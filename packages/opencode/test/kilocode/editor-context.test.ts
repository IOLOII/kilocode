import { describe, expect, test } from "bun:test"
import { environmentDetails, staticEnvLines } from "../../src/kilocode/editor-context"

describe("environmentDetails", () => {
  test("contains date-only timestamp without hours/minutes/seconds", () => {
    const result = environmentDetails()
    // Must contain a date line
    expect(result).toContain("Current date:")
    // Must NOT contain time-of-day (hours:minutes:seconds pattern like T13:32:40)
    expect(result).not.toMatch(/Current (?:date|time): \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    // Must NOT use "Current time:" label at all
    expect(result).not.toContain("Current time:")
  })

  test("date matches YYYY-MM-DD+HH:MM format", () => {
    const result = environmentDetails()
    expect(result).toMatch(/Current date: \d{4}-\d{2}-\d{2}[+-]\d{2}:\d{2}/)
  })

  test("is stable across consecutive calls on the same day", () => {
    const a = environmentDetails()
    const b = environmentDetails()
    expect(a).toBe(b)
  })

  test("wraps in environment_details tags", () => {
    const result = environmentDetails()
    expect(result).toMatch(/^<environment_details>\n/)
    expect(result).toMatch(/<\/environment_details>$/)
  })

  test("includes active file when provided", () => {
    const result = environmentDetails({ activeFile: "src/index.ts" })
    expect(result).toContain("Active file: src/index.ts")
  })

  test("includes visible files when provided", () => {
    const result = environmentDetails({ visibleFiles: ["a.ts", "b.ts"] })
    expect(result).toContain("Visible files:")
    expect(result).toContain("  a.ts")
    expect(result).toContain("  b.ts")
  })

  test("includes open tabs when provided", () => {
    const result = environmentDetails({ openTabs: ["x.ts", "y.ts"] })
    expect(result).toContain("Open tabs:")
    expect(result).toContain("  x.ts")
    expect(result).toContain("  y.ts")
  })

  test("omits optional sections when not provided", () => {
    const result = environmentDetails()
    expect(result).not.toContain("Active file:")
    expect(result).not.toContain("Visible files:")
    expect(result).not.toContain("Open tabs:")
  })
})

describe("staticEnvLines", () => {
  test("includes shell when provided", () => {
    const result = staticEnvLines({ shell: "/bin/bash" })
    expect(result).toEqual(["  Default shell: /bin/bash"])
  })

  test("returns empty array when no context", () => {
    expect(staticEnvLines()).toEqual([])
    expect(staticEnvLines({})).toEqual([])
  })
})
