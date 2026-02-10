import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { composeSystemPrompt, EXTRACTION_PROMPT } from "@/lib/prompts";
import { BriefDataSchema, type CampaignType } from "@/lib/schemas";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface ChatRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  campaignTypes?: string[];
  extractBrief?: boolean;
}

export async function POST(request: Request) {
  try {
    const { messages, campaignTypes, extractBrief }: ChatRequest =
      await request.json();

    const claudeMessages = messages.map(
      (msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })
    );

    const systemPrompt = composeSystemPrompt(
      (campaignTypes as CampaignType[]) || []
    );

    // Streaming chat response
    const stream = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: claudeMessages,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Stream chat text
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const text = event.delta.text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }

          // Brief extraction (separate non-streaming call)
          if (extractBrief) {
            try {
              const extractionResponse = await anthropic.messages.parse({
                model: "claude-sonnet-4-20250514",
                max_tokens: 4096,
                system: EXTRACTION_PROMPT,
                messages: [
                  ...claudeMessages,
                  {
                    role: "user" as const,
                    content:
                      "Kérlek, foglald össze a brief adatokat a beszélgetés alapján.",
                  },
                ],
                output_config: {
                  format: zodOutputFormat(BriefDataSchema),
                },
              });

              if (extractionResponse.parsed_output) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ briefData: extractionResponse.parsed_output })}\n\n`
                  )
                );
              }
            } catch (extractionError) {
              console.error("Brief extraction failed:", extractionError);
              // Don't break the chat stream -- extraction is optional
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Hiba történt a chat feldolgozása során" },
      { status: 500 }
    );
  }
}
