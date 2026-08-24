// Derived signals. Everything here is computed locally from free data, so it costs
// nothing and can run over the whole database as often as you like.
//
// This module is where most of the PropStream replacement value actually lives.
// A county assessor roll already contains owner name, owner mailing address, last
// sale date and last sale amount. From those four columns you can infer absentee
// ownership, tenure, likely free and clear status, and estate ownership, which are
// the filters people pay a subscription for.

import { candidateKeys, classifyOwner, normAddress, normState } from './normalize.ts';
import type { DerivedSignals, EquityBasis, PropertyInput } from './types.ts';

/**
 * Approximate US average 30 year fixed mortgage rate by year of origination.
 * Used only to estimate a remaining loan balance when the county publishes a sale
 * price but no loan data. Values are rounded historical averages, good enough to
 * separate "probably free and clear" from "probably still leveraged".
 */
const HISTORICAL_RATES: Array<[number, number]> = [
  [1975, 0.0900], [1980, 0.1350], [1982, 0.1620], [1985, 0.1210], [1990, 0.1013],
  [1995, 0.0793], [2000, 0.0805], [2003, 0.0583], [2005, 0.0587], [2007, 0.0634],
  [2009, 0.0504], [2012, 0.0366], [2015, 0.0385], [2018, 0.0454], [2020, 0.0311],
  [2021, 0.0296], [2022, 0.0534], [2023, 0.0681], [2024, 0.0672], [2025, 0.0660],
  [2026, 0.0640],
];

function rateForYear(year: number): number {
  let rate = HISTORICAL_RATES[0]![1];
  for (const [y, r] of HISTORICAL_RATES) {
    if (year >= y) rate = r;
    else break;
  }
  return rate;
}

export interface EquityModelConfig {
  /** Assumed loan to value on the original purchase when no loan data exists. */
  assumedLtv: number;
  /** Amortization term in years for the assumed purchase loan. */
  assumedTermYears: number;
  /** Tenure at which a property is treated as free and clear regardless of math. */
  freeAndClearYears: number;
  /** Equity percent at or above which a property counts as free and clear. */
  freeAndClearEquityPercent: number;
}

export const DEFAULT_EQUITY_MODEL: EquityModelConfig = {
  assumedLtv: 0.8,
  assumedTermYears: 30,
  freeAndClearYears: 32,
  freeAndClearEquityPercent: 90,
};

/** Remaining balance on a fully amortizing loan after `monthsPaid` payments. */
export function remainingBalance(
  principal: number,
  annualRate: number,
  termMonths: number,
  monthsPaid: number,
): number {
  if (principal <= 0) return 0;
  if (monthsPaid >= termMonths) return 0;
  if (monthsPaid <= 0) return principal;
  const i = annualRate / 12;
  if (i <= 0) return Math.max(0, principal * (1 - monthsPaid / termMonths));
  const f = (1 + i) ** termMonths;
  const g = (1 + i) ** monthsPaid;
  return Math.max(0, principal * ((f - g) / (f - 1)));
}

function monthsBetween(fromIso: string, toIso: string): number {
  const a = new Date(`${fromIso}T00:00:00Z`);
  const b = new Date(`${toIso}T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
}

export interface EquityEstimate {
  estimatedEquity: number | null;
  equityPercent: number | null;
  equityBasis: EquityBasis;
  likelyFreeAndClear: boolean;
}

/**
 * Estimate equity. Prefers real loan data. Falls back to amortizing the original
 * purchase loan forward from the sale date, which is the only option with free
 * county data. The basis is always reported so nothing downstream mistakes an
 * estimate for a measurement.
 */
export function estimateEquity(
  p: PropertyInput,
  asOf: string,
  cfg: EquityModelConfig = DEFAULT_EQUITY_MODEL,
): EquityEstimate {
  const value = p.estimatedValue ?? p.assessedValue;
  const yearsOwned = p.lastSaleDate ? monthsBetween(p.lastSaleDate, asOf) / 12 : null;

  if (value != null && value > 0 && p.openMortgageBal != null) {
    const equity = value - p.openMortgageBal;
    const pct = (equity / value) * 100;
    return {
      estimatedEquity: Math.round(equity),
      equityPercent: Number(pct.toFixed(1)),
      equityBasis: 'measured',
      likelyFreeAndClear: p.openMortgageBal === 0 || pct >= cfg.freeAndClearEquityPercent,
    };
  }

  if (value != null && value > 0 && p.lastSaleDate && yearsOwned != null) {
    // Long tenure alone implies the original loan is retired.
    if (yearsOwned >= cfg.freeAndClearYears) {
      return {
        estimatedEquity: Math.round(value),
        equityPercent: 100,
        equityBasis: 'estimated_from_tenure',
        likelyFreeAndClear: true,
      };
    }
    const saleAmount = p.lastSaleAmount;
    if (saleAmount != null && saleAmount > 1000) {
      const saleYear = Number(p.lastSaleDate.slice(0, 4));
      const principal = saleAmount * cfg.assumedLtv;
      const bal = remainingBalance(
        principal,
        rateForYear(saleYear),
        cfg.assumedTermYears * 12,
        monthsBetween(p.lastSaleDate, asOf),
      );
      const equity = value - bal;
      const pct = (equity / value) * 100;
      return {
        estimatedEquity: Math.round(equity),
        equityPercent: Number(pct.toFixed(1)),
        equityBasis: 'estimated_from_tenure',
        likelyFreeAndClear: pct >= cfg.freeAndClearEquityPercent,
      };
    }
    // A recorded transfer with no price is usually a gift, an inheritance or a
    // quitclaim, none of which carry a new purchase loan.
    if (yearsOwned >= 5) {
      return {
        estimatedEquity: Math.round(value),
        equityPercent: 100,
        equityBasis: 'estimated_from_tenure',
        likelyFreeAndClear: true,
      };
    }
  }

  return {
    estimatedEquity: null,
    equityPercent: null,
    equityBasis: 'unknown',
    likelyFreeAndClear: false,
  };
}

export function derive(
  p: PropertyInput,
  asOf: string = new Date().toISOString().slice(0, 10),
  equityModel: EquityModelConfig = DEFAULT_EQUITY_MODEL,
): DerivedSignals {
  const { key, basis, keys } = candidateKeys(p);
  const owner = classifyOwner(p.ownerName);

  const situs = normAddress(p.addressLine);
  const mail = normAddress(p.ownerMailingAddress);
  let absenteeOwner: boolean | null = null;
  if (situs && mail) {
    absenteeOwner = situs !== mail;
  } else if (p.ownerMailingCity && p.city) {
    absenteeOwner = String(p.ownerMailingCity).trim().toUpperCase() !== String(p.city).trim().toUpperCase();
  }

  const mailState = normState(p.ownerMailingState);
  const propState = normState(p.state);
  const outOfStateOwner = mailState && propState ? mailState !== propState : null;

  const yearsOwned = p.lastSaleDate
    ? Number((monthsBetween(p.lastSaleDate, asOf) / 12).toFixed(1))
    : null;

  const eq = estimateEquity(p, asOf, equityModel);

  return {
    dedupeKey: key,
    dedupeBasis: basis,
    dedupeKeys: keys,
    absenteeOwner,
    outOfStateOwner,
    ownerOccupied: absenteeOwner == null ? null : !absenteeOwner,
    yearsOwned,
    ownerType: owner.ownerType,
    estateIndicator: owner.estateIndicator,
    trustIndicator: owner.trustIndicator,
    ...eq,
  };
}
