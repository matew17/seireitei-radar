import type { Plugin } from "@opencode-ai/plugin"

const BLOCKED = [
  { re: /\bDROP\s+TABLE/i, why: "Destructive database operation blocked." },
  { re: /\bTRUNCATE\b/i, why: "Destructive database operation blocked." },
  { re: /prisma\s+migrate\s+reset/, why: "Destructive database operation blocked." },
]

export const GitGuard: Plugin = async ({ $ }) => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "bash") return
      const cmd: string = output.args.command ?? ""

      for (const { re, why } of BLOCKED) {
        if (re.test(cmd)) throw new Error(why)
      }

      // Push estando parado en main — chequeo dinámico, imposible con un glob
      if (/\bgit\s+push\b/.test(cmd)) {
        const branch =
          (await $`git rev-parse --abbrev-ref HEAD`.text()).trim()
        if (branch === "main" || branch === "master") {
          throw new Error(
            `Current branch is ${branch}. Create a feature branch before pushing.`
          )
        }
      }
    },
  }
}
