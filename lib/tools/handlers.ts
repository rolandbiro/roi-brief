import type { BriefState, ClassifyCampaignInput, UpdateBriefInput, SuggestQuickRepliesInput, ToolResult } from "./types";

function deepSet(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const result = { ...obj };
  const keys = path.split(".");
  let current: Record<string, unknown> = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    current[key] = { ...(current[key] as Record<string, unknown> || {}) };
    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
  return result;
}

export function handleToolExecution(
  toolName: string,
  input: unknown,
  currentState: BriefState
): ToolResult {
  switch (toolName) {
    case "classify_campaign": {
      const { campaign_types, confidence } = input as ClassifyCampaignInput;
      const existingTypes = new Set(currentState.detectedTypes);
      campaign_types.forEach(t => existingTypes.add(t));
      const mergedTypes = Array.from(existingTypes);

      return {
        output: {
          status: "ok",
          message: `Típus(ok) rögzítve: ${mergedTypes.join(", ")}`,
          detected_types: mergedTypes,
        },
        updatedState: {
          ...currentState,
          detectedTypes: mergedTypes,
          typeConfidence: confidence,
          phase: confidence === "high" ? "type_confirmed" : currentState.phase,
          confirmedTypes: confidence === "high" ? mergedTypes : currentState.confirmedTypes,
        },
      };
    }
    case "update_brief": {
      const { field, value } = input as UpdateBriefInput;
      const updatedBrief = deepSet(currentState.briefData, field, value);
      return {
        output: { status: "ok", field, message: `${field} frissítve` },
        updatedState: {
          ...currentState,
          briefData: updatedBrief,
        },
      };
    }
    case "suggest_quick_replies": {
      const { options } = input as SuggestQuickRepliesInput;
      return {
        output: { status: "ok", quickReplies: options },
        updatedState: currentState,
      };
    }
    default:
      return {
        output: { status: "error", message: `Ismeretlen tool: ${toolName}` },
        updatedState: currentState,
      };
  }
}
