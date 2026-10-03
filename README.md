# OpsCom skills

The agent skills we use at OpsCom Corp, in one public repo that the [`skills` CLI](https://skills.sh) can install from.

A skill is a folder with a `SKILL.md` in it. The file starts with YAML front matter: a `name`, plus a `description` that says what the skill does and when to use it. Then come the instructions. A coding agent (Claude Code, Codex, Cursor and others) loads only the descriptions up front. When a task matches one, it reads that skill's full instructions and follows them. Skills are how we hand an agent our conventions once, instead of repeating them in every prompt and every repo.

## Skills

| Skill                                                           | What it is for                        |
| --------------------------------------------------------------- | ------------------------------------- |
| [`git-workflow`](skills/git-workflow/README.md)                 | Git and PR flow when `master` is prod |
| [`opscom-design-system`](skills/opscom-design-system/README.md) | OpsCom UI on the design-system repo   |

Each link opens the skill's README, which gives the idea and the install commands. The instructions themselves live in that folder's `SKILL.md`.

## Install

```sh
npx skills add OpsComCorp/skills --list                                  # what the repo holds
npx skills add OpsComCorp/skills                                         # pick interactively
npx skills add OpsComCorp/skills --skill opscom-design-system            # one skill, this project
npx skills add OpsComCorp/skills --skill opscom-design-system -g         # one skill, every project
npx skills add OpsComCorp/skills --skill opscom-design-system -a claude-code -y   # one agent, no prompts
npx skills add OpsComCorp/skills --all                                   # every skill, every agent
```

- **Project install** (the default) copies the skill into the repo, for example `.claude/skills/<name>/` for Claude Code. It also writes `skills-lock.json`. Commit both, so everyone on the repo gets the same version.
- **Global install** (`-g`) goes to your user folder and applies to every project on your machine.
- **`-a`** picks the agents. Use `-a '*'` for every agent the CLI detects.

Keep installed skills current:

```sh
npx skills list                            # what is installed here
npx skills update                          # pull the latest version of installed skills
npx skills experimental_install            # restore a project's skills from skills-lock.json
npx skills remove opscom-design-system     # uninstall
```

Without the CLI (Claude Code only), copy the folder:

```sh
git clone https://github.com/OpsComCorp/skills.git
mkdir -p ~/.claude/skills
cp -r skills/skills/opscom-design-system ~/.claude/skills/
```

## Repository layout

```text
skills/
  <name>/
    SKILL.md     # what the agent reads: front matter + instructions
    README.md    # what people read: the idea + how to install
tests/           # pnpm test (offline) and pnpm test:online
.woodpecker/     # CI: runs pnpm verify on every PR and master push
README.md        # this file
```

The CLI finds every `skills/<name>/SKILL.md` on `master`. A merge to `master` is a release: the next `npx skills add` or `update` picks it up.

## Add a new skill

1. **Branch.** Work on your own dev branch, not on `master`. The [`git-workflow`](skills/git-workflow/README.md) skill describes the flow.
2. **Create the folder.**

   ```sh
   cd skills && npx skills init <name>    # creates skills/<name>/SKILL.md
   ```

   Run it from inside `skills/`. Given a path (`init skills/<name>`), it writes the path into `name:`.

   Use lowercase kebab-case for `<name>`. Prefix it with `opscom-` when the skill only makes sense inside OpsCom.

3. **Write the front matter.**

   ```yaml
   ---
   name: <name> # must match the folder name
   description: 'What it does. Use when … (the tasks, files and words that should trigger it).'
   ---
   ```

   The description is the only thing an agent sees before it decides to load the skill. Name the tasks, the files and the words a user would say. Quote the whole value if it contains a colon.

4. **Write the instructions** in `SKILL.md`. The house rules are below.
5. **Add `README.md`** next to it. Give the idea in a few lines, what the skill depends on, and the install commands. Copy the shape of an existing skill's README.
6. **List it** in the table above.
7. **Run the tests**, then try the skill in a scratch repo:

   ```sh
   pnpm install
   pnpm verify
   ```

8. **Open a PR to `master`.** CI runs the same `pnpm verify`; once it is green and merged, the skill is installable.

## Tests

`pnpm verify` runs both suites. CI runs it on [ci.opscom.io](https://ci.opscom.io) for every PR and every push to `master`.

- **`pnpm test`** (offline) checks each skill against the [Agent Skills spec](https://agentskills.io/specification):
  - `SKILL.md` and `README.md` exist.
  - `name` matches the folder and is lowercase kebab-case.
  - `description` is 1–1024 characters.
  - `SKILL.md` stays under 500 lines.
  - The skills CLI lists the skill.

  Across the whole repo it checks:
  - The table above lists exactly the skill folders.
  - Relative links resolve.
  - Table rows stay within 120 characters.
  - No file holds internal detail: home paths, local project paths, Linear URLs or ticket IDs.
- **`pnpm test:online`** checks that every external URL in a Markdown file still answers. Skills point at other repos, so a rename there can break a skill here.

### House rules for skill content

- **Point at the source of truth; don't copy it.** If the values live in another repo (tokens, configs, commands), the skill says where to read them. A copy goes stale quietly; a pointer can't.
- **Rules, not reference dumps.** Put in `SKILL.md` what an agent would get wrong without it. Leave out what it can read from the code.
- **Short and current.** Write in the present tense and American English. Delete a rule when it stops being true; don't keep "used to" notes.
- **One skill, one job.** If two skills would trigger on the same request, merge them or make their descriptions rule each other out.
