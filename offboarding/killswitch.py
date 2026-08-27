#!/usr/bin/env python3
"""killswitch.py — offboarding kill switch for Growth Factor.

Turns the access inventory into an ordered, verifiable runbook for one person's
departure, and keeps an append-only record of what was actually done.

Deliberately NOT automatic. There is no HR-event trigger and no API call that
revokes anything: a kill switch wired to a status field in a payroll tool
eventually fires on a typo and takes client sites down. A human runs this, works
the checklist, and closes it out.

    ./killswitch.py check                     validate the inventory (run in CI)
    ./killswitch.py people                    who is on file, and what they hold
    ./killswitch.py plan <person>             print the runbook
    ./killswitch.py start <person> --reason R  open a tracked run in runs/
    ./killswitch.py status                    open runs and their progress
    ./killswitch.py complete <run-file>       close a run (refuses if steps are open)

Python 3.11+, standard library only.
"""

from __future__ import annotations

import argparse
import datetime as dt
import re
import subprocess
import sys
import tomllib
from pathlib import Path

HERE = Path(__file__).resolve().parent
INVENTORY = HERE / "inventory.toml"
PEOPLE = HERE / "people.toml"
RUNS = HERE / "runs"
AUDIT = RUNS / "audit.log"

PHASES = {
    0: ("Phase 0 — PRECHECKS (do these first; nothing below is safe until they are done)",
        "Non-destructive. Every item here is something that becomes impossible, or "
        "destroys access you still need, if you do it after a later phase."),
    1: ("Phase 1 — per-person cutoff",
        "Accounts revocable for one human. The identity provider is deliberately "
        "not here; it is Phase 4."),
    2: ("Phase 2 — ROTATION of shared secrets",
        "These cannot be revoked per person. Changing them is the only real "
        "control. Ordered by blast radius. This is the phase that actually "
        "protects you, and the one most checklists omit."),
    3: ("Phase 3 — continuity",
        "Move the work, the files and the client relationships. All of this needs "
        "their account still alive."),
    4: ("Phase 4 — identity termination",
        "Last, on purpose. Phases 0-3 depend on this account existing."),
    5: ("Phase 5 — verification and record",
        "A ticked box is a claim. This phase turns claims into evidence."),
}

REQUIRED_SYSTEM_FIELDS = ("id", "name", "phase", "blast_radius", "revocation",
                          "tiers", "owner", "steps", "verify", "share_policy")
SHARE_POLICIES = ("never_share", "named_user", "autofill_only", "not_applicable")
REQUIRED_PERSON_FIELDS = ("id", "name", "email", "tiers")

