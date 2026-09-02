# Growth Factor site

Vite + React + TypeScript + Tailwind v4 + shadcn/ui. Growth Factor's own
marketing site — **not** a client deliverable. Client sites follow the
static-first house pipeline in `.claude/skills/house-style/`, which is
deliberately framework-free.

```powershell
npm install
npm run dev       # http://localhost:5173
npm run build
npm run preview
```

## Structure

| Path | What |
|---|---|
| `src/components/ui/button.tsx` | shadcn Button, plus a `gradient` variant for the hero CTA |
| `src/components/ui/saas-template.tsx` | the landing page: nav + hero |
| `src/index.css` | Tailwind v4 entry, shadcn theme tokens, keyframes |
| `components.json` | shadcn config — sets `@/components/ui` as the primitives path |
| `scripts/shot-artboard.mjs` | renders a design artboard to a portfolio screenshot |

## Adding shadcn components

```powershell
npx shadcn@latest add card dialog input
```

They land in `src/components/ui/` because `components.json` says so. Don't move
that folder — the CLI reads the path from there, and generated code imports
`@/components/ui/...`.

## Portfolio screenshots

The hero image is a real render of the Nashville MMA artboard rather than stock
or a hotlinked placeholder:

```powershell
npm run shot -- ../projects/nashvillemma/design/Homepage.dc.html work-nashvillemma
```

Output goes to `public/<name>.jpg` at 1440x900, 2x, JPEG quality 88.

**Note:** the artboards load Bebas Neue and Montserrat from Google Fonts. If you
render with no network access the headline falls back to a system sans and the
screenshot won't match the real design — re-run it on a connected machine to get
the correct typefaces.

## Copy

The words in `saas-template.tsx` are placeholder. Headline, sub-headline, badge
and button labels all need your own copy before this ships.
