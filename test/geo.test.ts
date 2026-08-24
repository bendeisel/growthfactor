import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  distanceToShapeFt, haversineMiles, inBbox, padBbox, pointInShape, shapeBbox,
  toShape, vertexCount, type Shape,
} from '../src/core/geo.ts';

// A square roughly the size of a small lake, near Old Hickory Lake's latitude.
const SQUARE: Shape = {
  type: 'Polygon',
  coordinates: [[
    [-86.70, 36.20], [-86.60, 36.20], [-86.60, 36.30], [-86.70, 36.30], [-86.70, 36.20],
  ]],
};

test('haversine matches a known distance', () => {
  // Downtown Nashville to Gallatin is about 24 miles.
  const d = haversineMiles(36.1627, -86.7816, 36.3884, -86.4467);
  assert.ok(d > 22 && d < 26, `expected about 24 miles, got ${d.toFixed(1)}`);
  assert.equal(Math.round(haversineMiles(36, -86, 36, -86)), 0);
});

test('point in polygon', () => {
  assert.equal(pointInShape(-86.65, 36.25, SQUARE), true, 'centre is inside');
  assert.equal(pointInShape(-86.50, 36.25, SQUARE), false, 'east of the square is outside');
  assert.equal(pointInShape(-86.65, 36.40, SQUARE), false, 'north of the square is outside');
});

test('polygons with holes exclude the hole', () => {
  const withHole: Shape = {
    type: 'Polygon',
    coordinates: [
      [[-86.70, 36.20], [-86.60, 36.20], [-86.60, 36.30], [-86.70, 36.30], [-86.70, 36.20]],
      [[-86.66, 36.24], [-86.64, 36.24], [-86.64, 36.26], [-86.66, 36.26], [-86.66, 36.24]],
    ],
  };
  assert.equal(pointInShape(-86.65, 36.25, withHole), false, 'an island in the lake is not water');
  assert.equal(pointInShape(-86.62, 36.25, withHole), true, 'still inside outside the hole');
});

test('distance to shape is zero inside and correct outside', () => {
  assert.equal(distanceToShapeFt(-86.65, 36.25, SQUARE), 0);

  // 0.1 degrees of longitude east of the edge, at latitude 36.25.
  // 0.1 * 111320 * cos(36.25) metres, converted to feet.
  const expected = 0.1 * 111_320 * Math.cos((36.25 * Math.PI) / 180) * 3.280839895;
  const actual = distanceToShapeFt(-86.50, 36.25, SQUARE);
  assert.ok(
    Math.abs(actual - expected) / expected < 0.02,
    `expected about ${Math.round(expected)} ft, got ${Math.round(actual)} ft`,
  );
});

test('distance picks the nearest edge, not the nearest vertex', () => {
  // Straight out from the middle of the east edge. A vertex-only implementation
  // would overshoot by measuring to a corner instead.
  const midEdge = distanceToShapeFt(-86.59, 36.25, SQUARE);
  const nearCorner = distanceToShapeFt(-86.59, 36.20, SQUARE);
  const oneDegFt = 111_320 * Math.cos((36.25 * Math.PI) / 180) * 3.280839895;
  assert.ok(Math.abs(midEdge - 0.01 * oneDegFt) / (0.01 * oneDegFt) < 0.05,
    `mid edge distance looked wrong: ${Math.round(midEdge)} ft`);
  assert.ok(Math.abs(nearCorner - 0.01 * oneDegFt) / (0.01 * oneDegFt) < 0.05,
    `corner distance looked wrong: ${Math.round(nearCorner)} ft`);
});

test('a waterfront threshold separates lakefront from a mile inland', () => {
  const onTheWater = distanceToShapeFt(-86.5985, 36.25, SQUARE); // about 45 ft out
  const inland = distanceToShapeFt(-86.55, 36.25, SQUARE);       // about 2.7 miles out
  assert.ok(onTheWater < 1000, `should count as waterfront, got ${Math.round(onTheWater)} ft`);
  assert.ok(inland > 5280, `should not count as waterfront, got ${Math.round(inland)} ft`);
});

test('bbox and padding', () => {
  assert.deepEqual(shapeBbox(SQUARE), [-86.70, 36.20, -86.60, 36.30]);
  const padded = padBbox(shapeBbox(SQUARE), 5280);
  assert.ok(padded[0] < -86.70 && padded[2] > -86.60);
  assert.ok(padded[1] < 36.20 && padded[3] > 36.30);
  assert.equal(inBbox(-86.65, 36.25, shapeBbox(SQUARE)), true);
  assert.equal(inBbox(-86.40, 36.25, shapeBbox(SQUARE)), false);
});

test('shape parsing accepts GeoJSON and Esri formats', () => {
  const geojsonFeature = {
    type: 'Feature',
    properties: { gnis_name: 'Old Hickory Lake' },
    geometry: { type: 'Polygon', coordinates: SQUARE.coordinates },
  };
  assert.equal(toShape(geojsonFeature)?.type, 'Polygon');

  const collection = { type: 'FeatureCollection', features: [geojsonFeature, geojsonFeature] };
  const merged = toShape(collection);
  assert.equal(merged?.type, 'MultiPolygon');
  assert.equal(vertexCount(merged!), 10, 'two five point rings merge into one multipolygon');

  // Esri JSON, which is what an ArcGIS query returns without f=geojson.
  const esri = { features: [{ geometry: { rings: SQUARE.coordinates } }] };
  const fromEsri = toShape(esri);
  assert.ok(fromEsri);
  assert.equal(pointInShape(-86.65, 36.25, fromEsri!), true);

  assert.equal(toShape(null), null);
  assert.equal(toShape({ nonsense: true }), null);
});
