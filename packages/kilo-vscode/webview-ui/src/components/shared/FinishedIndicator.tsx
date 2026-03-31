/**
 * FinishedIndicator component
 * Shows a subtle "Task complete" message after the agent finishes a task,
 * making it clear the extension is idle and ready for the next input.
 */

import { Component, Show } from "solid-js"
import { Icon } from "@kilocode/kilo-ui/icon"
import { useSession } from "../../context/session"
import { useLanguage } from "../../context/language"

export const FinishedIndicator: Component = () => {
  const session = useSession()
  const language = useLanguage()

  const hasMessages = () => session.userMessages().length > 0

  return (
    <Show when={session.status() === "idle" && hasMessages()}>
      <div class="finished-indicator" role="status" aria-label={language.t("session.status.finished")}>
        <Icon name="circle-check" size="small" class="finished-icon" />
        <span class="finished-text">{language.t("session.status.finished")}</span>
      </div>
    </Show>
  )
}
