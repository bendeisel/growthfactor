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
  leaseOption: {
    /** Paid to the seller for the option itself. Usually credited at closing. */
    optionFeePercentOfArv: number;
    /** Gross monthly rent as a share of ARV. The old one percent rule, tempered. */
    monthlyRentPercentOfArv: number;
    /** Strike price on the option. */
    optionPricePercentOfArv: number;
    termYears: number;
    /** Share of each rent payment credited against the purchase price. */
    rentCreditPercent: number;
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
  leaseOption: {
    optionFeePercentOfArv: 0.02,
    monthlyRentPercentOfArv: 0.008,
    optionPricePercentOfArv: 1.0,
    termYears: 3,
    rentCreditPercent: 0.25,
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

export interface LeaseOptionTerms {
  optionFee: number;
  monthlyRent: number;
  optionPrice: number;
  termYears: number;
  rentCreditPerMonth: number;
  totalRentCredit: number;
  /** Left to finance at exercise, after the fee and the accrued rent credit. */
  netAtExercise: number;
}

export interface OfferEstimate {
  arvEstimate: number | null;
  repairEstimate: number | null;
  /** Cash offer ceiling: ARV times MAO percent, less repairs, less fee. */
  maxCashOffer: number | null;
  sellerFinance: SellerFinanceTerms | null;
  leaseOption: LeaseOptionTerms | null;
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
  strategy?: string,
): OfferEstimate {
  const notes: string[] = [];
  const baseValue = p.estimatedValue ?? p.assessedValue ?? null;
  if (baseValue == null) {
    return {
      arvEstimate: null, repairEstimate: null, maxCashOffer: null,
      sellerFinance: null, leaseOption: null,
      notes: ['no published value, cannot estimate an offer'],
    };
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

  const lo = cfg.leaseOption;
  const optionPrice = Math.round(arv * lo.optionPricePercentOfArv);
  const monthlyRent = Math.round(arv * lo.monthlyRentPercentOfArv);
  const rentCreditPerMonth = Math.round(monthlyRent * lo.rentCreditPercent);
  const totalRentCredit = rentCreditPerMonth * 12 * lo.termYears;
  const optionFee = Math.round(arv * lo.optionFeePercentOfArv);
  const leaseOption: LeaseOptionTerms = {
    optionFee,
    monthlyRent,
    optionPrice,
    termYears: lo.termYears,
    rentCreditPerMonth,
    totalRentCredit,
    netAtExercise: Math.max(0, optionPrice - optionFee - totalRentCredit),
  };

  if (d.equityPercent != null && d.equityPercent < 60) {
    notes.push('equity is thin, so the existing loan probably has to stay in place');
  }

  // Strategy specific guidance, because the number that matters is different for
  // each structure and the one people get wrong is subject to.
  if (strategy === 'subject_to') {
    notes.push(
      'on a subject to deal the cash you need is the ARREARS plus closing, not the price. '
      + 'A foreclosure notice usually publishes the accelerated balance, so get a written '
      + 'reinstatement quote from the servicer before you commit to a number.',
    );
    notes.push(
      'due on sale is a right the lender holds and rarely exercises while payments arrive. '
      + 'If that risk still bothers you, a lease option or a land contract keeps title with '
      + 'the seller and never triggers it.',
    );
  }
  if (strategy === 'lease_option') {
    notes.push(
      'no title transfers here, so there is nothing for a due on sale clause to catch. '
      + 'The existing loan stays in the seller name, which is why the rent has to cover it.',
    );
  }
  if (strategy === 'cash_wholesale' && (d.equityPercent ?? 0) < 40) {
    notes.push('thin equity on a cash purchase leaves little room, check for a short sale angle');
  }

  return {
    arvEstimate: arv, repairEstimate: repair, maxCashOffer: maxCash,
    sellerFinance, leaseOption, notes,
  };
}
