import { describe, expect, it } from "bun:test"
import type { Event, Session } from "@kilocode/sdk/v2/client"

// vscode mock is provided by the shared preload (tests/setup/vscode-mock.ts)
const { KiloProvider } = await import("../../src/KiloProvider")

type Internals = {
  webview: { postMessage: (message: unknown) => Promise<unknown> } | null
  trackedSessionIds: Set<string>
  currentSession: Session | null
  pendingFollowup: { dir: string; time: number } | null
  handleLoadMessages: (sessionID: string) => Promise<void>
  handleEvent: (event: Event) => void
}

function created(input: { id: string; directory: string }): Event {
  return {
    type: "session.created",
    properties: {
      info: {
        id: input.id,
        slug: `${input.id}-slug`,
        projectID: "project-1",
        directory: input.directory,
        title: "Session",
        version: "1",
        time: { created: 1, updated: 1 },
      },
    },
  } as Event
}

function connection() {
  return {
    connect: async () => {},
    getClient: () => ({}) as never,
    onEventFiltered: () => () => undefined,
    onStateChange: () => () => undefined,
    onNotificationDismissed: () => () => undefined,
    onLanguageChanged: () => () => undefined,
    onProfileChanged: () => () => undefined,
    onMigrationComplete: () => () => undefined,
    getServerInfo: () => ({ port: 12345 }),
    getConnectionState: () => "connected" as const,
    resolveEventSessionId: (event: Event) => (event.type === "session.created" ? event.properties.info.id : undefined),
    recordMessageSessionId: () => undefined,
    notifyNotificationDismissed: () => undefined,
  }
}

describe("KiloProvider follow-up sessions", () => {
  it("adopts pending follow-up sessions for single-session views", async () => {
    const provider = new KiloProvider({} as never, connection() as never)
    const internal = provider as unknown as Internals
    const sent: unknown[] = []
    const loaded: string[] = []

    internal.webview = {
      postMessage: async (message: unknown) => {
        sent.push(message)
        return true
      },
    }
    internal.pendingFollowup = { dir: "/repo", time: Date.now() }
    internal.handleLoadMessages = async (sessionID: string) => {
      loaded.push(sessionID)
    }

    internal.handleEvent(created({ id: "ses-followup", directory: "/repo" }))
    await Promise.resolve()

    expect(internal.currentSession?.id).toBe("ses-followup")
    expect(internal.trackedSessionIds.has("ses-followup")).toBe(true)
    expect(loaded).toEqual(["ses-followup"])
    expect(sent).toEqual([
      {
        type: "sessionCreated",
        session: {
          id: "ses-followup",
          title: "Session",
          createdAt: new Date(1).toISOString(),
          updatedAt: new Date(1).toISOString(),
          revert: null,
          summary: null,
        },
      },
    ])
  })

  it("does not adopt pending follow-up sessions in agent manager panels", async () => {
    const provider = new KiloProvider({} as never, connection() as never, undefined, {
      adoptFollowupSessions: false,
    })
    const internal = provider as unknown as Internals
    const sent: unknown[] = []

    internal.webview = {
      postMessage: async (message: unknown) => {
        sent.push(message)
        return true
      },
    }
    internal.pendingFollowup = { dir: "/repo", time: Date.now() }
    internal.handleLoadMessages = async () => {}

    internal.handleEvent(created({ id: "ses-followup", directory: "/repo" }))
    await Promise.resolve()

    expect(internal.currentSession).toBeNull()
    expect(internal.trackedSessionIds.has("ses-followup")).toBe(false)
    expect(sent).toEqual([])
  })
})
