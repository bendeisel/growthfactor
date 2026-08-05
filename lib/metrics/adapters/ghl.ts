import type { MetricsAdapter } from "@/lib/metrics/types";
import { fetchNormalized, NotConfiguredError } from "@/lib/metrics/adapters/normalized";

/**
 * GoHighLevel subaccounts.
 *
 * Phase 2 decision still open: either an n8n workflow that fans out over the
 * subaccounts with the existing PIT tokens, or a serverless function doing the
 * same. Either way it lands on the normalized contract below, so this adapter
 * does not change when that choice is made.
 */

function url() {
  return process.env.GHL_METRICS_URL;
}

export const ghlAdapter: MetricsAdapter = {
  id: "ghl",
  label: "GHL subaccounts",
  isConfigured: () => Boolean(url()),
  missingReason: () => (url() ? undefined : "needs GHL_METRICS_URL"),
  async fetchMetrics(businesses) {
    const endpoint = url();
    if (!endpoint) throw new NotConfiguredError("GHL_METRICS_URL is not set");
    return fetchNormalized({
      source: "ghl",
      url: endpoint,
      token: process.env.GHL_METRICS_TOKEN,
      businesses,
    });
  },
};
