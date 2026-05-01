import type { Cohort } from '@/lib/types';

type Tier = Cohort['pricingTiers'][number];

export function getTier(count: number, tiers: Tier[]): Tier | null {
  if (count === 0) return null;
  return tiers.find((t) => count >= t.min && count <= t.max) ?? null;
}
