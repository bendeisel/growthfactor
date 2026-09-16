#!/usr/bin/env python3
"""Pull every Google review for the business straight from Google Business Profile.

This is the official Business Profile API, authenticated as the business owner
— not scraping.  It is also the only route out of this environment: google.com,
maps.google.com and every third-party scraper host are refused by the network
egress proxy, while *.googleapis.com answers.

Usage:

    export GBP_TOKEN="ya29.a0Af..."        # OAuth access token, owner account
    python3 fetch_gbp_reviews.py            # -> extra_reviews.json
    python3 build_reviews.py                # tags + merges them into reviews.json

Getting a token (no code required):

  1. In Google Cloud console, enable the "Google My Business API" for a project.
     Business Profile APIs need a one-time access request approved by Google:
     https://developers.google.com/my-business/content/prereqs
  2. Go to https://developers.google.com/oauthplayground
  3. Gear icon -> "Use your own OAuth credentials", paste the client ID/secret.
  4. In the scope box enter:  https://www.googleapis.com/auth/business.manage
  5. Authorize as the account that owns the Nashville MMA listing, exchange the
     code, and copy the access token.  It is valid for one hour, which is plenty.

The token is read from the environment and never written to disk or to git.
"""
import json
import os
import pathlib
import sys
import time
import urllib.error
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "extra_reviews.json"

ACCOUNTS = "https://mybusinessaccountmanagement.googleapis.com/v1/accounts"
LOCATIONS = ("https://mybusinessbusinessinformation.googleapis.com/v1/"
             "%s/locations?readMask=name,title&pageSize=100")
REVIEWS = "https://mybusiness.googleapis.com/v4/%s/reviews?pageSize=50"

TOKEN = os.environ.get("GBP_TOKEN", "").strip()


def get(url):
    req = urllib.request.Request(url, headers={
        "Authorization": "Bearer " + TOKEN,
        "Accept": "application/json",
    })
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")[:400]
            if e.code in (429, 500, 502, 503) and attempt < 3:
                time.sleep(2 ** attempt)
                continue
            sys.exit("HTTP %s on %s\n%s" % (e.code, url, body))
        except urllib.error.URLError as e:
            if attempt < 3:
                time.sleep(2 ** attempt)
                continue
            sys.exit("network error on %s: %s" % (url, e))


def paged(url, key):
    out, token = [], None
    while True:
        u = url + (("&" if "?" in url else "?") + "pageToken=" + token if token else "")
        data = get(u)
        out += data.get(key, [])
        token = data.get("nextPageToken")
        if not token:
            return out


def main():
    if not TOKEN:
        sys.exit("set GBP_TOKEN first — see the docstring at the top of this file")

    accounts = paged(ACCOUNTS, "accounts")
    if not accounts:
        sys.exit("that token can see no Business Profile accounts")
    print("accounts visible : %d" % len(accounts))

    rows, seen = [], set()
    for acct in accounts:
        acct_name = acct["name"]                       # accounts/123
        for loc in paged(LOCATIONS % acct_name, "locations"):
            loc_id = loc["name"].split("/")[-1]         # locations/456 -> 456
            title = loc.get("title", loc["name"])
            path = "%s/locations/%s" % (acct_name, loc_id)
            revs = paged(REVIEWS % path, "reviews")
            print("  %-42s %4d reviews" % (title[:42], len(revs)))
            for r in revs:
                text = (r.get("comment") or "").strip()
                name = (r.get("reviewer", {}).get("displayName") or "").strip()
                if not text or not name:
                    continue                            # star-only rating
                key = (name, text[:60])
                if key in seen:
                    continue
                seen.add(key)
                rows.append({
                    "name": name,
                    "text": text,
                    "stars": r.get("starRating"),
                    "date": r.get("createTime", "")[:10],
                    "location": title,
                    "source": "google-business-profile",
                })

    OUT.write_text(json.dumps(rows, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print("\nwritten: %d reviews with text -> %s" % (len(rows), OUT.name))
    print("next   : python3 build_reviews.py")


if __name__ == "__main__":
    main()
