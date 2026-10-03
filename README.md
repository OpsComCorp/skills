# OpsCom skills

Agent skills used at OpsCom Corp, installable with [`npx skills`](https://skills.sh).

## Install

```sh
npx skills add OpsComCorp/skills                              # every skill, in this project
npx skills add OpsComCorp/skills --skill git-workflow -g      # one skill, globally (all detected agents)
npx skills add OpsComCorp/skills --list                       # list what the repo holds
```

Claude Code only, user-level, without the CLI:

```sh
mkdir -p ~/.claude/skills
cp -r skills/git-workflow ~/.claude/skills/
```

## Skills

- [`git-workflow`](skills/git-workflow/SKILL.md) — branch, commit, sync/rebase and pull-request workflow for repositories where `master` is production: personal dev branches, Conventional Commits, rebase before you push, green checks before merge.
- [`opscom-design-system`](skills/opscom-design-system/SKILL.md) — how to build and restyle OpsCom UI on [OpsComCorp/design-system](https://github.com/OpsComCorp/design-system): read its `DESIGN.md` and `tokens/theme.css` for every value, the rules agents get wrong, and the migrate-on-touch policy for older repos.
