// GHL API push.
//
// HARD RULE: nothing in this file sends a message to a seller and nothing in this
// file sends an offer. It creates or updates a contact, attaches the deal numbers
// as custom fields, and creates an opportunity in a pipeline stage. That is all.
// No workflow trigger endpoint is called, so importing a lead cannot kick off an
// SMS or email sequence.
//
// A lead must already be staged at awaiting_approval and the caller must pass an
// explicit confirmation before anything is written to GHL.

import { HttpClient } from '../core/http.ts';
import { getEnv } from '../core/env.ts';
import { splitOwnerName } from '../core/normalize.ts';
import { contactAddress } from './ghl-csv.ts';
import type { LeadRecord } from '../store/index.ts';

const BASE = 'https://services.leadconnectorhq.com';

export interface GhlConfig {
  apiKey: string;
  locationId: string;
  pipelineId?: string;
  pipelineStageId?: string;
  /** GHL API version header. Required by the v2 API. */
  version?: string;
  /**
   * Canonical field name to GHL custom field id. Must be created in GHL first and
   * listed here. Never guessed: an unknown id is dropped with a warning.
   */
  customFieldIds?: Record<string, string>;
  nameOrder?: 'last-first' | 'first-last';
}

export function ghlConfigFromEnv(overrides: Partial<GhlConfig> = {}): GhlConfig {
  const cfg: GhlConfig = {
    apiKey: overrides.apiKey ?? getEnv('GHL_API_KEY') ?? '',
    locationId: overrides.locationId ?? getEnv('GHL_LOCATION_ID') ?? '',
    pipelineId: overrides.pipelineId ?? getEnv('GHL_PIPELINE_ID'),
    pipelineStageId: overrides.pipelineStageId ?? getEnv('GHL_PIPELINE_STAGE_ID'),
    version: overrides.version ?? '2021-07-28',
    customFieldIds: overrides.customFieldIds ?? {},
    nameOrder: overrides.nameOrder ?? 'last-first',
  };
  if (!cfg.apiKey) throw new Error('GHL_API_KEY is not set. Create a Private Integration token in GHL.');
  if (!cfg.locationId) throw new Error('GHL_LOCATION_ID is not set.');
  return cfg;
}

function headers(cfg: GhlConfig): Record<string, string> {
  return {
    authorization: `Bearer ${cfg.apiKey}`,
    version: cfg.version ?? '2021-07-28',
    'content-type': 'application/json',
  };
}

export interface GhlCustomField {
  id: string;
  name?: string;
  fieldKey?: string;
  dataType?: string;
}

/** List the custom fields that exist in the sub-account, so ids are looked up, not guessed. */
export async function listCustomFields(cfg: GhlConfig, http = new HttpClient()): Promise<GhlCustomField[]> {
  const body = await http.getJson<{ customFields?: GhlCustomField[] }>(
    `${BASE}/locations/${cfg.locationId}/customFields`,
    { headers: headers(cfg) },
  );
  return body.customFields ?? [];
}

/** The lead values worth carrying into GHL as custom fields. */
export function customFieldValues(l: LeadRecord): Record<string, string> {
  return {
    property_address: l.addressLine ?? '',
    property_city: l.city ?? '',
    property_state: l.state ?? '',
    property_zip: l.zip ?? '',
    county: l.county ?? '',
    estimated_value: String(l.estimatedValue ?? ''),
    equity_percent: String(l.equityPercent ?? ''),
    equity_basis: l.equityBasis ?? '',
    distress_types: l.distressTypes.join('; '),
    strategy: l.strategy ?? '',
    overall_score: String(l.overallScore ?? ''),
    seller_finance_score: String(l.sellerFinanceScore ?? ''),
    years_owned: String(l.yearsOwned ?? ''),
    owner_type: l.ownerType ?? '',
    lead_id: l.id,
  };
}

export interface PushResult {
  contactId?: string;
  opportunityId?: string;
  skippedFields: string[];
  warnings: string[];
}

export async function pushLead(
  l: LeadRecord,
  cfg: GhlConfig,
  opts: { confirm: boolean; opportunityValue?: number; http?: HttpClient; baseUrl?: string },
): Promise<PushResult> {
  if (!opts.confirm) {
    throw new Error('pushLead requires explicit confirmation. Nothing was sent.');
  }
  if (l.pipelineStage && l.pipelineStage !== 'awaiting_approval' && l.pipelineStage !== 'new' && l.pipelineStage !== 'reviewing') {
    // Guard against re-pushing something already moving through the pipeline.
    if (l.pipelineStage === 'offer_sent') {
      throw new Error(`lead ${l.id} is already at offer_sent. Refusing to touch it.`);
    }
  }

  const http = opts.http ?? new HttpClient();
  const base = opts.baseUrl ?? BASE;
  const warnings: string[] = [];
  const skippedFields: string[] = [];
  const name = splitOwnerName(l.ownerName, cfg.nameOrder);
  const mail = contactAddress(l);

  const values = customFieldValues(l);
  const customFields: Array<{ id: string; value: string }> = [];
  for (const [key, value] of Object.entries(values)) {
    const id = cfg.customFieldIds?.[key];
    if (!id) { skippedFields.push(key); continue; }
    if (value !== '') customFields.push({ id, value });
  }
  if (skippedFields.length) {
    warnings.push(`no GHL custom field id configured for: ${skippedFields.join(', ')}`);
  }

  const contactBody: Record<string, unknown> = {
    locationId: cfg.locationId,
    firstName: name.firstName,
    lastName: name.lastName ?? name.companyName,
    companyName: name.companyName,
    address1: mail.address1 || undefined,
    city: mail.city || undefined,
    state: mail.state || undefined,
    postalCode: mail.postalCode || undefined,
    tags: ['gf-lead', l.strategy ? `gf-${l.strategy.replace(/_/g, '-')}` : 'gf-unclassified'],
    source: 'growthfactor-leads',
    customFields,
  };
  for (const k of Object.keys(contactBody)) {
    if (contactBody[k] === undefined) delete contactBody[k];
  }

  const contactRes = await http.getJson<{ contact?: { id?: string }; id?: string }>(
    `${base}/contacts/upsert`,
    { method: 'POST', headers: headers(cfg), body: JSON.stringify(contactBody) },
  );
  const contactId = contactRes.contact?.id ?? contactRes.id;
  if (!contactId) warnings.push('contact upsert returned no id');

  let opportunityId: string | undefined;
  if (contactId && cfg.pipelineId && cfg.pipelineStageId) {
    const oppBody = {
      pipelineId: cfg.pipelineId,
      pipelineStageId: cfg.pipelineStageId,
      locationId: cfg.locationId,
      contactId,
      name: `${l.addressLine ?? 'Lead'} ${l.city ?? ''}`.trim(),
      status: 'open',
      monetaryValue: opts.opportunityValue ?? l.estimatedValue ?? 0,
    };
    const oppRes = await http.getJson<{ opportunity?: { id?: string }; id?: string }>(
      `${base}/opportunities/`,
      { method: 'POST', headers: headers(cfg), body: JSON.stringify(oppBody) },
    );
    opportunityId = oppRes.opportunity?.id ?? oppRes.id;
  } else if (!cfg.pipelineId || !cfg.pipelineStageId) {
    warnings.push('GHL_PIPELINE_ID or GHL_PIPELINE_STAGE_ID not set, contact created without an opportunity');
  }

  return { contactId, opportunityId, skippedFields, warnings };
}
