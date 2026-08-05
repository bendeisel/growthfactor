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
}

export const BUSINESSES: Business[] = [
  {
    id: "nashville-mma",
    name: "Nashville MMA Training Camp",
    kind: "MMA gym — memberships",
    source: "glowfox",
    membership: true,
  },
  {
    id: "fighters-boxing",
    name: "Fighters Boxing Gym",
    kind: "Boxing gym — memberships",
    source: "glowfox",
    membership: true,
  },
  {
    id: "growth-factor-ai",
    name: "Growth Factor AI",
    kind: "Agency — retainers",
    source: "ghl",
    membership: false,
  },
  {
    id: "fuel-fortress",
    name: "Fuel Fortress Nashville",
    kind: "Nutrition / supplements",
    source: "ghl",
    membership: false,
  },
  {
    id: "aeterna-club",
    name: "Aeterna Club",
    kind: "Membership club",
    source: "ghl",
    membership: true,
  },
  {
    id: "furst-place-mma",
    name: "Furst Place MMA",
    kind: "MMA gym — memberships",
    source: "glowfox",
    membership: true,
  },
  {
    id: "drhoward-compass",
    name: "Dr. Howard's Compass",
    kind: "Coaching program",
    source: "ghl",
    membership: false,
  },
];

export function getBusiness(id: string): Business | undefined {
  return BUSINESSES.find((b) => b.id === id);
}
