// Central place for names, prices and labels. Change the brand here.

export const SITE = {
  name: "Manifesto Tracker",
  tagline: "Every promise, tracked in public.",
  country: "Malaysia",
};

export const PLAN = {
  name: "Wakil",
  priceLabel: "RM 49",
  interval: "month",
  perks: [
    "Verified politician profile",
    "Publish and update your own milestones",
    "Edit your background, position and constituency",
    "Cancel any time — your public record stays",
  ],
};

export const CATEGORIES = [
  "Economy",
  "Social welfare",
  "Education",
  "Health",
  "Governance",
  "Infrastructure",
  "Digital",
  "Housing",
  "Environment",
  "Security",
  "Other",
] as const;

export const STATUSES = ["pledged", "in_progress", "achieved", "delayed", "broken"] as const;
export type MilestoneStatus = (typeof STATUSES)[number];
export const STATUS_FILTERS = [...STATUSES, "unknown"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export const STATUS_LABEL: Record<StatusFilter, string> = {
  unknown: "Unknown",
  pledged: "Pledged",
  in_progress: "In progress",
  achieved: "Achieved",
  delayed: "Delayed",
  broken: "Broken",
};

export const TYPE_LABEL = {
  bloc: "Bloc",
  alliance: "Coalition",
  party: "Party",
  politician: "Politician",
} as const;

export const BLOC_LABEL = {
  government: "Government",
  opposition: "Opposition",
  independent: "Independent",
} as const;

export function siteUrl() {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function isDemoMode() {
  return process.env.DEMO_MODE === "true";
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}
