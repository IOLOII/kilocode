# Code Review: PR #7200 — OpenCode v1.2.21 Upstream Sync

**PR:** https://github.com/Kilo-Org/kilocode/pull/7200  
**Author:** catrielmuller  
**Title:** OpenCode v1.2.21  
**Base:** `main`  
**Reviewed by:** automated subagent review (kilo)  
**Date:** 2026-03-18

---

## Overview

This PR syncs the Kilo fork with OpenCode v1.2.21 upstream, which is a major animation/motion overhaul in the UI. Alongside the upstream sync, it includes significant Kilo-specific work: a full marketplace expansion (MCP + Modes tabs), session revert/undo UI, image preview in the VS Code extension, autocomplete simplification, and a rewrite of `kilo-ui/message-part.tsx` from a thin re-export to a full standalone implementation.

The PR contains **231 changed files** across packages. This review focuses primarily on Kilo-specific files: `packages/kilo-ui/`, `packages/kilo-vscode/`, and the intersection of `packages/ui/` with those packages.

---

## Compilation Errors (TypeScript)

The PR branch has several TypeScript compilation errors that must be fixed before merge:

1. **`session.tsx:139,141`** — `Property 'revert' does not exist on type 'SessionInfo'` / `Property 'summary' does not exist on type 'SessionInfo'` — The `SessionInfo` type in the SDK (or local types) was not updated to include these new fields.
2. **`session.tsx:503-504`** — `Type '"messageRemoved"' is not comparable` — The `"messageRemoved"` case in the message discriminant union is missing from the type.
3. **`session.tsx:1318,1326`** — `"revertSession"` and `"unrevertSession"` not assignable to valid message types — These new message types weren't added to the outbound message union.
4. **`kilo-ui/message-part.tsx:2`** — `Cannot find module 'strip-ansi'` — dependency added to package.json but `bun install` may not have been run in CI context; types may also need to be checked.
5. **`packages/ui/` multiple** — `Cannot find module './grow-box'`, `'./motion'`, `'./tool-utils'`, `'./context-tool-results'`, `'./shell-rolling-results'` — New upstream files exist but exports/aliases not yet registered. Likely a build artifact issue.

---

## Critical Issues

### ❌ 1. `autoScroll.resume()` removed upstream — MessageList.tsx broken

**File:** `packages/kilo-vscode/webview-ui/src/components/chat/MessageList.tsx:56` and `:174`  
**Severity:** Critical (runtime error)

The upstream `createAutoScroll` API was heavily reworked. The `resume()` and `scrollToBottom()` methods were removed and replaced with `smoothScrollToBottom()`, `snapToBottom()`, and `forceScrollToBottom()`.

`MessageList.tsx` still calls `autoScroll.resume()` at lines 56 and 174. These will throw at runtime.

**Fix required:**

```ts
// Replace:
autoScroll.resume()
// With:
autoScroll.smoothScrollToBottom()
// or:
autoScroll.forceScrollToBottom()
```

---

### ❌ 2. Cross-package import: webview reaching into extension src/

**File:** `packages/kilo-vscode/webview-ui/src/components/marketplace/MarketplaceView.tsx:16`  
**Severity:** High (architectural concern)

```ts
import { TelemetryEventName } from "../../../../src/services/telemetry/types"
```

This import crosses the webview→extension host boundary. The webview is a browser build; `src/` is a Node.js build. If `TelemetryEventName` ever transitively imports anything Node-specific, the webview build will break. The telemetry enum values should be inlined or placed in a shared `webview-ui/src/types/` file.

---

### ❌ 3. Missing `kilocode_change` markers in commit `266ceca64`

**Severity:** High (merge debt)

Commit `266ceca64` ("refactor: kilo compat for v1.2.21") modifies ~200 shared files (packages/opencode, packages/app, packages/ui, packages/sdk) with **zero** `kilocode_change` markers. Per AGENTS.md, all modifications to shared upstream files must be marked so downstream merges remain manageable.

This creates significant merge debt. Future upstream syncs will be very difficult to reason about without these markers.

---

## High Issues

### ⚠️ 4. String comparison on message IDs for revert boundary

