# Issue Triage Report

Mapping of 8 known problems to existing open GitHub issues in Kilo-Org/kilocode.

## 1. No dialog/button to switch from "ask mode" in the chat

**Match found:**

- **#7803** — feat(vscode): Add mode quick toggle from chat UI
  https://github.com/Kilo-Org/kilocode/issues/7803

Also related:

- **#6347** — Improve mode switching UX: nicer prompts and auto-switch capability
  https://github.com/Kilo-Org/kilocode/issues/6347

## 2. Autoscrolling not following new content / nested scroll boxes cause issues

**Matches found:**

- **#7666** — Auto-Scrolling breaks on questions
  https://github.com/Kilo-Org/kilocode/issues/7666
- **#6937** — Improve scrolling UX: Don't trap scroll focus in individual message scrollboxes when scrolling through task history
  https://github.com/Kilo-Org/kilocode/issues/6937
- **#3310** — Critical: Scrolling Malfunction in Kilo Code Output Window
  https://github.com/Kilo-Org/kilocode/issues/3310

## 3. File links in chat are not clickable

**No matching issue found.**

Searched: "file link", "clickable", "links not clickable", "file path link", "hyperlink file", "file mention click open", "open file click", "link navigate file". No open issue specifically about file paths/links in chat messages not being clickable.

## 4. Missing turn summary (green theme from old extension)

**No matching issue found.**

Searched: "turn summary", "summary", "green theme", "turn recap". No open issue specifically about missing turn summaries or the green-themed summary from the old extension.

## 5. AgentManager worktrees need icon when awaiting user input

**Match found:**

- **#7529** — Unified Notification System for Agent Manager and VS Code Extension
  https://github.com/Kilo-Org/kilocode/issues/7529

This issue explicitly describes the problem: "The agent-manager currently shows a loading spinner while sessions are active but hides the spinner when a session is blocked by a pending question or permission — leaving no visual distinction between 'idle' and 'waiting for input.'" Requirement R1.1 covers adding a distinct visual indicator on worktree items when a session needs user input.

## 6. AgentManager diffviewer toggle between uncommitted and all branch changes

**Match found:**

- **#7521** — Agent Manager: diff mode toggle (branch / staged / unstaged)
  https://github.com/Kilo-Org/kilocode/issues/7521

## 7. Enormous questions UX

**Match found:**

- **#6826** — Question UX could be improved
  https://github.com/Kilo-Org/kilocode/issues/6826

This issue covers question UX problems including duplicate text boxes and highlighting issues. While it doesn't specifically mention "enormous" questions, it is the closest match for question UX improvements.

## 8. Permission prompt steals keyboard focus

**Confirmed — issue #7563 is still OPEN:**

- **#7563** — Bug: Permission prompt steals keyboard focus from other parts of the app
  https://github.com/Kilo-Org/kilocode/issues/7563

---

## Summary Table

| #   | Problem                                   | Issue                                                                                                                                                                           | Status                  |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1   | No dialog/button to switch from ask mode  | [#7803](https://github.com/Kilo-Org/kilocode/issues/7803), [#6347](https://github.com/Kilo-Org/kilocode/issues/6347)                                                            | Matched                 |
| 2   | Autoscrolling / nested scroll issues      | [#7666](https://github.com/Kilo-Org/kilocode/issues/7666), [#6937](https://github.com/Kilo-Org/kilocode/issues/6937), [#3310](https://github.com/Kilo-Org/kilocode/issues/3310) | Matched                 |
| 3   | File links in chat not clickable          | —                                                                                                                                                                               | No matching issue found |
| 4   | Missing turn summary (green theme)        | —                                                                                                                                                                               | No matching issue found |
| 5   | AgentManager worktree awaiting input icon | [#7529](https://github.com/Kilo-Org/kilocode/issues/7529)                                                                                                                       | Matched                 |
| 6   | AgentManager diffviewer toggle            | [#7521](https://github.com/Kilo-Org/kilocode/issues/7521)                                                                                                                       | Matched                 |
| 7   | Enormous questions UX                     | [#6826](https://github.com/Kilo-Org/kilocode/issues/6826)                                                                                                                       | Matched (partial)       |
| 8   | Permission prompt steals keyboard focus   | [#7563](https://github.com/Kilo-Org/kilocode/issues/7563)                                                                                                                       | Confirmed open          |
