import type { MetricsAdapter } from "@/lib/metrics/types";
import { fetchNormalized, NotConfiguredError } from "@/lib/metrics/adapters/normalized";

/**
 * Glow Fox, reached through the n8n workflow (locked decision, spec §7).
 *
 * n8n owns the Glow Fox credentials and the scheduled pull; this adapter just
 * reads the normalized result. Metrics pulled per spec: MTD, last month,
 * revenue, new members, cancellations, past due, active member count.
 */

function url() {
  return process.env.GLOWFOX_N8N_URL;
}

export const glowFoxAdapter: MetricsAdapter = {
  id: "glowfox",
  label: "Glow Fox (n8n)",
  isConfigured: () => Boolean(url()),
  missingReason: () => (url() ? undefined : "needs GLOWFOX_N8N_URL"),
  async fetchMetrics(businesses) {
    const endpoint = url();
    if (!endpoint) throw new NotConfiguredError("GLOWFOX_N8N_URL is not set");
    return fetchNormalized({
      source: "glowfox",
      url: endpoint,
      token: process.env.GLOWFOX_N8N_TOKEN,
      businesses,
    });
  },
};
