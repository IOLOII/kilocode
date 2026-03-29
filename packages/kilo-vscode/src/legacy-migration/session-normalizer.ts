import type { LegacyHistoryItem } from "./legacy-session-types"
import type {
  KilocodeSessionImportMessageData as Message,
  KilocodeSessionImportPartData as Part,
  KilocodeSessionImportProjectData as Project,
  KilocodeSessionImportSessionData as Session,
} from "@kilocode/sdk/v2"

export interface NormalizedSession {
  project: NonNullable<Project["body"]>
  session: NonNullable<Session["body"]>
  messages: Array<NonNullable<Message["body"]>>
  parts: Array<NonNullable<Part["body"]>>
}

export async function normalizeSession(_input: {
  id: string
  dir: string
  item?: LegacyHistoryItem
}): Promise<NormalizedSession> {
  throw new Error("normalizeSession is not implemented yet")
}
