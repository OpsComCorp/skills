---
name: opscom-design-system
description: 'How to build and restyle OpsCom UI on the OpsCom design system — the opscom.io homepage look published as DESIGN.md plus a generated shadcn/Tailwind v4 theme in the OpsComCorp/design-system repo. Use when creating a new page, component or demo app for OpsCom; wiring tokens/theme.css into a shadcn app; touching UI in an OpsCom repo that still has its own older look; or answering questions about OpsCom colors, fonts, spacing, buttons or brand. Not for authoring the DESIGN.md format itself (use design-md for that).'
---

# OpsCom design system

The OpsComCorp/design-system repo is the source of truth for how OpsCom looks. This skill holds no values — no hex codes, pixel sizes or font sizes. It tells you where they live, how to apply them, and how to move older UI onto them.

If this skill and the repo ever disagree, the repo wins.

## Read the source first

Before you write or review any UI, read these two files and take every value from them:

- **`DESIGN.md`** — the tokens (YAML front matter) and the rules behind them (prose). Read the whole file once per task; the Do's and Don'ts section is short and binding.
- **`tokens/theme.css`** — the generated shadcn/Tailwind v4 theme. Copy it into apps; never edit a copy by hand.

Use a local checkout when there is one, and fetch from GitHub otherwise:

```sh
# local clone of OpsComCorp/design-system
git -C path/to/design-system pull --ff-only   # make sure it is current
cat path/to/design-system/DESIGN.md

# anywhere else
curl -fsSL https://raw.githubusercontent.com/OpsComCorp/design-system/master/DESIGN.md
curl -fsSL https://raw.githubusercontent.com/OpsComCorp/design-system/master/tokens/theme.css
```

The repo's `README.md` has the exact shadcn setup steps, and its `AGENTS.md` has the rules for changing a value. Follow those files; this skill does not repeat them.

## Rules that hold everywhere

These are the decisions agents most often get wrong. The values behind them are in `DESIGN.md`.

- **Use token names, not values.** Write `bg-background`, `text-muted-foreground`, `border-border`, `font-heading`, `text-headline-xl`, `rounded-2xl`. A hex code, `px` font size or font-family string in app code is a bug unless DESIGN.md names it as a one-off.
- **Interactive and non-interactive must look different.** Buttons are pills (`rounded-full`); links are underlined; tabs and selection use `brand`. Titles, labels and text blocks are never boxed, filled or rounded like a control. If a user could mistake a heading for a button, the design is wrong.
- **`primary` is the resting button; `brand` is state.** `brand` shows hover, selected, focus and text selection only — never a resting fill, never decoration, never a link color.
- **Two faces, two weights.** Headings use `font-heading`, everything else `font-sans`. Only the weights DESIGN.md lists; nothing bolder.
- **Flat.** Hierarchy comes from tonal steps and hairline borders. Don't add shadows, gradients on surfaces, a second accent color, a monospace face, or decorative icons.
- **Big media is rounded; text is not boxed.** Cards are open columns separated by whitespace and hairlines.
- **Dark is a band, not a theme toggle.** Put `class="dark"` on one section for the forward-looking band; DESIGN.md says when.
- **Section openers follow the section-header pattern** in DESIGN.md's Layout section: slash label, headline, short muted description.
- **Accessible by default.** Every interactive target meets the touch-target token on phones; every focusable element shows the focus ring; every animation stops under `prefers-reduced-motion: reduce`.
- **Breakpoints are the system's.** `md`, `lg` and `2xl` are redefined by `theme.css`; don't add arbitrary `min-[...]` breakpoints.
- **Missing token? Stop and ask.** If DESIGN.md has no value for what you need (chart colors are not defined yet, for example), say so and propose the token in the design-system repo. Don't invent one locally.

## Building new UI

New pages, components and demo apps start on the design system — no exceptions without the user's say-so.

1. Read `DESIGN.md` and the repo `README.md`.
2. In a new shadcn/Tailwind v4 app, install `tokens/theme.css` exactly as the README says, including deleting shadcn's own generated theme blocks. In an existing app, see "Migrating older UI" below first.
3. Give shadcn's Button the pill shape in the app's `components/ui/button.tsx`, as DESIGN.md's Do's and Don'ts require.
4. Build from shadcn components styled by the tokens. Only write a custom component when DESIGN.md describes one (its Components section) and shadcn has nothing close.
5. Check the result against DESIGN.md's Do's and Don'ts before calling it done, and look at it in a browser at a phone width and a desktop width.

An app without Tailwind can still follow the system: read the CSS variables from `theme.css` and the rules from `DESIGN.md`.

## Migrating older UI: on touch, not all at once

Older repos have their own look. They move to the design system gradually:

- **New UI in an old repo uses the design system.** Don't copy the surrounding legacy style into a new component or page.
- **Touching old UI? Offer to migrate it in the same PR.** When a task changes a component or page that still uses the old look, tell the user and propose migrating that component or page as part of the change. Keep it to what the task touches — never restyle neighbors as a side effect. If the user declines, leave the old style alone.
- **Migrate whole units.** A component or page is either on the system or not. Don't mix old and new tokens inside one component.
- **Never import `theme.css` globally into a mixed repo.** It sets `:root`, `.dark`, fonts, radius and breakpoints for the whole app, so every route that keeps its own look changes with it. In a repo where some routes stay on their old look, scope the system to the routes that adopt it. The repo's migration ticket says how. Before the first import, read the repo's global CSS for overrides that would cancel the tokens (forced radii, forced font weights, remapped palette classes).
- **Leave deliberate looks alone.** A route whose bespoke visual identity is the product (a film, a 3D scene, a customer-branded demo) stays as is unless the user says otherwise.
- **Track it.** Each repo's migration plan lives in its Linear project. Mention the ticket in the PR when a migration rides along.

## Changing the system

Never fix a value inside an app. A wrong or missing value is a change to the design-system repo:

1. Edit `DESIGN.md` there, following that repo's `AGENTS.md` (measure, hex only, regenerate, `pnpm verify`).
2. Ship it, then re-copy `tokens/theme.css` into each app that uses it.

If you're not working in the design-system repo, describe the change and where it belongs instead of making it.
