import type { Plugin } from "@opencode-ai/plugin"
import { appendFileSync, mkdirSync, readFileSync } from "node:fs"

export const Telemetry: Plugin = async ({ directory }) => {
  return {
    event: async ({ event }) => {
      // session.idle ≈ el hook Stop de Claude Code
      if (event.type !== "session.idle") return

      let spec = "none"
      try {
        spec = readFileSync(`${directory}/.sdd/current-spec`, "utf-8").trim()
      } catch {}

      const runsDir = `${directory}/.sdd/runs`
      mkdirSync(runsDir, { recursive: true })

      const day = new Date().toISOString().slice(0, 10)
      appendFileSync(
        `${runsDir}/${day}.jsonl`,
        JSON.stringify({
          ts: new Date().toISOString(),
          spec,
          event: event.type,
        }) + "\n"
      )
    },
  }
}
