import type { Plugin } from "@opencode-ai/plugin";

const isDotenvPath = (pattern: string) =>
  /(^|[\\/])\.env(?:\.[^\\/]*)?(?:$|[\\/])/.test(pattern);

export default (async () => ({
  "permission.ask": async (input, output) => {
    const patterns = input.pattern
      ? Array.isArray(input.pattern)
        ? input.pattern
        : [input.pattern]
      : [];

    if (patterns.some(isDotenvPath)) output.status = "deny";
  },
})) satisfies Plugin;
