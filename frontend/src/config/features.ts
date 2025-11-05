export const FEATURES = {
  HIDE_REVIEWS: true,
  HIDE_WHATS_INCLUDED: true,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

export const isFeatureEnabled = (flag: FeatureFlag): boolean => FEATURES[flag];
