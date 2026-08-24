// Named markets.
//
// A market is a place you actually work, which rarely lines up with a single
// county boundary. Old Hickory Lake touches five counties and only the shoreline
// matters. Spring Hill straddles a county line. "The Pegram area" includes the
// unincorporated land around Pegram that a city name match would miss.

import { haversineMiles } from './geo.ts';

export interface MarketCounty {
  name?: string;
  state?: string;
  fips?: string;
}

export interface MarketNear {
  lat: number;
  lon: number;
  radiusMiles: number;
}

export interface MarketWaterfront {
  waterbody: string;
  maxDistanceFt: number;
}

export interface Market {
  name: string;
  label?: string;
  counties?: MarketCounty[];
  cities?: string[];
  near?: MarketNear;
  waterfront?: MarketWaterfront;
  notes?: string[];
}

/** The subset of a lead a market test needs. */
export interface MarketSubject {
  county?: string;
  state?: string;
  fips?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  distanceToWaterFt?: number;
  waterbodyName?: string;
}

const norm = (s: string | undefined): string =>
  (s ?? '').toLowerCase().replace(/\s+county$/, '').trim();

function countyMatches(subject: MarketSubject, counties: MarketCounty[]): boolean {
  for (const c of counties) {
    if (c.fips && subject.fips && String(subject.fips).replace(/\D/g, '') === c.fips) return true;
    if (c.name && norm(subject.county) === norm(c.name)) {
      // A county name alone can repeat across states, so check state when both know it.
      if (c.state && subject.state && c.state.toUpperCase() !== subject.state.toUpperCase()) continue;
      return true;
    }
  }
  return false;
}

/**
 * Test a lead against a market.
 *
 * `cities` and `near` are ORed with each other and ANDed with everything else, so
 * a parcel just outside the town limits but inside the radius still counts, and so
 * does one the assessor labels with the town but which sits outside the circle.
 */
export function marketMatches(subject: MarketSubject, market: Market): { pass: boolean; failed: string[] } {
  const failed: string[] = [];

  if (market.counties?.length && !countyMatches(subject, market.counties)) {
    failed.push('county');
  }

  const hasPlaceRule = Boolean(market.cities?.length || market.near);
  if (hasPlaceRule) {
    let placeOk = false;
    if (market.cities?.length) {
      const city = norm(subject.city);
      if (city && market.cities.some((c) => norm(c) === city)) placeOk = true;
    }
    if (!placeOk && market.near && subject.latitude != null && subject.longitude != null) {
      const miles = haversineMiles(subject.latitude, subject.longitude, market.near.lat, market.near.lon);
      if (miles <= market.near.radiusMiles) placeOk = true;
    }
    if (!placeOk) failed.push('place');
  }

  if (market.waterfront) {
    const d = subject.distanceToWaterFt;
    if (d == null) failed.push('waterDistanceUnknown');
    else if (d > market.waterfront.maxDistanceFt) failed.push('waterfront');
    else if (
      subject.waterbodyName
      && norm(subject.waterbodyName) !== norm(market.waterfront.waterbody)
      // Allow a slug to match a label, for example old-hickory-lake and Old Hickory Lake.
      && subject.waterbodyName.toLowerCase().replace(/[^a-z]/g, '')
        !== market.waterfront.waterbody.toLowerCase().replace(/[^a-z]/g, '')
    ) {
      failed.push('differentWaterbody');
    }
  }

  return { pass: failed.length === 0, failed };
}

export function findMarket(markets: Market[], name: string): Market {
  const hit = markets.find((m) => m.name.toLowerCase() === name.toLowerCase());
  if (!hit) {
    throw new Error(`unknown market "${name}". Available: ${markets.map((m) => m.name).join(', ')}`);
  }
  return hit;
}
