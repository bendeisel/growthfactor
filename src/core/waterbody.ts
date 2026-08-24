// Shoreline data.
//
// The shoreline is the one input the waterfront filter cannot derive from an
// assessor roll, so it is fetched once and cached to disk. USGS NHD is the
// authoritative free source for US inland water.
//
// The NHD layer index for waterbodies was not verifiable when this was written, so
// nothing here depends on knowing it. The fetch walks a list of candidate layers,
// queries each one by bounding box rather than by field name, and filters the
// returned features on any attribute that mentions the lake. That way it works
// without knowing the schema, and when it cannot find the name it reports what it
// did find instead of failing silently.

import { qs, type HttpClient } from './http.ts';
import { shapeBbox, toShape, vertexCount, type Bbox, type Ring, type Shape } from './geo.ts';

export interface WaterbodyCandidate {
  service: string;
  layers: number[];
  note?: string;
}

export interface WaterbodySource {
  name: string;
  label?: string;
  nameFields?: string[];
  match: string;
  candidates: WaterbodyCandidate[];
  bbox?: Bbox;
}

export interface FetchOutcome {
  shape: Shape | null;
  layerUsed?: string;
  featureCount: number;
  vertices: number;
  bbox?: Bbox;
  /** Distinct names seen in the search area, for when the match found nothing. */
  namesSeen: string[];
  attempts: Array<{ layer: string; features: number; matched: number; error?: string }>;
}

interface RawFeature {
  attributes?: Record<string, unknown>;
  properties?: Record<string, unknown>;
  geometry?: unknown;
}

function attrsOf(f: RawFeature): Record<string, unknown> {
  return f.attributes ?? f.properties ?? {};
}

/** Does any string attribute mention the target name. */
function mentions(f: RawFeature, needle: string, nameFields?: string[]): boolean {
  const want = needle.toLowerCase();
  const attrs = attrsOf(f);
  if (nameFields?.length) {
    for (const k of nameFields) {
      const v = attrs[k];
      if (typeof v === 'string' && v.toLowerCase().includes(want)) return true;
    }
  }
  for (const v of Object.values(attrs)) {
    if (typeof v === 'string' && v.toLowerCase().includes(want)) return true;
  }
  return false;
}

function namesOf(f: RawFeature, nameFields?: string[]): string[] {
  const attrs = attrsOf(f);
  const out: string[] = [];
  const keys = nameFields?.length
    ? nameFields
    : Object.keys(attrs).filter((k) => /name/i.test(k));
  for (const k of keys) {
    const v = attrs[k];
    if (typeof v === 'string' && v.trim()) out.push(v.trim());
  }
  return out;
}

function ringsFrom(features: RawFeature[]): Ring[][] {
  const parts: Ring[][] = [];
  for (const f of features) {
    const shape = toShape(f.geometry ?? f);
    if (!shape) continue;
    if (shape.type === 'Polygon') parts.push(shape.coordinates);
    else parts.push(...shape.coordinates);
  }
  return parts;
}

/** List the layers a MapServer or FeatureServer publishes, with their names. */
export async function listLayers(
  service: string,
  http: HttpClient,
): Promise<Array<{ id: number; name: string; geometryType?: string }>> {
  const body = await http.getJson<{
    layers?: Array<{ id: number; name: string; geometryType?: string }>;
    error?: { message: string };
  }>(`${service.replace(/\/+$/, '')}?f=json`);
  if (body.error) throw new Error(`${service}: ${body.error.message}`);
  return body.layers ?? [];
}

async function queryLayer(
  service: string,
  layer: number,
  bbox: Bbox | undefined,
  http: HttpClient,
): Promise<RawFeature[]> {
  const base = `${service.replace(/\/+$/, '')}/${layer}/query`;
  const params: Record<string, string | number | boolean | undefined> = {
    where: '1=1',
    outFields: '*',
    returnGeometry: true,
    outSR: 4326,
    f: 'json',
    resultRecordCount: 2000,
  };
  if (bbox) {
    // A bounding box keeps this to one small request instead of a national pull.
    params.geometry = `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`;
    params.geometryType = 'esriGeometryEnvelope';
    params.spatialRel = 'esriSpatialRelIntersects';
    params.inSR = 4326;
  }
  const body = await http.getJson<{ features?: RawFeature[]; error?: { message: string; details?: string[] } }>(
    `${base}?${qs(params)}`,
  );
  if (body.error) {
    throw new Error(`${body.error.message} ${(body.error.details ?? []).join('; ')}`.trim());
  }
  return body.features ?? [];
}

/**
 * Try each candidate layer until one yields polygons matching the name.
 * `acceptName` overrides the configured match, for the case where the fetch
 * reported the names it found and you picked one.
 * `acceptAll` takes every water polygon in the bounding box instead of matching.
 */
export async function fetchWaterbody(
  src: WaterbodySource,
  http: HttpClient,
  opts: { acceptName?: string; acceptAll?: boolean } = {},
): Promise<FetchOutcome> {
  const needle = opts.acceptName ?? src.match;
  const attempts: FetchOutcome['attempts'] = [];
  const namesSeen = new Set<string>();

  for (const cand of src.candidates) {
    for (const layer of cand.layers) {
      const label = `${cand.service}/${layer}`;
      let features: RawFeature[];
      try {
        features = await queryLayer(cand.service, layer, src.bbox, http);
      } catch (err) {
        attempts.push({ layer: label, features: 0, matched: 0, error: (err as Error).message });
        continue;
      }

      for (const f of features) for (const n of namesOf(f, src.nameFields)) namesSeen.add(n);

      const matched = opts.acceptAll
        ? features.filter((f) => f.geometry)
        : features.filter((f) => f.geometry && mentions(f, needle, src.nameFields));
      attempts.push({ layer: label, features: features.length, matched: matched.length });
      if (!matched.length) continue;

      const parts = ringsFrom(matched);
      if (!parts.length) continue;
      const shape: Shape = { type: 'MultiPolygon', coordinates: parts };
      return {
        shape,
        layerUsed: label,
        featureCount: matched.length,
        vertices: vertexCount(shape),
        bbox: shapeBbox(shape),
        namesSeen: [...namesSeen].sort(),
        attempts,
      };
    }
  }

  return {
    shape: null,
    featureCount: 0,
    vertices: 0,
    namesSeen: [...namesSeen].sort(),
    attempts,
  };
}
