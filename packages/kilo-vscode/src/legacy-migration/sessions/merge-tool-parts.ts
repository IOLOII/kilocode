import type { KilocodeSessionImportPartData as Part } from "@kilocode/sdk/v2"
import type { LegacyApiMessage } from "./legacy-session-types"
import { getText, getToolUse, isToolResult, record } from "./create-parts-util"

// This takes the "tool started" half and the matching "tool finished" half,
// and merges both so the migrated session keeps one complete tool action.
export function mergeToolUseAndResult(
  partID: string,
  messageID: string,
  sessionID: string,
  created: number,
  entry: LegacyApiMessage,
  result: { type?: string; tool_use_id?: string; content?: unknown },
): NonNullable<Part["body"]> | undefined {
  const tool = getToolUse(entry, result.tool_use_id)
  if (!tool) return undefined
  const callID = typeof tool.id === "string" ? tool.id : partID
  const name = typeof tool.name === "string" ? tool.name : "unknown"
  const output = getText(result.content) ?? name

  return {
    id: partID,
    messageID,
    sessionID,
    timeCreated: created,
    data: {
      type: "tool",
      callID,
      tool: name,
      state: {
        status: "completed",
        input: record(tool.input),
        output,
        title: name,
        metadata: {},
        time: {
          start: created,
          end: created,
        },
      },
    },
  }
}

export function thereIsNoToolResult(entry: LegacyApiMessage, id: string | undefined) {
  if (!Array.isArray(entry.content)) return true
  return !entry.content.some((part) => isToolResult(part) && part.tool_use_id === id)
}
