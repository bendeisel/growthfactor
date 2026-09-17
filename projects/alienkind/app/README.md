# Alien Kind, the app

Next.js 15, TypeScript, Tailwind v4, shadcn structure. This is the real build.
The single file HTML version and its artifact were the mockup.

## Why this exists

Every component Ben has sent assumes Next, Tailwind, shadcn and TypeScript:
`next/link`, `motion/react`, `unicornstudio-react`, imports from
`@/components/ui/...`. None of that runs in a single file artifact, which is
also why the Unicorn scene cannot work there: artifacts run under a CSP that
allows scripts only from a short list of CDNs, and UnicornStudio fetches its
runtime and project data from its own host.

## Run it

```powershell
cd C:\path\to\growthfactor\projects\alienkind\app
npm install
npm run dev
```

Then `npm run build` before shipping. `npm run typecheck` on its own is faster
when you only want the types checked.

## Layout

```
app/globals.css              the palette and the orb, as tokens
app/layout.tsx               fonts, metadata, noindex
app/page.tsx                 renders the dashboard
components/ui/               shadcn's folder. Components dropped in here land
                             at the import path every snippet already uses.
  animated-badge.tsx         Eldora badge, the light riding the trace
  bloim-animation-background.tsx   the UnicornStudio scene
components/dash/             the dashboard itself
  data.ts                    all the sample data, typed. Replace this file
                             when the real wiring lands.
  orb.tsx                    the obsidian
  parts.tsx                  stat tiles, meters, rows, the pace chart
  dashboard.tsx              rail, destinations, terminal
lib/utils.ts                 cn()
```

`components/ui` is not a preference. The shadcn CLI writes there, and every
component Ben sends imports from `@/components/ui/...`, so anywhere else means
hand editing every import.

## Colour

Burnt orange `#E8751F` on a lifted charcoal `#2B2A28`, a blackish grey with
warmth in it rather than a void or a navy. Red, purple and green are Bob, Kevin
and Stewart and nothing else, which is why pace uses green, amber and red and
the legend says so in words.

Both themes are real. The toggle sits at the bottom of the rail and the choice
is remembered. Light is `:root[data-theme="light"]`, and every colour is a token
so nothing has to be restyled per theme.

## The Unicorn scene

Installed and wired, off by default, switched from the rail. It draws a full
bleed canvas behind everything, which is a taste call on a dense dashboard, and
it only renders on a real origin because it fetches its own runtime. Turn it on
with the Scene button and see it locally.

## The orb

Three ellipses in one SVG, spinning around the centre at different rates. The
first version used three divs each with a `rotateX`, copied from the reference,
and Chromium painted a white plane outline around every one of them. Ellipses
give the same tilted orbit read with nothing to go wrong: a flatter `ry` is a
steeper tilt, and the spin is the roll.

## Still sample data

Every number is in `components/dash/data.ts` and the header says so. Nothing is
connected yet. Superhuman, Glofox and GHL come next.
