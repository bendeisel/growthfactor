---
type: system
status: live
version: 2
updated: 2026-09-03
---

# Routines

Six routines. Each one is narrow on purpose. Set each up in Claude Code Desktop:
Code tab > Routines > New routine > Local, point it at the vault folder, paste the
prompt.

Every prompt starts with a MODE line. Run everything at `MODE: dry-run` for the
first two weeks. Dry run means the routine writes a proposed-changes file into
`_system/logs/` and moves nothing. Read a few of those, fix the rules that were
wrong, then flip to `MODE: apply`.

Schedule spread on purpose so two routines never run inside the same minute.

| # | Routine        | Cadence            | Scope                          |
| - | -------------- | ------------------ | ------------------------------ |
| 6 | Daily memory   | Daily 5:10am       | raw pile in, `_system/memory/` out |
| 1 | Inbox triage   | Daily 5:30am       | `00-inbox/` in, org folders out |
| 2 | Client sweep   | Monday 7:00am      | client + offer frontmatter      |
| 3 | Integrity audit| Friday 4:00pm      | read-only, one report out       |
| 4 | Month close    | 1st, 6:00am        | archive + rollups               |
| 5 | Personal       | Sunday 7:00pm      | `50-personal/` only             |

Memory runs twenty minutes before triage on purpose. It needs to see the pile
raw, in `00-inbox/` and `_system/sessions/`, before triage files it away.

---

## Routine 6: Daily memory

Daily, 5:10am. Reads yesterday's raw pile, decides what is durable, files it,
archives what it read, and logs every decision including the skips. This is the
routine whose log you read, not whose output you trust blind.

```
MODE: dry-run

Read _system/_rules.md in full before doing anything. Section 9 governs this run
and rule 6.3 is the one that ends the run if you get it wrong.

Scope. You may READ: 00-inbox/, _system/sessions/, _system/memory/,
_system/logs/, _system/needs-human.md, and the client, offer, project, person and
sop files in 10-gfai/, 20-lgb/, 30-nmma/, 40-fbg/, 60-people/ for the single
purpose of checking whether a fact is already recorded in frontmatter. You may
WRITE: _system/memory/, _system/logs/, _system/needs-human.md, and moves out of
_system/sessions/ into 70-archive/<year>/sessions/. You may not read, open, list,
or follow a link into 50-personal/. You may not edit any note body outside
_system/memory/. You may not change frontmatter on any file outside
_system/memory/. You may not move anything out of 00-inbox/. Triage does that
twenty minutes from now and it will do it better than you.

Step 0. Forget rules first. Read _system/memory/_forget.md. Remove every matching
line from every memory file before you read anything else, and hold the rules for
the rest of the run so a forgotten fact cannot be refiled by this same pass. Log
that a forget rule fired and which file it cleaned. Do not restate what it
forgot.

Step 1. Assemble the pile. Everything in _system/sessions/ that is not already
stamped processed: true, plus every file in 00-inbox/ created or modified since
this routine last ran, plus the last triage log. If the pile is more than 40
files, take the 40 oldest and log the backlog count. A backlog is a number in a
log, not a reason to rush the rest.

Step 2. Extract candidates. One fact per line, one sentence, present tense.
Every candidate carries the source path and the date it appeared. Extract what
the text states. Do not infer a fact from the absence of one, and do not
summarize a conversation into a fact that no line in it actually says.

Step 3. Never-filed check. Run every candidate against rule 9.3 before anything
else. A hit is dropped and logged by category number only. Do not quote it, do
not paraphrase it into the log, do not carry it forward as a candidate. The log
line is `skipped | 9.3.<n> | <source path>` and nothing more.

Step 4. Horizon test. Apply all four tests in rule 9.1 to every surviving
candidate. Log the failing test number for each skip. Three out of four is a
skip, and a close call is a skip you note, not a fact you file.

Step 5. First appearance. Anything that passes but is a single passing mention
goes to _candidates.md in the rule 9.4 format. Anything already sitting in
_candidates.md that appeared again independently gets promoted to its real file
today, with confirmed: set to today, and its candidate line removed. Drop
candidates older than 60 days and log each drop. The two exceptions in rule 9.4,
a direct standing instruction from Ben and a structural fact a note already
implies, skip the holding pen and file immediately.

Step 6. Categorize. Each filed fact goes to exactly one file from the fixed set
in rule 9.2. If a fact fits two, pick the narrower one, org file over identity
or stack, and log the choice. If it fits none, write a needs-human line and file
nothing. Do not pick the closest file.

Step 7. Reorganize what you own. Inside the memory files only:
  - Merge lines that state the same fact, keeping the earliest first seen and the
    latest confirmed, and both sources.
  - Supersede contradictions per rule 9.6. Older line moves to _superseded.md
    with both dates and both sources. Never silently replace.
  - Re-sort lines under their existing headings, most recently confirmed first.
  - Leave every [pin] line exactly as written, in place, at the top of its
    heading. A new fact that contradicts a pin is a needs-human line, not an edit.
  - Recount fact_count: and set updated: on every file you changed.
  - Do not add a heading. Do not add a file. Do not rewrite a fact into better
    prose. You are sorting a filing cabinet, not editing copy.

Step 8. Boundary check before writing. For every org memory file, read the
never_link: list on every client the file names. If two walled clients would land
in the same file, split the walled one into its own file, log that you did, and
add a needs-human line so a human confirms the split. Then confirm no line in any
_system/memory/ file traces to 50-personal/. If one does, drop it and log a rule
6.3 near-miss with the source path. A near-miss is worth reading about.

Step 9. Archive what you read. Move every processed file out of
_system/sessions/ into 70-archive/<year>/sessions/, stamping archived: <today>
and archived_by: routine-6-memory. Never delete a session file. The vault's
"deleting" is an archive move, and a session export is the only evidence of where
a fact came from.

Write _system/logs/YYYY-MM-DD-memory.md with four sections, each omitted entirely
if empty:
  1. Filed. `<memory file> | <fact> | <source path>`
  2. Held as candidate. `<fact> | first seen or reappeared | <source path>`
  3. Skipped. `<source path> | <rule number> | <one clause of why>`, with rule
     9.3 skips carrying the category number and no content.
  4. Moved to needs-human, superseded, promoted, dropped, split, or forgotten.
End with a count line: files read, facts filed, candidates held, skips by rule.
Every input file appears somewhere in this log. A file you read and filed nothing
from is a skip line, not a silence.

Finish with: git add -A && git commit -m "routine: memory YYYY-MM-DD"
```

