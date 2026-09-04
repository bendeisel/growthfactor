# Gym coaching program

Growth Factor's $297/month coaching offer for gyms. Teach the owner to run it,
hand them four AI systems they own, and measure the result in their own ad
account.

| File | What it is |
|---|---|
| `OFFER.md` | What $297 buys, what it does not, and why the price works |
| `curriculum.md` | Eight modules. 01 and 02 scripted in full, 03 to 08 as beats |
| `baseline-2026-09.md` | The measured "before" row, pulled live from AdKit |

## Members

| Gym | Status | Ad account | Notes |
|---|---|---|---|
| Nashville MMA Training Camp | Paying | Meta + Google | 126 leads/mo, $11.93 CPL. Site rebuilt, 16 pages in `projects/nashvillemma/site/` |
| Fighters Boxing Gym | Paying | Meta | 107 leads/mo, $12.18 CPL. Astro homepage merged in #7 |
| Furst Place MMA | Paying | Meta | 46 leads/mo, **$6.42 CPL**, best in cohort. Rebuild blocked on backup, #18 |
| Fuel Fortress Nashville | **4 months in arrears** | Meta + Google | See below |

## Fuel Fortress

Holds a membership, is four months behind, and by Ben's read is not doing well.
PR #15 is a finished homepage rebuild for them that has not shipped.

Recommendation, stated once and then it is a business decision, not a technical
one: **do not ship #15 and do not add them to the cohort until the balance is
current.** Four months at $297 is roughly $1,188 outstanding. Delivering more
work into an unpaid account makes the balance harder to collect, not easier,
because it removes the only leverage left. Offer a payment plan or a clean exit,
and keep the build on the branch either way. It stays ready.

## Open items

**1. Contract length and cohort cap.** Both in `OFFER.md`. Neither blocks
recording the modules, both block the sales page.

**2. AdKit access for members.** The idea was a shared project plus an affiliate
arrangement. Checked against the live AdKit MCP contract on 2026-09-03: there is
`studio ads share`, which produces a public brief link, and there are
workspaces, but no client-seat invite or affiliate program surfaced in the help
catalog. All five projects currently sit in one workspace, `Gym Funnel Ads`,
owned by Ben, which is enough to pull each gym's numbers and produce their
monthly report today.

So the monthly report works now. The affiliate revenue share is unverified.
Questions to put to AdKit before designing around it:

- Can a client be invited to a single project with read access, without seeing
  the rest of the workspace?
- Is there a partner or affiliate program, and does it pay on client-paid seats?
- If a member connects their own ad account, who owns the project record if they
  leave?

Do not promise members an AdKit seat until those come back.

**3. Google Ads is not in the baseline.** Connected on Nashville MMA and Fuel
Fortress, not pulled. Add before the first monthly review or the report
understates spend.

**4. Nothing has measured speed to lead.** Module 2 is built on the claim that
response time is the cheapest available win, and that claim is sound in general
but unmeasured here. First member to switch the bot on should record their
before number, even roughly, so module 2 gets a real result attached to it.

## Status

Program defined, baseline measured, modules 01 and 02 ready to record. Nothing
sold yet under the new price. No module recorded yet.
