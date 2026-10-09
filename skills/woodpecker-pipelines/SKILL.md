---
name: woodpecker-pipelines
description: 'Write, add or change Woodpecker CI workflows (`.woodpecker/*.yaml`) for an app that builds a Docker image to GHCR and deploys to EasyPanel: the checks workflow (lint, typecheck, unit tests), optional e2e and PR preview workflows, the production deploy, and Slack notify steps for failure and success. Use when setting up CI for a repo, adding or editing a workflow, moving a repo from GitHub Actions to Woodpecker, or adding a Playwright, preview or deploy stage. Not for reading why a pipeline failed: that is debugging a run, not writing a workflow.'
---

# Woodpecker pipelines

Every repo gets the same chain of workflows. Each `.woodpecker/*.yaml` file is one workflow; every workflow one event
starts is one pipeline. Copy the templates in [`templates/`](templates/), fill the placeholders, and delete the
optional commented blocks the repo doesn't use (Postgres, migration guard). Keep the other comments: they say why each
line is there, and the next person will want to remove it.

| Workflow                 | Needed   | Runs on                          | Waits on        |
| ------------------------ | -------- | -------------------------------- | --------------- |
| `checks.yaml`            | always   | PR, push to master, manual       | nothing         |
| `e2e.yaml`               | optional | PR, push to master, manual       | `checks`        |
| `preview.yaml`           | optional | PR                               | `checks`, `e2e` |
| `preview-teardown.yaml`  | with it  | PR closed                        | nothing         |
| `deploy.yaml`            | always   | push to master, manual on master | `checks`, `e2e` |

The templates assume Node with pnpm, a `Dockerfile` at the repo root, `master` as the production branch, and these
org secrets on the Woodpecker server: `ghcr_username`, `ghcr_token`, `easypanel_token`, `slack_webhook`. Before writing:

- Read the repo's `package.json` scripts, `.nvmrc`, `Dockerfile` and `AGENTS.md`, and use the commands it already has
  (its `test:e2e` script, not a bare `playwright test`).
- Check `pnpm-lock.yaml` is committed. `--frozen-lockfile` fails without it: generate and commit it first.
- Check the production branch with `git symbolic-ref refs/remotes/origin/HEAD`. If it is `main`, replace `master`
  everywhere.
- Ask for what the files can't tell you: the EasyPanel project and service, and the runtime env the service needs.

Placeholders: `<org>` and `<app>` (the GHCR path, lowercase), `<easypanel-url>`, `<ep-project>`, `<ep-service>`;
`<domain>` in the preview templates only.

With `e2e.yaml`, uncomment `- e2e` under `depends_on` in `deploy.yaml` (and `preview.yaml`). Left commented, the
deploy ships without waiting for the browser tests.

## Gates

- **A PR is gated by the same steps that gate a deploy.** Checks and e2e run on `pull_request` and on `push` to
  master; deploy runs on `push` to master and `depends_on` them. Never deploy from a workflow that skipped them.
- **Keep the `when` lists in step.** A workflow that `depends_on` another runs only when that one ran for the same
  event. A deploy that allows `manual` needs checks that allow `manual` too, or the deploy never starts.
- **`manual` deploys only from master:** `- event: manual` plus `branch: master`. Without the branch, a manual run on
  any branch ships that branch to production.
- **`when: path` applies to `push` and `pull_request` only.** Other events ignore it and run the workflow. A
  dependency skipped by its path filter counts as passed.
- **Order costs a slot.** Each workflow takes one of the agent's parallel slots. Make e2e wait on checks so a lint
  failure stops the pipeline before Chromium installs.
- **Repo setting:** "Cancel previous pipelines" must not include push, or a new push kills a deploy mid-flight.

## Steps

- **Pin every image** to an exact tag (`node:24.21.0`, `curlimages/curl:8.22.0`). No tag means `latest`, which
  changes under you. Match the Node version to `.nvmrc` and the Dockerfile.
- **pnpm through corepack:** `COREPACK_ENABLE_DOWNLOAD_PROMPT: "0"`, `corepack enable pnpm`, then
  `pnpm install --frozen-lockfile`.
- **Run the repo's own scripts** (`pnpm lint`, `pnpm typecheck`, `pnpm test`), never a hand-written glob that drops
  new test files.
- **`$$` for shell variables.** `$${VAR}` reaches the shell; a single `${CI_COMMIT_SHA}` is substituted by Woodpecker
  before the step runs, which is what you want for CI values in `settings` and messages.
- **Services are reached by their `name`** (`postgres:5432`), never `localhost`, never a host port. Wait for one with
  `timeout 60 bash -c 'until (echo > /dev/tcp/postgres/5432) 2> /dev/null; do sleep 1; done'`.
- **Size worker pools to the container's CPU cap** (`vitest --maxWorkers 2` on a 2-CPU cap). The container reports
  the host's cores, and more workers than CPUs makes timing-sensitive tests race.
- **Install packages with apt on a Debian-based image** (`node:<version>`), not apk. An Alpine image that installs
  nothing is fine.
- **The workspace is gone when the step ends.** There is no artifact upload: print what you need (Playwright's
  `error-context.md`) into the log on failure.
