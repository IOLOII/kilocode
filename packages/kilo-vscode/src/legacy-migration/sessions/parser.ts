import type { LegacyHistoryItem } from "./lib/legacy-types"
import type {
  KilocodeSessionImportMessageData as Message,
  KilocodeSessionImportPartData as Part,
  KilocodeSessionImportProjectData as Project,
  KilocodeSessionImportSessionData as Session,
} from "@kilocode/sdk/v2"
import { createMessages } from "./lib/messages"
import { createParts } from "./lib/parts/parts"
import { createProject } from "./lib/project"
import { createSession } from "./lib/session"

export interface NormalizedSession {
  project: NonNullable<Project["body"]>
  session: NonNullable<Session["body"]>
  messages: Array<NonNullable<Message["body"]>>
  parts: Array<NonNullable<Part["body"]>>
}

export async function parseSession(id: string, dir: string, item?: LegacyHistoryItem): Promise<NormalizedSession> {
  const project = createProject(item)
  const session = createSession(id, item, project.id)
  const messages = await createMessages(id, dir, item)
  const parts = await createParts(id, dir, item)

  return {
    project,
    session,
    messages,
    parts,
  }
}
