import type { KilocodeSessionImportSessionData as Session } from "@kilocode/sdk/v2"
import type { LegacyHistoryItem } from "./legacy-session-types"

export function createSession(input: { id: string; item?: LegacyHistoryItem; projectID: string }): NonNullable<Session["body"]> {
  const session = makeSession()

  // This is the target session id, and should be obtained from the migrated legacy session id.
  session.id = input.id

  // This is the owning project id in kilo.db, and should come from the project created for this session.
  session.projectID = input.projectID

  // This is the session slug, and should be derived from the legacy session identity.
  session.slug = input.id

  // This is the directory associated to the session, and should come from the legacy workspace.
  session.directory = input.item?.workspace ?? ""

  // This is the visible title of the session, and should come from the legacy task title.
  session.title = input.item?.task ?? input.id

  // This is the stored session version, and should match the backend session model version.
  session.version = "v2"

  // This is the session creation time, and should be obtained from legacy session metadata.
  session.timeCreated = input.item?.ts ?? 0

  // This is the session updated time, and should be obtained from legacy session metadata.
  session.timeUpdated = input.item?.ts ?? 0

  return session
}

function makeSession(): NonNullable<Session["body"]> {
  return {
    id: "",
    projectID: "",
    slug: "",
    directory: "",
    title: "",
    version: "",
    timeCreated: 0,
    timeUpdated: 0,
  }
}
