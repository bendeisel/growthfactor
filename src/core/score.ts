// Scoring.
//
// Two scores, deliberately kept separate:
//
//   distressScore       how much pressure the owner is under right now
//   sellerFinanceScore  how well the property fits a seller carried note
//
// They are separate because they disagree constantly. A house going to auction in
// three weeks scores high on distress and low on seller finance, because a seller
// in that spot needs cash, not payments. A free and clear absentee owner with a
// code violation is the reverse, and is the better seller finance call.

import type { DistressType, PropertyInput, Scores, Strategy } from './types.ts';
import type { DerivedSignals } from './types.ts';

const EVENT_WEIGHTS: Record<DistressType, number> = {
  foreclosure: 30,
  auction: 30,
  pre_foreclosure: 26,
  probate: 24,
  pre_probate: 22,
  tax_delinquent: 18,
  vacant: 16,
  demolition: 14,
  reo: 14,
  code_violation: 12,
  eviction: 10,
  lien: 10,
};

/** Events that mean the owner needs cash fast, which rules out carrying a note. */
const CASH_FORCING: DistressType[] = ['auction', 'foreclosure', 'reo'];

export interface ScoreEvent {
  eventType: DistressType;
  firstSeenAt: string;
  lastSeenAt: string;
  clearedAt?: string | null;
  filingDate?: string | null;
  auctionDate?: string | null;
}

function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso.length <= 10 ? `${fromIso}T00:00:00Z` : fromIso);
  const b = new Date(toIso.length <= 10 ? `${toIso}T00:00:00Z` : toIso);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 9999;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Fresh signals are worth more. A five year old lien is nearly noise. */
function recencyFactor(ev: ScoreEvent, asOf: string): number {
  if (ev.clearedAt) return 0.15;
  const age = daysBetween(ev.lastSeenAt, asOf);
  if (age <= 30) return 1;
  if (age >= 365) return Math.max(0.25, 0.4 - (age - 365) / 3650);
  return 1 - ((age - 30) / 335) * 0.6;
}

export function scoreLead(
  p: PropertyInput,
  d: DerivedSignals,
  events: ScoreEvent[],
  asOf: string = new Date().toISOString().slice(0, 10),
): Scores {
  const reasons: string[] = [];
  const active = events.filter((e) => !e.clearedAt);

  // ---- distress ----
  const bestByType = new Map<DistressType, number>();
  for (const e of events) {
    const v = (EVENT_WEIGHTS[e.eventType] ?? 8) * recencyFactor(e, asOf);
    const prev = bestByType.get(e.eventType);
    if (prev === undefined || v > prev) bestByType.set(e.eventType, v);
  }
  let distress = 0;
  for (const v of bestByType.values()) distress += v;

  const distinctActive = new Set(active.map((e) => e.eventType));
  if (distinctActive.size > 1) {
    const stack = Math.min((distinctActive.size - 1) * 8, 24);
    distress += stack;
    reasons.push(`${distinctActive.size} distress signals stacked: ${[...distinctActive].join(', ')}`);
  } else if (distinctActive.size === 1) {
    reasons.push(`distress signal: ${[...distinctActive][0]}`);
  }

  // An auction date on the calendar is the hardest deadline in this business.
  const nextAuction = active
    .map((e) => e.auctionDate)
    .filter((x): x is string => Boolean(x))
    .sort()[0];
  if (nextAuction) {
    const days = daysBetween(asOf, nextAuction);
    if (days >= 0 && days <= 60) {
      distress += 10;
      reasons.push(`auction scheduled in ${days} days`);
    }
  }
  const distressScore = Math.max(0, Math.min(100, Math.round(distress)));

  // ---- seller finance fit ----
  let sf = 0;
  const pct = d.equityPercent;
  if (pct != null) {
    if (pct >= 90) { sf += 35; reasons.push(`equity about ${Math.round(pct)} percent, owner can carry paper`); }
    else if (pct >= 70) { sf += 26; reasons.push(`equity about ${Math.round(pct)} percent`); }
    else if (pct >= 50) { sf += 16; }
    else if (pct >= 30) { sf += 8; }
  } else {
    reasons.push('equity unknown, no sale history or value published');
  }
  if (d.likelyFreeAndClear) { sf += 8; reasons.push('likely free and clear'); }

  const yrs = d.yearsOwned;
  if (yrs != null) {
    if (yrs >= 25) { sf += 15; reasons.push(`owned ${Math.round(yrs)} years`); }
    else if (yrs >= 15) sf += 11;
    else if (yrs >= 10) sf += 7;
    else if (yrs >= 5) sf += 3;
  }

  if (d.absenteeOwner) { sf += 10; reasons.push('absentee owner, mailing address differs from the property'); }
  if (d.outOfStateOwner) { sf += 6; reasons.push('owner mails out of state'); }

  if (d.ownerType === 'trust') { sf += 8; reasons.push('held in trust, often open to passive income'); }
  else if (d.ownerType === 'individual') sf += 6;
  else if (d.ownerType === 'estate') { sf += 4; reasons.push('estate or heirs on the deed, probate angle'); }
  else if (d.ownerType === 'company') sf += 2;

  if (d.estateIndicator && d.ownerType !== 'estate') reasons.push('estate language in the owner name');

  const cashForced = active.some((e) => CASH_FORCING.includes(e.eventType)) || Boolean(nextAuction);
  if (!cashForced) sf += 8;
  else reasons.push('time pressure or lender ownership makes a carried note unlikely');

  const type = (p.propertyType ?? '').toLowerCase();
  if (/single|sfr|residential|duplex|triplex|fourplex|condo|townh|multi/.test(type)) sf += 5;

  const sellerFinanceScore = Math.max(0, Math.min(100, Math.round(sf)));

  // ---- strategy ----
  let strategy: Strategy;
  const has = (t: DistressType) => distinctActive.has(t);
  // A sale already on the calendar overrides everything else. Terms need weeks of
  // negotiation and a subject to close needs a reinstatement quote and a payoff,
  // and neither fits inside a month. Cash is what closes before the gavel.
  const daysToAuction = nextAuction ? daysBetween(asOf, nextAuction) : null;
  const auctionImminent = daysToAuction != null && daysToAuction >= 0 && daysToAuction <= 45;

  if (has('reo') || has('auction')) strategy = 'cash_wholesale';
  else if (auctionImminent) strategy = 'cash_wholesale';
  else if ((has('foreclosure') || has('pre_foreclosure')) && (pct ?? 0) < 40) strategy = 'subject_to';
  else if (d.likelyFreeAndClear || (pct ?? 0) >= 70) strategy = 'seller_finance';
  else if ((pct ?? 0) >= 40) strategy = 'novation';
  else strategy = 'unclear';

  const overall = Math.round(0.55 * sellerFinanceScore + 0.45 * distressScore);
  const grade: Scores['grade'] =
    overall >= 75 ? 'A' : overall >= 60 ? 'B' : overall >= 45 ? 'C' : overall >= 30 ? 'D' : 'F';

  return {
    distressScore,
    sellerFinanceScore,
    overallScore: overall,
    grade,
    strategy,
    reasons,
  };
}
