# 01.3 Email domain authentication

**Module:** 01 The Spine
**Video:** ~7 min
**Needs first:** 01.1
**You finish with:** email that lands in the inbox instead of spam

## Why this matters

Two of your agents fall back to email. The follow-up agent's day 5 touch is an
email. If your email goes to spam, that touch is wasted and you will never
know, because spam does not bounce, it just silently disappears.

Gmail and Yahoo tightened bulk sender rules and unauthenticated mail from a
business domain now gets filtered aggressively. Sending as
`yourgym@gmail.com` through HighLevel is the fastest way into the spam folder,
because you are claiming to be Gmail while sending from somewhere else.

## What you are doing

Proving to receiving mail servers that HighLevel is allowed to send on behalf
of your domain. Three DNS records:

| Record | What it says |
|--------|-------------|
| SPF | These servers may send as my domain |
| DKIM | This message really came from me and was not altered |
| DMARC | Here is what to do with mail that fails the first two |

You add them wherever your domain is registered. GoDaddy, Namecheap,
Cloudflare, Hostinger, wherever you bought it.

## Steps

1. Open **Settings > Email Services**.

   [SHOT 01.3-01]

2. Choose to add or verify a **dedicated sending domain**. Use a subdomain,
   not your root domain. `mail.yourgym.com` or `send.yourgym.com`.

   Use a subdomain because if sending reputation ever goes bad, it damages the
   subdomain and not the domain your actual website and personal email run on.

3. HighLevel gives you a set of DNS records to add.

   [SHOT 01.3-02]

4. Log in to your domain registrar and open the DNS settings for your domain.

5. Add each record exactly as shown. Type, name, value. Copy and paste, never
   retype, and watch for a trailing space when you paste.

   [SHOT 01.3-03]

6. Save at the registrar, then come back to HighLevel and click **Verify**.

7. If it fails, wait. DNS takes anywhere from minutes to a few hours to
   propagate. Try again in an hour before assuming anything is wrong.

8. Once verified, set the **from name** and **from address**. From name is
   your gym name. From address is something a human would reply to, like
   `hello@yourgym.com`, not `noreply@`.

## Steps, DMARC

DMARC is a fourth record and it is the one most people skip. Add it.

Start permissive, then tighten once you know nothing is broken.

- Name: `_dmarc`
- Type: TXT
- Value to start with: `v=DMARC1; p=none; rua=mailto:you@yourgym.com`

Leave it at `p=none` for a few weeks. Once you are confident everything legit
is passing, change `p=none` to `p=quarantine`.

## Test it

1. Send a test email from HighLevel to a Gmail address you own.
2. Open it in Gmail on desktop. Click the three dots, **Show original**.
3. You want to see `PASS` next to SPF, DKIM and DMARC.

   [SHOT 01.3-04]

4. Send another to an Outlook address. Confirm it lands in the inbox and not
   in junk.

If any of the three says FAIL, the DNS record for that one is wrong. Go back
and compare it character by character.

## Checklist

- [ ] Dedicated sending subdomain added
- [ ] SPF, DKIM records added at the registrar
- [ ] DMARC record added at `p=none`
- [ ] Verified in HighLevel
- [ ] Test to Gmail shows PASS on all three
- [ ] Test to Outlook lands in inbox
- [ ] From address is a real, monitored, replyable address

## When it goes wrong

**Verification keeps failing.** Nine times out of ten it is one of: a trailing
space in a pasted value, the record added to the wrong domain, or the
registrar automatically appending the domain to the name field so you end up
with `mail.yourgym.com.yourgym.com`. Check that last one specifically, it
catches everybody.

**Verified but still going to spam.** Authentication gets you allowed to send,
it does not make you welcome. New sending domains have no reputation. Send low
volume for the first two weeks, to people who actually opened your emails
before, and it builds.

**Emails from the agents look fine but nobody replies.** Check the from
address is monitored. Replies to `noreply@` vanish and members assume they
were ignored.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 01.3-01 | Settings > Email Services | The domain section | Add domain button | Existing domains |
| 01.3-02 | The DNS records HighLevel generates | The record table | The copy buttons | Record values |
| 01.3-03 | A registrar DNS panel, records being added | The add record form | Name and value fields | Domain name |
| 01.3-04 | Gmail, Show original view | The SPF DKIM DMARC results | The three PASS lines | Email addresses |

## Video script

**Hook.** Your follow-up agent sends an email on day five. If that email goes
to spam, you will never know, because spam does not bounce. Here is how to
make sure it does not.

**Beats.**
1. On screen: talk to camera. SPF, DKIM, DMARC in thirty seconds, in plain
   English. Do not go deeper than that.
2. On screen: Email Services. Add subdomain. Say why a subdomain, in one line.
3. On screen: split screen, HighLevel records and registrar panel. Paste each
   one. Call out the double domain trap while doing it.
4. On screen: verify. Show it failing, then say wait an hour. Managing the
   expectation is the point.
5. On screen: Gmail Show original with three PASS lines. This is the win shot.

**Go do.** Add the records tonight, verify tomorrow morning. Then send
yourself a test and check Show original.

## Verify on screen

- Exact menu path and section name for email domain setup.
- Whether DMARC is generated by HighLevel or has to be added manually.
- Whether a dedicated domain is required or optional on our plan.
