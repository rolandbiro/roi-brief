import Anthropic from "@anthropic-ai/sdk";
import { BRIEF_SYSTEM_PROMPT } from "@/lib/prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    // Build conversation for Claude
    const claudeMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Create streaming response
    const stream = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: BRIEF_SYSTEM_PROMPT,
      messages: claudeMessages,
      stream: true,
    });

    // Create a ReadableStream from the Anthropic stream
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const text = event.delta.text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
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
