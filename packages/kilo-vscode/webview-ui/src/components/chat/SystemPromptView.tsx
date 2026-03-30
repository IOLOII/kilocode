/**
 * SystemPromptView component
 * Displays the assembled system prompt segments.
 * Rendered as an overlay inside the messages area so it doesn't shift the prompt input.
 */

import { Component, For, Show, createEffect, createSignal, on, onCleanup } from "solid-js"
import { IconButton } from "@kilocode/kilo-ui/icon-button"
import { Tooltip } from "@kilocode/kilo-ui/tooltip"
import { Spinner } from "@kilocode/kilo-ui/spinner"
import { useVSCode } from "../../context/vscode"
import { useSession } from "../../context/session"
import { useLanguage } from "../../context/language"
import type { ExtensionMessage } from "../../types/messages"

export const SystemPromptView: Component<{ onClose: () => void }> = (props) => {
  const vscode = useVSCode()
  const session = useSession()
  const language = useLanguage()

  const [system, setSystem] = createSignal<string[]>([])
  const [loading, setLoading] = createSignal(true)
  const [copied, setCopied] = createSignal(false)

  // Re-fetch when session changes; close if session is cleared
  createEffect(
    on(
      () => session.currentSessionID(),
      (sid) => {
        if (!sid) {
          props.onClose()
          return
        }
        setLoading(true)
        setSystem([])
        vscode.postMessage({ type: "requestSystemPrompt", sessionID: sid })
      },
    ),
  )

  const unsub = vscode.onMessage((msg: ExtensionMessage) => {
    if (msg.type !== "systemPromptLoaded") return
    if (msg.sessionID !== session.currentSessionID()) return
    setSystem(msg.system)
    setLoading(false)
  })
  onCleanup(unsub)

  const copyAll = () => {
    const text = system().join("\n\n")
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div data-component="system-prompt-view">
      <div data-slot="system-prompt-header">
        <span data-slot="system-prompt-title">{language.t("context.systemPrompt.title")}</span>
        <div data-slot="system-prompt-actions">
          <Tooltip
            value={copied() ? language.t("context.systemPrompt.copied") : language.t("context.systemPrompt.copy")}
            placement="bottom"
          >
            <IconButton
              icon={copied() ? "check" : "copy"}
              size="small"
              variant="ghost"
              onClick={copyAll}
              aria-label={language.t("context.systemPrompt.copy")}
              data-copied={copied() ? "" : undefined}
            />
          </Tooltip>
          <Tooltip value={language.t("common.close")} placement="bottom">
            <IconButton
              icon="close"
              size="small"
              variant="ghost"
              onClick={props.onClose}
              aria-label={language.t("common.close")}
            />
          </Tooltip>
        </div>
      </div>

      <Show when={loading()}>
        <div data-slot="system-prompt-loading">
          <Spinner />
        </div>
      </Show>
      <Show when={!loading()}>
        <div data-slot="system-prompt-content">
          <For each={system()}>{(segment) => <pre data-slot="system-prompt-segment">{segment}</pre>}</For>
        </div>
      </Show>
    </div>
  )
}
