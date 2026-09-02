# Offboarding kill switch

What to do when someone leaves, in the order that keeps you from locking
yourself out of your own client accounts.

```
./killswitch.py check                       validate the inventory (run in CI)
./killswitch.py people                      who is on file, and what they hold
./killswitch.py plan <person>                print the runbook
./killswitch.py start <person> --reason R    open a tracked run in runs/
./killswitch.py status                       open runs and their progress
./killswitch.py complete runs/<file>.md      close a run and record it
```

Python 3.11+, standard library only. Nothing to install.

## What this is

Three files of data and one script that turns them into an ordered checklist:

| File | What it holds |
|---|---|
| `inventory.toml` | every system, its blast radius, who owns it, the exact steps, how to verify |
| `people.toml` | who holds which access tier, which vault groups they can read, which clients they touched |
| `killswitch.py` | generates the runbook, validates the data, records what was done |
| `runs/` | one committed checklist per departure, plus an append-only `audit.log` |

`plan` filters the inventory by the departing person's tiers, orders it by
phase and blast radius, and emits markdown with a checkbox per step. `start`
writes that to `runs/` so it can be worked and committed as a record.

## House credential policy

The policy: **Ben holds the credentials. Nobody else, ever.** Other people get
*use* without *sight* — shared through Dashlane with "Can autofill" so they can
log in but never view, copy, edit or reshare the password.

Each system carries a `share_policy`, and the generated runbook tells you what
that means for the departure in front of you:

| `share_policy` | What it means | On exit |
|---|---|---|
| `never_share` | Ben only. Registrar, hosting root, finance, deploy keys, API keys, SSH keys, 2FA seeds — copy-paste secrets with no autofill mode. | Rotate unconditionally. If it *was* shared, that's an incident. |
| `named_user` | The service supports the person as their own user. **Always prefer this.** | Remove the user. **Zero rotation.** |
| `autofill_only` | Shared "Can autofill" — the fallback for services with no user management (booking software, legacy CMSes). | Amicable + blast radius ≤3: optional. For-cause: rotate all of it. |
| `not_applicable` | Not a credential — a device, a data transfer, a process. | — |

Run `plan` with `--for-cause` for a departure that wasn't amicable, and every
shared credential rotates regardless of permission level.

**Why autofill-only isn't a boundary:** the password is delivered to the browser
to fill the field, so someone motivated can read it out. "Can autofill" removes
*accidental* retention and blocks bulk export. That's worth a lot — it's what
earns the right to skip rotation on an ordinary exit — but it is not protection
against a person who wants to keep the password. Hence the for-cause branch.

**Named user beats autofill-only** wherever it's available. A shared login, even
autofill-only, still eventually rotates. A named user is removed and nothing
rotates at all. Every service you move to named users deletes an entry from
every future runbook.

**The never-share audit runs regardless of tier.** Never-share systems are
scoped `tiers = ["admin"]`, so they never appear in a contractor's plan — but the
audit lists them anyway and asks you to confirm each was never shared. A "yes"
there matters more than the exit you're working: it means the policy drifted.

### What the policy is worth, measured

The example contractor's runbook before never-share items were scoped to admin
only: **95 items.** After: **77.** The 18 that disappeared were the highest
blast-radius rotations on the list — registrar, hosting, deploy keys, finance,
the lead path. That's the policy paying for itself, and the same number will
keep falling as services move to named users.

## The two classes of access, which is the whole point

**Class 1 — per-person accounts you can revoke.** Workspace, GitHub org,
Slack, ClickUp. Clean, instant, auditable. This is the easy 20%, and it is
where most offboarding checklists stop.

**Class 2 — shared secrets you can only rotate.** Hostinger hPanel, the
registrar, deploy keys, and above all the *client-owned* credentials you are
custodian of: their Google Business Profile, Ads, Analytics, the legacy CMS
login from their migration, the `leads@` mailbox.

