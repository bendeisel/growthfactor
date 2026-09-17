/* Sample data. Flagged in the header so nothing here reads as a live account.
   When the real wiring lands this file is what gets replaced. */

export type Dir = "up" | "down" | "warn" | "flat";
export type Tile = { name: string; value: string; delta: string; dir: Dir };
export type Kind = "good" | "warn" | "bad";

export const AGENTS = [
  { id: "bob", name: "Bob", scope: "The gyms", colour: "var(--agent-bob)", open: 2 },
  { id: "kevin", name: "Kevin", scope: "Agency", colour: "var(--agent-kevin)", open: 5 },
  { id: "stewart", name: "Stewart", scope: "Personal", colour: "var(--agent-stewart)", open: 1 },
] as const;

export type AgentId = (typeof AGENTS)[number]["id"];

export const BUSINESSES: Record<string, Tile[]> = {
  "All businesses (7)": [
    { name: "Revenue MTD", value: "$80.9K", delta: "+2% pace", dir: "up" },
    { name: "Total members", value: "1,417", delta: "+1%", dir: "up" },
    { name: "New members", value: "74", delta: "0% pace", dir: "flat" },
    { name: "Lost members", value: "33", delta: "18% pace", dir: "down" },
  ],
  "Nashville MMA": [
    { name: "Revenue MTD", value: "$18.4K", delta: "+12%", dir: "up" },
    { name: "Total members", value: "312", delta: "+7 net", dir: "up" },
    { name: "New members", value: "24", delta: "+26%", dir: "up" },
    { name: "Lost members", value: "17", delta: "+21%", dir: "down" },
  ],
  "Fighters Boxing": [
    { name: "Revenue MTD", value: "$9,625", delta: "18% behind", dir: "down" },
    { name: "Total members", value: "141", delta: "-3 net", dir: "down" },
    { name: "New members", value: "11", delta: "-31%", dir: "down" },
    { name: "Lost members", value: "14", delta: "+56%", dir: "down" },
  ],
  "Growth Factor": [
    { name: "Revenue MTD", value: "$24.2K", delta: "+8%", dir: "up" },
    { name: "Retainers", value: "6", delta: "+1", dir: "up" },
    { name: "Proposals out", value: "4", delta: "2 overdue", dir: "warn" },
    { name: "Builds live", value: "3", delta: "1 in preview", dir: "flat" },
  ],
};

export const PACE: Record<string, { name: string; pct: number; kind: Kind }[]> = {
  "All businesses (7)": [
    { name: "Revenue", pct: 2, kind: "good" }, { name: "New", pct: 0, kind: "warn" },
    { name: "Lost", pct: 18, kind: "bad" }, { name: "Members", pct: 1, kind: "good" }],
  "Nashville MMA": [
    { name: "Revenue", pct: 12, kind: "good" }, { name: "New", pct: 26, kind: "good" },
    { name: "Lost", pct: 21, kind: "bad" }, { name: "Members", pct: 2, kind: "good" }],
  "Fighters Boxing": [
    { name: "Revenue", pct: -18, kind: "bad" }, { name: "New", pct: -31, kind: "bad" },
    { name: "Lost", pct: 56, kind: "bad" }, { name: "Members", pct: -2, kind: "warn" }],
  "Growth Factor": [
    { name: "Revenue", pct: 8, kind: "good" }, { name: "New", pct: 14, kind: "good" },
    { name: "Lost", pct: 0, kind: "good" }, { name: "Members", pct: 6, kind: "good" }],
};

export const REVENUE = [
  { name: "Growth Factor AI", value: 24200, label: "$24.2K" },
  { name: "Nashville MMA Training Camp", value: 18400, label: "$18.4K" },
  { name: "Fighters Boxing Gym", value: 9625, label: "$9,625" },
  { name: "Dr. Howard's Compass", value: 9295, label: "$9,295" },
  { name: "Fuel Fortress Nashville", value: 7410, label: "$7,410" },
  { name: "Furst Place MMA", value: 6890, label: "$6,890" },
  { name: "Aeterna Club", value: 5080, label: "$5,080" },
];

export const ACCOUNTS = [
  { address: "ben@growth-factor.ai", unread: 9, reply: 3 },
  { address: "ben@nashvillemma.com", unread: 4, reply: 2 },
  { address: "grove.investing@gmail.com", unread: 1, reply: 0 },
];

export const MAIL = [
  { from: "Dedrek Sanders", subject: "Saturday seminar times", account: "nashvillemma", when: "15m", kind: "bad" as Kind },
  { from: "Lorenz", subject: "Fighters Boxing invoice, second notice", account: "growth-factor", when: "1h", kind: "warn" as Kind },
  { from: "Glofox Support", subject: "API access request #4471", account: "growth-factor", when: "3h", kind: "warn" as Kind },
  { from: "Furst Place MMA", subject: "A2P registration approved", account: "growth-factor", when: "Wed", kind: null },
  { from: "Title company", subject: "Closing docs for signature", account: "grove.investing", when: "Wed", kind: null },
];

