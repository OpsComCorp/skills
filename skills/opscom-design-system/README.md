# opscom-design-system

Keeps every OpsCom UI on one look: the opscom.io homepage system published in [OpsComCorp/design-system](https://github.com/OpsComCorp/design-system).

The skill holds no colors, sizes or fonts. It sends the agent to that repo's `DESIGN.md` and `tokens/theme.css` for every value, and adds the rules agents tend to get wrong. New pages and components start on the system. Older UI in existing projects moves over when someone touches it. To change a value, edit the `design-system` repo, never an app.

The full instructions are in [`SKILL.md`](SKILL.md).

**When it triggers:** building or restyling OpsCom UI, wiring `theme.css` into a shadcn/Tailwind app, editing an older-looking page in an OpsCom repo, or questions about OpsCom colors, fonts or buttons.

**Needs:** network access to GitHub, or a local clone of the `design-system` repo.

## Install

Into the current project, for every agent the CLI detects:

```sh
npx skills add OpsComCorp/skills --skill opscom-design-system
```

This copies the skill into the repo (for Claude Code, `.claude/skills/opscom-design-system/`) and records it in `skills-lock.json`. Commit both, so the whole team gets it.

Other ways:

```sh
# every project on your machine
npx skills add OpsComCorp/skills --skill opscom-design-system -g

# only Claude Code, no prompts
npx skills add OpsComCorp/skills --skill opscom-design-system -a claude-code -y

# without the CLI (Claude Code, user-level)
git clone https://github.com/OpsComCorp/skills.git
mkdir -p ~/.claude/skills && cp -r skills/skills/opscom-design-system ~/.claude/skills/
```

Check that it is installed, and keep it current:

```sh
npx skills list
npx skills update opscom-design-system
npx skills remove opscom-design-system
```

In Claude Code, start a new session after installing, then ask something like "build a pricing section in the OpsCom style". The agent should read `DESIGN.md` before it writes any CSS.