You cannot remove a person from a shared password. Suspending their account
does nothing to a Hostinger password they memorised or a vault export they took
last month. For an agency holding credentials on behalf of dozens of clients,
Class 2 *is* the exposure — so this system is built around inventory-driven
rotation, and Phase 2 is the longest phase in every generated runbook.

Two consequences worth internalising:

- **Scope rotation by visibility, not assignment.** Read access to a vault
  group compromises every item in that group the moment the person walks,
  whether or not they were assigned that client. `people.toml` records
  `vault_groups` for exactly this reason.
- **The inventory has to exist before anyone quits.** An inventory
  reconstructed during an exit is a guess, and the thing a guess misses is a
  live registrar credential sitting in a former contractor's password manager.

## Why the phases are in this order

The ordering is a security control, not documentation polish.

| Phase | | Why here |
|---|---|---|
| 0 | Prechecks | Non-destructive. Each item becomes impossible, or destroys evidence, if done later. |
| 1 | Per-person cutoff | Fast, clean revocations. Identity provider deliberately excluded. |
| 2 | **Rotation** | The phase that actually protects you. Ordered by blast radius: registrar, hosting, then client assets. |
| 3 | Continuity | Drive transfer, mail delegation, work handover — all need their account alive. |
| 4 | Identity termination | **Last.** Phases 0–3 depend on this account existing. |
| 5 | Verification | A ticked box is a claim. This phase turns claims into evidence. |

**Revoke the identity provider last.** The instinct is to kill SSO first. Do
that and you lose the account you needed for the admin Drive transfer, for mail
delegation, and — the expensive one — for any client account where that
person's phone is the second factor. Suspend first and that client's Google Ads
account is gone behind a support-desk ownership dispute, while the client waits.
Phase 0's 2FA sweep exists to find those before anything is cut off, and
`twofa_holder_for` in `people.toml` surfaces them as blockers at the top of
every runbook.

**Revoking OAuth grants is the highest-value single action here.** It is what
kills "Sign in with Google" access to every SaaS you forgot you had. It lives
in Phase 4 for that reason, and a password reset without terminating live
sessions does not achieve it — a session survives a password change until you
explicitly sign it out.

## Why the trigger is manual

There is no HR-event hook and no API call in this tool that revokes anything.
A kill switch wired to a status field in a payroll system eventually fires on a
typo or a mid-contract data-entry fix, and takes client sites down. The cost of
a manual trigger is a few minutes; the cost of a false positive is a client
outage and an explanation you do not want to give.

So: a human runs `start`, works the checklist, and closes it. `complete`
refuses while items are open unless you pass `--force --reason`, which records
the partial close in the audit log rather than hiding it. Everything is
idempotent — re-running a rotation step is harmless, skipping one is not.

## Pointers, never secrets

`inventory.toml`, `people.toml` and every run file are committed to git and
shared with whoever picks up an exit. They hold system names, admin URLs, vault
*group* names, and owners — never a password, key, token, recovery code or 2FA
seed. `check` scans for credential-shaped strings and fails, and `complete`
refuses to close a run file containing one. Wire `check` into CI so the rule
holds without anyone remembering it.

## Before first use

Every `[[system]]` is seeded from what this repo implies about the stack and
carries `verified = false`. `check` will warn on each one until a human
confirms it against reality, which is deliberate: an unverified inventory is
the exact failure this system exists to prevent. Walk them, correct the ones
that are wrong, delete what does not apply, add what is missing, then flip the
flag.

Then replace the `example-contractor` entry in `people.toml` with real people.
Keep it current while they are *here* — that is the maintenance cost, and it is
the whole reason the system works on the day it is needed.

## The number worth watching

Run `plan` for a contractor with broad vault access and count the checklist
items. It comes out around 85. That number is a direct measure of how much
shared, non-named-user access you have granted — and it drops sharply when you
move systems to named users and split the vault into per-client groups. Treat
it as a metric, not a chore: the cheapest exit is the one where there was
nothing to rotate.
