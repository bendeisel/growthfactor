# The Edit Loop — why revisions take minutes

## The real problem

Client edits are rarely slow because the changes are hard. They are slow because:

1. Feedback arrives vague, in fragments, across email/text/calls over two weeks
2. Each item requires hunting down where it lives
3. Global-feeling changes ("less blue," "more spacing") mean touching 40 elements
4. Every round costs a context reload

The system fixes all four — three structurally, one procedurally.

---

## Structural fix: most edits are one field

Because design is tokens and content is data, incoming feedback sorts into four
buckets, and three of them are minutes:

| Bucket | Example | Where the fix lives | Time |
|---|---|---|---|
| **A. Token** | "less blue", "too cramped", "softer corners", "calm the animation" | one variable in the skin | **seconds**, propagates site-wide |
| **B. Content** | wrong phone, new testimonial, reworded headline, swap a photo | one field in `client.json`, re-inject | **1–2 min** |
| **C. Structure** | "move pricing above testimonials", "try the other hero", "drop the stats band" | reorder/swap in `layouts/`, re-assemble | **2–5 min** |
| **D. Custom** | "we need an interactive coverage map" | actual work | **hours** — quote separately |

In practice A–C is ~85–90% of feedback. That is the whole game. "Make everything a
bit less blue" is one variable here and a forty-element slog in a normal build.

**Important discipline:** when a bucket-D item appears and it is genuinely good,
build it into the *core* as a new component variant, not onto that one site. Then
client 12 gets it for free. The library should get better with every project.

---

## Procedural fix: how feedback is collected

The structural work is wasted if feedback still arrives as "hey can we chat about
the site."

**Pin feedback to the page.** Use a visual annotation layer on staging (Atarim,
Ruttl, BugHerd, or Bricks' own comment workflow) so every item is attached to the
element it refers to. This removes the entire "which section do you mean" round trip.

**One consolidated round, with a deadline.** Ship the draft with: "Review by
Thursday. Everything in one pass. We turn it around in 24 hours." Two rounds
budgeted, a third by exception. Open-ended feedback windows are what turn a
one-week project into a six-week project — and that is a scoping problem, not a
tooling problem.

**Ask directed questions.** "Any feedback?" gets you a fortnight of dribble. Instead:
*Is the headline how you'd describe yourselves to a stranger? Are these the five
services you actually want to sell? Is anything factually wrong? Is there a photo
you'd rather we used?* Directed questions produce actionable answers.

**Set expectations about taste up front.** State in the proposal that layout and
design system are fixed, content and brand are theirs. Clients who understand the
model do not ask for bucket-D changes.

---

## Triage flow

When feedback lands, Claude Code triages it before anything is touched:

1. Parse annotations/notes into a discrete item list
2. Classify each A / B / C / D
3. Apply all A items (skin), then B (client.json), then C (layout), then re-assemble
4. Re-run the QA gate
5. Reply with a per-item checklist: done, or quoted with reasoning for D items

Batch the whole round into one re-assembly rather than editing piecemeal — it is
faster and it keeps the site a clean generated artifact instead of drifting into a
hand-patched one.

---

## The one-week timeline

| Day | |
|---|---|
| Mon | Intake complete, build, gate, polish, staging link out with directed questions |
| Tue–Wed | Client reviews with annotation tool |
| Thu | Feedback due. Triage + apply + gate. Same-day turnaround. |
| Fri | Round 2 (minor). Approve. Promote. |

The week is spent waiting on the client, not working. That is correct — and it is
why one person can run many builds in parallel.
</invoke>
