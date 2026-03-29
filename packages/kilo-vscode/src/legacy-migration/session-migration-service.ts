import * as vscode from "vscode"
import type { KiloClient } from "@kilocode/sdk/v2/client"
import type { LegacyHistoryItem } from "./legacy-session-types"
import { normalizeSession } from "./session-normalizer"

export async function migrateSession(input: {
  id: string
  context: vscode.ExtensionContext
  client: KiloClient
}) {
  const dir = vscode.Uri.joinPath(input.context.globalStorageUri, "tasks").fsPath
  const items = input.context.globalState.get<LegacyHistoryItem[]>("taskHistory", [])
  const item = items.find((item) => item.id === input.id)
  const payload = await normalizeSession({
    id: input.id,
    dir,
    item,
  })

  // await input.client.kilocode.sessionImport.project(payload.project, { throwOnError: true })
  // await input.client.kilocode.sessionImport.session(payload.session, { throwOnError: true })
  // for (const msg of payload.messages) await input.client.kilocode.sessionImport.message(msg, { throwOnError: true })
  // for (const part of payload.parts) await input.client.kilocode.sessionImport.part(part, { throwOnError: true })

  // Adjust return based on backend call response
  return {
    ok: true,
    payload,
  }
}
