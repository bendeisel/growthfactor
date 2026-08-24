// ArcGIS Feature and Map Server connector.
//
// This is the workhorse. Counties, cities and several federal agencies publish
// parcels, code enforcement cases, vacancy surveys and REO inventory as ArcGIS
// layers with an open REST query interface and no key. HUD publishes its FHA
// single family REO inventory this way.
//
// Handles the two pagination styles found in the wild: resultOffset paging where
// the server advertises supportsPagination, and object id windowing where it does
// not.

import { qs, type HttpClient } from '../core/http.ts';
import type { SourceField } from '../core/fieldmap.ts';
import type { RawRecord, SourceConfig } from '../core/types.ts';
import type { Connector, DescribeResult, PageOptions } from './index.ts';

interface ArcGisLayerMeta {
  name?: string;
  type?: string;
  maxRecordCount?: number;
  objectIdField?: string;
  objectIdFieldName?: string;
  geometryType?: string;
  fields?: Array<{ name: string; alias?: string; type?: string }>;
  advancedQueryCapabilities?: { supportsPagination?: boolean; supportsOrderBy?: boolean };
  error?: { code: number; message: string; details?: string[] };
}

interface ArcGisQueryResponse {
  features?: Array<{ attributes?: RawRecord; geometry?: unknown }>;
  exceededTransferLimit?: boolean;
  count?: number;
  error?: { code: number; message: string; details?: string[] };
}

function assertNoError(body: { error?: { message: string; details?: string[] } }, url: string): void {
  if (body.error) {
    const detail = body.error.details?.join('; ') ?? '';
    throw new Error(`ArcGIS error from ${url}: ${body.error.message} ${detail}`.trim());
  }
}

/** Point geometry, or the average of a polygon ring, in WGS84. */
function geometryToLatLon(geom: unknown): { latitude?: number; longitude?: number } {
  if (!geom || typeof geom !== 'object') return {};
  const g = geom as Record<string, unknown>;
  if (typeof g.x === 'number' && typeof g.y === 'number') {
    return { longitude: g.x, latitude: g.y };
  }
  const rings = (g.rings ?? g.paths) as number[][][] | undefined;
  const ring = rings?.[0];
  if (ring?.length) {
    let sx = 0;
    let sy = 0;
    let n = 0;
    for (const pt of ring) {
      if (typeof pt[0] === 'number' && typeof pt[1] === 'number') { sx += pt[0]; sy += pt[1]; n++; }
    }
    if (n) return { longitude: sx / n, latitude: sy / n };
  }
  return {};
}

function layerUrl(cfg: SourceConfig): string {
  const url = String(cfg.url ?? '').replace(/\/+$/, '');
  if (!url) throw new Error(`source ${cfg.name}: missing "url"`);
  return url;
}

export const arcgisConnector: Connector = {
  kind: 'arcgis',
  defaultCostPerRecordCents: 0,

  async describe(cfg, http): Promise<DescribeResult> {
    const url = layerUrl(cfg);
    const meta = await http.getJson<ArcGisLayerMeta>(`${url}?f=json`);
    assertNoError(meta, url);

    const fields: SourceField[] = (meta.fields ?? []).map((f) => ({
      name: f.name, alias: f.alias, type: f.type,
    }));

    const notes: string[] = [];
    const wantGeometry = cfg.returnGeometry !== false && Boolean(meta.geometryType);
    if (wantGeometry) {
      // Geometry gives coordinates even when the layer has no lat/lon columns.
      const hasLat = fields.some((f) => /^(lat|latitude|y)$/i.test(f.name));
      if (!hasLat) {
        fields.push({ name: 'latitude', type: 'esriFieldTypeDouble' });
        fields.push({ name: 'longitude', type: 'esriFieldTypeDouble' });
        notes.push('latitude and longitude will be derived from layer geometry');
      }
    }
    if (!meta.advancedQueryCapabilities?.supportsPagination) {
      notes.push('server does not advertise pagination, falling back to object id windowing');
    }
    if (meta.maxRecordCount) notes.push(`server maxRecordCount is ${meta.maxRecordCount}`);

    let recordCount: number | undefined;
    try {
      const where = String(cfg.where ?? '1=1');
      const cnt = await http.getJson<ArcGisQueryResponse>(
        `${url}/query?${qs({ where, returnCountOnly: true, f: 'json' })}`,
      );
      assertNoError(cnt, url);
      recordCount = cnt.count;
    } catch (err) {
      notes.push(`count query failed: ${(err as Error).message}`);
    }

    return { label: meta.name ?? cfg.label ?? cfg.name, fields, recordCount, notes };
  },

  async *pages(cfg, http, opts: PageOptions): AsyncGenerator<RawRecord[]> {
    const url = layerUrl(cfg);
    const meta = await http.getJson<ArcGisLayerMeta>(`${url}?f=json`);
    assertNoError(meta, url);

    const where = String(cfg.where ?? '1=1');
    const oidField = meta.objectIdField ?? meta.objectIdFieldName ?? 'OBJECTID';
    const serverMax = meta.maxRecordCount ?? 1000;
    const pageSize = Math.min(Number(cfg.pageSize ?? serverMax) || serverMax, serverMax);
    const supportsPaging = Boolean(meta.advancedQueryCapabilities?.supportsPagination);
    const wantGeometry = cfg.returnGeometry !== false && Boolean(meta.geometryType);
    const outFields = String(cfg.outFields ?? '*');

    let emitted = 0;
    let offset = 0;
    let lastOid = Number(cfg.startObjectId ?? 0);

    for (;;) {
      const params: Record<string, string | number | boolean | undefined> = {
        outFields,
        f: 'json',
        returnGeometry: wantGeometry,
        outSR: wantGeometry ? 4326 : undefined,
        resultRecordCount: pageSize,
      };
      if (supportsPaging) {
        params.where = where;
        params.resultOffset = offset;
        params.orderByFields = oidField;
      } else {
        // Object id windowing is stable without server side paging support.
        params.where = `(${where}) AND ${oidField} > ${lastOid}`;
        params.orderByFields = oidField;
      }

      const body = await http.getJson<ArcGisQueryResponse>(`${url}/query?${qs(params)}`);
      assertNoError(body, url);
      const feats = body.features ?? [];
      if (!feats.length) return;

      const rows: RawRecord[] = [];
      for (const f of feats) {
        const attrs: RawRecord = { ...(f.attributes ?? {}) };
        if (wantGeometry) {
          const { latitude, longitude } = geometryToLatLon(f.geometry);
          if (latitude !== undefined && attrs.latitude === undefined) attrs.latitude = latitude;
          if (longitude !== undefined && attrs.longitude === undefined) attrs.longitude = longitude;
        }
        const oid = Number(attrs[oidField]);
        if (Number.isFinite(oid) && oid > lastOid) lastOid = oid;
        rows.push(attrs);
      }

      yield rows;
      emitted += rows.length;
      offset += rows.length;

      if (opts.limit && emitted >= opts.limit) return;
      // A short page means the result set is exhausted.
      if (rows.length < pageSize && !body.exceededTransferLimit) return;
    }
  },
};
