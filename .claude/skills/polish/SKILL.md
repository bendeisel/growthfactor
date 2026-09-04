---
name: polish
description: Growth Factor's craft audit pass over a site that already exists. Run it on built HTML/CSS before handover, before go-live, or any time someone says the build looks off, feels unfinished, cheap, or amateur without being able to say why. Also use it when asked to "polish", "clean up", "tighten", "QA", or "review" a page or site, and after any significant build or edit session. It measures contrast, kernel conformance, spacing system, type scale, radius consistency, motion physics, focus states, and the SEO defaults, then reports what is actually wrong with file references. It is a checking pass, not a redesign, and it never introduces a color, typeface, or shape the site does not already have.
---

# Polish: the craft audit

Generation and craft are different jobs. Generation makes the decisions.
Craft is whether those decisions were executed at the level of the pixel, and
it is almost entirely measurable: contrast ratios, spacing on a system, a type
ladder with real steps, motion that runs at plausible durations on properties
that do not force layout.

This skill runs after something exists. It does not design.

## The rule that keeps this from becoming a redesign

**A polish pass may not introduce anything.** No new color, no new typeface, no
new shape, no rewritten copy. The four locks in the `house-style` skill apply
here unchanged, and a polish pass is one of the easiest places to break them,
because every individual fix looks like an improvement.

If a finding cannot be fixed without importing something, it is not a polish
finding. Write it down for the design conversation instead.

## Run the audit

```bash
python3 .claude/skills/polish/scripts/audit.py <site-dir> --kernel <kernel.json>
```

It reads every `.css` file plus every inline `<style>` block, scopes each HTML
document separately (a folder of artboards is many documents with many page
grounds, not one), and reports findings at three levels.

- **BLOCKER** — ships broken. Contrast failures, a missing viewport meta,
  removed focus outlines, motion with no reduced-motion block.
- **WARN** — real craft defects. Off-system spacing, a type ladder with
  accidental steps, colors outside the kernel, layout-forcing transitions.
- **NOTE** — measurements and advisories to read with judgement.

Exit code is 2 for blockers, 1 for warnings, 0 otherwise, so it drops into a
pre-deploy check. `--json` for machine-readable output.

It skips page-level SEO checks on `.dc.html` artboards, because artboards are
compositions rather than pages and flagging them for a missing `<title>` just
trains people to ignore the report.

## When the kernel itself is the defect

The audit will sometimes flag a contrast failure that comes straight from the
client's own brand values. This happened on the first real run: Nashville MMA's
kernel specifies `--buttonBg: #C0883A` with `--buttonColor: #FFFFFF`, and white
on that gold measures 3.08:1 against a 4.5:1 requirement. The vendor template
shipped it, it is live, and it is genuinely hard to read.

The kernel lock does not mean shipping an accessibility defect. It means the
fix comes from inside the kernel:

1. **Re-pair existing kernel values.** The same kernel already contains
   `#0A0A0A` and `#131313`. Near-black on that gold measures 9.4:1. Swapping the
   *text* color for another kernel color fixes it without inventing anything.
2. **Change the relationship, not the value.** Larger or heavier text drops the
   requirement to 3:1. Reversing to gold-on-dark often passes outright.
3. **Only if neither works,** propose a minimal value change to the client as an
   explicit decision, with the measured numbers. Never silently darken a brand
   color, because a silently adjusted hex is drift that will spread to every
   future page.

Flag it either way at handover. A client whose buttons have been failing
contrast since their old vendor built the site should be told.

## What the script cannot measure

Run these by eye. They are the difference between passing an audit and being
worth the money.

**Optical alignment.** Mathematically centered is not optically centered. A
play triangle in a circle needs shifting right. Text beside an icon aligns to
its cap height, not its bounding box. Quotes and bullets hang into the margin.

**Line length and leading.** Body copy reads at 45 to 85 characters. Line height
runs inverse to size: tight on display type (0.9 to 1.1), open on body (1.5 to
1.7). Display type set at body leading is the single most common tell of a
generated page.

**Letter-spacing.** Large display type needs negative tracking. Small caps and
uppercase labels need positive tracking. Neither is optional, and getting them
backwards makes good faces look cheap.

**The hierarchy actually resolving.** Squint at the page. The order things
arrive in should match the order they matter in. If two elements arrive
together, one of them needs to lose.

**Touch targets.** 44px minimum on anything tappable, including the gap between
adjacent targets.

**The page at 320px and at 1920px.** Not just the breakpoints in the CSS: the
extremes, where a fixed width or an unwrapped headline actually breaks.

**Motion, watched rather than read.** Durations that measure correctly can still
feel wrong. Check the direction rule from `house-style/references/motion.md`:
entering decelerates, leaving accelerates. Then load the page with
`prefers-reduced-motion` forced on and confirm nothing is stuck invisible.

**Real content at real length.** The longest program name, the client who has no
photo, the review that runs four lines. Layouts break on content, not on
lorem ipsum.

## Reporting

Give the user findings grouped by severity, each with a `file:line` reference
and the measured number. Say what the fix is, not that something "feels off".

Separate the list into:

- **Fixed** — what you corrected, with the numbers before and after.
- **Needs a decision** — findings whose fix would require importing something,
  or a change to the kernel, or a copy edit. These go to the client or to the
  design conversation, never fixed unilaterally.
- **Measured, no action** — the report's notes, so the next person does not
  re-derive them.

Then re-run the audit and state the remaining counts. A polish pass that ends
without a second run has not been verified.

## Related

- `house-style` — the design skill. The four locks, the axes kit, the kernel.
  Read it if the work turns out to need design decisions rather than craft.
- `house-style/references/motion.md` — motion physics and the banned defaults.
- `house-style/references/hostinger-delivery.md` — the SEO defaults the audit
  checks for, and why they ship on every site.
