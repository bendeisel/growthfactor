// Buy box filtering. Applied when reading leads, never during ingest, so that
// tightening the filters later does not mean re-pulling anything.

import type { DerivedSignals, PropertyInput, Scores } from './types.ts';

export interface BuyBox {
  states?: string[];
  counties?: string[];
  minValue?: number;
  maxValue?: number;
  minEquityPercent?: number;
  minSqft?: number;
  maxSqft?: number;
  yearBuiltFloor?: number;
  minBeds?: number;
  /** Case insensitive substrings that must appear in the property type. */
  propertyTypeInclude?: string[];
  propertyTypeExclude?: string[];
  minOverallScore?: number;
  strategies?: string[];
  /** Keep leads whose equity is unknown rather than filtering them out. */
  allowUnknownEquity?: boolean;
}

export const DEFAULT_BUY_BOX: BuyBox = { allowUnknownEquity: true };

export interface Candidate {
  property: PropertyInput;
  derived: DerivedSignals;
  scores: Scores;
}

export function matchesBuyBox(c: Candidate, box: BuyBox): { pass: boolean; failed: string[] } {
  const failed: string[] = [];
  const p = c.property;
  const val = p.estimatedValue ?? p.assessedValue ?? null;
  const type = (p.propertyType ?? '').toLowerCase();

  if (box.states?.length && (!p.state || !box.states.map((s) => s.toUpperCase()).includes(p.state.toUpperCase()))) failed.push('state');
  if (box.counties?.length) {
    const c2 = (p.county ?? '').toLowerCase();
    if (!box.counties.some((x) => c2.includes(x.toLowerCase()))) failed.push('county');
  }
  if (box.minValue != null && (val == null || val < box.minValue)) failed.push('minValue');
  if (box.maxValue != null && val != null && val > box.maxValue) failed.push('maxValue');

  if (box.minEquityPercent != null) {
    const pct = c.derived.equityPercent;
    if (pct == null) { if (!box.allowUnknownEquity) failed.push('equityUnknown'); }
    else if (pct < box.minEquityPercent) failed.push('minEquityPercent');
  }

  if (box.minSqft != null && (p.sqft == null || p.sqft < box.minSqft)) failed.push('minSqft');
  if (box.maxSqft != null && p.sqft != null && p.sqft > box.maxSqft) failed.push('maxSqft');
  if (box.yearBuiltFloor != null && p.yearBuilt != null && p.yearBuilt < box.yearBuiltFloor) failed.push('yearBuiltFloor');
  if (box.minBeds != null && (p.beds == null || p.beds < box.minBeds)) failed.push('minBeds');

  if (box.propertyTypeInclude?.length && !box.propertyTypeInclude.some((t) => type.includes(t.toLowerCase()))) failed.push('propertyTypeInclude');
  if (box.propertyTypeExclude?.length && box.propertyTypeExclude.some((t) => t && type.includes(t.toLowerCase()))) failed.push('propertyTypeExclude');

  if (box.minOverallScore != null && c.scores.overallScore < box.minOverallScore) failed.push('minOverallScore');
  if (box.strategies?.length && !box.strategies.includes(c.scores.strategy)) failed.push('strategy');

  return { pass: failed.length === 0, failed };
}
