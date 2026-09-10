---
name: ads-onboard
description: Connect a new client's ad and measurement accounts end to end, then verify each one actually answers. Use when a client is coming aboard or when their accounts were never properly wired: "get their accounts connected", "set up tracking for this client", "we just signed them, hook up their ads", "are we even able to see their data", "onboard the new gym". Walks Google Ads, Meta, Tag Manager, Search Console and GA4, writes the registry row, and reports what is measurable and what is not before any budget is touched. Not for pulling numbers on an already-connected client (ads-report).
---

# Ads onboard: from signed to measurable

The goal is not five connected accounts. It is a written answer to **"can we
measure whether their money is working"**, which is usually no on arrival,
and the reason is usually one unpublished GTM container.

Read `../ads-factory/SKILL.md` first. The credential setup in
`../ads-factory/references/auth-setup.md` happens once, not per client.

## Step 0: credentials answer

```bash
cd .claude/skills/ads-factory/scripts
python3 ads.py doctor
```

If a surface fails here it fails for every client, so fix it before
involving the client in anything.

## Step 1: the access asks, in one message

The client has to grant access in each platform. Send all five at once
rather than discovering them one at a time over a week. What to ask for is
listed per platform in `auth-setup.md`, section "Per client".

The one people get wrong is Meta: sharing the ad account with Growth
Factor's Business Manager is **not enough**. The system user then has to be
assigned to that account. Until that happens the account is visible in the
UI and returns a permission error from the API, which looks like a bug and
is not.

## Step 2: create the row

```bash
python3 accounts.py add spidersboxing --client "Spiders Boxing" --status connecting
```

The slug is the same slug the site work uses, so a client is one name across
both halves of the agency. `accounts.py slugify "Spider's Boxing & Fitness"`
if in doubt.

## Step 3: discover each ID from the API, do not type them

Every platform can list what the credential can now see, which is both
faster than asking the client for IDs and proof the access actually landed.

```bash
python3 googleads.py tree                    # customer IDs under the MCC
python3 meta.py accounts                     # act_ IDs, owned and client
python3 ga4.py properties                    # property IDs, every account
python3 gsc.py sites                         # exact property strings
python3 gtm.py accounts                      # then: gtm.py containers <id>
```

Save each as it appears:

```bash
python3 accounts.py set spidersboxing \
  --google-ads 123-456-7890 --meta 998877665544 \
  --ga4 456123789 --gsc https://spidersboxing.com/ \
  --gtm-account 6001234567 --gtm-container 12345678 --gtm-public-id GTM-ABC1234
```

The registry normalizes on the way in: dashes come off the Google ID, `act_`
goes onto the Meta ID, the trailing slash goes onto a URL-prefix property,
and a `G-` measurement ID pasted into `--ga4` is refused with a note saying
where the real number lives.

If a platform does not appear, the access did not land. That is a client
conversation, not a config change.

## Step 4: verify, then read the whole picture

```bash
python3 accounts.py list --missing     # anything still unconnected
python3 ads.py client spidersboxing    # every surface, in order
```

`ads.py client` runs the tag audit, GA4 key events, GA4 channels, Search
Console against the previous window, and both ad platforms. A platform the
client does not use is skipped with a note rather than failing the run.

## Step 5: the measurement verdict

This is the deliverable. `gtm.py audit <slug>` is the core of it:

```bash
python3 gtm.py audit spidersboxing
python3 ga4.py events spidersboxing
```

Four questions, in this order, because each one makes the next meaningless
if the answer is no:

1. **Is the container published at all?** An unpublished container measures
   nothing, however correct its tags look in the UI.
2. **Is there a GA4 configuration tag (`googtag`) live?** Without it GA4
   sees no traffic.
3. **Are there GA4 event tags (`gaawe`) live, and are those events marked as
   key events in GA4?** A form submission nobody marked as a key event is
   not a conversion, and Google Ads has nothing to import.
4. **Is there a Google Ads conversion tag (`awct`) live?** Without it the
   campaigns cannot optimize toward anything, which no amount of bid tuning
   fixes.

Write the answers down in the registry `--notes`. Whatever is missing here
is the first work order, ahead of any campaign change, because until it is
fixed nobody can tell whether a campaign change helped.

## Step 6: fix the tagging, if that is the engagement

Drafts first, publish deliberately, and never publish in the same breath as
creating:

```bash
python3 gtm.py add-ga4-config spidersboxing --measurement-id G-ABC123XYZ
python3 gtm.py triggers spidersboxing
python3 gtm.py add-ga4-event spidersboxing --event generate_lead --trigger 12345
python3 gtm.py publish spidersboxing --name "GA4 base + lead event"
```

Each of those refuses and prints its payload until `--confirm` is added.
`publish` is the one that changes the client's live site, so confirm it
knowing that.

## Step 7: close the row

```bash
python3 accounts.py set spidersboxing --status live \
  --notes "GA4 + lead event published 2026-09-10. Google Ads conversion tag still missing, quoted separately."
```

`live` means measurable, not merely connected. A client with five connected
accounts and an unpublished container is still `connecting`.