- **Lint every file** from the repo root before pushing. Locally the CLI doesn't know the server's privileged plugins, so name buildx:
  `woodpecker-cli lint --strict --plugins-privileged woodpeckerci/plugin-docker-buildx:6 .woodpecker/<file>.yaml`.

## Build and push

- **`woodpeckerci/plugin-docker-buildx:6`, exactly that tag.** It runs privileged, and the server accepts only the
  tags in `WOODPECKER_PLUGINS_PRIVILEGED`. Another tag fails lint with "formerly privileged plugin".
- **The GHCR path is lowercase:** `ghcr.io/myorg/app`, not `MyOrg`.
- **Tag `latest` and `sha-${CI_COMMIT_SHA}`.** The service runs `latest`; the sha tag is the rollback.
- **`build_args` is a map** (`BUILD_SHA: ${CI_COMMIT_SHA}`). A list of `KEY=VALUE` builds green with empty args.
  `NEXT_PUBLIC_*` values are inlined at build time, so they are build args, never the panel's runtime env. A build
  arg the Dockerfile has no `ARG` for is silently dropped: add `ARG BUILD_SHA` where the app reads it.
- **Registry cache:** `cache_from: 'type=registry\,ref=<repo>:buildcache'` (the plugin splits on commas; `\,` keeps
  one value) and `cache_to: ...,mode=max,ignore-error=true` so a cache hiccup never fails a deploy.

## Deploy

- **The deploy step asks EasyPanel to redeploy one service**, which pulls `latest`. Use the curl in
  `templates/deploy.yaml` as is.
- **Never add `|| true` or `|| echo`** to it. The `||` branch succeeds, so a refused redeploy goes green while
  production keeps the old image. `--fail-with-body` fails on 400 and up and keeps the reason in the log.
- **A 2xx means accepted, not running.** EasyPanel pulls and restarts on its own; a crash loop still leaves the step
  green. Bake `BUILD_SHA` into the page (a meta tag) so anyone can see which commit is live, and watch a health URL
  with uptime monitoring.
- **Runtime env lives in the panel** and is never written from CI. List what the service needs in the workflow's
  header comment, with what breaks without it.
- **Secrets the deploy needs are allowed on push and manual only.** Write them in the header comment.

## Preview

Optional and heavier than it looks. A preview needs a repo script (`scripts/preview.sh up|down`) that creates and
removes EasyPanel services, a wildcard DNS record, repo secrets allowed on PR events, and `preview-teardown.yaml`, or
every abandoned PR leaves a service running. Tag preview images with the commit sha, never a fixed `pr-N` tag, and
write their build cache to a separate `pr-buildcache` tag so a PR never evicts master's layers. Keep the host one
label deep (`pr-12-app.example.com`): a wildcard certificate does not cover `pr-12.app.example.com`.

**Previews belong in private repos.** Any PR that runs can read the secrets its workflow gets: it controls the YAML,
and no command filter stops `curl` or `base64`. Teammates already get the same secrets on push, so the risk is fork
PRs, and a private repo with org-level forking off gets none. For a public repo, follow the "Public repo" notes in
the header of `templates/preview.yaml`: keep fork approval on and read every fork's `.woodpecker/` changes before
approving, limit PRs to collaborators, or give the preview its own narrow secrets.

## Notify

Every workflow ends with two Slack steps, copied from the templates: `notify-failure` and `notify-success`.

- **Steps, not a separate notify workflow.** A workflow filtered to `status: [failure]` runs only when every workflow
  it depends on failed, and `CI_PIPELINE_STATUS` reflects only the workflow it runs in, so a separate one misses a
  red e2e after a green checks.
- **Failure posts on every event except pull requests; success posts only on push and manual to master.** Checks
  and e2e on a PR never post: the red or green check is the message. The org `slack_webhook` is not allowed on pull
  request events, and a step whose `when` excludes the event is dropped before its secret is looked up.
- **Preview is the exception:** it posts on failure and on success, with the PR number and the preview URL, so
  someone comes to check. That needs `slack_webhook` as a repo secret that also allows `pull_request` (see the
  header of `templates/preview.yaml`). `preview-teardown.yaml` posts nothing.
- **`failure: ignore`** on both, so a Slack outage never turns a good deploy red.
- **The deploy's success message says "deployed"**; the others say "passed".
- **No commit text in the message.** A quote in it breaks the JSON.
- **`slack_webhook` has no image filter.** A secret with an image filter fails in a `commands` step.

## Checklist

1. `pnpm-lock.yaml` is committed; `checks.yaml` and `deploy.yaml` exist; every workflow ends with `notify-failure` and `notify-success`.
2. Every `depends_on` points at a workflow whose `when` covers the same events, and `deploy.yaml` lists every check
   workflow that exists (`e2e` included).
3. `manual` in `deploy.yaml` carries `branch: master`.
4. Every image is pinned; buildx is exactly `:6`; the GHCR path is lowercase.
5. The deploy curl has no `||`.
6. The header comment of each deploy names the service, its secrets and its runtime env.
7. `woodpecker-cli lint` passes on every file, and the first PR pipeline runs green before you merge.
