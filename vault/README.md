# Vault system files

Everything in this folder is the template for Ben's Obsidian vault. It lives in
git here so it is reviewable and revertable. The vault itself is a separate git
repo on the machine that runs the routines.

## What is here

```
vault/
  CLAUDE.md                      loads business memory at the start of every session
  _system/
    _rules.md                    v2. Rule 9 is the memory contract
    routines.md                  v2. Six routines, paste-ready prompts
    memory/                      the fixed nine-file set, seeded with pins
  50-personal/
    CLAUDE.md                    loads personal memory only
    memory/personal.md           routine 5 owns this
```

## Install

1. In the vault, `git init` if you have not already. Nothing below is reversible
   without it.
2. Copy `vault/CLAUDE.md` to the vault root, `vault/_system/` into the vault's
   `_system/`, and `vault/50-personal/` into the vault's `50-personal/`.
3. Build out the rest of the folder map from rule 2. Empty folders are fine.
   `_system/sessions/` and `_system/logs/` both need to exist before routine 6
   runs.
4. Read the pins in `_system/memory/`. They came from what you have already told
   Claude. Fix anything wrong, add what is missing. Ten good pinned lines per
   file is enough to teach routine 6 the shape of a fact.
5. Set up the routines per the setup order at the bottom of `routines.md`.
   Routine 6 first if memory is what you want soonest, in dry-run, for two weeks.

## Routine 6, the short version

Runs daily at 5:10am, twenty minutes before triage, so it sees the pile raw.

Reads yesterday's session exports and inbox captures. Pulls candidate facts.
Drops anything in the never-filed list without quoting it. Puts the rest through
a four-part horizon test. Holds single mentions in `_candidates.md` until they
show up a second time independently. Files what survives into one of nine fixed
files. Merges duplicates, supersedes contradictions into `_superseded.md`,
re-sorts, and leaves every `[pin]` line alone. Archives the sessions it read.
Writes a log with four sections, including every skip and the rule number that
caused it.

The log is the part that matters. It is how you find out the test is miscalibrated
before six weeks of wrong facts are loading into every session you start.

## One machine only

Obsidian Sync moves the vault across all five devices. Routine 6 runs on exactly
one of them. Two machines running it means the same facts filed twice and two
commits racing. Pick the desktop that is awake at 5:10am and leave the routine off
everywhere else.
