import type { Event, Session } from "@kilocode/sdk/v2/client"
import { normalizePath } from "./git-import"
import type { AgentManagerOutMessage } from "./types"

interface State {
  getSession(id: string): { worktreeId: string | null } | undefined
  getWorktrees(): Array<{ id: string; path: string }>
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
  if (input.state.getSession(info.id)) return

  const target = normalizePath(info.directory)
  const wt = input.state.getWorktrees().find((item) => normalizePath(item.path) === target)
  if (!wt) return

  const parent = info.parentID ? input.state.getSession(info.parentID) : undefined
  if (parent?.worktreeId && parent.worktreeId !== wt.id) return

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
