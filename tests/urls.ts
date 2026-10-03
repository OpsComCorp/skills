// Online check, run by `pnpm test:online`: every external URL in a Markdown file
// answers. Skills point at other repos instead of copying them, so a renamed
// file there breaks a skill here without any local change.
import assert from "node:assert/strict";
import { test } from "node:test";
import { markdownFiles, read } from "./repo.ts";

const URL_PATTERN = /https?:\/\/[^\s)`'"<>\]]+/g;
const PLACEHOLDER = /example\.com|<[^>]+>/;

const urls = new Map<string, string>();
for (const file of markdownFiles()) {
  for (const [url] of read(file).matchAll(URL_PATTERN)) {
    const clean = url.replace(/[.,;:]+$/, "");
    if (!PLACEHOLDER.test(clean) && !urls.has(clean)) urls.set(clean, file);
  }
}

async function status(url: string): Promise<number> {
  const init = { redirect: "follow", signal: AbortSignal.timeout(15_000) } as const;
  const head = await fetch(url, { ...init, method: "HEAD" });
  if (head.ok) return head.status;
  // Some hosts reject HEAD; ask again with GET before calling the link broken.
  const get = await fetch(url, { ...init, method: "GET" });
  await get.body?.cancel();
  return get.status;
}

for (const [url, file] of urls) {
  test(`${url} (from ${file})`, async () => {
    const code = await status(url);
    assert.ok(code < 400, `HTTP ${code}`);
  });
}
