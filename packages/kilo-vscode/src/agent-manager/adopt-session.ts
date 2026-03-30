import type { Event, Session } from "@kilocode/sdk/v2/client"
import path from "path"
import type { AgentManagerOutMessage } from "./types"

interface State {
  getSession(id: string): { worktreeId: string | null } | undefined
  getWorktree(id: string): { id: string; path: string } | undefined
  addSession(sessionId: string, worktreeId: string | null): void
}

interface Panel {
  sessions: {
    setSessionDirectory(id: string, directory: string): void
    trackSession(id: string): void
    registerSession(session: Session): void
  }
}

export function adoptSession(input: {
  event: Event
  state: State | undefined
  panel: Panel | undefined
  postMessage: (msg: AgentManagerOutMessage) => void
  pushState: () => void
  log: (msg: string, data?: Record<string, unknown>) => void
}) {
  if (input.event.type !== "session.created") return
  if (!input.state || !input.panel) return

  const info = input.event.properties.info
  if (!info.parentID) return
  if (input.state.getSession(info.id)) return

  const parent = input.state.getSession(info.parentID)
  if (!parent?.worktreeId) return

  const wt = input.state.getWorktree(parent.worktreeId)
  if (!wt) return
  if (path.resolve(wt.path) !== path.resolve(info.directory)) return

  input.state.addSession(info.id, wt.id)
  input.panel.sessions.setSessionDirectory(info.id, wt.path)
  input.panel.sessions.trackSession(info.id)
  input.panel.sessions.registerSession(info)
  input.pushState()
  input.postMessage({
    type: "agentManager.sessionAdded",
    sessionId: info.id,
    worktreeId: wt.id,
  })
  input.log("Adopted backend-created worktree session", {
    parentID: info.parentID,
    sessionId: info.id,
    worktreeId: wt.id,
  })
}
