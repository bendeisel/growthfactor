# -*- coding: utf-8 -*-
"""The feature catalog. Single source for the homepage index and features page."""

ICONS = {
    "pipeline": '<path d="M3 6h18M3 12h12M3 18h6"/>',
    "funnel":   '<path d="M3 4h18l-7 8v7l-4 2v-9L3 4z"/>',
    "form":     '<rect x="4" y="3" width="16" height="18"/><path d="M8 8h8M8 12h8M8 16h4"/>',
    "chat":     '<path d="M4 4h16v12H9l-5 4V4z"/><path d="M8 9h8M8 12.5h5"/>',
    "calendar": '<rect x="3" y="5" width="18" height="16"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    "phone":    '<path d="M6 3h4l2 5-2.5 1.5a12 12 0 0 0 5 5L16 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z"/>',
    "mail":     '<rect x="3" y="5" width="18" height="14"/><path d="M3 6l9 7 9-7"/>',
    "flow":     '<rect x="3" y="3" width="6" height="6"/><rect x="15" y="15" width="6" height="6"/><path d="M9 6h6v9M6 9v6h9"/>',
    "agent":    '<rect x="5" y="7" width="14" height="12"/><path d="M12 3v4M9 12h.01M15 12h.01M9.5 16h5"/>',
    "super":    '<rect x="9" y="9" width="6" height="6"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3 3M18 18l-3-3M18 6l-3 3M6 18l3-3"/>',
    "star":     '<path d="M12 3l2.7 5.9 6.3.7-4.7 4.3 1.3 6.3L12 17l-5.6 3.2 1.3-6.3L3 9.6l6.3-.7L12 3z"/>',
    "course":   '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M7 10v5c0 1.5 2.4 3 5 3s5-1.5 5-3v-5"/>',
    "card":     '<rect x="2" y="5" width="20" height="14"/><path d="M2 10h20M6 15h4"/>',
    "chart":    '<path d="M3 21h18"/><rect x="5" y="12" width="3.5" height="6"/><rect x="10.5" y="7" width="3.5" height="11"/><rect x="16" y="3" width="3.5" height="15"/>',
    "social":   '<circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="6" r="2.6"/><circle cx="18" cy="18" r="2.6"/><path d="M8.4 10.8l7.2-3.6M8.4 13.2l7.2 3.6"/>',
    "site":     '<rect x="3" y="4" width="18" height="16"/><path d="M3 9h18M6.5 6.5h.01M9.5 6.5h.01"/>',
    "list":     '<path d="M4 6h16M4 12h16M4 18h16"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
    "shield":   '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
}