**File:** `packages/kilo-vscode/webview-ui/src/components/chat/RevertBanner.tsx:27`  
**Also:** `MessageList.tsx:77`  
**Severity:** High (data-dependent bug)

```ts
const next = users().find((m) => m.id > boundary)
```

This uses lexicographic string comparison to determine message ordering. This is **only correct** if message IDs are lexicographically sortable (e.g. ULIDs or time-prefixed sorted UUIDs). If they are not, the revert logic will silently find the wrong "next" message.

**Action required:** Verify that session message IDs are lexicographically sortable (e.g. confirm they are ULIDs). If not, use the message `createdAt` timestamp for ordering.

---

### ⚠️ 5. `PermissionRequest.always` is required — all producers must be updated

**File:** `packages/kilo-vscode/webview-ui/src/types/messages.ts:159`  
**Severity:** High

The `always` field was added as required (no `?`) to `PermissionRequest`. All code that constructs a `PermissionRequest` object must now include `always`. Check that KiloProvider and all mock fixtures were updated, or make the field optional (`always?: string[]`).

---

## Medium Issues

### ⚠️ 6. Empty catch block in `handleRemoveMode`

**File:** `packages/kilo-vscode/src/KiloProvider.ts:1268`  
**Severity:** Medium

```ts
} catch {
  // failed to remove via cli, try via kilo.json
}
```

AGENTS.md style guide: "Never leave a `catch` block empty." Silent swallowing hides real errors. Minimum fix:

```ts
} catch (err) {
  console.debug("[KiloProvider] CLI removeAgent failed, trying kilo.json:", err)
}
```

---

### ⚠️ 7. `removeMode` always returns `success: true` for "not found"

**File:** `packages/kilo-vscode/src/KiloProvider.ts:1277-1280`  
**Also:** `packages/kilo-vscode/src/services/marketplace/installer.ts:212-213`  
**Severity:** Medium

`removeMode()` treats "not found" as a successful no-op and returns `{ success: true }`. This means when the CLI removal fails (step 1 of the two-step fallback), the marketplace removal (step 2) always reports `success: true` even if the mode wasn't in `kilo.json` either. As a result, `disposeCliInstance("global")` at line 1280 is always called in the fallback path, even when nothing was actually removed.

**Recommendation:** Add a `found: boolean` field to the `removeMode` return type so callers can distinguish "removed successfully" from "not found (treated as success)."

---

### ⚠️ 8. `createEffect` re-subscribes on reactive dep changes — missed messages

**File:** `packages/kilo-vscode/webview-ui/src/components/marketplace/InstallModal.tsx:79-91`  
**Severity:** Medium

`createEffect` is used to subscribe to `vscode.onMessage()`. Because the callback references reactive signals (`scope()`, `params()`, `method()`), the subscription tears down and re-subscribes every time these change. Messages arriving during the re-subscription window will be missed.

**Fix:** Move the onMessage subscription outside the effect, or use `on()` with explicit dependencies and a non-tracking inner body.

---

### ⚠️ 9. Removed `agentsLoaded`/`skillsLoaded` listeners — may cause stale data

**File:** `packages/kilo-vscode/webview-ui/src/components/marketplace/MarketplaceView.tsx:55-62`  
**Severity:** Medium

The old MarketplaceView re-fetched data on `agentsLoaded` and `skillsLoaded` events. These were removed without replacement. If agents/skills are loaded asynchronously after the marketplace's initial `fetchData()` call, the marketplace will show stale data until the next workspace change triggers refetch.

**Action required:** Verify these events are now handled elsewhere, or restore the listeners.

---

### ⚠️ 10. `onOpenHelp` URL reverted to `opencode.ai`

**Commits:** `bddd2e694`  
**Severity:** Medium (branding regression)

The `onOpenHelp` callback URL was changed back to `opencode.ai/desktop-feedback` instead of `kilo.ai/desktop-feedback`. This appears to be an unintentional reversion of a branding change during the merge.

---

## Low Issues

### ℹ️ 11. `let removed` violates style guide

**File:** `packages/kilo-vscode/src/KiloProvider.ts:1261`

`let removed = false` violates the "avoid let statements" style rule. This could be refactored into a helper function that returns a boolean, avoiding the mutable variable.

---

