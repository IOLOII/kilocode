import { describe, expect, it } from "bun:test"
import type { Event } from "@kilocode/sdk/v2/client"
import { adoptSession } from "../../src/agent-manager/adopt-session"

function created(input: { id: string; parentID?: string; directory: string }): Event {
  return {
    type: "session.created",
    properties: {
      info: {
        id: input.id,
        slug: `${input.id}-slug`,
        projectID: "project-1",
        directory: input.directory,
        parentID: input.parentID,
        title: "Session",
        version: "1",
        time: { created: 1, updated: 1 },
      },
    },
  } as Event
}

describe("adoptSession", () => {
  it("adopts a backend-created worktree session with normalized paths", () => {
    const added: Array<[string, string | null]> = []
    const directories: Array<[string, string]> = []
    const tracked: string[] = []
    const registered: string[] = []
    const posts: unknown[] = []
    const logs: Array<[string, Record<string, unknown> | undefined]> = []

    adoptSession({
      event: created({ id: "ses-child", directory: "C:\\Repo\\.kilo\\worktrees\\feature\\" }),
      state: {
        getSession(id) {
          return undefined
        },
        getWorktrees() {
          return [{ id: "wt-1", path: "c:/repo/.kilo/worktrees/feature" }]
        },
        addSession(sessionId, worktreeId) {
          added.push([sessionId, worktreeId])
        },
      },
      panel: {
        sessions: {
          setSessionDirectory(id, directory) {
            directories.push([id, directory])
          },
          trackSession(id) {
            tracked.push(id)
          },
          registerSession(session) {
            registered.push(session.id)
          },
        },
      },
      postMessage(msg) {
        posts.push(msg)
      },
      pushState() {},
      log(msg, data) {
        logs.push([msg, data])
      },
    })

    expect(added).toEqual([["ses-child", "wt-1"]])
    expect(directories).toEqual([["ses-child", "c:/repo/.kilo/worktrees/feature"]])
    expect(tracked).toEqual(["ses-child"])
    expect(registered).toEqual(["ses-child"])
    expect(posts).toEqual([
      {
        type: "agentManager.sessionAdded",
        sessionId: "ses-child",
        worktreeId: "wt-1",
      },
    ])
    expect(logs[0]?.[0]).toBe("Adopted backend-created worktree session")
  })

  it("ignores child sessions when the parent belongs to another worktree", () => {
    const added: string[] = []

    adoptSession({
      event: created({ id: "ses-child", parentID: "ses-parent", directory: "/repo/.kilo/worktrees/feature" }),
      state: {
        getSession(id) {
          if (id === "ses-parent") return { worktreeId: "wt-2" }
          return undefined
        },
        getWorktrees() {
          return [
            { id: "wt-1", path: "/repo/.kilo/worktrees/feature" },
            { id: "wt-2", path: "/repo/.kilo/worktrees/other" },
          ]
        },
        addSession(sessionId) {
          added.push(sessionId)
        },
      },
      panel: {
        sessions: {
          setSessionDirectory() {},
          trackSession() {},
          registerSession() {},
        },
      },
      postMessage() {},
      pushState() {},
      log() {},
    })

    expect(added).toHaveLength(0)
  })
})
