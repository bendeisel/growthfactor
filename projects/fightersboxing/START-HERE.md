# Fighters Boxing Gym: where things stand

Three questions answered. Everything else in this folder is detail you can
ignore until you need it.

---

## 1. Is the website ready to move?

**Technically yes.** The finished website is packed and ready:
`fighters-website.zip`.

But there is **one thing I would not launch with:**

### The blocker

🔴 **The Intermediate Boxing class times are a guess.**

You told me "2 classes per week" but never gave days or times. I put
**Tuesday and Friday, 5:45pm** in as a placeholder. If that is wrong, the
live site is telling people to show up when there is no class.

**All I need from you: the real days and times.**

### Not blockers, but they make it look unfinished

| Item | What is wrong |
| --- | --- |
| **Coach photos** | The Coaches page shows initials instead of faces. The 9 photo files exist on your live site. Filenames are listed in `SEO-PLAN.md` Part 8. Send them and they go straight in. |
| **Billy Falco** | A blog post announces him as interim head coach, but he is not on the Coaches page. One of the two is out of date. |
| **6am and 7am Boxing Basics** | I added these because you told me they exist. Never confirmed against the real schedule. Worth a second look. |

### Genuinely optional, can follow later

Blog post images, class pricing, extra schema, the new local SEO pages.

---

## 2. How to put it on Hostinger

**You do not need the API token.** Forget it for now.

**The zip IS the website.** Upload it, unzip it, delete the zip. Done.

The full click-by-click is in **`HOSTINGER-SETUP.md`**, written plainly.
Nine steps, about 10 minutes.

### The one thing to understand

The preview link I keep sending you is **not** what gets uploaded. That
link is a special all-in-one page built for reviewing.

The real website is **25 separate pages**, and that is what is in the zip.

---

## 3. SEO

### Rank Math will not work on this site

Rank Math is a **WordPress plugin**. This new site is not WordPress, so it
cannot be installed. Telling you now so you do not go hunting for it.

**Nothing is lost.** Rank Math's entire job is prompting you to fill in a
box for every page. I already wrote all of that into the code, for all 25
pages. It now happens by itself every time the site is built.

Keep Rank Math for any site that stays on WordPress. Not this one.

### Your instinct was close, but not quite right

Astro (the tool this is built with) does **not** do SEO by magic.

- **Free from Astro:** a very fast site, and clean code search engines
  read easily.
- **I had to write:** the titles, descriptions, schema and sitemap. But
  now they maintain themselves instead of needing a dashboard.

### For comparison

Your current site has an SEO plugin installed with **every field left
blank**. All 34 pages. Zero titles, zero descriptions.

Going from that to this is the biggest cheap win you had, and it is
already banked.

### What software cannot do (this is where the leads are)

1. **Google Business Profile.** For a gym this matters more than the
   website. I would want access.
2. **Reviews.** Strongest local ranking signal, and the biggest reason
   someone picks you. Ask after every first class.
3. **Your story.** An Olympic coach who is a hall of fame inductee, a
   nonprofit running since 2001, a pro boxer on staff. Almost no gym in
   Nashville can say that, and your current site barely mentions it.

The short version is in **`SEO-SIMPLE.md`**. The full technical plan is in
**`SEO-PLAN.md`**.

### On doubling leads

Leads will most likely double from **conversion, not traffic.**

If 100 people visit and 1 calls, that is 1 lead. If the site is clearer
and 2 call, you doubled leads on identical traffic. The new site has a
popup form on every button, a real schedule, real coaches, and a clear
first-day page. That work is done.

Doubling traffic takes months. Doubling conversion can happen the day you
launch.

---

## What I need from you, in priority order

1. **Intermediate Boxing days and times.** The only real blocker.
2. **The 9 coach photos.**
3. **Is Billy Falco a coach or not.**
4. **Confirm the domain** is `fightersnashville.com`.
5. **Google Business Profile access**, when you are ready for that stage.

## Files in this folder

| File | What it is |
| --- | --- |
| `fighters-website.zip` | The actual website, ready to upload |
| `START-HERE.md` | This file |
| `HOSTINGER-SETUP.md` | Click-by-click upload steps |
| `SEO-SIMPLE.md` | SEO, one page |
| `SEO-PLAN.md` | SEO, full detail for later |
| `source/` | Every content decision logged, for handover |
| `site/` | The code |
