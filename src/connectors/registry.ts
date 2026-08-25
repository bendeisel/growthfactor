import type { SourceConfig } from '../core/types.ts';
import type { Connector } from './index.ts';
import { arcgisConnector } from './arcgis.ts';
import { csvConnector } from './csv.ts';
import { htmlConnector } from './html.ts';
import { reapiConnector } from './reapi.ts';
import { socrataConnector } from './socrata.ts';

export const CONNECTORS: Record<string, Connector> = {
  arcgis: arcgisConnector,
  socrata: socrataConnector,
  csv: csvConnector,
  html: htmlConnector,
  reapi: reapiConnector,
};

/**
 * The browser connector is registered lazily because it needs Node builtins and a
 * local Chromium, neither of which exists inside a Supabase Edge Function. Sources
 * with kind "browser" therefore run from the CLI or a cron box, not from the edge.
 */
async function loadBrowserConnector(): Promise<Connector | undefined> {
  try {
    const mod = await import('./browser.ts');
    return mod.browserConnector;
  } catch {
    return undefined;
  }
}

export async function ensureConnector(cfg: SourceConfig): Promise<Connector> {
  if (cfg.kind === 'browser' && !CONNECTORS.browser) {
    const c = await loadBrowserConnector();
    if (!c) {
      throw new Error(
        `source ${cfg.name}: kind "browser" needs a local Chromium and a Node runtime. `
        + 'Run it from the CLI rather than a Supabase Edge Function.',
      );
    }
    CONNECTORS.browser = c;
  }
  return connectorFor(cfg);
}

export function connectorFor(cfg: SourceConfig): Connector {
  const c = CONNECTORS[cfg.kind];
  if (!c) throw new Error(`source ${cfg.name}: unknown kind "${cfg.kind}"`);
  return c;
}

/** Cents per record for this source. Free public data stays at zero. */
export function costPerRecordCents(cfg: SourceConfig): number {
  return cfg.costPerRecordCents ?? connectorFor(cfg).defaultCostPerRecordCents;
}
