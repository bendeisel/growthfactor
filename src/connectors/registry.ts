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

export function connectorFor(cfg: SourceConfig): Connector {
  const c = CONNECTORS[cfg.kind];
  if (!c) throw new Error(`source ${cfg.name}: unknown kind "${cfg.kind}"`);
  return c;
}

/** Cents per record for this source. Free public data stays at zero. */
export function costPerRecordCents(cfg: SourceConfig): number {
  return cfg.costPerRecordCents ?? connectorFor(cfg).defaultCostPerRecordCents;
}
