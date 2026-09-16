# OpsCom skills

Agent skills used at OpsCom Corp, installable with [`npx skills`](https://skills.sh).

## Install

```sh
npx skills add OpsComCorp/skills                              # every skill, in this project
npx skills add OpsComCorp/skills --skill contributing -g      # one skill, globally (all detected agents)
npx skills add OpsComCorp/skills --list                       # list what the repo holds
```

Claude Code only, user-level, without the CLI:

```sh
mkdir -p ~/.claude/skills
cp -r skills/contributing ~/.claude/skills/
```

## Skills

- [`contributing`](skills/contributing/SKILL.md) — branch, commit, sync/rebase and pull-request workflow for repositories where `master` is production: personal dev branches, Conventional Commits, rebase before you push, green checks before merge.
