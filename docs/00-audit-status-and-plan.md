# Growth Factor AI: Portal + Static Site System
## Audit status, architecture notes, and build plan

Date: 2026-08-17
Author: Claude Code session (branch `claude/project-understanding-plan-b85hdq`)

---

## 1. Section 1 audit: status is BLOCKED, and here is exactly why

The handoff spec says do not write code until the CI audit is resolved. I attempted the audit
from this session and could not complete it. Four separate access gaps, each with a specific fix.

| What I tried | Result | How to unblock |
|---|---|---|
| Fetch `https://ci.growth-factor.ai/` | Blocked by the environment network egress policy (403 at the proxy CONNECT stage, for both the fetch tool and curl) | Change this environment's network policy to allow the domain. See https://code.claude.com/docs/en/claude-code-on-the-web |
| Read David's CI source on GitHub | Not reachable. This session's GitHub scope is `bendeisel/growthfactor` only, and that repo contains a README and nothing else. The `bendeisel` account shows 1 public repo total. | Tell me the owner/repo for CI and I will attach it, or grant the Claude GitHub App access to the org that owns it |
| List Supabase projects | The connected Supabase account has org "Growth Factor AI" (`bvglilwjihwjztmvtlut`) with **zero projects** | See the risk note below |
| Mission Control API on the VPS | No host, no docs, no token | Base URL plus a token, or confirmation that I am writing the endpoints too |

### Risk worth raising now, separate from the build

The Supabase org Ben controls has no projects in it. If CI is genuinely running on Supabase, that
project sits in an account Ben does not appear to control. A multi-tenant client-facing platform,
with client data in it, hosted on a developer's personal infrastructure account is a real business
risk regardless of how well the code is written. Worth resolving before the portal is built on top
of it, not after. Options: transfer the project into the Growth Factor org, or treat this as a point
in favour of a new Supabase project owned by the company.

### What the audit needs to answer

Unchanged from Section 1 of the spec: auth provider, whether tenancy is enforced by row level
security or only in app code, org-with-multiple-users support, role model, database and schema
shape, whether `organizations` and any `services` concept already exist, framework and version,
styling system, whether the layout shell is separable from the SEO module, the exact design token
values, and the deploy pipeline. The recommendation of extend versus parallel falls out of those
answers, and Ben makes the final call.

**Fastest path if repo access is slow:** paste or attach these six files and I can answer most of
the audit and extract the tokens: `package.json`, the migrations or schema directory, the Tailwind
config or theme token file, the auth middleware, the root layout component, and one representative
page component.

---

## 2. Understanding of the project

Two products, one of which is the long term asset and the other is what pays for it.

1. **The portal.** Multi-tenant client dashboard. A client logs in once and sees a service selector
   listing only the services they pay for. Websites is module one. Ads, SEO, chatbots, and reporting
   come later by configuration, not by rewrite. The real product inside the portal is a single
   request queue shared by every module, keyed by `service_type`.
2. **The static site system.** Astro static output on Cloudflare Pages, one private repo per client,
   location pages generated from a data file, heavy semantic HTML and JSON-LD. Sold to gyms and
   martial arts studios, displacing a competitor whose clients cannot edit their own title tags.

Three systems already exist and must not become four: CI (client-facing SEO platform), Mission
Control (internal ops, FastAPI plus React on the VPS, the agency system of record), and GHL plus
n8n for CRM and automation. The portal talks to Mission Control over an API and never shares its
database.

The technical thesis is that pre-rendered semantic HTML plus a strong schema graph wins both
Google and AI extraction in a vertical where every competing platform renders badly, and that this
edge is defensible for roughly two years. I agree with that thesis, and the plan below turns it
into build-time pass/fail checks rather than good intentions.

---

## 3. Architecture notes: seven things I would pin down or change

Ordered by how expensive they are to get wrong.

### 3.1 One repo per client is right for delivery and wrong for maintenance, unless the code is a package

A private repo per client is correct for ownership, backup, and Cloudflare wiring. But if each repo
contains a full copy of the template code, then at 40 clients a single template bug fix is 40 pull
requests, and the marginal cost of a client stops being near zero.

Recommendation: the site code lives in a versioned theme package in this monorepo. Each client repo
holds only content data, config, brand assets, and a pinned theme version. Fixing the template is
one release plus a version bump, and the bump is scriptable across every client repo. This is the
single most important structural decision in the template track and the spec does not address it.

