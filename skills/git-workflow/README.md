# git-workflow

The default git flow for repos where `master` is production. Every merge deploys, so work lands only through a reviewed pull request with green checks.

In short:

- Each developer works on a long-lived personal branch (`alice-dev`).
- Commits follow Conventional Commits.
- Rebase onto `origin/master` before you push.
- Open a PR to `master` and merge it once checks are green.

A repo's own `CONTRIBUTING.md`, `AGENTS.md` or `CLAUDE.md` overrides it.

The full instructions are in [`SKILL.md`](SKILL.md).

**When it triggers:** branching, committing, rebasing or syncing with `origin/master`, pushing, and opening or updating a pull request.

## Install

Into the current project, for every agent the CLI detects:

```sh
npx skills add OpsComCorp/skills --skill git-workflow
```

This copies the skill into the repo (for Claude Code, `.claude/skills/git-workflow/`) and records it in `skills-lock.json`. Commit both, so the whole team gets it.

Other ways:

```sh
# every project on your machine
npx skills add OpsComCorp/skills --skill git-workflow -g

# only Claude Code, no prompts
npx skills add OpsComCorp/skills --skill git-workflow -a claude-code -y

# without the CLI (Claude Code, user-level)
git clone https://github.com/OpsComCorp/skills.git
mkdir -p ~/.claude/skills && cp -r skills/skills/git-workflow ~/.claude/skills/
```

Check that it is installed, and keep it current:

```sh
npx skills list
npx skills update git-workflow
npx skills remove git-workflow
```

In Claude Code, start a new session after installing, then ask something like "open a PR for this branch". The agent should rebase onto `origin/master` before it pushes.