# id, cat, icon, name, sub, body, uses[]
FEATURES = [
 ("crm", "capture", "pipeline", "CRM &amp; Pipelines",
  "Every lead, every stage, one board you can actually read.",
  "A drag-and-drop board of every deal you have open. Stages you name yourself, "
  "cards that carry the whole history &mdash; every text, call, email, form fill "
  "and payment attached to the person, not scattered across four apps. Move a card "
  "and an automation can fire: the estimate goes out, the reminder queues, the "
  "review request waits for the job to close.",
  ["Unlimited contacts", "Custom stages", "Full activity history", "Smart lists"]),

 ("forms", "capture", "form", "Forms, Surveys &amp; Quizzes",
  "Ask the qualifying questions before you ever pick up the phone.",
  "Build a form, a multi-step survey or a scored quiz and drop it on any page, "
  "funnel or website &mdash; yours or not. Conditional logic branches the questions "
  "based on what they answered, so a tyre-kicker and a ready buyer get different "
  "paths. Every submission lands on the contact record and can start a workflow "
  "the same second.",
  ["Conditional logic", "Multi-step", "Embeddable anywhere", "Instant notifications"]),

 ("funnels", "convert", "funnel", "Funnels &amp; Landing Pages",
  "Build the page, the upsell and the thank-you in an afternoon.",
  "A visual builder for the pages that actually take money: opt-ins, VSLs, "
  "application pages, order forms with order bumps and one-click upsells. Start "
  "from a template, swap the copy and the photos, point your domain at it. "
  "Split-test two versions and the platform tells you which one earns more, "
  "not which one gets more clicks.",
  ["Drag-and-drop", "A/B split tests", "Order bumps", "One-click upsells"]),

 ("sites", "convert", "site", "Websites &amp; Blogs",
  "A real site on your own domain, not a page on someone else&rsquo;s.",
  "Full multi-page websites with navigation, blogs and a proper mobile layout, "
  "hosted and SSL-secured. Same builder as the funnels, so anything you learn "
  "once works everywhere. Point an existing domain at it or buy one inside the "
  "platform.",
  ["Custom domains", "Free SSL", "Blog", "Mobile layouts"]),

 ("chat", "capture", "chat", "Conversations &mdash; SMS, Email, DM, WhatsApp",
  "One inbox for every channel a customer might reach you on.",
  "Text messages, emails, Facebook and Instagram DMs, Google Business chat and "
  "WhatsApp all land in a single threaded inbox on your phone and desktop. Reply "
  "from anywhere and it goes back out on the channel they used. Snippets and "
  "saved replies for the questions you answer forty times a week.",
  ["Unified inbox", "Mobile app", "Saved replies", "Missed-call text-back"]),

 ("phone", "capture", "phone", "Phone System &amp; Call Tracking",
  "Your number, your recordings, your attribution.",
  "Buy tracking numbers inside the platform, route calls to whoever should pick "
  "up, record and transcribe them, and see exactly which ad or page produced the "
  "call. Missed calls text back automatically &mdash; the single highest-return "
  "automation most local businesses ever turn on. Power dialer for the list you "
  "need to work through today.",
  ["Call recording", "Transcription", "Power dialer", "Missed-call text-back"]),

 ("calendar", "convert", "calendar", "Calendars &amp; Booking",
  "They book themselves, and then they actually show up.",
  "Round-robin or single-host calendars that respect your real availability, "
  "buffer times and service durations. Confirmations, reminders and reschedule "
  "links go out by text and email on a schedule you set. No-shows drop into a "
  "recovery workflow instead of into a hole.",
  ["Round-robin", "Reminder sequences", "Google/Outlook sync", "No-show recovery"]),

 ("email", "convert", "mail", "Email Marketing",
  "Broadcasts, sequences and the deliverability to land them.",
  "Design an email once, send it to a filtered segment, and watch opens, clicks "
  "and replies come back onto the contact record. Long-running nurture sequences "
  "run in the background for the people who said &ldquo;not right now&rdquo; nine "
  "months ago and are ready today.",
  ["Broadcasts", "Nurture sequences", "Segments", "Templates"]),

 ("workflows", "automate", "flow", "Workflow Automation",
  "The if-this-then-that engine everything else plugs into.",
  "A visual canvas where a trigger (form filled, stage moved, call missed, tag "
  "added, date reached) fires a chain of actions: send the text, wait two days, "
  "check if they replied, branch, assign the task, update the pipeline, ping "
  "you on Slack. This is the part that replaces a part-time admin, and it is the "
  "single thing we most enjoy teaching people to build.",
  ["Visual builder", "Branching logic", "Wait &amp; goal steps", "Webhooks"]),

 ("agents", "intelligence", "agent", "AI Agents",
  "A conversation that qualifies and books while you sleep.",
  "Point an agent at a channel and give it your offer, your tone and your rules. "
  "It answers in seconds, asks the qualifying questions, handles the predictable "
  "objections, and books onto your calendar &mdash; then hands the thread to a "
  "human the moment it hits something it shouldn&rsquo;t decide. Voice agents "
  "answer the phone the same way.",
  ["Conversation AI", "Voice agents", "Human handoff", "Trained on your offer"]),

 ("super", "intelligence", "super", "Super Agents",
  "An agent that runs other agents, with memory of the whole record.",
  "Where a single agent handles one conversation, a super agent coordinates the "
  "system: it reads the full contact history, decides which sequence a person "
  "belongs in, spins up the right agent for the job, rewrites the follow-up when "
  "the first one didn&rsquo;t land, reorders your day by who is actually close to "
  "buying, and escalates the handful worth your personal call. You build it in the "
  "same workflow canvas &mdash; or we build it for you.",
  ["Multi-step reasoning", "Full-record memory", "Agent orchestration", "Priority scoring"]),

 ("content", "intelligence", "list", "AI Content &amp; Creative",
  "Draft the ad, the email and the landing copy without staring at a blank box.",
  "Generate ad angles, subject lines, SMS copy, landing page sections and social "
  "captions from a description of your offer &mdash; then edit them, because the "
  "edit is where the money is. Built into the same editors you were already using, "
  "not a separate tab you forget about.",
  ["Ad copy", "Email &amp; SMS", "Page sections", "Image generation"]),

 ("reviews", "monetize", "star", "Reputation &amp; Reviews",
  "Ask at the right moment and the stars take care of themselves.",
  "Trigger a review request by text and email the moment a job closes or an "
  "appointment completes, route the happy ones to Google and Facebook, and catch "
  "the unhappy ones privately first. Reply to every review from the same inbox as "
  "everything else.",
  ["Google &amp; Facebook", "Automated requests", "Reply from inbox", "Review widgets"]),

 ("social", "monetize", "social", "Social Planner",
  "Plan the month once instead of panicking every morning.",
  "Schedule and publish to Facebook, Instagram, Google Business, LinkedIn, TikTok "
  "and YouTube from a single calendar view. Bulk-load a month, watch the engagement "
  "land back in the same reporting as everything else.",
  ["Multi-channel", "Calendar view", "Bulk scheduling", "Engagement tracking"]),

 ("courses", "monetize", "course", "Courses, Memberships &amp; Communities",
  "Sell what you know, on the same platform that sells what you do.",
  "Host video courses, drip the lessons, gate them behind a payment or a "
  "membership tier, and run a community space alongside. Unlimited students, and "
  "the same contact record follows them from lead to buyer to member.",
  ["Unlimited courses", "Drip content", "Membership tiers", "Communities"]),

 ("payments", "monetize", "card", "Payments, Invoices &amp; Subscriptions",
  "Take the money in the same place you made the promise.",
  "Connect Stripe, PayPal, Square or NMI and send invoices, take deposits, run "
  "subscriptions and build estimates that convert into invoices with one click. "
  "Text a payment link mid-conversation and watch it clear before they leave the "
  "driveway.",
  ["Invoices &amp; estimates", "Subscriptions", "Text-to-pay", "Coupons"]),

 ("reporting", "measure", "chart", "Reporting &amp; Attribution",
  "Which ad made which dollar, without a spreadsheet.",
  "Dashboards for pipeline value, appointment volume, call outcomes, campaign "
  "performance and agent activity &mdash; with source attribution that follows a "
  "lead from the first ad click through to the payment. Scheduled reports land in "
  "your inbox so you look at them.",
  ["Attribution", "Pipeline value", "Call reporting", "Scheduled emails"]),

 ("access", "measure", "shield", "Users, Permissions &amp; Ownership",
  "Your account, your data, your logins &mdash; on day one.",
  "Add your team with the permissions each of them should have, keep an audit "
  "trail of who changed what, and export everything whenever you want. Nothing "
  "about your business is held hostage inside our account, because it was never "
  "in our account.",
  ["Unlimited users", "Role permissions", "Full export", "Your domains"]),
]

CATEGORIES = [
    ("capture",      "Capture",      "Get the lead, and get to them first.",
     "Everything that turns attention into a name, a number and a conversation."),
    ("convert",      "Convert",      "Turn the conversation into a booking.",
     "Pages, calendars and follow-up that move a lead to a scheduled, paid outcome."),
    ("automate",     "Automate",     "Do it once. Let it run forever.",
     "The engine underneath the whole platform &mdash; and the skill we most want you to have."),
    ("intelligence", "Intelligence", "Agents, Super Agents and creative.",
     "The AI layer. Included at $100, not sold as a tier on top of it."),
    ("monetize",     "Monetize",     "Get paid, get reviewed, get referred.",
     "The things that happen after someone says yes, and make the next yes easier."),
    ("measure",      "Measure",      "Know what worked.",
     "Attribution, reporting and the fact that all of it belongs to you."),
]

# Which features surface on the homepage index
HOME_IDS = ["crm", "funnels", "workflows", "agents", "super", "chat", "calendar", "reviews"]
