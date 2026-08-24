// A local stand-in for the public endpoints this pipeline talks to.
//
// The live hosts were not reachable from the environment this was built in, so the
// connectors are exercised against faithful replicas of the response shapes each
// service documents: ArcGIS layer metadata plus paged query responses, Socrata
// view metadata plus paged rows, and the GHL v2 contact and opportunity endpoints.

import { createServer, type Server } from 'node:http';

export interface MockOptions {
  /** Number of synthetic parcels the ArcGIS layer should serve. */
  parcelCount?: number;
  /** Whether the ArcGIS layer advertises server side pagination. */
  supportsPagination?: boolean;
  maxRecordCount?: number;
}

export interface MockHandle {
  url: string;
  close: () => Promise<void>;
  requests: string[];
}

const ARCGIS_FIELDS = [
  { name: 'OBJECTID', alias: 'OBJECTID', type: 'esriFieldTypeOID' },
  { name: 'PARID', alias: 'Parcel ID', type: 'esriFieldTypeString' },
  { name: 'OWNNAME', alias: 'Owner Name', type: 'esriFieldTypeString' },
  { name: 'SITUSADDR', alias: 'Property Address', type: 'esriFieldTypeString' },
  { name: 'SITUSCITY', alias: 'Property City', type: 'esriFieldTypeString' },
  { name: 'SITUSZIP', alias: 'Property Zip', type: 'esriFieldTypeString' },
  { name: 'MAILADDR', alias: 'Owner Mailing Address', type: 'esriFieldTypeString' },
  { name: 'MAILCITY', alias: 'Owner Mailing City', type: 'esriFieldTypeString' },
  { name: 'MAILSTATE', alias: 'Owner Mailing State', type: 'esriFieldTypeString' },
  { name: 'TOTAL_MKT_VAL', alias: 'Total Market Value', type: 'esriFieldTypeDouble' },
  { name: 'SALEDATE', alias: 'Last Sale Date', type: 'esriFieldTypeDate' },
  { name: 'SALEPRICE', alias: 'Last Sale Price', type: 'esriFieldTypeDouble' },
  { name: 'YRBUILT', alias: 'Year Built', type: 'esriFieldTypeInteger' },
  { name: 'HEATEDAREA', alias: 'Heated Area', type: 'esriFieldTypeInteger' },
  { name: 'LUC_DESC', alias: 'Land Use', type: 'esriFieldTypeString' },
];

/** Deterministic synthetic parcels covering the archetypes the scorer must separate. */
function parcel(i: number): Record<string, unknown> {
  const archetype = i % 4;
  const base = {
    OBJECTID: i,
    PARID: `047 12 0 ${String(i).padStart(4, '0')}.00`,
    SITUSADDR: `${100 + i} Oak Ave`,
    SITUSCITY: 'Nashville',
    SITUSZIP: '37201',
    YRBUILT: 1955 + (i % 40),
    HEATEDAREA: 1200 + (i % 800),
    LUC_DESC: 'SINGLE FAMILY',
  };
  if (archetype === 0) {
    // Long tenure absentee owner, out of state. The seller finance target.
    return {
      ...base,
      OWNNAME: `SMITH JOHN ${i}`,
      MAILADDR: `PO Box ${i}`,
      MAILCITY: 'Tampa',
      MAILSTATE: 'FL',
      TOTAL_MKT_VAL: 310000 + i * 100,
      SALEDATE: Date.UTC(1987, 5, 15),
      SALEPRICE: 42000,
    };
  }
  if (archetype === 1) {
    // Recent leveraged buyer, owner occupied. Should rank low.
    return {
      ...base,
      OWNNAME: `JONES ANN ${i}`,
      MAILADDR: `${100 + i} Oak Ave`,
      MAILCITY: 'Nashville',
      MAILSTATE: 'TN',
      TOTAL_MKT_VAL: 340000,
      SALEDATE: Date.UTC(2022, 4, 1),
      SALEPRICE: 325000,
    };
  }
  if (archetype === 2) {
    // Estate on the deed. A probate lead found for free in the owner name.
    return {
      ...base,
      OWNNAME: `WILLIAMS ROBERT ESTATE OF`,
      MAILADDR: `${100 + i} Oak Ave`,
      MAILCITY: 'Nashville',
      MAILSTATE: 'TN',
      TOTAL_MKT_VAL: 250000,
      SALEDATE: Date.UTC(1999, 0, 1),
      SALEPRICE: 80000,
    };
  }
  // Corporate landlord, mid equity.
  return {
    ...base,
    OWNNAME: `ACME HOLDINGS LLC`,
    MAILADDR: '500 Commerce St',
    MAILCITY: 'Nashville',
    MAILSTATE: 'TN',
    TOTAL_MKT_VAL: 275000,
    SALEDATE: Date.UTC(2013, 2, 1),
    SALEPRICE: 150000,
  };
}

const SOCRATA_COLUMNS = [
  { fieldName: 'case_number', name: 'Case Number', dataTypeName: 'text' },
  { fieldName: 'request_type', name: 'Request Type', dataTypeName: 'text' },
  { fieldName: 'property_address', name: 'Property Address', dataTypeName: 'text' },
  { fieldName: 'city', name: 'City', dataTypeName: 'text' },
  { fieldName: 'zip_code', name: 'Zip Code', dataTypeName: 'text' },
  { fieldName: 'date_opened', name: 'Date Opened', dataTypeName: 'calendar_date' },
  { fieldName: 'status', name: 'Status', dataTypeName: 'text' },
];