### ℹ️ 12. `{ recursive: true }` on single-file deletion

**File:** `packages/kilo-vscode/src/KiloProvider.ts:2060`

`recursive: true` is passed to `vscode.workspace.fs.delete()` when deleting individual image preview files. This is harmless for files but would recursively delete a directory if a path-traversal bug occurred. Remove `recursive: true` from single-file deletes.

---

### ℹ️ 13. `__method` magic key mixed with user parameters

**File:** `packages/kilo-vscode/webview-ui/src/components/marketplace/InstallModal.tsx:96-97`

```ts
paramValues.__method = method()!.name
```

A server parameter named `__method` would be silently overwritten. Send `method` as a separate field in `mpInstallOptions` rather than mixing it into `parameters`.

---

### ℹ️ 14. Unsafe type assertion in utils

**File:** `packages/kilo-vscode/src/kilo-provider-utils.ts:220`

```ts
const props = event.properties as { sessionID: string; messageID: string }
```

No runtime validation. If the backend sends a `message.removed` event without these fields, `props.sessionID` and `props.messageID` will silently be `undefined`, causing downstream bugs. Add a guard or use optional chaining with null checks.

---

### ℹ️ 15. Variable shadowing in `MarketplaceListView`

**File:** `packages/kilo-vscode/webview-ui/src/components/marketplace/MarketplaceListView.tsx:63`

The inner `t` in `setTags(current.filter((t) => t !== tag))` shadows the `t` from `useLanguage()` at line 34. Rename to avoid confusion:

```ts
setTags((current) => current.filter((v) => v !== tag))
```

---

### ℹ️ 16. Dead ternary in `InstallModal`

**File:** `packages/kilo-vscode/webview-ui/src/components/marketplace/InstallModal.tsx:41`

```ts
const initial = workspace() ? options()[0] : options()[0]
```

Both branches are identical. Simplify to `const initial = options()[0]`.

---

### ℹ️ 17. Clickable spans missing accessibility attributes

**File:** `packages/kilo-vscode/webview-ui/src/components/marketplace/ItemCard.tsx:36-38`

Clickable `<span>` elements (item name, author) should have `role="link"` and `tabIndex={0}` with keyboard handlers for accessibility.

---

### ℹ️ 18. Revert banner strings not translated

**File:** All non-English locale files in `packages/kilo-vscode/webview-ui/src/i18n/`

The `revert.banner.*` keys (8 keys: "Redo", "Redo All", "Reverted", etc.) are present in all locale files but with English text only. Standard pattern for initial PRs — should be tracked for follow-up translation.

---

## Notes on kilo-ui/message-part.tsx Rewrite

### Approach Change

The previous `kilo-ui/src/components/message-part.tsx` was ~41 lines: a re-export of the upstream component plus a reasoning-block override. This PR replaces it with a full ~2301-line standalone copy of the upstream file, with Kilo-specific modifications layered in.

**Kilo-specific additions in the copy:**

1. `processCarriageReturns()` — Windows CLI carriage return handling (correct)
2. `McpTool` component — generic tool renderer with markdown output (correct)
3. Reasoning part override — collapsible block with brain icon (was in old file)
4. `handleMarkdownClick` — click-to-open files in VS Code (correct)
5. `data.openFile()` calls on file paths in read/edit/write/patch tools (correct)
6. `onRevert` prop on `UserMessageDisplay` (wired in VscodeSessionTurn)
7. Split `metaHead`/`metaTail` for richer user message metadata display

**Maintenance concern:** Every future upstream change to `packages/ui/src/components/message-part.tsx` must now be manually merged into the kilo-ui copy. This is a significant maintenance burden. Recommend adding a comment:

```ts
// This file is a fork of packages/ui/src/components/message-part.tsx.
// Keep in sync with upstream, preserving the Kilo-specific additions marked below.
```

**Assessment:** The copy is complete and correct. No missing exports, no missing tool registrations, no TODOs.

---

## Catrielmuller Commit Review

### `266ceca64` — `refactor: kilo compat for v1.2.21`

~200 files changed. SDK/env var rebranding (`@opencode-ai/sdk` → `@kilocode/sdk`, `OPENCODE_*` → `KILO_*`, etc.). **Zero `kilocode_change` markers** on any of the ~200 shared file modifications. This will make future upstream merges painful.