---

## Routine 1: Inbox triage

Daily, 5:30am. The workhorse. Everything you dumped into the vault yesterday gets
filed before you open it.

```
MODE: dry-run

Read _system/_rules.md in full before doing anything. It governs this run.

Scope. You may READ: 00-inbox/, _system/. You may WRITE: 00-inbox/,
_system/logs/, _system/needs-human.md, and you may MOVE files from 00-inbox/
into the org folders defined in the rules. You may not read or write anything
inside 50-personal/ or _system/memory/. You may not edit any file that is already
outside 00-inbox/.

For each file in 00-inbox/:

1. Determine type and org from the content. If either is unclear, leave the file
   in place and add a needs-human.md line. Do not guess.
2. Add or complete the base frontmatter keys per the schema. Fill type-specific
   keys only where the content states them explicitly. Leave unstated keys empty.
   An empty key is information. A guessed key is a lie you will act on later.
3. Rename per the naming rule.
4. Move to the correct folder.
5. Do not touch the note body. Not for typos, not for headings, not for
   formatting. Frontmatter and filename only.

If a note names a client that has no file in any clients/ folder, create a stub
client file with client_status: prospect, org set, and everything else empty, then
add a needs-human.md line saying the stub needs terms.

Write _system/logs/YYYY-MM-DD-triage.md: one line per file as
`<old path> -> <new path> | keys added: <list>`. Then a short section listing what
went to needs-human and why.

Finish with: git add -A && git commit -m "routine: triage YYYY-MM-DD"
```

---

## Routine 2: Client and offer sweep

Monday, 7:00am. This is the one that pays for itself. Renewals, offer coverage,
stale clients, dashboards.

```
MODE: dry-run

Read _system/_rules.md in full before doing anything. Sections 5, 6, and 7 govern
this run.

Scope. You may READ: 10-gfai/, 20-lgb/, 30-nmma/, 40-fbg/, 60-people/, _system/.
You may WRITE: frontmatter on client and offer files, everything in
_system/dashboards/ and _system/logs/, and needs-human.md. You may not read
50-personal/. You may not write _system/memory/. You may not edit any note body.
You may not author a new offer file.

Step 1. Renewals. For every client with client_status: active, compute
days_to_renew from renews:. Apply the ladder in rule 7 exactly. For every client
landing in T-30, create a ClickUp task titled `Renewal: <client> <renews date>`
with the offer slug, offer version, health, owner, and last_touch in the
description. Check existing ClickUp tasks first and never create a duplicate.

Step 2. Offer coverage. For each active client, check every slug in offers:
resolves to a real offer file. If a referenced offer has offer_status: sunset,
flag it as "needs new version before renewal" on the dashboard. If a slug resolves
to nothing, that is a needs-human line.

Step 3. Offer rollup. Regenerate active_clients: on every offer file from the
client files. This key is generated and you overwrite it every run. Any offer with
offer_status: live and zero active clients gets flagged on the dashboard as
"live but unsold."

Step 4. Staleness. Any active client whose last_touch is more than 21 days old gets
health: yellow. More than 45 days, health: red. Log every health change with the
old and new value. Never set health: green automatically. Green is a human call.

Step 5. Dashboards. Write one file per org into _system/dashboards/:
`<org>-clients.md`. Structure:
  - Urgent block at top: overdue and T-7 renewals only. Omit the block entirely
    if empty rather than writing "none."
  - Renewal ladder table, soonest first.
  - Active roster with health, owner, offer version, last_touch.
  - Offers table: version, status, active client count.
  - Open questions: the needs-human lines from this run that touch this org.

Before writing any dashboard, check every client's never_link: list. If two clients
on the same dashboard have each other listed, split them into separate files rather
than breaking the rule. Log that you did.

Write _system/logs/YYYY-MM-DD-sweep.md with every frontmatter change as
`<file> | <key>: <old> -> <new>`, every ClickUp task created, and every skipped
duplicate.

Finish with: git add -A && git commit -m "routine: sweep YYYY-MM-DD"
```