export const GLOFOX = {
  tiles: [
    { name: "Active members", value: "1,417", delta: "+1%", dir: "up" as Dir },
    { name: "Check-ins this week", value: "1,043", delta: "+96", dir: "up" as Dir },
    { name: "Classes run", value: "58", delta: "3 cancelled", dir: "warn" as Dir },
    { name: "Avg class size", value: "11.4", delta: "+0.8", dir: "up" as Dir },
  ],
  recon: [
    { metric: "Locations", ghl: "4", glofox: "4", kind: "good" as Kind },
    { metric: "New members", ghl: "11", glofox: "14", kind: "bad" as Kind },
    { metric: "Transactions", ghl: "1,284", glofox: "1,284", kind: "good" as Kind },
    { metric: "Lapsed", ghl: "23", glofox: "19", kind: "warn" as Kind },
  ],
  classes: [
    { name: "Mon 6:00am Boxing", booked: 18, cap: 22 },
    { name: "Mon 6:00pm MMA", booked: 24, cap: 26 },
    { name: "Tue 6:00pm Sparring", booked: 9, cap: 20 },
    { name: "Wed 6:00am Boxing", booked: 15, cap: 22 },
    { name: "Wed 6:00pm BJJ", booked: 21, cap: 24 },
    { name: "Sat 10:00am Kids", booked: 27, cap: 30 },
  ],
};

export const SESSIONS = [
  { name: "Command Center, GHL adapter", tool: "CLAUDE CODE", when: "now", agent: "kevin" },
  { name: "Glofox reconciliation, four locations", tool: "CLAUDE CODE", when: "12m", agent: "kevin" },
  { name: "Nashville MMA site rebuild", tool: "COWORK", when: "1h", agent: "bob" },
  { name: "Fighters Boxing class schedule", tool: "TERMINAL", when: "1h", agent: "bob" },
  { name: "Ads audit, Fuel Fortress", tool: "CHATGPT AGENT", when: "3h", agent: "kevin" },
  { name: "Weekly client reporting run", tool: "CLAUDE PROJECTS", when: "Wed", agent: "kevin" },
  { name: "Grove Investing, closing checklist", tool: "TERMINAL", when: "Wed", agent: "stewart" },
];

export const ATTENTION = [
  { kind: "bad" as Kind, text: "Fighters Boxing revenue 18% behind last month's pace, lost members up 56%." },
  { kind: "bad" as Kind, text: "Glofox and GHL disagree on new members, 11 against 14. The gap is re-joins." },
  { kind: "warn" as Kind, text: "Furst Place map rank slipped 3 to 7 in Bellevue." },
];

export type Line = { kind: "tool" | "gate" | "bot" | "you"; text: string };
export const SCRIPTS: Record<string, { app: string; state: string; lines: Line[] }> = {
  "Which business is furthest behind pace?": {
    app: "Reports", state: "Comparing pace",
    lines: [
      { kind: "tool", text: "pace_compare across 7 businesses" },
      { kind: "bot", text: "Fighters Boxing Gym, and it is not close.\n\nRevenue 18% behind, new members down 31%, lost members up 56%. The other six sit within 8% either way." },
    ],
  },
  "Open my email, everything unread.": {
    app: "Superhuman", state: "Reading three accounts",
    lines: [
      { kind: "tool", text: "list_threads across 3 accounts" },
      { kind: "bot", text: "Fourteen unread, five waiting on you.\n\nThe one that matters is Dedrek asking about Saturday seminar times. Parents are waiting on him, he is waiting on you." },
    ],
  },
  "Show me Glofox and where it disagrees with GHL.": {
    app: "Glofox", state: "Reconciling two systems",
    lines: [
      { kind: "tool", text: "glofox_members, ghl_contacts" },
      { kind: "bot", text: "Two rows disagree.\n\nNew members: GHL says 11, Glofox says 14. Glofox counts a returning member as new, GHL does not. Lapsed is off by four for the same reason.\n\nWhich definition do you want on the wall?" },
    ],
  },
  "Draft the reply to Dedrek about Saturday.": {
    app: "Superhuman", state: "Drafting",
    lines: [
      { kind: "tool", text: "get_thread, Saturday seminar times" },
      { kind: "gate", text: "create_or_update_draft, waiting on your approval" },
      { kind: "bot", text: "Draft is ready. It confirms the 10am move and asks him to give parents a week of notice.\n\nIt will not send until you approve." },
    ],
  },
};

export const kindColour = (k: Kind | null) =>
  k === "good" ? "var(--good)" : k === "bad" ? "var(--bad)" : k === "warn" ? "var(--warn)" : "var(--line)";
