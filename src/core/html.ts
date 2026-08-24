// Minimal HTML table reader.
//
// A lot of the highest signal public data is a table on a page with no API behind
// it: trustee sale notices, sheriff sale lists, delinquent tax rolls. This pulls
// those tables into rows of objects so the normal field mapper can take over.
//
// Deliberately small and regex based rather than a real parser, because the pages
// in question are server rendered tables from the 2000s. Known limit: a table
// nested inside another table will confuse the row split. If you hit one, target
// the inner table with tableIndex.

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '-', mdash: '-',
};

export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, name: string) => ENTITIES[name.toLowerCase()] ?? m);
}

export function stripTags(html: string): string {
  return decodeEntities(
    html
      // A line break inside a cell is a separator, not nothing.
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/(p|div|li|tr)>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]*>/g, ''),
  ).replace(/\s+/g, ' ').trim();
}

/** Every table on the page, as rows of cell text. */
export function parseHtmlTables(html: string): string[][][] {
  const tables: string[][][] = [];
  for (const tableMatch of html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)) {
    const rows: string[][] = [];
    for (const rowMatch of (tableMatch[1] ?? '').matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells: string[] = [];
      for (const cellMatch of (rowMatch[1] ?? '').matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)) {
        cells.push(stripTags(cellMatch[1] ?? ''));
      }
      if (cells.length) rows.push(cells);
    }
    if (rows.length) tables.push(rows);
  }
  return tables;
}

export interface TableSelect {
  /** Zero based index of the table to use. */
  tableIndex?: number;
  /** Choose the first table whose header row contains all of these, case insensitive. */
  requireHeaders?: string[];
}

/**
 * Pick the interesting table. Header matching is preferred over an index, because
 * a page redesign moves indexes around but rarely renames the columns.
 */
export function selectTable(tables: string[][][], sel: TableSelect = {}): string[][] | null {
  if (sel.requireHeaders?.length) {
    const want = sel.requireHeaders.map((h) => h.toLowerCase());
    for (const t of tables) {
      const header = (t[0] ?? []).map((c) => c.toLowerCase());
      if (want.every((w) => header.some((h) => h.includes(w)))) return t;
    }
    return null;
  }
  return tables[sel.tableIndex ?? 0] ?? null;
}

/** Rows of a table as objects keyed by the header row. */
export function tableToObjects(rows: string[][]): Array<Record<string, string>> {
  if (rows.length < 2) return [];
  const header = (rows[0] ?? []).map((h, i) => h || `column_${i + 1}`);
  const out: Array<Record<string, string>> = [];
  for (const row of rows.slice(1)) {
    // Skip separator or repeated header rows.
    if (row.every((c) => !c)) continue;
    const o: Record<string, string> = {};
    header.forEach((h, i) => { o[h] = row[i] ?? ''; });
    out.push(o);
  }
  return out;
}
