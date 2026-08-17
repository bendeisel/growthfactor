# Questions for David: CI platform audit

Context for David: we are adding a client-facing Websites module alongside CI's SEO module. The
first decision is whether we extend CI or build a second app beside it. Extending is strongly
preferred, because it means one login, one request queue, one system. Your answers decide it.

Each question notes what it decides on our side, so you can tell which ones matter and which are
just record keeping. Short answers are fine. Anywhere the honest answer is "not really" or "it was
hardcoded to ship", say that, because a wrong assumption on our side costs more than an unfinished
feature on yours.

---

## A. Auth and tenancy

**A1. What auth provider does CI use?** Supabase Auth, Clerk, Auth0, NextAuth, or something custom?

> Decides: whether the new module can sit behind the same login, which is the one thing a client
> must never see broken.

Answer:

**A2. Is tenancy enforced in the database or in application code?** Concretely: are there Postgres
row level security policies on the client-facing tables, or does the app add a `where org_id = ...`
filter in its queries?

> Decides: how much we trust the existing boundary. App-level filtering is not disqualifying, but it
> changes the review we do before pointing a second module at the same data.

Answer:

**A3. Can one client organisation have several user accounts,** each logging in separately? Or is it
currently one login per client?

> Decides: whether the `organizations` plus `users` split already exists or we are introducing it.

Answer:

**A4. Is there any role concept?** Anything distinguishing a client user from agency staff, even if
it is just a boolean or an email domain check.

> Decides: whether agency staff can use the same app to see across clients, or we need a separate
> internal view.

Answer:

**A5. How does a client get created today?** Fully manual, a script, a form, or automated?

> Decides: where our automated provisioning hooks in, and whether it replaces or wraps what exists.

Answer:

---

## B. Data layer

**B1. What database, and where does it live?** If Supabase, which account or organisation owns the
project? We ask because the Growth Factor Supabase organisation currently shows no projects in it,
so we cannot see it from our side.

> Decides: whether the portal is built on infrastructure the company controls. This is the one
> question with a business answer rather than a technical one.

Answer:

**B2. Is there already a `clients` or `organizations` table?** If yes, paste the column list.

Answer:

**B3. Is there any concept of services or subscriptions a client has,** or is CI SEO-only with the
functionality hardcoded?

> Decides: whether we add a `services` table or extend something that exists. Also tells us whether
> a service selector dropdown is a new idea or a partly built one.

Answer:

**B4. Is there any requests, tickets, or tasks table** where client requests land today? If clients
currently request changes by email or WhatsApp, that is the answer we need to hear.

> Decides: whether we are creating the shared request queue or unifying two of them.

Answer:

---

## C. Frontend and design

**C1. Framework and version.** Next.js and which router, Vite plus React, Remix, something else?

Answer:

**C2. Styling system.** Tailwind, CSS modules, styled-components? And is there a component library
underneath, such as shadcn/ui, Radix, Mantine, or MUI?

> Decides: whether the new module can reuse your components directly or has to match them by hand.

Answer:

**C3. Is there a shared layout or shell component** that wraps every page, with the SEO screens
plugged into it? Or is the SEO functionality part of the layout itself?

> Decides: extend versus parallel, more than any other single question. A separable shell means we
> add a module. An entangled one means a rewrite we would rather avoid.

Answer:

**C4. Design tokens.** The new module has to be visually indistinguishable from CI, so we need the
real values rather than our approximation of them. Whichever of these exists, pasted verbatim is
ideal:

- the `theme` or `theme.extend` block from `tailwind.config.*`
- or the CSS custom properties block, usually the `:root` and dark variants in the global stylesheet
- the font stack, including how fonts are loaded
- border radius scale, shadow values, and the spacing scale if it is customised
- whether there is a dark mode, and how it is toggled

Answer:

---

## D. Deployment

**D1. Where is CI hosted?** Vercel, Cloudflare, Netlify, the VPS?

Answer:

**D2. What is the deploy pipeline?** Push to a branch and it ships, a GitHub Action, or manual?

Answer:

**D3. Are there staging or preview environments,** and is there a way to point a branch at a test
database?

> Decides: whether we can build and review the new module without touching live client data.

Answer:

---

## E. SEO and ranking data

**E1. Where does CI get its ranking and traffic data?** Google Search Console API, DataForSEO,
SerpApi, Ahrefs, something scraped, or manual entry?

> Decides: what powers the performance snapshot in the Websites module. We reuse your source rather
> than adding a second one, so this is a straight reuse question.

Answer:

**E2. How is that data stored and refreshed?** A cron or scheduled job writing to a table, or fetched
live per request? Any rate limits or per-seat costs we should know about before a second module
starts reading it?

Answer:

---

## F. Your own read

**F1. If we add a Websites module to CI, what breaks first?** You know where the shortcuts are. This
is the most useful answer on the page.

Answer:

**F2. Would you extend CI or build beside it,** and why?

Answer:

---

## Fastest path, if you would rather not write prose

Six files answer most of the above, and we can read the rest from them:

1. `package.json`
2. the migrations or schema directory, or a schema dump
3. `tailwind.config.*` or the global stylesheet with the token definitions
4. the auth middleware or route protection layer
5. the root layout component
6. one representative page component from the SEO module

Read access to the repository is better still, since it means no back and forth at all.
