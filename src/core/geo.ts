// Geometry, for the "on the water" problem.
//
// Waterfront is not an attribute in any assessor roll. It has to be computed from
// where the parcel is relative to where the water is. Every parcel already has a
// coordinate, derived from the layer geometry during ingest, so all that is missing
// is the shoreline and the arithmetic.
//
// Distances use a local equirectangular projection rather than a full geodesic
// solution. At county scale the error is a fraction of a percent, which is far
// inside the tolerance of a "within 1000 feet of the lake" question.

export type Position = [number, number]; // [longitude, latitude]
export type Ring = Position[];

export interface PolygonShape {
  type: 'Polygon';
  coordinates: Ring[]; // first ring is the outer boundary, the rest are holes
}

export interface MultiPolygonShape {
  type: 'MultiPolygon';
  coordinates: Ring[][];
}

export type Shape = PolygonShape | MultiPolygonShape;

export type Bbox = [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]

const FEET_PER_METER = 3.280839895;
const METERS_PER_DEG_LAT = 111_320;
const EARTH_RADIUS_MILES = 3958.7613;

const toRad = (d: number): number => (d * Math.PI) / 180;

/** Great circle distance in miles. Used for "within N miles of town" filters. */
export function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(a)));
}

function polygons(shape: Shape): Ring[][] {
  return shape.type === 'Polygon' ? [shape.coordinates] : shape.coordinates;
}

export function shapeBbox(shape: Shape): Bbox {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  for (const poly of polygons(shape)) {
    for (const ring of poly) {
      for (const [lon, lat] of ring) {
        if (lon < minLon) minLon = lon;
        if (lat < minLat) minLat = lat;
        if (lon > maxLon) maxLon = lon;
        if (lat > maxLat) maxLat = lat;
      }
    }
  }
  return [minLon, minLat, maxLon, maxLat];
}

/** Grow a bbox by a margin in feet, for a cheap prefilter before exact distance. */
export function padBbox(box: Bbox, feet: number): Bbox {
  const meters = feet / FEET_PER_METER;
  const dLat = meters / METERS_PER_DEG_LAT;
  const midLat = (box[1] + box[3]) / 2;
  const dLon = meters / (METERS_PER_DEG_LAT * Math.max(0.01, Math.cos(toRad(midLat))));
  return [box[0] - dLon, box[1] - dLat, box[2] + dLon, box[3] + dLat];
}

export function inBbox(lon: number, lat: number, box: Bbox): boolean {
  return lon >= box[0] && lon <= box[2] && lat >= box[1] && lat <= box[3];
}

/** Ray casting. Counts crossings of the ring by a ray heading east. */
function pointInRing(lon: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]!;
    const b = ring[j]!;
    const [xi, yi] = a;
    const [xj, yj] = b;
    if (yi > lat !== yj > lat) {
      const x = ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
      if (lon < x) inside = !inside;
    }
  }
  return inside;
}

/** True when the point is inside the outer ring of any polygon and not in a hole. */
export function pointInShape(lon: number, lat: number, shape: Shape): boolean {
  for (const poly of polygons(shape)) {
    const outer = poly[0];
    if (!outer || !pointInRing(lon, lat, outer)) continue;
    let inHole = false;
    for (let h = 1; h < poly.length; h++) {
      if (pointInRing(lon, lat, poly[h]!)) { inHole = true; break; }
    }
    if (!inHole) return true;
  }
  return false;
}

/** Distance from a point to a line segment, in a local metre frame. */
function distancePointToSegmentMeters(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/**
 * Distance in feet from a point to the nearest edge of a shape.
 * Returns 0 when the point is inside, which for a lake polygon means the parcel
 * centroid is over water. That happens with narrow coves and long docks, and it
 * still counts as waterfront.
 */
export function distanceToShapeFt(lon: number, lat: number, shape: Shape): number {
  if (pointInShape(lon, lat, shape)) return 0;

  // Project to metres in a frame centred on the query point.
  const mPerLon = METERS_PER_DEG_LAT * Math.cos(toRad(lat));
  const px = 0;
  const py = 0;
  let best = Infinity;

  for (const poly of polygons(shape)) {
    for (const ring of poly) {
      for (let i = 0; i < ring.length - 1; i++) {
        const a = ring[i]!;
        const b = ring[i + 1]!;
        const ax = (a[0] - lon) * mPerLon;
        const ay = (a[1] - lat) * METERS_PER_DEG_LAT;
        const bx = (b[0] - lon) * mPerLon;
        const by = (b[1] - lat) * METERS_PER_DEG_LAT;
        // Skip segments whose endpoints are both far away, cheaply.
        if (Math.min(Math.abs(ax), Math.abs(bx)) > best && Math.min(Math.abs(ay), Math.abs(by)) > best) {
          continue;
        }
        const d = distancePointToSegmentMeters(px, py, ax, ay, bx, by);
        if (d < best) best = d;
      }
    }
  }
  return best === Infinity ? Infinity : best * FEET_PER_METER;
}

/** Accept a GeoJSON Feature, FeatureCollection, geometry, or an Esri ring set. */
export function toShape(input: unknown): Shape | null {
  if (!input || typeof input !== 'object') return null;
  const o = input as Record<string, unknown>;

  if (o.type === 'FeatureCollection' && Array.isArray(o.features)) {
    // Merge every feature into one MultiPolygon. A reservoir is often published as
    // several polygons, one per reach or per county.
    const parts: Ring[][] = [];
    for (const f of o.features) {
      const s = toShape(f);
      if (s) parts.push(...polygons(s));
    }
    return parts.length ? { type: 'MultiPolygon', coordinates: parts } : null;
  }
  if (o.type === 'Feature') return toShape(o.geometry);
  if (o.type === 'Polygon' && Array.isArray(o.coordinates)) {
    return { type: 'Polygon', coordinates: o.coordinates as Ring[] };
  }
  if (o.type === 'MultiPolygon' && Array.isArray(o.coordinates)) {
    return { type: 'MultiPolygon', coordinates: o.coordinates as Ring[][] };
  }
  // Esri JSON: { rings: [[[x,y],...], ...] }. Esri does not distinguish outer
  // rings from holes by position, so each ring becomes its own polygon. For a
  // distance-to-shoreline question that is the right call anyway.
  if (Array.isArray(o.rings)) {
    const rings = o.rings as Ring[];
    return { type: 'MultiPolygon', coordinates: rings.map((r) => [r]) };
  }
  if (Array.isArray(o.features)) {
    const parts: Ring[][] = [];
    for (const f of o.features as Array<Record<string, unknown>>) {
      const s = toShape(f.geometry ?? f);
      if (s) parts.push(...polygons(s));
    }
    return parts.length ? { type: 'MultiPolygon', coordinates: parts } : null;
  }
  return null;
}

/** Total vertex count, useful for reporting how detailed a shoreline is. */
export function vertexCount(shape: Shape): number {
  let n = 0;
  for (const poly of polygons(shape)) for (const ring of poly) n += ring.length;
  return n;
}
