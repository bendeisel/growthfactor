# Growth Factor: working rules

## Writing

**Never use an em dash.** Not in client copy, not in code comments, not in commit
messages, not in replies. This is absolute and applies to every project in this
repo. Use a comma, a colon, a period, or parentheses instead. Rewrite the sentence
if none of those fit.

En dashes are still fine inside numeric or time ranges that come from client copy
(for example "Mon – Fri: 8:00 AM – 8:00 PM"), because that is the client's own
punctuation and it is not an em dash.

## Client site work

Read `.claude/skills/house-style/SKILL.md` before any design or copy work on a
client site. The four locks, the divergence log, and the banned defaults all apply.

## Build target

Static HTML, CSS and vanilla JS deployed to Hostinger. No React, no TypeScript, no
Tailwind, no build step. React components from shadcn/ui and similar sources are
design reference to port by hand, never code to install. See
`.claude/skills/house-style/references/hostinger-delivery.md`.
