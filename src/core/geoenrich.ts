// Waterfront enrichment. Local, free, and re-runnable as often as you like.

import { distanceToShapeFt, inBbox, padBbox, shapeBbox, type Shape } from './geo.ts';
import type { Store } from '../store/index.ts';

export interface EnrichWaterOptions {
  /** Parcels further than this from the water's bounding box are skipped. */
  maxMiles?: number;
  /** Distance at or under which a parcel counts as waterfront, for reporting. */
  waterfrontFt?: number;
}

export interface EnrichWaterResult {
  withCoordinates: number;
  measured: number;
  waterfront: number;
  skippedNoCoordinates: number;
}

/**
 * Measure every parcel's distance to a shoreline and store it.
 *
 * Parcels outside the padded bounding box are skipped rather than measured, which
 * keeps a county sized pull fast. A skipped parcel keeps a null distance, which
 * every waterfront filter reads as "not near this water".
 */
export async function enrichWaterDistance(
  store: Store,
  shape: Shape,
  waterbodyName: string,
  opts: EnrichWaterOptions = {},
): Promise<EnrichWaterResult> {
  const maxMiles = opts.maxMiles ?? 3;
  const waterfrontFt = opts.waterfrontFt ?? 1000;
  const searchBox = padBbox(shapeBbox(shape), maxMiles * 5280);

  const rows = await store.allForScoring();
  const result: EnrichWaterResult = {
    withCoordinates: 0, measured: 0, waterfront: 0, skippedNoCoordinates: 0,
  };

  for (const r of rows) {
    const lat = r.property.latitude;
    const lon = r.property.longitude;
    if (lat == null || lon == null) { result.skippedNoCoordinates++; continue; }
    result.withCoordinates++;
    if (!inBbox(lon, lat, searchBox)) continue;
    const ft = Math.round(distanceToShapeFt(lon, lat, shape));
    await store.setWaterDistance(r.id, ft, waterbodyName);
    result.measured++;
    if (ft <= waterfrontFt) result.waterfront++;
  }
  return result;
}