---

## Routine 3: Integrity audit

Friday, 4:00pm. Read-only. This routine's whole job is telling you where the vault
is lying to you. It fixes nothing, which is why you can trust its report.

```
MODE: apply

Read _system/_rules.md. This run is READ-ONLY except for one output file.

Scope. You may READ everything except 50-personal/. You may WRITE exactly one
file: _system/logs/YYYY-MM-DD-audit.md. You may not modify, move, rename, or
create anything else. If you find yourself wanting to fix something, write it in
the report instead.

Report these sections, each as a table, each omitted entirely if empty:

1. Schema violations. Notes missing required base keys, or carrying a type or org
   value not in the rules, or with a date in a format other than YYYY-MM-DD.
2. Orphans. Notes not linked from any other note and not on any dashboard.
3. Broken links. Wikilinks pointing at files that do not exist. Group by target so
   a single renamed file shows as one row, not thirty.
4. Boundary check. Any link crossing between 50-personal/ and an org folder, in
   either direction. Any dashboard, rollup, or memory file violating a never_link:
   pair. Any line in _system/memory/ whose src: path is inside 50-personal/. These
   are the failures that matter most. List them first even though they are
   section 4.
5. Duplicates. SOPs or offers with near-identical titles or bodies across org
   folders, which usually means the same process got written twice instead of
   linked once.
6. Stalled projects. status: active, opened more than 60 days ago, and either no
   next_action or no file modification in 30 days.
7. Rule drift. Folders, types, or tags present in the vault but absent from
   _rules.md. This section is a signal that the rules file needs editing, not that
   the vault does.
8. Memory health. Facts in _system/memory/ that duplicate a frontmatter key and
   should be dropped per rule 9.1.4. Candidates older than 60 days the memory
   routine failed to drop. Memory lines with no resolvable src: path. Any file
   outside the fixed set in rule 9.2.

End with a three line summary: what got worse since last week's audit, what got
better, and the single highest leverage fix.

Finish with: git add -A && git commit -m "routine: audit YYYY-MM-DD"
```

---

## Routine 4: Month close

1st of the month, 6:00am. Archive what is done, roll up what happened, per org,
without mixing them.

```
MODE: dry-run

Read _system/_rules.md in full. Rules 1, 2, 4, and 9 govern this run.

Scope. You may READ: all org folders, _system/. You may WRITE: frontmatter on
project, client, and offer files, moves into 70-archive/<year>/,
_system/dashboards/, _system/logs/. You may not read 50-personal/. You may not
write _system/memory/. You may not edit any note body.

Step 1. Archive. Move to 70-archive/<year>/ and stamp archived: and archived_by:
  - projects with status: done and closed: more than 30 days ago
  - clients with client_status: churned and no activity in 60 days
  - offers with offer_status: sunset and zero active clients
  - session exports in 70-archive/<year>/sessions/ older than 12 months, into
    70-archive/<year>/sessions-cold/
Preserve the org subfolder structure inside the archive year so a restore is
obvious. Never delete. Never archive anything with an open ClickUp task
referencing it.

Step 2. Rollup. Write one file per org into _system/dashboards/:
`<org>-<YYYY-MM>-close.md`. Each covers only that org. No file mentions two orgs.
Include: clients added, churned, renewed. Offers launched or sunset. Projects
opened and closed. Health changes over the month with the reason from the sweep
logs. Renewals landing in the next 60 days. Open needs-human items older than 30
days.

Step 3. Rules maintenance. Read the last four audit reports. If the same rule
drift item appears in three or more, add a needs-human line proposing the specific
rules edit. Do not edit _rules.md yourself. That file is human-owned.

Step 4. Memory review. Read the last month of memory logs. Report, as a needs-human
line each: any fact filed and then superseded inside the same month, which means
the horizon test is passing things it should not; any category in rule 9.3 that
fired more than five times, which means a source is leaking; any memory file that
grew by more than 20 facts, which usually means the routine is filing events.
Propose the rules edit. Do not make it.

Write _system/logs/YYYY-MM-DD-close.md listing every archive move and every
frontmatter change.

Finish with: git add -A && git commit -m "routine: close YYYY-MM"
```

