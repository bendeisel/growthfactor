/*
  Sample report shapes for Client OS.

  These are NOT vendor numbers, and the UI badges them as sample data with the
  credential each one is waiting on. They exist so the panels have a real shape
  to render — swapping in a live adapter means replacing this module's export,
  not touching the components.

  Ads → AdKit (Google + Meta, `breakdown: "day"`).
  SEO → DataForSEO coordinate-anchored local SERP, one call per grid point.
  Web → GA4 Data API + Search Console API.
*/

export type ReportId = "ads" | "seo" | "web";

export interface AdsReport {
  spendCents: number;
  leads: number;
  costPerLeadCents: number;
  roas: number;
  dailySpendCents: number[];
  delivery: [string, string][];
}

export interface SeoReport {
  city: string;
  keywords: number;
  /** 7×7 local rank grid, row-major. Index 24 is the business address. */
  grid: number[];
}

export interface WebReport {
  sessions: number;
  conversions: number;
  conversionRate: number;
  avgPosition: number;
  dailySessions: number[];
  search: [string, string][];
}

export interface ClientReport {
  ads: AdsReport;
  seo: SeoReport;
  web: WebReport;
}

export const CLIENT_REPORTS: Record<string, ClientReport> = {
  "nashville-mma": {
    ads: {
      spendCents: 214_000,
      leads: 63,
      costPerLeadCents: 3397,
      roas: 4.1,
      dailySpendCents: [12_000, 14_200, 9_800, 17_500, 16_000, 18_800, 15_100, 20_500, 19_000, 16_700, 21_200, 19_800, 17_600, 22_200],
      delivery: [["Impressions", "184,220"], ["Clicks", "3,110"], ["CTR", "1.69%"], ["Conv. rate", "2.03%"]],
    },
    seo: {
      city: "Nashville, TN",
      keywords: 14,
      grid: [7, 6, 5, 4, 5, 7, 9, 6, 4, 3, 3, 4, 6, 8, 5, 3, 2, 2, 2, 4, 6, 4, 2, 1, 1, 1, 3, 5, 5, 3, 2, 1, 2, 3, 6, 7, 5, 3, 2, 3, 5, 8, 9, 7, 5, 4, 5, 7, 11],
    },
    web: {
      sessions: 4812,
      conversions: 96,
      conversionRate: 2.0,
      avgPosition: 12.4,
      dailySessions: [280, 310, 295, 340, 362, 331, 388, 401, 377, 420, 444, 412, 468, 491],
      search: [["Impressions", "62,400"], ["Clicks", "2,180"], ["CTR", "3.49%"], ["New visitors", "71%"]],
    },
  },
  "fighters-boxing": {
    ads: {
      spendCents: 178_000,
      leads: 29,
      costPerLeadCents: 6138,
      roas: 1.9,
      dailySpendCents: [14_500, 13_800, 15_200, 12_000, 11_000, 9_800, 13_200, 10_500, 9_400, 11_800, 10_100, 8_800, 9_600, 8_300],
      delivery: [["Impressions", "96,410"], ["Clicks", "1,240"], ["CTR", "1.29%"], ["Conv. rate", "2.34%"]],
    },
    seo: {
      city: "Nashville, TN",
      keywords: 11,
      grid: [14, 13, 11, 10, 11, 13, 16, 12, 10, 8, 7, 9, 11, 14, 10, 8, 6, 5, 6, 9, 12, 9, 6, 4, 3, 4, 7, 10, 10, 7, 5, 4, 5, 8, 11, 12, 10, 8, 7, 9, 12, 15, 15, 13, 11, 10, 12, 14, 18],
    },
    web: {
      sessions: 2204,
      conversions: 31,
      conversionRate: 1.4,
      avgPosition: 18.9,
      dailySessions: [210, 198, 205, 182, 176, 190, 165, 171, 158, 163, 149, 155, 142, 138],
      search: [["Impressions", "28,900"], ["Clicks", "842"], ["CTR", "2.91%"], ["New visitors", "64%"]],
    },
  },
  "fuel-fortress": {
    ads: {
      spendCents: 341_000,
      leads: 71,
      costPerLeadCents: 4803,
      roas: 2.8,
      dailySpendCents: [19_000, 20_500, 24_000, 21_800, 26_200, 24_400, 28_100, 27_000, 29_500, 25_800, 31_200, 28_800, 30_100, 32_700],
      delivery: [["Impressions", "241,880"], ["Clicks", "4,620"], ["CTR", "1.91%"], ["Conv. rate", "1.54%"]],
    },
    seo: {
      city: "Nashville, TN",
      keywords: 18,
      grid: [9, 8, 7, 6, 7, 9, 12, 8, 6, 5, 4, 5, 7, 10, 7, 5, 3, 3, 3, 5, 8, 6, 3, 2, 1, 2, 4, 7, 7, 4, 3, 2, 3, 5, 8, 9, 7, 5, 4, 6, 8, 11, 12, 10, 8, 7, 9, 11, 14],
    },
    web: {
      sessions: 6140,
      conversions: 148,
      conversionRate: 2.4,
      avgPosition: 9.1,
      dailySessions: [380, 412, 398, 455, 470, 441, 502, 528, 499, 551, 570, 544, 601, 628],
      search: [["Impressions", "91,200"], ["Clicks", "3,940"], ["CTR", "4.32%"], ["New visitors", "68%"]],
    },
  },
  "furst-place-mma": {
    ads: {
      spendCents: 129_000,
      leads: 38,
      costPerLeadCents: 3395,
      roas: 3.6,
      dailySpendCents: [8_800, 9_400, 11_000, 10_200, 12_100, 11_500, 9_800, 13_400, 12_800, 11_600, 14_100, 13_000, 12_400, 14_800],
      delivery: [["Impressions", "74,300"], ["Clicks", "1,510"], ["CTR", "2.03%"], ["Conv. rate", "2.52%"]],
    },
    seo: {
      city: "Bellevue, TN",
      keywords: 9,
      grid: [12, 11, 9, 8, 9, 11, 14, 10, 8, 7, 6, 7, 9, 12, 9, 7, 5, 4, 5, 7, 10, 8, 5, 3, 2, 3, 6, 9, 9, 6, 4, 3, 4, 6, 10, 11, 9, 7, 6, 8, 10, 13, 13, 11, 10, 9, 11, 13, 16],
    },
    web: {
      sessions: 1880,
      conversions: 44,
      conversionRate: 2.3,
      avgPosition: 14.7,
      dailySessions: [130, 142, 138, 155, 161, 149, 172, 168, 181, 175, 190, 184, 198, 206],
      search: [["Impressions", "21,600"], ["Clicks", "703"], ["CTR", "3.25%"], ["New visitors", "73%"]],
    },
  },
};
