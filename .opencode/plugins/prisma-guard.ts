import type { Plugin } from "@opencode-ai/plugin"

export const PrismaGuard: Plugin = async ({ $ }) => {
  return {
    "tool.execute.after": async (input) => {
      if (input.tool !== "edit" && input.tool !== "write") return
      const file: string = input.args.filePath ?? ""
      if (!file.endsWith("schema.prisma")) return

      const schemaDiff =
        await $`git diff --quiet -- prisma/schema.prisma`.nothrow()
      if (schemaDiff.exitCode === 0) return

      const status = await $`git status --porcelain prisma/migrations`.text()
      const newMigrations = status
        .split("\n")
        .filter((l) => l.startsWith("??")).length

      if (newMigrations === 0) {
        throw new Error(
          "schema.prisma changed without a migration.\n" +
            "Run: npx prisma migrate dev --name <descriptive_name>\n" +
            "Constitution II: schema changes require a versioned migration " +
            "in the same commit."
        )
      }
    },
  }
}
