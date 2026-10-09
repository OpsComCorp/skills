# woodpecker-pipelines

How we write Woodpecker CI workflows for an app that ships as a Docker image to GHCR and runs on EasyPanel. Every repo gets the same chain:

- **`checks`**: lint, typecheck and unit tests, on every PR and every push to `master`.
- **`e2e`** (optional): Playwright, after `checks`.
- **`preview`** (optional): one preview deploy per PR, removed when the PR closes.
- **`deploy`**: build, push and redeploy production, only after the checks pass on `master`.

Every workflow ends with Slack steps that post on failure and on success. On pull requests only the preview posts.

The full instructions are in [`SKILL.md`](SKILL.md); copy-ready workflows are in [`templates/`](templates/).

**When it triggers:** setting up CI for a repo, adding or editing a `.woodpecker/*.yaml` workflow, moving from GitHub Actions to Woodpecker, or adding an e2e, preview or deploy stage. It does not cover debugging a failed run.

**Depends on:** a Woodpecker server with org secrets `ghcr_username`, `ghcr_token`, `easypanel_token` and `slack_webhook`, and `woodpeckerci/plugin-docker-buildx:6` allowed as a privileged plugin.

## Install

Into the current project, for every agent the CLI detects:

```sh
npx skills add OpsComCorp/skills --skill woodpecker-pipelines
```

This copies the skill into the repo (for Claude Code, `.claude/skills/woodpecker-pipelines/`) and records it in `skills-lock.json`. Commit both, so the whole team gets it.

Other ways:

```sh
# every project on your machine
npx skills add OpsComCorp/skills --skill woodpecker-pipelines -g

# only Claude Code, no prompts
npx skills add OpsComCorp/skills --skill woodpecker-pipelines -a claude-code -y

# without the CLI (Claude Code, user-level)
git clone https://github.com/OpsComCorp/skills.git
mkdir -p ~/.claude/skills && cp -r skills/skills/woodpecker-pipelines ~/.claude/skills/
```

Check that it is installed, and keep it current:

```sh
npx skills list
npx skills update woodpecker-pipelines
npx skills remove woodpecker-pipelines
```

In Claude Code, start a new session after installing, then ask something like "set up Woodpecker CI for this repo". The agent should write `checks.yaml` and `deploy.yaml` with notify steps at the end of each.