### 3.2 The requests table will have two owners, so name the authority now

Section 3 says one requests table with a `service_type` column, and also says the portal must reach
Mission Control by API rather than sharing its database. Both are correct, and together they mean a
request exists in two places at once.

Recommendation: Mission Control owns work state. The portal `requests` row is the client-facing
projection, carrying `external_ref`, `last_synced_at`, and a client-visible status derived from the
Kanban column by an explicit mapping. Status flows back by webhook, with a periodic reconcile job
because webhooks get missed. Decide the column-to-status mapping as a written table, since
"In Progress" for a client and the internal column names will not be one to one.

### 3.3 Automated provisioning conflicts with "nothing goes live without human approval"

Section 5 step 4 attaches the live domain during automated provisioning. Section 8 says nothing goes
live without human approval. Those cannot both hold.

Recommendation: provisioning ends at a preview URL carrying `noindex`, plus a Kanban card for
review. Promoting to the live domain is a separate, explicitly approved action in the portal or in
Mission Control. This also gives us a safe place to review generated copy before Google sees it.

### 3.4 Make the build gate a real test suite, and run it where it cannot be skipped

The spec asks for a build-time check that fails the deploy if critical content is missing. Go
further, because this gate is the moat. Assert on the built HTML: exactly one H1 per page, body copy
present in view-source, every JSON-LD block parses and carries the required types and fields,
canonical present, meta title and description within length bounds, and a cross-page similarity check
on location copy so two locations cannot ship near-identical intros. Add the Section 8 writing rules
as a linter, so no em dashes and no banned words is mechanical rather than a review step. Every
failure exits non-zero.

Run it in GitHub Actions and deploy with `wrangler` direct upload rather than letting Cloudflare
Pages build from the repo. Two reasons: the gate cannot be bypassed, and we stop depending on the
Pages build allowance across a growing number of client projects.

### 3.5 The class schedule must be rendered HTML, not a booking-software iframe

Most gym sites embed the Mindbody or Zen Planner widget. That single choice causes both problems the
spec is trying to solve. The schedule is invisible to Google and to AI extraction, and the third
party script hurts the largest contentful paint on exactly the mobile connection we are targeting.

Recommendation: the schedule is data in the repo, rendered as static semantic HTML, with any booking
link pointing out to their software. This satisfies "class schedule visible without a click" and turns
the schedule into indexable content. It raises an ops question that needs an answer: schedules change,
so who updates them, and is an edit request the mechanism or do we sync from their booking software's
API where one exists.

### 3.6 Forms need one small dynamic surface, and that is fine

Speed to lead under 60 seconds and a static site with no backend need reconciling. A single
Cloudflare Worker or Pages Function that validates the submission, fires the n8n or GHL webhook, and
returns is enough. Cloudflare Turnstile for spam, because a traditional captcha costs conversions in
this vertical. No database, no login, no secrets in the client bundle. Section 7's "close to zero
attack surface" holds, as long as the endpoint is rate limited.

### 3.7 One correction on the performance targets

LCP, CLS, and total blocking time can be gated in CI. INP cannot: it is a field metric that requires
real user interaction, so a lab run cannot produce a truthful number. Gating "INP under 200ms" in CI
would be a check that passes without meaning.

Recommendation: gate LCP, CLS, and TBT as pass/fail in CI with Lighthouse budgets, and measure INP
from field data once sites have traffic. The targets stay, the measurement moves to where it is real.

### 3.8 Minor data model additions

Keeping the spec's shape, plus:

- `services`: unique constraint on `(org_id, service_type)`, and `plan_tier` needs to be the thing
  the module gates on, so the tier definitions have to be settled before the module is built.
- `requests`: add `service_id`, `external_ref` (the Mission Control card), and an `edit_class` field
  distinguishing an included minor edit from scoped work. Without that field the edit policy is a
  paragraph in a contract instead of something the form enforces.
- `sites`: add `env` (preview or live) and `theme_version`, per 3.1 and 3.3.
- Billing: Section 4 wants current tier and next invoice date. That data lives in GHL or Stripe.
  Read it through the API, do not create a second copy of billing state in the portal database.

---

## 4. Plan

Two tracks. Track A is unblocked and can start immediately. Track B needs the audit.

### Track A: the static site system (start now)

