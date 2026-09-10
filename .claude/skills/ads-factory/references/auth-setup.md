# One-time credential setup

Two credentials cover everything: one Google refresh token and one Meta
system user token. Do this once. Every client after that is a registry row,
not a new setup.

Ben is on Windows. Run everything below from **Git Bash** or **PowerShell**
in `.claude\skills\ads-factory\scripts`. Both work, the commands are
identical.

## Why this shape

The alternative is per-client OAuth, where each client authorizes their own
token and you keep a token per client alive forever. That means a refresh
chore per client and a broken report every time one of them changes a
password. Agency-owned credentials invert it: the client grants Growth
Factor's manager account access through the normal in-platform invite, and
the credential never changes.

The cost is that access is only as good as the invite. If a client removes
the MCC from their Google Ads account, that client's reads stop. Nothing
else breaks.

## Google, once

### 1. Cloud project and APIs

In a Google Cloud project owned by ben@growth-factor.ai, enable all five:

- Google Ads API
- Tag Manager API
- Google Search Console API
- Google Analytics Data API
- Google Analytics Admin API

A missing API here fails later as a 403 that reads like a permission
problem, which is why `ads.py doctor` checks each surface separately.

### 2. OAuth client

APIs and services > Credentials > Create credentials > OAuth client ID.
Application type must be **Desktop app**. A Web client rejects the
out-of-band redirect the setup script uses.

### 3. Consent screen

Publish it. Leaving it in **Testing** expires refresh tokens after 7 days,
which shows up weeks later as `invalid_grant` on a Monday morning. The
error handler names this specifically because it is the failure that wastes
the most time.

### 4. Developer token, for Google Ads only

In the manager account (MCC): Tools > API Center. Apply for a developer
token. Basic access is enough for everything here. The token belongs to the
MCC and covers every account the MCC manages, so it is applied for once.

### 5. Mint the refresh token

```bash
python3 google_oauth_setup.py
```

It prints a consent URL, you paste back the code, it prints the three lines
for `config.env`. The scopes it asks for:

| Scope | What stops working without it |
| --- | --- |
| `adwords` | all Google Ads reads and writes |
| `tagmanager.readonly` | reading tags, triggers, the live version |
| `tagmanager.edit.containers` | creating tags |
| `tagmanager.edit.containerversions` | creating a version to publish |
| `tagmanager.publish` | publishing to the client's live site |
| `webmasters` | Search Console, including sitemap submit |
| `analytics.readonly` | GA4 reports and property structure |
| `analytics.edit` | GA4 admin changes |

One token carries all eight. Adding a scope later means re-minting, and the
old token keeps working until you replace it.

### 6. Per client, in Google

The client does these, or does them with you on a call:

- **Google Ads:** accepts the MCC link request. Their customer ID then shows
  up in `googleads.py tree`.
- **GTM:** adds ben@growth-factor.ai to the container with Publish
  permission. Read-only access is enough for `audit`, but not to fix
  anything.
- **Search Console:** adds ben@growth-factor.ai as Full user. Owner is not
  required.
- **GA4:** adds ben@growth-factor.ai with Editor on the property.

## Meta, once

### 1. App

developers.facebook.com > My Apps > Create App > type **Business**. Add the
Marketing API product. Note the app ID and secret.

### 2. System user

Business Settings > Users > System users > Add. Give it **Admin** system
user role. A system user token does not expire when a human's password
changes, which is the entire reason to use one rather than your own token.

### 3. Token

On the system user: Generate new token > pick the app > select scopes:

- `ads_read` for every report here
- `ads_management` for the two gated writes
- `business_management` to list the Business Manager's ad accounts

Copy it into `META_SYSTEM_USER_TOKEN`. Confirm what it actually carries:

```bash
python3 meta.py token
```

That reads `debug_token`, which reports the scopes really on the token
rather than the ones you meant to select.

### 4. Per client, in Meta

The client shares their ad account with Growth Factor's Business Manager,
then you assign the system user to it: Business Settings > Accounts > Ad
Accounts > pick the account > Assign system user > Manage campaigns.

Assigning the **system user** is the step people miss. Sharing the ad
account with the business is not enough on its own, and the failure looks
like a permission error on an account you can plainly see in the UI.

## Confirm the whole thing

```bash
python3 ads.py doctor
```

Seven surfaces, one cheap read each, and a named remedy for every failure.
Reads only, so it is safe to run at any time.
