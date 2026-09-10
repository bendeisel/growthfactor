#!/usr/bin/env python3
"""Mint the one Google refresh token, once.

    python3 google_oauth_setup.py

Run this on the machine with a browser, signed in as ben@growth-factor.ai.
It prints a URL, takes the code you paste back, and prints the refresh token
to put in config.env. Every Google surface in this skill then runs off that
one token: Ads, Tag Manager, Search Console and Analytics.

Windows: run it from Git Bash or PowerShell in
  .claude\\skills\\ads-factory\\scripts

Prerequisites, in the Google Cloud project that owns the OAuth client:
  - Google Ads API, Tag Manager API, Search Console API, Google Analytics
    Data API and Google Analytics Admin API all enabled.
  - An OAuth client of type "Desktop app". A Web client will reject the
    redirect this script uses.
  - ben@growth-factor.ai added as a test user if the consent screen is still
    in testing, or the app published.

Why paste-a-code instead of a local web server: no port to open, works over
a remote shell, and the code is single-use and expires in minutes.
"""

import json
import sys
import urllib.parse
import urllib.request

sys.path.insert(0, __file__.rsplit("/", 1)[0] if "/" in __file__ else ".")
import gfads  # noqa: E402

# The out-of-band redirect for installed apps.
REDIRECT = "urn:ietf:wg:oauth:2.0:oob"
AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"


def main():
    print(__doc__)
    print("-" * 72)
    client_id = input("OAuth client ID: ").strip()
    client_secret = input("OAuth client secret: ").strip()
    if not client_id or not client_secret:
        gfads.die("both the client ID and secret are required")

    params = {
        "client_id": client_id,
        "redirect_uri": REDIRECT,
        "response_type": "code",
        "scope": " ".join(gfads.GOOGLE_SCOPES),
        # offline is what makes Google return a refresh token at all, and
        # consent forces it even if this account already granted the app.
        "access_type": "offline",
        "prompt": "consent",
    }
    print("\n1. Open this URL, signed in as the account that has access to the")
    print("   client MCC, GTM, Search Console and GA4:\n")
    print("   %s?%s" % (AUTH_URL, urllib.parse.urlencode(params)))
    print("\n2. Approve every scope. Google will show you a code.\n")
    print("   Scopes requested:")
    for scope in gfads.GOOGLE_SCOPES:
        print("     %s" % scope)
    code = input("\n3. Paste the code here: ").strip()
    if not code:
        gfads.die("no code pasted")

    body = urllib.parse.urlencode({
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": REDIRECT,
        "grant_type": "authorization_code",
    }).encode()
    req = urllib.request.Request(
        gfads.GOOGLE_TOKEN_URL, data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            got = json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")
        gfads.die("Google rejected the code (HTTP %d): %s\n"
                  "       A code is single use and expires in minutes, so if "
                  "this is the second try, start again from step 1."
                  % (exc.code, detail[:400]), gfads.EXIT_API)

    if "refresh_token" not in got:
        gfads.die("no refresh_token in the response: %s\n"
                  "       Google only returns one with access_type=offline and "
                  "prompt=consent. Revoke the app at "
                  "https://myaccount.google.com/permissions and retry."
                  % json.dumps(got)[:400], gfads.EXIT_API)

    print("\n" + "=" * 72)
    print("Put these three lines in config.env:\n")
    print("GOOGLE_CLIENT_ID=%s" % client_id)
    print("GOOGLE_CLIENT_SECRET=%s" % client_secret)
    print("GOOGLE_REFRESH_TOKEN=%s" % got["refresh_token"])
    print("\n" + "=" * 72)
    print("Then check it end to end:  python3 ads.py doctor")
    print("\nThe refresh token does not expire on its own. It dies if the")
    print("password changes, access is revoked, or the consent screen is left")
    print("in testing mode, which expires tokens after 7 days. Publish the")
    print("app to avoid that one.")


if __name__ == "__main__":
    main()