### `bddd2e694` — `feat: fix opencode v1.2.21`

Inlines ~2300 lines from upstream into kilo-ui, removes the vite alias plugin (`kiloUiAlias`), fixes the `keyed` regression from the merge. Commit message `feat: fix` is contradictory and vague. Also reverts the `kilo.ai` help URL back to `opencode.ai` (likely unintentional).

### `426521468` — `resolve merge conflicts`

175 files. Most resolutions look correct. Missing `kilocode_change` marker on `CommitMessageRoutes` import in `server.ts`. The `keyed` regression was introduced here and fixed in the next commit.

### `8f9852c08` — `fix: vscode publish`

Clean. Adds VS Code extension to publish pipeline. Correct use of `kilocode_change` markers.

### `95af22108` — `refactor: fix test`

Updates db test expectations for `kilo.db` naming. Clean, correct `kilocode_change` marker.

### `b6f98376f` — `fix: fix ui and vscode tests`

Updates stories from `BasicTool` → `ToolCall` API. Adds `matchMedia` mock for tests. Clean.

### `bf51350c1`, `b9ceb6f5f`, `1d711fcef`

Lockfile/package.json/README cleanup. All correct.

---

## Items That Look Good

- **Autocomplete simplification** is a significant improvement — replaces complex provider-profile-balance checking with clean CLI backend delegation. Fixes a provider registration leak and a startup race condition.
- **Image preview extraction** into pure functions with good test coverage is well done.
- **`sessionToWebview` `?? null` pattern** with explaining comment is excellent defensive code.
- **i18n-keys.test.ts** (407 lines) is a valuable CI guard against translation key drift.
- **Marketplace unified `MarketplaceListView`** is a clean abstraction.
- **`RevertBanner`** UI is well-structured and clear.
- Visual regression snapshots updated throughout (correct).

---

## Summary Table

| #   | Severity     | File                                        | Issue                                                             |
| --- | ------------ | ------------------------------------------- | ----------------------------------------------------------------- |
| 1   | **Critical** | `MessageList.tsx:56,174`                    | `autoScroll.resume()` removed upstream — runtime error            |
| 2   | **High**     | `MarketplaceView.tsx:16`                    | Cross-package import webview→extension src                        |
| 3   | **High**     | commit `266ceca64`                          | 200 shared files modified, zero `kilocode_change` markers         |
| 4   | **High**     | `RevertBanner.tsx:27`, `MessageList.tsx:77` | String comparison on IDs — verify lexicographic ordering          |
| 5   | **High**     | `messages.ts:159`                           | `always` required on `PermissionRequest` — verify all producers   |
| 6   | **Medium**   | `KiloProvider.ts:1268`                      | Empty catch block — swallows error silently                       |
| 7   | **Medium**   | `KiloProvider.ts:1277-1280`                 | `removeMode` success=true for "not found" causes wasteful dispose |
| 8   | **Medium**   | `InstallModal.tsx:79-91`                    | createEffect re-subscribe risks missed messages                   |
| 9   | **Medium**   | `MarketplaceView.tsx:55-62`                 | Removed `agentsLoaded` listeners — possible stale data            |
| 10  | **Medium**   | commit `bddd2e694`                          | `kilo.ai` help URL reverted to `opencode.ai`                      |
| 11  | Low          | `KiloProvider.ts:1261`                      | `let removed` style violation                                     |
| 12  | Low          | `KiloProvider.ts:2060`                      | `recursive: true` on single-file delete                           |
| 13  | Low          | `InstallModal.tsx:96-97`                    | `__method` magic key in params                                    |
| 14  | Low          | `kilo-provider-utils.ts:220`                | Unsafe type assertion without validation                          |
| 15  | Low          | `MarketplaceListView.tsx:63`                | Variable shadowing                                                |
| 16  | Low          | `InstallModal.tsx:41`                       | Dead ternary                                                      |
| 17  | Low          | `ItemCard.tsx:36-38`                        | Clickable spans missing a11y attributes                           |
| 18  | Low          | `i18n/*.ts`                                 | Revert strings in English only across all locales                 |