---

## Routine 5: Personal

Sunday, 7:00pm. Separate routine, separate trusted folder, no read access to
anything with a client in it. Set this one up pointing at `50-personal/` as the
working directory if Desktop lets you, which makes the boundary physical rather
than instructed.

```
MODE: dry-run

Read _system/_rules.md, sections 2, 3, 4, 6, and 9.

Scope. You may READ and WRITE only inside 50-personal/ and
_system/logs/. You may not read, link to, summarize, or reference anything in
10-gfai/, 20-lgb/, 30-nmma/, 40-fbg/, 60-people/, _system/dashboards/, or
_system/memory/. If a note in 50-personal/ mentions a client or a business project,
leave that text alone and do not follow it anywhere.

1. File anything loose in 50-personal/ into projects/, people/, or notes/ per the
   schema. Frontmatter and filename only, never the body.
2. Refresh next_action: on active personal projects where the note states one
   explicitly. Where it does not, leave it empty and list the project in the
   weekly output as "no stated next action." Do not invent one.
3. Personal memory. Apply the full rule 9 procedure, horizon test, never-filed
   list, first-appearance holding pen and all, to 50-personal/ only, writing to
   50-personal/memory/personal.md. That file is the only memory file you may
   touch. A fact about a business, a client, or an offer is not personal memory
   even when a personal note is where it showed up. Skip it and log the skip.
4. Write 50-personal/weekly-YYYY-MM-DD.md: active projects with next actions,
   projects with no next action, anything with a date inside the next 14 days,
   and what has not been touched in 30 days.
5. Archive personal projects with status: done into 70-archive/<year>/personal/.

Write _system/logs/YYYY-MM-DD-personal.md with files touched and keys changed.

Finish with: git add -A && git commit -m "routine: personal YYYY-MM-DD"
```

---

## Setup order

1. `git init` in the vault. Do this first. Everything below is reversible only
   because of this step.
2. Build the folder map from rule 2. Empty folders are fine.
3. Drop `_rules.md` and this file into `_system/`. Drop the two `CLAUDE.md` files
   at the vault root and in `50-personal/`.
4. Backfill by hand: one client file and one offer file, complete, correct. Then
   write ten lines into `identity.md`, `stack.md`, and `operating.md` yourself,
   in the rule 9.5 format, marked `[pin]`. The routines pattern-match off what
   exists. Two good examples beat a prompt paragraph describing what good looks
   like, and pinned lines give routine 6 the shape of a fact before it has filed
   one.
5. Create routine 1 only. Dry run, daily, one week. Read the proposed-changes
   logs each morning and fix `_rules.md` where it guessed wrong.
6. Flip routine 1 to apply. Add routine 3, the audit, which is read-only and safe
   to run at apply from day one.
7. Add routine 6 in dry run. Give it a full two weeks there, longer than any
   other routine, and read every skip section. The skips tell you whether the
   horizon test is calibrated. Too many facts filed means it is treating events
   as facts. Nothing filed for three days means the pile is not reaching
   `_system/sessions/`.
8. Add routine 2 in dry run for two Mondays before applying. It is the one that
   writes to ClickUp, so duplicate tasks are the failure mode to watch.
9. Add 4 and 5 last.

Enable the worktree toggle on any routine if you want each run isolated from
uncommitted changes in the vault. For a notes vault it is usually unnecessary,
since you are the only writer and the git commit at the end of each run gives you
the rollback point.

## Getting the pile into the vault

Routine 6 reads `_system/sessions/`. Nothing fills that folder on its own.

- Claude Code sessions in the vault: transcripts already live under
  `~/.claude/projects/`. A one-line cron that copies yesterday's `.jsonl` files
  into `_system/sessions/` is enough.
- OpenClaw runs: point their output or log path at `_system/sessions/`.
- Claude and ChatGPT web chats: paste into a file in `00-inbox/`, or use their
  export, and drop the export in `_system/sessions/`.
- Voice notes and phone captures: `00-inbox/`. Routine 6 reads that too.

Obsidian Sync moves all of it across the five devices, so it does not matter which
one you captured on. It does matter that routine 6 runs on exactly one machine.
Two machines running it means two runs filing the same facts twice and two commits
racing each other. Pick the desktop that is on at 5:10am and leave the routine off
everywhere else.
