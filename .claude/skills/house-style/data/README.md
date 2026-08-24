# The shipped log

One row per site that ships. Read it at Step 0, append at Step 6.

This file — not the size of any theme library — is what actually prevents two
clients from getting the same site. It works by checking against *neighbours*
(same vertical, same region) instead of hoping randomness spreads collisions
out. See `references/axes.md` for why a catalog cannot do this job.

## Columns

| Column | What goes in it |
| --- | --- |
| `date` | ISO date the site shipped |
| `client` | Client name |
| `vertical` | Business category — keep these consistent, they are the join key |
| `city`, `state` | Where the client competes for local search |
| `radius_conflict_check` | Which logged rows you checked against, or "none logged nearby" |
| `display_face`, `body_face` | Actual faces used |
| `type_stance` | Axis 2 from `references/axes.md` |
| `color_stance` | Axis 5 |
| `structure` | Axis 1 |
| `density` | Axis 3 |
| `rhythm` | Axis 4 |
| `accent_hex`, `ground_hex` | The two colors that define the site at a glance |
| `platform` | 97Display, WordPress, custom, etc. |
| `notes` | Anything a future project needs to know |

## The divergence check

Before designing, filter to rows in the same `vertical` within roughly 100
miles. At least **two** of {`type_stance`, `color_stance`, `structure`} must
differ from every one of those rows. Record what you checked in
`radius_conflict_check` so the next project can see the reasoning.

If nothing is logged nearby, say so explicitly rather than leaving it blank —
an empty cell is ambiguous between "checked, all clear" and "forgot".

## Keeping it honest

- Log the site you actually shipped, not the one you designed. If the client
  overrode a choice, the override is what future neighbours will collide with.
- A `BEFORE` row (like the seeded Nashville MMA row) records a vendor template
  as captured, not a Growth Factor decision. Mark those clearly in `notes` so
  they are not mistaken for house work.
- Keep `vertical` values consistent. "martial arts gym" and "MMA gym" as
  separate values will silently break the check.