/** Violations that intentionally overlap the parcel addresses, to test stacking. */
function violation(i: number): Record<string, unknown> {
  const target = i * 4; // hits the archetype 0 parcels
  return {
    case_number: `CV-2026-${1000 + i}`,
    request_type: i % 5 === 0 ? 'DEMOLITION UNSAFE STRUCTURE' : 'PROPERTY MAINTENANCE',
    property_address: `${100 + target} Oak Ave`,
    city: 'Nashville',
    zip_code: '37201',
    date_opened: '2026-08-01T00:00:00.000',
    status: 'OPEN',
  };
}

export async function startMock(opts: MockOptions = {}): Promise<MockHandle> {
  const parcelCount = opts.parcelCount ?? 2500;
  const supportsPagination = opts.supportsPagination ?? true;
  const maxRecordCount = opts.maxRecordCount ?? 1000;
  const requests: string[] = [];

  const server: Server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    requests.push(url.pathname + (url.search || ''));
    const json = (body: unknown, status = 200) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    };

    // ---- ArcGIS layer metadata ----
    if (url.pathname === '/arcgis/parcels/0' ) {
      return json({
        name: 'Ownership Parcels',
        type: 'Feature Layer',
        geometryType: 'esriGeometryPolygon',
        objectIdField: 'OBJECTID',
        maxRecordCount,
        fields: ARCGIS_FIELDS,
        advancedQueryCapabilities: { supportsPagination, supportsOrderBy: true },
      });
    }

    // ---- ArcGIS query ----
    if (url.pathname === '/arcgis/parcels/0/query') {
      if (url.searchParams.get('returnCountOnly') === 'true') {
        return json({ count: parcelCount });
      }
      const size = Math.min(
        Number(url.searchParams.get('resultRecordCount') ?? maxRecordCount),
        maxRecordCount,
      );
      let ids: number[];
      if (supportsPagination) {
        const offset = Number(url.searchParams.get('resultOffset') ?? 0);
        ids = Array.from({ length: size }, (_, k) => offset + k + 1).filter((n) => n <= parcelCount);
      } else {
        // Object id windowing: the connector puts "OBJECTID > n" in the where clause.
        const where = url.searchParams.get('where') ?? '';
        const m = where.match(/OBJECTID\s*>\s*(\d+)/);
        const after = m ? Number(m[1]) : 0;
        ids = Array.from({ length: size }, (_, k) => after + k + 1).filter((n) => n <= parcelCount);
      }
      const wantGeom = url.searchParams.get('returnGeometry') === 'true';
      return json({
        features: ids.map((id) => ({
          attributes: parcel(id),
          geometry: wantGeom
            ? { rings: [[[-86.8, 36.1], [-86.8, 36.2], [-86.7, 36.2], [-86.7, 36.1], [-86.8, 36.1]]] }
            : undefined,
        })),
        exceededTransferLimit: ids.length === size && (ids[ids.length - 1] ?? 0) < parcelCount,
      });
    }

    // ---- Socrata view metadata ----
    if (url.pathname === '/api/views/abcd-1234.json') {
      return json({ name: 'Property Standards Violations', columns: SOCRATA_COLUMNS });
    }

    // ---- Socrata rows ----
    if (url.pathname === '/resource/abcd-1234.json') {
      if ((url.searchParams.get('$select') ?? '').includes('count')) {
        return json([{ n: '120' }]);
      }
      const limit = Number(url.searchParams.get('$limit') ?? 1000);
      const offset = Number(url.searchParams.get('$offset') ?? 0);
      const rows = Array.from({ length: limit }, (_, k) => offset + k)
        .filter((n) => n < 120)
        .map((n) => violation(n));
      return json(rows);
    }

    // ---- GHL v2 ----
    if (url.pathname === '/contacts/upsert' && req.method === 'POST') {
      if (!req.headers.authorization?.startsWith('Bearer ')) return json({ message: 'unauthorized' }, 401);
      if (!req.headers.version) return json({ message: 'Version header required' }, 400);
      return json({ contact: { id: 'contact_mock_1' } });
    }
    if (url.pathname === '/opportunities/' && req.method === 'POST') {
      return json({ opportunity: { id: 'opp_mock_1' } });
    }
    if (url.pathname.endsWith('/customFields')) {
      return json({ customFields: [{ id: 'cf_1', name: 'Property Address', fieldKey: 'contact.property_address', dataType: 'TEXT' }] });
    }

    // ---- failure injection, used to prove retry and backoff ----
    if (url.pathname === '/flaky') {
      const n = requests.filter((r) => r.startsWith('/flaky')).length;
      if (n < 3) return json({ message: 'slow down' }, 429);
      return json({ ok: true });
    }
    if (url.pathname === '/arcgis/broken/0') {
      return json({ error: { code: 400, message: 'Layer does not exist', details: ['bad layer'] } });
    }

    return json({ message: 'not found' }, 404);
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
