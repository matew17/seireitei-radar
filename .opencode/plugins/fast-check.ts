import type { Plugin } from "@opencode-ai/plugin"

export const FastCheck: Plugin = async ({ $ }) => {
  return {
    "tool.execute.after": async (input) => {
      if (input.tool !== "edit" && input.tool !== "write") return
      const file: string = input.args.filePath ?? ""
      if (!file.endsWith(".ts")) return
      await $`npx eslint --fix ${file}`.quiet().nothrow()
    },
  }
}
