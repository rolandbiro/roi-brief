import Anthropic from "@anthropic-ai/sdk";
import { composeSystemPrompt } from "@/lib/prompts";
import { TOOL_DEFINITIONS, handleToolExecution } from "@/lib/tools";
import type { BriefState } from "@/lib/tools";
import { createInitialBriefState } from "@/lib/tools";
import { BriefDataSchema } from "@/lib/schemas";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const MAX_ITERATIONS = 25;

interface ChatRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  briefState?: BriefState;
  extractBrief?: boolean;
}

export async function POST(request: Request) {
  try {
    const { messages, briefState, extractBrief }: ChatRequest =
      await request.json();

    let currentBriefState: BriefState = briefState || createInitialBriefState();

    // Extract brief from tool-collected state — no Claude call needed
    if (extractBrief) {
      const briefData = {
        ...currentBriefState.briefData,
        campaign_types: currentBriefState.confirmedTypes.length > 0
          ? currentBriefState.confirmedTypes
          : currentBriefState.detectedTypes,
      };

      const parsed = BriefDataSchema.safeParse(briefData);
      if (parsed.success) {
        return Response.json({ briefData: parsed.data });
      }
      // Fallback: return unvalidated data (optional fields may be missing)
      return Response.json({ briefData });
    }

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const claudeMessages: Anthropic.MessageParam[] = messages.map(
            (msg) => ({
              role: msg.role as "user" | "assistant",
              content: msg.content,
            })
          );

          // Agentic loop: streaming Claude call -> tool detection -> server-side execution -> continuation
          let conversationMessages: Anthropic.MessageParam[] = [
            ...claudeMessages,
          ];
          let continueLoop = true;
          let iteration = 0;
          let pendingQuickReplies: Array<{ label: string; value: string | null }> | null = null;

          while (continueLoop && iteration < MAX_ITERATIONS) {
            iteration++;

            const systemPrompt = composeSystemPrompt(currentBriefState);

            const stream = await anthropic.messages.create({
              model: "claude-sonnet-4-20250514",
              max_tokens: 4096,
              system: systemPrompt,
              messages: conversationMessages,
              tools: TOOL_DEFINITIONS as Anthropic.Tool[],
              stream: true,
            });

            let textContent = "";
            let toolUseBlocks: Array<{
              id: string;
              name: string;
              input: unknown;
            }> = [];
            let currentToolUse: {
              id: string;
              name: string;
              partialJson: string;
            } | null = null;
            let stopReason = "";

            for await (const event of stream) {
              // Stream text deltas to client
              if (event.type === "content_block_delta") {
                if (event.delta.type === "text_delta") {
                  textContent += event.delta.text;
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
                    )
                  );
                }
                // Accumulate tool input JSON (NOT sent to client)
                if (event.delta.type === "input_json_delta") {
                  if (currentToolUse) {
                    currentToolUse.partialJson += event.delta.partial_json;
                  }
                }
              }

              // Track content block starts for tool_use
              if (
                event.type === "content_block_start" &&
                event.content_block.type === "tool_use"
              ) {
                currentToolUse = {
                  id: event.content_block.id,
                  name: event.content_block.name,
                  partialJson: "",
                };
              }

              // Complete tool_use block
              if (event.type === "content_block_stop" && currentToolUse) {
                toolUseBlocks.push({
                  id: currentToolUse.id,
                  name: currentToolUse.name,
                  input: currentToolUse.partialJson ? JSON.parse(currentToolUse.partialJson) : {},
                });
                currentToolUse = null;
              }

              // Track stop reason
              if (event.type === "message_delta") {
                stopReason = event.delta.stop_reason || "";
              }
            }

            if (stopReason === "tool_use" && toolUseBlocks.length > 0) {
              // Build assistant message with content blocks
              const assistantContent: Anthropic.ContentBlockParam[] = [];
              if (textContent) {
                assistantContent.push({ type: "text", text: textContent });
              }
              for (const tool of toolUseBlocks) {
                assistantContent.push({
                  type: "tool_use",
                  id: tool.id,
                  name: tool.name,
                  input: tool.input as Record<string, unknown>,
                });
              }

              // Execute tools server-side
              const toolResults: Anthropic.ToolResultBlockParam[] = [];
              for (const tool of toolUseBlocks) {
                const result = handleToolExecution(
                  tool.name,
                  tool.input,
                  currentBriefState
                );
                currentBriefState = result.updatedState;
                // Collect quick replies if suggest_quick_replies was called
                if (result.output.quickReplies) {
                  pendingQuickReplies = result.output.quickReplies as Array<{ label: string; value: string | null }>;
                }
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: tool.id,
                  content: JSON.stringify(result.output),
                });
              }

              // Send brief state update to client
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ briefState: currentBriefState })}\n\n`
                )
              );

              // Continue conversation with tool results
              conversationMessages = [
                ...conversationMessages,
                { role: "assistant", content: assistantContent },
                { role: "user", content: toolResults },
              ];

              // Reset for next iteration
              textContent = "";
              toolUseBlocks = [];
            } else {
              // end_turn — conversation complete for this turn
              continueLoop = false;
            }
          }

          // Max iterations warning
          if (iteration >= MAX_ITERATIONS) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ text: "\n\n[A feldolgozás elérte a maximális iterációszámot. Kérlek, folytasd a beszélgetést.]" })}\n\n`
              )
            );
          }

          // Send quick replies if any were suggested
          if (pendingQuickReplies) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ quickReplies: pendingQuickReplies })}\n\n`
              )
            );
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
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
