// A local stand-in for the public endpoints this pipeline talks to.
//
// The live hosts were not reachable from the environment this was built in, so the
// connectors are exercised against faithful replicas of the response shapes each
// service documents: ArcGIS layer metadata plus paged query responses, Socrata
// view metadata plus paged rows, and the GHL v2 contact and opportunity endpoints.

import { createServer, type Server } from 'node:http';

/**
 * A crude Old Hickory Lake stand in: a narrow east to west channel at the real
 * lake's latitude, which is enough to test the distance and threshold logic.
 */
export const MOCK_LAKE_RING: Array<[number, number]> = [
  [-86.70, 36.28], [-86.20, 36.28], [-86.20, 36.30], [-86.70, 36.30], [-86.70, 36.28],
];

export interface MockOptions {
  /** Number of synthetic parcels the ArcGIS layer should serve. */
  parcelCount?: number;
  /** Place parcels along the lake so waterfront distance can be exercised. */
  lakeParcels?: boolean;
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

/**
 * Parcel footprints. In lake mode every fourth parcel sits just off the shoreline
 * and the rest march steadily inland, so a distance threshold has something real
 * to separate.
 */
function parcelGeometry(id: number, lakeMode: boolean): { rings: Array<Array<[number, number]>> } {
  if (!lakeMode) {
    return { rings: [[[-86.8, 36.1], [-86.8, 36.2], [-86.7, 36.2], [-86.7, 36.1], [-86.8, 36.1]]] };
  }
  const lon = -86.68 + (id % 40) * 0.01;
  // Archetype 0 parcels, the long tenure absentee ones, sit on the water.
  const lat = id % 4 === 0
    ? 36.2795 - 0.0004 * (id % 3)   // roughly 15 to 150 feet south of the shoreline
    : 36.2795 - 0.02 * (1 + (id % 5)); // 1.4 to 7 miles inland
  const d = 0.0002;
  return {
    rings: [[
      [lon - d, lat - d], [lon + d, lat - d], [lon + d, lat + d], [lon - d, lat + d], [lon - d, lat - d],
    ]],
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
  const lakeParcels = opts.lakeParcels ?? false;
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
          geometry: wantGeom ? parcelGeometry(id, lakeParcels) : undefined,
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

    // ---- A JavaScript rendered docket, the shape modern court portals take ----
    // The results table does not exist in the HTML at all. Plain HTTP sees a shell.
    if (url.pathname === '/portal') {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(`<html><head><title>Probate Case Search</title></head><body>
        <h1>Case Search</h1>
        <div id="results">Loading results...</div>
        <script>
          var CASES = [
            ['26P1234','SMITH JOHN R','08/01/2026','120 Oak Ave, Nashville, TN 37201','Estate Administration'],
            ['26P1235','WILLIAMS ROBERT','08/03/2026','216 Oak Ave, Nashville, TN 37201','Estate Administration'],
            ['26P1236','DAVIS MARY E','08/07/2026','312 Oak Ave, Nashville, TN 37201','Will Probated']
          ];
          setTimeout(function () {
            var rows = CASES.map(function (c) {
              return '<tr><td>' + c[0] + '</td><td>' + c[1] + '</td><td>' + c[2] +
                     '</td><td>' + c[3] + '</td><td>' + c[4] + '</td></tr>';
            }).join('');
            document.getElementById('results').innerHTML =
              '<table id="cases"><thead><tr><th>Case Number</th><th>Decedent Name</th>' +
              '<th>Date Filed</th><th>Property Address</th><th>Case Type</th></tr></thead>' +
              '<tbody>' + rows + '</tbody></table>';
          }, 250);
        </script></body></html>`);
      return undefined;
    }

    // ---- A search form, where results only appear after a submit ----
    if (url.pathname === '/portal-search') {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(`<html><body>
        <form id="f" onsubmit="return false">
          <input id="caseType" value="" />
          <select id="county"><option value="">Pick</option><option value="DAVIDSON">Davidson</option></select>
          <button id="go" type="button">Search</button>
        </form>
        <div id="out"></div>
        <script>
          var PAGE = 1;
          function render() {
            var start = (PAGE - 1) * 2;
            var rows = '';
            for (var i = start; i < start + 2 && i < 6; i++) {
              rows += '<tr><td>26P' + (2000 + i) + '</td><td>OWNER ' + i +
                      '</td><td>08/1' + i + '/2026</td><td>' + (400 + i * 8) +
                      ' Oak Ave, Nashville, TN 37201</td></tr>';
            }
            document.getElementById('out').innerHTML =
              '<table id="res"><thead><tr><th>Case Number</th><th>Decedent Name</th>' +
              '<th>Date Filed</th><th>Property Address</th></tr></thead><tbody>' + rows +
              '</tbody></table>' +
              (PAGE < 3 ? '<a id="next" href="#" onclick="PAGE++;render();return false">Next</a>' : '');
          }
          document.getElementById('go').addEventListener('click', function () {
            var t = document.getElementById('caseType').value;
            var c = document.getElementById('county').value;
            if (t === 'PROBATE' && c === 'DAVIDSON') { PAGE = 1; render(); }
            else { document.getElementById('out').innerHTML = '<p>No criteria selected.</p>'; }
          });
        </script></body></html>`);
      return undefined;
    }

    // ---- USGS NHD stand in, for waterbody fetching ----
    if (url.pathname === '/nhd/MapServer') {
      return json({
        layers: [
          { id: 6, name: 'NHDFlowline', geometryType: 'esriGeometryPolyline' },
          { id: 9, name: 'NHDArea', geometryType: 'esriGeometryPolygon' },
          { id: 10, name: 'NHDWaterbody', geometryType: 'esriGeometryPolygon' },
        ],
      });
    }
    // Layer 8 does not exist, which exercises walking past a failed candidate.
    if (url.pathname === '/nhd/MapServer/8/query') {
      return json({ error: { code: 400, message: 'Invalid or missing input parameters', details: [] } });
    }
    // Layer 9 has water but not the lake, which exercises the name filter.
    if (url.pathname === '/nhd/MapServer/9/query') {
      return json({
        features: [{
          attributes: { GNIS_NAME: 'Cumberland River', FTYPE: 460 },
          geometry: { rings: [[[-86.9, 36.15], [-86.85, 36.15], [-86.85, 36.16], [-86.9, 36.16], [-86.9, 36.15]]] },
        }],
      });
    }
    if (url.pathname === '/nhd/MapServer/10/query') {
      return json({
        features: [
          {
            attributes: { GNIS_NAME: 'Old Hickory Lake', FTYPE: 436, AREASQKM: 91.1 },
            geometry: { rings: [MOCK_LAKE_RING] },
          },
          {
            attributes: { GNIS_NAME: 'Percy Priest Lake', FTYPE: 436 },
            geometry: { rings: [[[-86.6, 36.0], [-86.5, 36.0], [-86.5, 36.05], [-86.6, 36.05], [-86.6, 36.0]]] },
          },
        ],
      });
    }

    // ---- skip trace vendor stand in ----
    if (url.pathname === '/skiptrace' && req.method === 'POST') {
      if (!req.headers['x-api-key']) return json({ message: 'missing key' }, 401);
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        let parsed: Record<string, unknown> = {};
        try { parsed = JSON.parse(body || '{}'); } catch { /* ignore */ }
        // A deliberately awkward envelope, to prove nothing depends on its shape.
        if (String(parsed.last_name ?? '').toUpperCase() === 'NOBODY') {
          return json({ output: { identity: {} } });
        }
        json({
          output: {
            identity: {
              phones: [
                { phoneNumber: '615-555-0101', type: 'Wireless' },
                { number: '(615) 555-0102' },
              ],
              emails: [{ email: `${String(parsed.last_name ?? 'x').toLowerCase()}@example.com` }],
            },
          },
        });
      });
      return undefined;
    }

    // ---- an HTML notice page, the shape trustee sale lists take ----
    if (url.pathname === '/notices') {
      res.writeHead(200, { 'content-type': 'text/html' });
      const rows = Array.from({ length: 12 }, (_, i) => `
        <tr>
          <td>09/${String(10 + i).padStart(2, '0')}/2026</td>
          <td>${100 + i * 4} Oak Ave<br/>Nashville, TN 37201</td>
          <td>Davidson</td>
          <td>Wilson &amp; Assoc. P.L.L.C.</td>
          <td>$${(150000 + i * 1000).toLocaleString('en-US')}.00</td>
        </tr>`).join('');
      res.end(`<html><body>
        <table id="nav"><tr><td>Home</td><td>Search</td></tr></table>
        <table class="notices">
          <thead><tr><th>Sale Date</th><th>Property Address</th><th>County</th>
            <th>Trustee</th><th>Unpaid Balance</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></body></html>`);
      return undefined;
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
