// What the tests read: the skill folders and every tracked Markdown file.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const SKILLS_DIR = join(ROOT, "skills");

const IGNORED = new Set([".git", "node_modules"]);

export function skillNames(): string[] {
  return readdirSync(SKILLS_DIR)
    .filter((entry) => statSync(join(SKILLS_DIR, entry)).isDirectory())
    .sort();
}

/** Every file in the repo, as a path relative to ROOT. */
export function repoFiles(dir = ROOT): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (IGNORED.has(entry.name)) return [];
    const path = join(dir, entry.name);
    return entry.isDirectory() ? repoFiles(path) : [relative(ROOT, path)];
  });
}

export function markdownFiles(): string[] {
  return repoFiles().filter((file) => file.endsWith(".md"));
}

export function read(file: string): string {
  return readFileSync(join(ROOT, file), "utf8");
}
