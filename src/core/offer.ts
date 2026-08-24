// Offer math.
//
// Nothing here sends anything. It produces numbers to review. The build spec is
// explicit that no offer ever fires automatically, and the percentages below are
// placeholders that need to be replaced with the real buy criteria before any of
// these figures are quoted to a seller.

import type { DerivedSignals, PropertyInput } from './types.ts';

export interface OfferConfig {
  /** Multiplier from published value to after repair value. Assessor values often lag market. */
  arvMultiplier: number;
  /** Cash maximum allowable offer as a share of ARV, before repairs and fee. */
  maoPercentOfArv: number;
  /** Rough repair budget per square foot when no inspection exists. */
  repairPerSqft: number;
  /** Minimum repair allowance for any property. */
  repairFloor: number;
  assignmentFee: number;
  sellerFinance: {
    /** Seller financed price as a share of ARV. Terms buy price, so this runs higher. */
    pricePercentOfArv: number;
    downPercent: number;
    ratePercent: number;
    amortYears: number;
    balloonYears: number;
  };
}

export const DEFAULT_OFFER_CONFIG: OfferConfig = {
  arvMultiplier: 1.0,
  maoPercentOfArv: 0.7,
  repairPerSqft: 25,
  repairFloor: 5000,
  assignmentFee: 10000,
  sellerFinance: {
    pricePercentOfArv: 0.95,
    downPercent: 0.1,
    ratePercent: 5,
    amortYears: 30,
    balloonYears: 7,
  },
};

export interface SellerFinanceTerms {
  price: number;
  downPayment: number;
  notePrincipal: number;
  ratePercent: number;
  amortYears: number;
  monthlyPrincipalAndInterest: number;
  balloonYears: number;
  balloonBalance: number;
}

export interface OfferEstimate {
  arvEstimate: number | null;
  repairEstimate: number | null;
  /** Cash offer ceiling: ARV times MAO percent, less repairs, less fee. */
  maxCashOffer: number | null;
  sellerFinance: SellerFinanceTerms | null;
  /** Cash the seller nets at closing under the seller financed structure. */
  notes: string[];
}

function monthlyPayment(principal: number, annualRatePercent: number, years: number): number {
  const i = annualRatePercent / 100 / 12;
  const n = years * 12;
  if (principal <= 0 || n <= 0) return 0;
  if (i === 0) return principal / n;
  return (principal * i) / (1 - (1 + i) ** -n);
}

function balanceAfter(principal: number, annualRatePercent: number, years: number, afterYears: number): number {
  const i = annualRatePercent / 100 / 12;
  const n = years * 12;
  const m = Math.min(afterYears * 12, n);
  if (principal <= 0) return 0;
  if (i === 0) return Math.max(0, principal * (1 - m / n));
  const f = (1 + i) ** n;
  const g = (1 + i) ** m;
  return Math.max(0, principal * ((f - g) / (f - 1)));
}

export function computeOffer(
  p: PropertyInput,
  d: DerivedSignals,
  cfg: OfferConfig = DEFAULT_OFFER_CONFIG,
): OfferEstimate {
  const notes: string[] = [];
  const baseValue = p.estimatedValue ?? p.assessedValue ?? null;
  if (baseValue == null) {
    return { arvEstimate: null, repairEstimate: null, maxCashOffer: null, sellerFinance: null, notes: ['no published value, cannot estimate an offer'] };
  }
  if (p.estimatedValue == null && p.assessedValue != null) {
    notes.push('value is an assessed value, not a market estimate, so ARV is soft');
  }
  notes.push('ARV is derived from published value, not from comps. Pull comps before quoting.');

  const arv = Math.round(baseValue * cfg.arvMultiplier);
  const repair = Math.round(Math.max(cfg.repairFloor, (p.sqft ?? 0) * cfg.repairPerSqft));
  if (!p.sqft) notes.push('no square footage published, repair estimate is the floor value only');

  const maxCash = Math.round(arv * cfg.maoPercentOfArv - repair - cfg.assignmentFee);

  const s = cfg.sellerFinance;
  const price = Math.round(arv * s.pricePercentOfArv);
  const down = Math.round(price * s.downPercent);
  const principal = price - down;
  const sellerFinance: SellerFinanceTerms = {
    price,
    downPayment: down,
    notePrincipal: principal,
    ratePercent: s.ratePercent,
    amortYears: s.amortYears,
    monthlyPrincipalAndInterest: Math.round(monthlyPayment(principal, s.ratePercent, s.amortYears)),
    balloonYears: s.balloonYears,
    balloonBalance: Math.round(balanceAfter(principal, s.ratePercent, s.amortYears, s.balloonYears)),
  };

  if (d.equityPercent != null && d.equityPercent < 60) {
    notes.push('equity is thin, a seller carry may require the existing loan to stay in place');
  }

  return { arvEstimate: arv, repairEstimate: repair, maxCashOffer: maxCash, sellerFinance, notes };
}
