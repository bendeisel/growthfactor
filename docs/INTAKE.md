# Intake

Intake is the highest-leverage step in the pipeline and the one most likely to blow
the timeline. Every hour of assembly speed you gain is wasted if you're still
chasing a phone number on day four.

## The design constraint

**The client must finish it in one sitting.** That is the only requirement that
matters. A thorough form nobody completes is worth less than a short form everybody
does.

So the form is split in two:

- **Essentials** — everything required to start a build. If any of it is missing, the
  build does not start.
- **Enrichment** — everything that improves the site but can arrive during the review
  week. Real photos, long bios, extra testimonials, detailed service copy.

The client sees both, but only Essentials blocks. This is what lets you say "send us
these 9 things and you'll have a site tomorrow" instead of "fill in this 60-field
questionnaire."

## Essentials (blocking)

1. Business name
2. Phone (+ emergency line if different)
3. Address + service areas
4. Hours
5. Top 5 services
6. Logo
7. Three testimonials
8. Years in business
9. **The differentiator** — "why do people pick you over the guy down the road?"

That last one is the single most important field in the file. Almost all generated
copy leans on it, and it is the difference between a site that sounds like the
business and a site that sounds like a template. If a client gives you a
non-answer, get them on the phone for five minutes and write it down yourself.

## Enrichment (non-blocking)

Real photography — the biggest single differentiator between a $10k-looking site and
an obvious template, and the top priority to collect during the review week. Then
team bios, credentials, pricing, class schedules, extra testimonials, service detail
copy, integrations.

## The form

`intake/form.html` — a single self-contained file. No build step, no server, no
dependencies. Host it anywhere, or email it as an attachment.

It produces a `client.json` conforming to `schemas/client.schema.json`, saves progress
to `localStorage` as the client types, adapts its fields to the selected niche, and
shows a live readiness meter that tells the client exactly what is still blocking.

**Prefill from the agency side** with URL parameters so the client never sees fields
that aren't theirs to answer:

```
form.html?slug=acme-restoration&niche=restoration&skin=restoration&layout=resto-01-emergency
```

With those set, the agency block is hidden and the client just answers business
questions.

## Validate before provisioning

```bash
node scripts/validate-client.mjs clients/acme-restoration.json
```

Dependency-free — it validates against the JSON Schema directly, and additionally
enforces the cross-field rules a schema can't express:

- Skin and layout exist, and the layout belongs to the chosen skin
- Medical testimonials have `consentOnFile: true`
- Client-supplied brand colours are contrast-checked at WCAG AA
- Combat/fitness builds that use a schedule-bearing layout actually have a schedule
- Service slugs are unique (they become URLs)

Exit code 1 means **do not provision**. Warnings mean the build will work but will
need enrichment during the review week.

## Practical notes

**Do the form with them on the first call** for your first few clients. You'll learn
which questions are ambiguous much faster than by watching abandoned sessions, and
you'll get better answers.

**Ask for photos as a folder link, not attachments.** Google Drive or Dropbox. Then
put the URL in `brand.photos` and pull them at assembly.

**Never let a missing field become an invented one.** If a certification isn't in
`client.json`, it does not go on the site. The voice guides state this explicitly
and the QA gate checks for stats that don't trace back to intake — inventing an
IICRC certification or a competition record is the kind of error that ends a client
relationship.
