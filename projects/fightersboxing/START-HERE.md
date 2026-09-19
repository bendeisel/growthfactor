# Fighters Boxing Gym: where things stand

Three questions answered. Everything else in this folder is detail you can
ignore until you need it.

---

## 1. Is the website ready to move?

**Yes.** The finished website is packed and ready:
`fighters-website.zip`.

### The schedule blocker is closed

Your screenshot of the schedule graphic settled it. **Every class time on
the site now matches your real schedule**, and nothing on it is a guess
any more.

Six things were wrong before, all now fixed:

| | Was | Now |
| --- | --- | --- |
| Boxing Basics 6AM | Every weekday | Monday and Wednesday only |
| Boxing Basics 7AM | Every weekday | Tuesday and Thursday only |
| Intermediate Boxing | Tue and Fri (my guess) | Tuesday and Thursday, 5:45pm |
| Youth Boxing 4:30pm | Unconfirmed | Monday and Wednesday, confirmed, ages 8 to 13 |
| Saturday Open Gym | 2AM (a typo on your old site) | 9AM to 12PM |
| Competition Team | Mon and Wed | Monday, Wednesday **and Thursday** |

Two classes were also removed because they are no longer on your
schedule: **Competition Sparring** and **Foundational Sparring**. And
Friday correctly has no morning class now.

I also picked up the legend from your graphic, so the site shows **"Coach
permission required"** on Competition Team and Intermediate, and **"Ages 8
to 13"** on the youth classes. Someone reading the times sees that in the
same glance.

### Not blockers, but they make it look unfinished

| Item | What is wrong |
| --- | --- |
| **Coach photos** | The Coaches page shows initials instead of faces. The 9 photo files exist on your live site. Filenames are listed in `SEO-PLAN.md` Part 8. Send them and they go straight in. |
| **Billy Falco** | A blog post announces him as interim head coach, but he is not on the Coaches page. One of the two is out of date. |

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

1. **The 9 coach photos.** Now the biggest visible gap.
2. **Is Billy Falco a coach or not.**
3. **Confirm the domain** is `fightersnashville.com`.
4. **Google Business Profile access**, when you are ready for that stage.

Nothing on this list blocks launch. The site can go up today.

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