The spec puts the template fifth in the build order. I would start it first, for three reasons: it
is the thing being sold, it is the only track not blocked by the audit or the open questions, and
what the website module actually shows a client is defined by what the template produces. Building
the template first de-risks the portal.

- **A1. Monorepo scaffold** in this repo, pnpm workspaces: `packages/site-theme` (the Astro theme,
  versioned per 3.1), `packages/content-schema` (Zod schemas where unique copy is a required field
  with a minimum length, so uniqueness is enforced by the type system), `tools/site-gate` (the build
  gate from 3.4), `apps/reference-site` (a working fixture client used for development).
- **A2. The theme.** Mobile first, built for someone in a parking lot. Above the fold answers
  discipline, location, and one call to action. Sticky mobile call to action bar. Schedule rendered
  from data per 3.5. Multi-step form in three steps. Real photography slots designed so unpolished
  photos read as intentional. Pricing anchor. Coach bios with credentials and lineage. Kids program
  safety and instructor background section.
- **A3. Location loop and schema.** One page per record from the content collection. JSON-LD
  components generated from the same data: `HealthClub` or `ExerciseGym` under
  `SportsActivityLocation` as primary type with `additionalType` pointing at the discipline,
  `Organization` with the full `sameAs` graph, `Course` plus `CourseInstance` for programs so the
  schedule is machine readable, `FAQPage` where it fits, `Person` for coaches.
- **A4. The gate.** Everything in 3.4, wired into GitHub Actions, deploying by `wrangler` direct
  upload to a `noindex` preview.
- **A5. SEO and performance infrastructure.** Sitemap at build, `robots.txt` and `llms.txt`,
  canonicals, redirects, data-driven internal linking including a nearby-locations block, WebP and
  AVIF conversion at build, Lighthouse budgets per 3.7.
- **A6. One real gym, end to end,** with real coaches, real class times, real cross streets. This is
  the proof, and it needs real client data from Ben before it can be honest.

A1 through A4 is the bulk of the value and is the first serious build push. A5 is mechanical. A6
waits on data.

### Track B: the portal (starts when the audit lands)

- **B1.** The written audit and the extend-versus-parallel recommendation.
- **B2.** Schema and row level security, plus the Mission Control API contract written down as
  OpenAPI, including the request sync design from 3.2.
- **B3.** Portal shell with the service dropdown, matching CI tokens exactly.
- **B4.** Website module v1, the four features in Section 4 and nothing else.
- **B5.** Provisioning endpoint callable from n8n, ending at a `noindex` preview plus a Kanban card,
  with promotion to live as a gated step per 3.3.

### On llms.txt

Cheap to add, so add it. But it should not be mistaken for the lever. Crawler adoption is thin. The
thing that actually wins AI extraction is what the spec already identifies: clean semantic markup,
a real schema graph, and answer-shaped headings. Ranking it honestly matters, because build effort
should follow the real edge.

---

## 5. Questions for Ben

1. **CI access.** Which route: repo access, opening the network policy for `ci.growth-factor.ai`, or
   the six pasted files listed in Section 1?
2. **Supabase ownership.** Is the CI database in an account Growth Factor controls? See the risk note.
3. **Mission Control.** Does it already expose an API, and can I have a base URL and token, or am I
   writing those endpoints as part of this work?
4. **Ranking and traffic source.** What does CI already use? Reuse it, do not add a second.
5. **Tier split.** What separates the lower tier from the higher tier in portal features? The module
   gates on this and I cannot guess it.
6. **Edit policy.** Recommended default: minor edits included, new pages and redesigns scoped
   separately. Confirm so the request form can enforce it via `edit_class`.
7. **Self-publishing.** Any launch client that genuinely needs it, or does the headless CMS wait for
   v2? Recommendation: v2.
8. **Domain ownership.** Recommendation: the client owns the domain and we hold DNS access. Given
   that the pitch against the competitor is that their clients own nothing, owning our clients'
   domains would undercut the story.
9. **First real client.** Which gym, how many locations, and do we have real coach, schedule, and
   photo data yet? Unique copy is a required field, so the data gates the launch.

---

## 6. Writing constraints

Section 8 is treated as a build gate, not a guideline. No em dashes or double dashes, and the banned
word list is enforced by `tools/site-gate` across generated copy, UI text, and documentation,
including this document.
