---
name: git-workflow
description: Git workflow for repositories where master is production and protected — personal dev branches, Conventional Commits, rebase before you push, green checks before merge. Use when branching, committing, rebasing, syncing with origin/master, pushing, or opening or updating a pull request.
---

# Git workflow

`master` is production. Every push to it deploys, so a merge is a deploy rather than a checkpoint: this is GitHub Flow on long-lived personal branches — each developer integrates on their own branch and lands work through a pull request with green checks.

A repo states its own gates and may override this workflow; read its `CONTRIBUTING.md`, `AGENTS.md` or `CLAUDE.md`, and its `package.json` scripts first. What follows is the default when the repo is silent.

## Branches

- **`master`** — protected. Never commit to it, never push to it, never force-push it. Changes arrive only through a pull request.
- **Personal dev branches** — one per developer, long-lived, named after the person: `alice-dev`, `bob-dev` (substitute your own). Work on your own branch, not on someone else's.
- **Parallel work** gets a numbered branch off `master`: `alice-dev-2`, `alice-dev-3`. One workstream per branch; two unrelated features are two pull requests.

`master` is a read-only mirror on your machine: fetch it, merge or rebase it into your branch, never edit while it is checked out. No local hook enforces this; branch protection is the backstop.

Create a branch from an up-to-date `master`:

```sh
git fetch origin
git switch master
git pull --ff-only
git switch -c alice-dev-2   # only the first time
```

## Commits

Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`…), one logical change per commit.

## Sync: rebase before you push

**Rebase onto `origin/master` before you push.** That is the preferred way to sync, and it keeps the branch a readable stack on top of `master`.

```sh
git fetch origin
git switch <your-branch>
git rebase origin/master
# resolve conflicts here, in the branch
git push --force-with-lease      # --force-with-lease, never --force
```

Rebasing is fine **on your own branch only**, when nobody else has based work on it: it rewrites history, so it needs `git push --force-with-lease`. Never force-push `master`.

Merge instead when the branch is shared or somebody else may build on it — a merge is a normal push and needs no force:

```sh
git fetch origin
git merge origin/master
# resolve conflicts here, in the branch, and commit the merge
```

Never resolve a conflict on `master`. Sync again after any PR of yours is merged, so your branch does not re-merge later. Nothing syncs automatically: when a teammate merges, your branch does not move and nothing warns you.

## Before you push

1. Sync, rebasing onto `origin/master` (above).
2. Run the repo's gates locally — CI must be green before merge. Typical pnpm gates:

   ```sh
   pnpm lint
   pnpm typecheck
   pnpm test:unit -- --run
   ```

3. Regenerate and commit generated artifacts when the repo has them; CI fails on a stale one (e.g. `pnpm db:codegen` then `pnpm db:commit`).
4. Push, and update the pull request description when behaviour changed.

## Pull requests

Open the PR against `master` as soon as the work is reviewable, and mark it **Draft** while it is not.

- **Title** — a Conventional Commit describing the PR as a whole, not its first commit. Rewrite it when the scope changes.
- **Description** — fill in every section of the template. **Update it on every push that changes behaviour**; a description that no longer matches the diff is an incomplete PR.
- **Merge** — a merge commit, as the repository history uses. Leave the dev branch in place; it is long-lived, not per-PR.

## Rules

- No direct pushes to `master`.
- Force-push only your own branch — or the one you are pairing on, with its owner's agreement. Never `master`.
- Do not delete another developer's branch.
- No secrets in a branch, and never in a PR description.
- Keep the PR scoped; a second, unrelated fix gets its own branch.

## Repository settings (GitHub, one-time)

- Protect `master`: **require a pull request before merging**, **require the CI status check**, disallow force-pushes and deletions.
- Tick **Require branches to be up to date before merging**. GitHub already blocks a conflicted PR, so this is not a conflict guard: it makes the required checks run against the base that will actually be merged, and forces a conflict-free stale branch to sync before it can merge.
- Register the check context CI reports. When one suite also runs as a reusable workflow under a deploy workflow, the contexts differ (`test` and `test / test`) — register the one the PR carries.
