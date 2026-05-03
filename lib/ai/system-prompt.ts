import "server-only";

/**
 * Lazy module-scoped loader for the v5 framework system prompt.
 *
 * Reads `public/brand-archetypes-v5.md` (~10k tokens) once per process and caches
 * the resulting promise. Dynamic `import("node:fs/promises")` keeps Turbopack from
 * trying to resolve `fs` if anything ever transitively imports this from a client
 * boundary by mistake — the import only runs on the server at request time.
 */

let cached: Promise<string> | null = null;

export function loadSystemPrompt(): Promise<string> {
  if (!cached) {
    cached = (async () => {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      return fs.readFile(
        path.join(process.cwd(), "public", "brand-archetypes-v5.md"),
        "utf8",
      );
    })();
  }
  return cached;
}
