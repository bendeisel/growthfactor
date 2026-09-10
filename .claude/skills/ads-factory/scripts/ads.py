#!/usr/bin/env python3
"""One front door for the ads factory.

    ads.py doctor                    check every credential, name what is broken
    ads.py client <slug>             one client's whole measurement picture
    ads.py google  ... | meta ... | gtm ... | gsc ... | ga4 ... | accounts ...

The platform words just hand off to the matching CLI, so
`ads.py google report spidersboxing --days 7` is exactly
`googleads.py report spidersboxing --days 7`. Use whichever reads better.
"""

import os
import runpy
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import accounts  # noqa: E402
import gfads  # noqa: E402

TARGETS = {
    "google": "googleads.py",
    "googleads": "googleads.py",
    "meta": "meta.py",
    "gtm": "gtm.py",
    "tags": "gtm.py",
    "gsc": "gsc.py",
    "console": "gsc.py",
    "ga4": "ga4.py",
    "analytics": "ga4.py",
    "accounts": "accounts.py",
}


def run(script, argv):
    """Run a sibling CLI in this process so exit codes and stdout pass
    straight through."""
    sys.argv = [os.path.join(HERE, script)] + list(argv)
    runpy.run_path(sys.argv[0], run_name="__main__")


# --------------------------------------------------------------------------
# doctor
# --------------------------------------------------------------------------

CHECKS = [
    # (label, the command that proves it, what a failure means)
    ("Google OAuth token",
     ["ga4.py", "properties", "--json"],
     "GOOGLE_CLIENT_ID / SECRET / REFRESH_TOKEN. Re-mint with "
     "python3 scripts/google_oauth_setup.py"),
    ("Google Ads (v25 + developer token + MCC)",
     ["googleads.py", "accounts", "--json"],
     "GOOGLE_ADS_DEVELOPER_TOKEN or GOOGLE_ADS_LOGIN_CUSTOMER_ID, or the "
     "refresh token is missing the adwords scope"),
    ("Tag Manager",
     ["gtm.py", "accounts", "--json"],
     "the refresh token is missing a tagmanager scope, or the Google user "
     "has no GTM access"),
    ("Search Console",
     ["gsc.py", "sites", "--json"],
     "the refresh token is missing the webmasters scope, or the Google user "
     "is not on any property"),
    ("GA4 Admin",
     ["ga4.py", "properties", "--json"],
     "the refresh token is missing an analytics scope"),
    ("Meta system user token",
     ["meta.py", "token", "--json"],
     "META_SYSTEM_USER_TOKEN, or the token has no ads_read scope"),
    ("Meta Business Manager",
     ["meta.py", "accounts", "--json"],
     "META_BUSINESS_ID, or the system user is not assigned to any ad account"),
]


def record_count(stdout):
    """Every check asks for --json, so a successful check can say how much it
    actually saw. 'ok, 0 records' is a different problem from 'ok'."""
    import json as _json
    try:
        parsed = _json.loads(stdout)
    except ValueError:
        return "reachable"
    if isinstance(parsed, list):
        return "%d record(s)" % len(parsed)
    if isinstance(parsed, dict):
        return "1 record"
    return "reachable"


def cmd_doctor(argv):
    """Run one cheap read against every surface and report which credential
    is actually wrong. Guessing which of eleven config values broke is the
    worst part of setting this up, so it is done once, here."""
    print("Checking every credential in config.env. Reads only, nothing is "
          "changed.\n")
    rows = []
    for label, cmd, remedy in CHECKS:
        proc = subprocess.run(
            [sys.executable, os.path.join(HERE, cmd[0])] + cmd[1:],
            capture_output=True, text=True)
        if proc.returncode == 0:
            rows.append({"surface": label, "state": "ok",
                         "detail": record_count(proc.stdout)})
        else:
            first = ""
            for line in (proc.stderr or "").splitlines():
                if line.strip():
                    first = line.strip()
                    break
            rows.append({"surface": label, "state": "FAILED",
                         "detail": first[:110] or "no output"})
            rows.append({"surface": "", "state": "-> fix",
                         "detail": remedy})
    gfads.out(rows, ["surface", "state", "detail"])
    broken = sum(1 for r in rows if r["state"] == "FAILED")
    print()
    if broken:
        print("%d of %d surfaces failed. Fix the ones above, then re-run."
              % (broken, len(CHECKS)))
        raise SystemExit(gfads.EXIT_CONFIG)
    print("All %d surfaces answered." % len(CHECKS))


def cmd_client(argv):
    """Everything known about one client, in the order it matters: can we
    measure them, then what are they spending."""
    if not argv:
        gfads.die("usage: ads.py client <slug>")
    slug = argv[0]
    row = accounts.find(slug)
    if not row:
        gfads.die("no client %r in the registry. `ads.py accounts list`." % slug)
    print("=" * 72)
    print("%s (%s)" % (row.get("client") or slug, slug))
    print("=" * 72)
    steps = [
        ("Tag Manager: measurement gaps", "gtm.py", ["audit", slug]),
        ("GA4: key events", "ga4.py", ["events", slug]),
        ("GA4: channels, 28 days", "ga4.py", ["report", slug, "--days", "28"]),
        ("Search Console: 28 days vs previous", "gsc.py", ["compare", slug, "--days", "28"]),
        ("Google Ads: campaigns, 30 days", "googleads.py", ["report", slug]),
        ("Meta: campaigns, 30 days", "meta.py", ["report", slug]),
    ]
    for title, script, cmd in steps:
        print("\n--- %s ---" % title)
        proc = subprocess.run(
            [sys.executable, os.path.join(HERE, script)] + cmd,
            capture_output=True, text=True)
        sys.stdout.write(proc.stdout)
        if proc.returncode != 0:
            # A client with no Meta account is normal, not a failure worth
            # aborting the whole picture over.
            for line in (proc.stderr or "").splitlines():
                if line.strip():
                    print("  skipped: %s" % line.strip())
                    break


def main():
    argv = sys.argv[1:]
    if not argv or argv[0] in ("-h", "--help", "help"):
        print(__doc__)
        print("Platform words: %s" % ", ".join(sorted(set(TARGETS))))
        return
    word = argv[0]
    if word == "doctor":
        return cmd_doctor(argv[1:])
    if word == "client":
        return cmd_client(argv[1:])
    if word in TARGETS:
        return run(TARGETS[word], argv[1:])
    gfads.die("unknown command %r. Try: doctor, client, %s"
              % (word, ", ".join(sorted(set(TARGETS)))))


if __name__ == "__main__":
    main()
