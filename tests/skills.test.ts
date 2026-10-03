// Offline checks for every skill and every Markdown file. Limits come from the
// Agent Skills spec: https://agentskills.io/specification
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { parse } from "yaml";
import { markdownFiles, read, repoFiles, ROOT, skillNames } from "./repo.ts";

const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_NAME = 64;
const MAX_DESCRIPTION = 1024;
const MAX_COMPATIBILITY = 500;
const MAX_SKILL_LINES = 500;
const MAX_TABLE_ROW = 120;

// This repo is public. These catch the generic shapes of internal detail:
// a local home path, a tracker URL or a ticket ID.
const LEAKS: ReadonlyArray<[string, RegExp]> = [
  ["macOS home path", /\/Users\/[A-Za-z]/],
  ["Linux home path", /\/home\/[a-z]/],
  ["local project path", /~\/Projects\//],
  ["Linear URL", /linear\.app\//],
  // Our Linear team key only; a wider pattern also matches UTF-8 or SHA-256.
  ["ticket ID", /\bOPS-\d+\b/],
];
const LEAK_EXEMPT = new Set(["tests/skills.test.ts", "pnpm-lock.yaml"]);

function frontMatter(file: string): Record<string, unknown> {
  const match = read(file).match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, `${file} must start with a --- front matter block`);
  const data: unknown = parse(match[1]);
  assert.ok(data && typeof data === "object" && !Array.isArray(data), `${file} front matter must be a mapping`);
  return data as Record<string, unknown>;
}

describe("each skill", () => {
  const names = skillNames();

  test("the repo has at least one skill", () => {
    assert.ok(names.length > 0);
  });

  for (const folder of names) {
    describe(folder, () => {
      const skill = `skills/${folder}/SKILL.md`;

      test("has SKILL.md and README.md", () => {
        assert.ok(existsSync(join(ROOT, skill)), `missing ${skill}`);
        assert.ok(existsSync(join(ROOT, `skills/${folder}/README.md`)), `missing skills/${folder}/README.md`);
      });

      test("name is valid and matches the folder", () => {
        const { name } = frontMatter(skill);
        assert.equal(name, folder, "name must match the folder name");
        assert.ok(folder.length <= MAX_NAME, `name is over ${MAX_NAME} characters`);
        assert.match(folder, NAME, "lowercase letters, digits and single hyphens only");
      });

      test("description is a non-empty string within the limit", () => {
        const { description } = frontMatter(skill);
        assert.equal(typeof description, "string", "description must be a string");
        const text = (description as string).trim();
        assert.ok(text.length > 0, "description is empty");
        assert.ok(text.length <= MAX_DESCRIPTION, `description is ${text.length} characters, max ${MAX_DESCRIPTION}`);
      });

      test("compatibility, if set, is within the limit", () => {
        const { compatibility } = frontMatter(skill);
        if (compatibility === undefined) return;
        assert.equal(typeof compatibility, "string");
        assert.ok((compatibility as string).length <= MAX_COMPATIBILITY);
      });

      test(`SKILL.md is under ${MAX_SKILL_LINES} lines`, () => {
        const lines = read(skill).split("\n").length;
        assert.ok(lines < MAX_SKILL_LINES, `${lines} lines; move detail into references/`);
      });
    });
  }
});

describe("root README", () => {
  test("its skills table lists exactly the skill folders", () => {
    const listed = [...read("README.md").matchAll(/^\| \[`([^`]+)`\]\(skills\/([^/]+)\/README\.md\)/gm)];
    for (const [, label, folder] of listed) assert.equal(label, folder, `table row ${label} links to ${folder}`);
    assert.deepEqual(listed.map(([, , folder]) => folder).sort(), skillNames());
  });
});

describe("Markdown files", () => {
  for (const file of markdownFiles()) {
    test(`${file}: relative links resolve`, () => {
      const text = read(file).replace(/```[\s\S]*?```/g, "");
      for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
        if (/^(https?:|mailto:|#)/.test(target)) continue;
        const path = join(ROOT, dirname(file), target.split("#")[0]);
        assert.ok(existsSync(path), `broken link: ${target}`);
      }
    });

    test(`${file}: table rows are at most ${MAX_TABLE_ROW} characters`, () => {
      const long = read(file)
        .split("\n")
        .filter((line) => line.startsWith("|") && line.length > MAX_TABLE_ROW);
      assert.deepEqual(long, []);
    });
  }
});

describe("public-repo hygiene", () => {
  for (const file of repoFiles().filter((f) => !LEAK_EXEMPT.has(f))) {
    test(`${file} has no internal detail`, () => {
      const text = read(file);
      for (const [label, pattern] of LEAKS) {
        const hit = text.match(pattern);
        assert.equal(hit, null, `${label}: "${hit?.[0]}"`);
      }
    });
  }
});

describe("skills CLI", () => {
  test("finds every skill folder", () => {
    const out = execFileSync("pnpm", ["exec", "skills", "add", ".", "--list"], {
      cwd: ROOT,
      encoding: "utf8",
      env: { ...process.env, NO_COLOR: "1", DO_NOT_TRACK: "1", DISABLE_TELEMETRY: "1" },
    });
    const names = skillNames();
    assert.match(out, new RegExp(`Found ${names.length} skills?`));
    for (const name of names) assert.match(out, new RegExp(`^\\W*${name}\\s*$`, "m"), `CLI did not list ${name}`);
  });
});
