import type { SourceId } from "@/lib/metrics/types";

export interface Business {
  id: string;
  /** Short label for the metrics column. */
  name: string;
  /** Longer descriptor, shown on hover / in tooltips. */
  kind: string;
  /**
   * Where this business's numbers come from.
   * Phase 2 confirms the exact mapping per subaccount; until then the
   * registry falls back to the mock adapter for anything unconfigured.
   */
  source: SourceId;
  /** External account identifier (GHL subaccount id, Glow Fox location id). */
  accountRef?: string;
  /** Membership businesses show active-member / past-due counts. */
  membership: boolean;
  /**
   * Ben owns it — it belongs in "My Businesses".
   * Ownership and clienthood are separate flags rather than separate lists,
   * because two of these are both: he owns the gyms *and* the agency serves
   * them. Two lists would mean maintaining the same gym twice.
   */
  owned?: boolean;
  /** The agency does done-for-you work for it — it belongs in "Client OS". */
  client?: boolean;
  /** No longer active. Kept so stored history still resolves to a name. */
  archived?: boolean;
}

export const BUSINESSES: Business[] = [
  {
    id: "nashville-mma",
    name: "Nashville MMA Training Camp",
    kind: "MMA gym — memberships",
    source: "glowfox",
    membership: true,
    owned: true,
    client: true,
  },
  {
    id: "fighters-boxing",
    name: "Fighters Boxing Gym",
    kind: "Boxing gym — memberships",
    source: "glowfox",
    membership: true,
    owned: true,
    client: true,
  },
  {
    id: "growth-factor-ai",
    name: "Growth Factor AI",
    kind: "Agency — retainers",
    source: "ghl",
    membership: false,
    owned: true,
  },
  {
    id: "fuel-fortress",
    name: "Fuel Fortress Nashville",
    kind: "Nutrition / supplements",
    source: "ghl",
    membership: false,
    client: true,
  },
  {
    id: "aeterna-club",
    name: "Aeterna Club",
    kind: "Membership club",
    source: "ghl",
    membership: true,
    archived: true,
  },
  {
    id: "furst-place-mma",
    name: "Furst Place MMA",
    kind: "MMA gym — memberships",
    source: "glowfox",
    membership: true,
    client: true,
  },
  {
    id: "drhoward-compass",
    name: "Dr. Howard's Compass",
    kind: "Coaching program",
    source: "ghl",
    membership: false,
    archived: true,
  },
];

export function getBusiness(id: string): Business | undefined {
  return BUSINESSES.find((b) => b.id === id);
}

/** The three Ben owns — the top of the rail. */
export const OWNED = BUSINESSES.filter((b) => b.owned && !b.archived);

/** The four the agency does done-for-you work for. */
export const CLIENTS = BUSINESSES.filter((b) => b.client && !b.archived);
