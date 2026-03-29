import type { KilocodeSessionImportPartData as Part } from "@kilocode/sdk/v2"
import type { LegacyApiMessage, LegacyHistoryItem } from "./legacy-session-types"
import { getApiConversationHistory, parseFile } from "./api-history"
import { createMessageID, createPartID, createSessionID } from "./ids"
import { createToolUsePart, isText, isToolResult, isToolUse } from "./create-parts-util"
import { mergeToolUseAndResult, thereIsNoToolResult } from "./merge-tool-parts"

export async function createParts(id: string, dir: string, item?: LegacyHistoryItem): Promise<Array<NonNullable<Part["body"]>>> {
  const file = await getApiConversationHistory(id, dir)
  const conversation = parseFile(file)

  return conversation.flatMap((entry, index) => parseParts(entry, index, id, item))
}

function parseParts(
  entry: LegacyApiMessage,
  index: number,
  id: string,
  item?: LegacyHistoryItem,
): Array<NonNullable<Part["body"]>> {
  const messageID = createMessageID(id, index)
  const sessionID = createSessionID(id)
  const created = entry.ts ?? item?.ts ?? 0

  if (typeof entry.content === "string") {
    if (!entry.content) return []
    return [
      {
        id: createPartID(id, index, 0),
        messageID,
        sessionID,
        timeCreated: created,
        data: {
          type: "text",
          // Plain string content in API history maps directly to a text part.
          text: entry.content,
          time: {
            start: created,
            end: created,
          },
        },
      },
    ]
  }

  if (!Array.isArray(entry.content)) return []

  const parts: Array<NonNullable<Part["body"]>> = []

  entry.content.forEach((part, partIndex) => {
    const partID = createPartID(id, index, partIndex)

    if (isText(part) && part.text) {
      parts.push({
        id: partID,
        messageID,
        sessionID,
        timeCreated: created,
        data: {
          type: "text",
          text: part.text,
          time: {
            start: created,
            end: created,
          },
        },
      })
      return
    }

    if (isToolUse(part) && thereIsNoToolResult(entry, part.id)) {
      parts.push(createToolUsePart(partID, messageID, sessionID, created, part))
      return
    }

    if (isToolResult(part)) {
      const tool = mergeToolUseAndResult(partID, messageID, sessionID, created, entry, part)
      if (!tool) return
      parts.push(tool)
      return
    }

    if (entry.type === "reasoning" && entry.text) {
      parts.push({
        id: partID,
        messageID,
        sessionID,
        timeCreated: created,
        data: {
          type: "reasoning",
          // Reasoning entries are kept as reasoning parts so we do not lose explicit thinking blocks from legacy history.
          text: entry.text,
          time: {
            start: created,
            end: created,
          },
        },
      })
    }
  })

  return parts
}