# Pattern hits are errors: this repo holds pointers to credentials, never
# credentials. The inventory is committed to git and shared with whoever picks
# up an exit, so a secret landing here is a breach of the thing it protects.
SECRET_PATTERNS = [
    ("a private key block", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY")),
    ("a GitHub token", re.compile(r"\b(?:ghp|gho|ghs|ghr)_[A-Za-z0-9]{20,}")),
    ("a GitHub fine-grained PAT", re.compile(r"\bgithub_pat_[A-Za-z0-9_]{20,}")),
    ("an OpenAI-style key", re.compile(r"\bsk-[A-Za-z0-9]{20,}")),
    ("an Anthropic-style key", re.compile(r"\bsk-ant-[A-Za-z0-9_\-]{20,}")),
    ("an AWS access key id", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("a Slack token", re.compile(r"\bxox[abposr]-[A-Za-z0-9-]{10,}")),
    ("a Google API key", re.compile(r"\bAIza[0-9A-Za-z_\-]{35}\b")),
    ("a Stripe key", re.compile(r"\b[rs]k_(?:live|test)_[A-Za-z0-9]{16,}")),
    ("an assigned credential", re.compile(
        r"(?i)\b(?:password|passwd|pwd|secret|api[_-]?key|token|recovery[_-]?code)"
        r"\s*[:=]\s*[\"']?\S{6,}")),
]

C = {"bold": "\033[1m", "dim": "\033[2m", "red": "\033[31m",
     "yellow": "\033[33m", "green": "\033[32m", "off": "\033[0m"}
if not sys.stdout.isatty():
    C = {k: "" for k in C}


def fail(msg: str) -> "None":
    print(f"{C['red']}error:{C['off']} {msg}", file=sys.stderr)
    raise SystemExit(1)


def load(path: Path) -> dict:
    if not path.exists():
        fail(f"{path.name} not found in {path.parent}")
    try:
        with path.open("rb") as fh:
            return tomllib.load(fh)
    except tomllib.TOMLDecodeError as exc:
        fail(f"{path.name} is not valid TOML: {exc}")


def today() -> str:
    return dt.date.today().isoformat()


def now() -> str:
    return dt.datetime.now().astimezone().isoformat(timespec="seconds")


def operator(explicit: str | None) -> str:
    if explicit:
        return explicit
    try:
        out = subprocess.run(["git", "config", "user.email"], capture_output=True,
                             text=True, timeout=5)
        if out.returncode == 0 and out.stdout.strip():
            return out.stdout.strip()
    except (OSError, subprocess.SubprocessError):
        pass
    return "unknown"


def find_person(people: dict, pid: str) -> dict:
    for p in people.get("person", []):
        if p.get("id") == pid:
            return p
    known = ", ".join(sorted(p.get("id", "?") for p in people.get("person", []))) or "none"
    fail(f"no person with id '{pid}' in people.toml (known: {known})")


def applies(entry: dict, person: dict) -> bool:
    return bool(set(entry.get("tiers", [])) & set(person.get("tiers", [])))


# --------------------------------------------------------------------------- #
# check
# --------------------------------------------------------------------------- #

def scan_secrets(paths: list[Path]) -> list[str]:
    problems = []
    for path in paths:
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError as exc:
            problems.append(f"{path.name}: unreadable ({exc})")
            continue
        for lineno, line in enumerate(text.splitlines(), 1):
            for label, pattern in SECRET_PATTERNS:
                if pattern.search(line):
                    problems.append(
                        f"{path.relative_to(HERE.parent)}:{lineno}: looks like "
                        f"{label} — this repo holds pointers, never secrets")
    return problems


def cmd_check(args: argparse.Namespace) -> int:
    inv, people = load(INVENTORY), load(PEOPLE)
    errors: list[str] = []
    warnings: list[str] = []

    tiers = set(inv.get("meta", {}).get("tiers", []))
    if not tiers:
        errors.append("inventory.toml: [meta].tiers is missing or empty")

    systems = inv.get("system", [])
    prechecks = inv.get("precheck", [])
    if not systems:
        errors.append("inventory.toml: no [[system]] entries")

    seen: set[str] = set()
    for entry, kind, required in (
        [(s, "system", REQUIRED_SYSTEM_FIELDS) for s in systems]
        + [(p, "precheck", ("id", "name", "tiers", "why", "steps")) for p in prechecks]
    ):
        sid = entry.get("id", "<no id>")
        for field in required:
            if field not in entry:
                errors.append(f"{kind} '{sid}': missing required field '{field}'")
        if sid in seen:
            errors.append(f"duplicate id '{sid}'")
        seen.add(sid)
        bad = set(entry.get("tiers", [])) - tiers
        if bad:
            errors.append(f"{kind} '{sid}': unknown tier(s) {sorted(bad)}")
        if not entry.get("steps"):
            errors.append(f"{kind} '{sid}': has no steps, so it would generate an "
                          f"empty checklist item")
        if kind == "system":
            if entry.get("phase") not in (1, 2, 3, 4, 5):
                errors.append(f"system '{sid}': phase must be 1-5 (0 is [[precheck]])")
            if not isinstance(entry.get("blast_radius"), int) or \
                    not 1 <= entry.get("blast_radius", 0) <= 5:
                errors.append(f"system '{sid}': blast_radius must be an int 1-5")
            sp = entry.get("share_policy")
            if sp is not None and sp not in SHARE_POLICIES:
                errors.append(f"system '{sid}': share_policy '{sp}' is not one of "
                              f"{list(SHARE_POLICIES)}")
            if sp == "never_share" and entry.get("tiers") and \
                    set(entry["tiers"]) - {"admin"}:
                warnings.append(
                    f"system '{sid}': share_policy is never_share but it applies to "
                    f"tiers {entry['tiers']} — if only Ben holds it, this should "
                    f"normally be tiers = [\"admin\"]")
            if not entry.get("verified", False):
                warnings.append(f"system '{sid}': verified = false — nobody has "
                                f"confirmed this matches your real stack")

    project_dir = HERE.parent / "projects"
    known_clients = {p.name for p in project_dir.iterdir() if p.is_dir()} \
        if project_dir.is_dir() else set()

    persons = people.get("person", [])
    if not persons:
        warnings.append("people.toml: no [[person]] entries — plan has nothing to run on")
    pseen: set[str] = set()
    for person in persons:
        pid = person.get("id", "<no id>")
        for field in REQUIRED_PERSON_FIELDS:
            if field not in person:
                errors.append(f"person '{pid}': missing required field '{field}'")
        if pid in pseen:
            errors.append(f"duplicate person id '{pid}'")
        pseen.add(pid)
        bad = set(person.get("tiers", [])) - tiers
        if bad:
            errors.append(f"person '{pid}': unknown tier(s) {sorted(bad)}")
        if not person.get("tiers"):
            errors.append(f"person '{pid}': no tiers, so their runbook would be empty")
        for client in person.get("clients", []):
            if known_clients and client not in known_clients:
                warnings.append(f"person '{pid}': client '{client}' has no folder in "
                                f"projects/ — typo, or an unrecorded project?")
        if "client-access" in person.get("tiers", []) and not person.get("vault_groups"):
            warnings.append(f"person '{pid}': has client-access but no vault_groups, "
                            f"so the rotation scope will come out empty and wrong")

    run_files = sorted(RUNS.glob("*.md")) if RUNS.is_dir() else []
    errors += scan_secrets([INVENTORY, PEOPLE] + run_files)

    for line in warnings:
        print(f"{C['yellow']}warn:{C['off']} {line}")
    for line in errors:
        print(f"{C['red']}error:{C['off']} {line}", file=sys.stderr)

    print()
    counts = (f"{len(systems)} systems, {len(prechecks)} prechecks, "
              f"{len(persons)} people, {len(run_files)} run file(s)")
    if errors:
        print(f"{C['red']}FAILED{C['off']} — {len(errors)} error(s), "
              f"{len(warnings)} warning(s). {counts}")
        return 1
    print(f"{C['green']}OK{C['off']} — {len(warnings)} warning(s). {counts}")
    return 0


# --------------------------------------------------------------------------- #
# plan
# --------------------------------------------------------------------------- #

def rotation_call(entry: dict, for_cause: bool) -> tuple[str, str]:
    """What this system's policy means for THIS departure. (label, explanation)"""
    policy = entry.get("share_policy", "not_applicable")
    br = entry.get("blast_radius", 5)
    if policy == "never_share":
        return ("ROTATE — unconditional",
                "Only Ben should ever have held this. If it was shared, treat this "
                "exit as an incident: rotate now and find out how it got shared.")
    if policy == "named_user":
        return ("REMOVE USER — no rotation needed",
                "Named-user access revokes cleanly for one person, which is why this "
                "is the preferred model. Rotation is only needed if you find they "
                "were using a shared login instead.")
    if policy == "autofill_only":
        if for_cause:
            return ("ROTATE — for-cause departure",
                    "Autofill-only is not a boundary against someone motivated to "
                    "keep the password. A for-cause exit rotates it regardless.")
        if br <= 3:
            return ("Rotation OPTIONAL — record your decision",
                    "Shared autofill-only and blast radius is 3 or below, so the "
                    "password was never viewable and this is the payoff of the "
                    "policy. Write down that you chose not to rotate, and why.")
        return ("ROTATE — blast radius too high to skip",
                f"Autofill-only, but blast radius {br}/5. Above 3 it rotates on "
                "every exit regardless of permission level.")
    return ("", "")


def build_plan(inv: dict, person: dict, reason: str | None,
               for_cause: bool = False) -> str:
    out: list[str] = []
    w = out.append
    pid = person["id"]
    ptiers = person.get("tiers", [])

    w(f"# Offboarding runbook — {person['name']} ({person.get('email', 'no email')})")
    w("")
    w(f"- **Person id:** `{pid}`")
    w(f"- **Role:** {person.get('role', 'unrecorded')}")
    w(f"- **Tiers:** {', '.join(ptiers) or 'NONE — this runbook will be empty'}")
    w(f"- **Generated:** {today()}")
    w(f"- **Departure type:** {'FOR CAUSE' if for_cause else 'amicable'}"
      f"{'  ← everything shared rotates, no exceptions' if for_cause else ''}")
    if reason:
        w(f"- **Reason:** {reason}")
    w("")
    w("Work the phases in order. The order is the security control: revoking the "
      "identity provider first locks you out of the client accounts you are "
      "responsible for, so it comes last.")
    w("")

    # Blockers.
    twofa = person.get("twofa_holder_for", [])
    w("## ⛔ Blockers — resolve before Phase 4")
    w("")
    if twofa:
        w("Their device is a second factor on the accounts below. Re-factor each one "
          "to a company-controlled factor and **confirm you can log in with it** "
          "before suspending anything. Get this wrong and the lockout is permanent, "
          "on an asset a client is paying you to hold.")
        w("")
        for acct in twofa:
            w(f"- [ ] **{acct}** — company factor added, tested in a private window, "
              f"their factor removed")
    else:
        w("- [ ] None recorded in `people.toml`. **Verify, do not assume** — run the "
          "Phase 0 2FA sweep and confirm. An empty list here is only trustworthy if "
          "somebody checked.")
    w("")

    # Never-share audit — the policy check that catches drift.
    # Deliberately NOT tier-filtered: these are admin-only by policy, so they
    # would never appear in a contractor's plan. Listing them anyway is how you
    # catch the case where policy drifted and one got shared after all.
    never = [x for x in inv.get("system", [])
             if x.get("share_policy") == "never_share"]
    if never:
        w("## Never-share audit")
        w("")
        w("House policy is that only Ben ever holds these. Confirm, for each, that "
          "this person never had it. A yes is not a routine rotation — it means the "
          "policy drifted, and the drift is more important than this one exit.")
        w("")
        for entry in never:
            w(f"- [ ] **{entry['name']}** — confirmed never shared with them")
        w("")

    # Rotation scope.
    w("## Rotation scope")
    w("")
    w("A shared secret is compromised the moment someone who could see it leaves, "
      "whether or not they used it. Scope by visibility, never by assignment.")
    w("")
    groups = person.get("vault_groups", [])
    if groups:
        w("**Vault groups they could read — every item in these rotates:**")
        w("")
        for g in groups:
            w(f"- [ ] `{g}` — enumerate items, rotate all, tick when the group is clear")
    else:
        w("- No vault groups recorded. If that is wrong, the rotation below is "
          "incomplete — fix `people.toml` before working this runbook.")
    w("")
    shared = person.get("shared_logins", [])
    if shared:
        w("**Shared (non-named-user) logins they used — mandatory rotation:**")
        w("")
        for s in shared:
            w(f"- [ ] `{s}` — rotated, and consider moving this system to named users "
              f"so the next exit costs nothing")
        w("")
    clients = person.get("clients", [])
    if clients:
        w(f"**Client projects they touched ({len(clients)}):** "
          + ", ".join(f"`{c}`" for c in clients))
        w("")
        w("Phase 2 client work below must be repeated per client. Also search Slack "
          "and mail for these client names — credentials pasted into a DM are outside "
          "the vault and outside the scope you just computed.")
        w("")

    # Phases.
    prechecks = [p for p in inv.get("precheck", []) if applies(p, person)]
    systems = [s for s in inv.get("system", []) if applies(s, person)]

    for phase in sorted(PHASES):
        title, blurb = PHASES[phase]
        if phase == 0:
            entries = prechecks
        else:
            entries = sorted([s for s in systems if s.get("phase") == phase],
                             key=lambda s: (-s.get("blast_radius", 0), s.get("id", "")))
        if not entries:
            continue
        w(f"## {title}")
        w("")
        w(f"{blurb}")
        w("")
        for entry in entries:
            br = entry.get("blast_radius")
            head = f"### {entry['name']}"
            if br:
                head += f"  ·  blast radius {br}/5"
            w(head)
            w("")
            meta = []
            if entry.get("owner"):
                meta.append(f"owner: {entry['owner']}")
            if entry.get("admin"):
                meta.append(f"where: {entry['admin']}")
            if entry.get("revocation"):
                meta.append(f"type: {entry['revocation']}")
            if not entry.get("verified", True):
                meta.append("**UNVERIFIED against your real stack**")
            if meta:
                w("*" + "  ·  ".join(meta) + "*")
                w("")
            call, why_call = rotation_call(entry, for_cause)
            if call:
                w(f"**Policy — {entry.get('share_policy')}: {call}.** {why_call}")
                w("")
            if entry.get("why"):
                w("> " + entry["why"].strip().replace("\n", "\n> "))
                w("")
            for step in entry.get("steps", []):
                w(f"- [ ] {step}")
            w("")
            if entry.get("verify"):
                w(f"**Verify:** {entry['verify']}")
                w("")

    w("## Close-out")
    w("")
    w("- [ ] Every box above is ticked, or has a written note saying why not")
    w("- [ ] Phase 5 verification actually executed, not assumed")
    w("- [ ] Re-check audit logs a week from now for login attempts on the revoked "
      "identity — attempts after departure make this an incident, not an exit")
    w(f"- [ ] Run `./killswitch.py complete runs/{today()}-{pid}.md`")
    w("")
    w("---")
    w("")
    w("*Generated by `offboarding/killswitch.py` from `inventory.toml` + "
      "`people.toml`. Do not write credentials into this file — it is committed, "
      "and `check` will reject it.*")
    return "\n".join(out) + "\n"


def cmd_plan(args: argparse.Namespace) -> int:
    inv, people = load(INVENTORY), load(PEOPLE)
    person = find_person(people, args.person)
    print(build_plan(inv, person, args.reason, args.for_cause))
    return 0


def cmd_start(args: argparse.Namespace) -> int:
    inv, people = load(INVENTORY), load(PEOPLE)
    person = find_person(people, args.person)
    RUNS.mkdir(exist_ok=True)
    suffix = "-for-cause" if args.for_cause else ""
    dest = RUNS / f"{today()}-{person['id']}{suffix}.md"
    if dest.exists() and not args.force:
        fail(f"{dest.relative_to(HERE.parent)} already exists — work that run, or "
             f"pass --force to regenerate it (regenerating loses ticked boxes)")
    who = operator(args.operator)
    body = build_plan(inv, person, args.reason, args.for_cause)
    body = body.replace("# Offboarding runbook",
                        f"<!-- run opened {now()} by {who} -->\n# Offboarding runbook", 1)
    dest.write_text(body, encoding="utf-8")
    AUDIT.parent.mkdir(exist_ok=True)
    with AUDIT.open("a", encoding="utf-8") as fh:
        fh.write(f"{now()} | START | {person['id']} | {who} | "
                 f"{args.reason or 'no reason given'}\n")
    total = body.count("- [ ]")
    print(f"{C['green']}opened{C['off']} {dest.relative_to(HERE.parent)} "
          f"({total} checklist items)")
    print(f"logged to {AUDIT.relative_to(HERE.parent)}")
    print()
    print(f"{C['bold']}Start with the blockers.{C['off']} Nothing in Phase 4 is safe "
          f"until the 2FA sweep is done.")
    return 0


def run_progress(path: Path) -> tuple[int, int]:
    text = path.read_text(encoding="utf-8", errors="replace")
    open_items = text.count("- [ ]")
    done = len(re.findall(r"- \[[xX]\]", text))
    return done, done + open_items


def cmd_status(args: argparse.Namespace) -> int:
    if not RUNS.is_dir() or not any(RUNS.glob("*.md")):
        print("no runs yet. open one with: ./killswitch.py start <person> --reason ...")
        return 0
    print(f"{C['bold']}Offboarding runs{C['off']}")
    print()
    for path in sorted(RUNS.glob("*.md")):
        done, total = run_progress(path)
        closed = "CLOSED" in path.read_text(encoding="utf-8", errors="replace")[:200]
        pct = int(100 * done / total) if total else 0
        colour = C["green"] if done == total else C["yellow"]
        state = "closed" if closed else "OPEN"
        print(f"  {colour}{done:>3}/{total:<3} ({pct:>3}%){C['off']}  "
              f"{path.name}  [{state}]")
    print()
    if AUDIT.exists():
        print(f"{C['dim']}audit log: {AUDIT.relative_to(HERE.parent)}{C['off']}")
    return 0


def cmd_complete(args: argparse.Namespace) -> int:
    path = Path(args.run_file)
    if not path.is_absolute():
        for cand in (Path.cwd() / path, HERE / path, RUNS / path.name):
            if cand.exists():
                path = cand
                break
    if not path.exists():
        fail(f"run file not found: {args.run_file}")
    leaks = scan_secrets([path])
    if leaks:
        for line in leaks:
            print(f"{C['red']}error:{C['off']} {line}", file=sys.stderr)
        fail("run file looks like it contains a credential — remove it before closing, "
             "this file is committed")
    done, total = run_progress(path)
    remaining = total - done
    if remaining and not args.force:
        fail(f"{remaining} of {total} checklist items are still open in {path.name}. "
             f"Finish them, or close with --force --reason '...' to record a deliberate "
             f"partial close.")
    who = operator(args.operator)
    header = f"<!-- CLOSED {now()} by {who}: {done}/{total} items"
    if remaining:
        header += f", {remaining} left open — {args.reason or 'no reason given'}"
    header += " -->\n"
    path.write_text(header + path.read_text(encoding="utf-8"), encoding="utf-8")
    AUDIT.parent.mkdir(exist_ok=True)
    with AUDIT.open("a", encoding="utf-8") as fh:
        verb = "COMPLETE" if not remaining else "PARTIAL"
        fh.write(f"{now()} | {verb} | {path.stem} | {who} | {done}/{total} items"
                 f"{f' — {args.reason}' if args.reason else ''}\n")
    print(f"{C['green']}closed{C['off']} {path.name} — {done}/{total} items")
    if remaining:
        print(f"{C['yellow']}{remaining} item(s) recorded as deliberately not done."
              f"{C['off']}")
    return 0


def cmd_people(args: argparse.Namespace) -> int:
    people = load(PEOPLE)
    persons = people.get("person", [])
    if not persons:
        print("no people on file. add [[person]] entries to people.toml")
        return 0
    print(f"{C['bold']}People on file{C['off']}")
    print()
    for p in persons:
        print(f"  {C['bold']}{p.get('id','?'):<22}{C['off']} {p.get('name','?')}")
        print(f"  {'':<22} tiers: {', '.join(p.get('tiers', [])) or '—'}")
        if p.get("vault_groups"):
            print(f"  {'':<22} vault: {', '.join(p['vault_groups'])}")
        if p.get("clients"):
            print(f"  {'':<22} clients: {', '.join(p['clients'])}")
        if p.get("twofa_holder_for"):
            print(f"  {'':<22} {C['yellow']}holds 2FA for: "
                  f"{', '.join(p['twofa_holder_for'])}{C['off']}")
        if p.get("shared_logins"):
            print(f"  {'':<22} {C['yellow']}shared logins: "
                  f"{', '.join(p['shared_logins'])}{C['off']}")
        print()
    return 0


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        prog="killswitch.py",
        description="Offboarding kill switch — generate and track access "
                    "revocation runbooks.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="The trigger is always a human. There is no automatic firing.")
    sub = ap.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("check", help="validate the inventory and scan for secrets")
    s.set_defaults(func=cmd_check)

    s = sub.add_parser("people", help="list people on file and what they hold")
    s.set_defaults(func=cmd_people)

    s = sub.add_parser("plan", help="print a runbook without opening a run")
    s.add_argument("person")
    s.add_argument("--reason", help="why they are leaving, for the record")
    s.add_argument("--for-cause", action="store_true",
                   help="departure was not amicable: every shared credential "
                        "rotates, autofill-only included")
    s.set_defaults(func=cmd_plan)

    s = sub.add_parser("start", help="open a tracked run in runs/")
    s.add_argument("person")
    s.add_argument("--reason", help="why they are leaving, for the record")
    s.add_argument("--operator", help="who is running this (default: git user.email)")
    s.add_argument("--for-cause", action="store_true",
                   help="departure was not amicable: every shared credential "
                        "rotates, autofill-only included")
    s.add_argument("--force", action="store_true",
                   help="overwrite an existing run file for today (loses ticks)")
    s.set_defaults(func=cmd_start)

    s = sub.add_parser("status", help="show open runs and progress")
    s.set_defaults(func=cmd_status)

    s = sub.add_parser("complete", help="close a run and record it")
    s.add_argument("run_file")
    s.add_argument("--reason", help="required in spirit when closing with items open")
    s.add_argument("--operator", help="who is running this (default: git user.email)")
    s.add_argument("--force", action="store_true",
                   help="close with items still open (records a partial close)")
    s.set_defaults(func=cmd_complete)

    args = ap.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
