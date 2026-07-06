export const MEMBERSHIP_CONFIG = {
  NONE: { label: "普通会员", discountRate: 1.0 },
  LEVEL1: { label: "心悦1级", discountRate: 0.98, threshold: 8000 },
  LEVEL2: { label: "心悦2级", discountRate: 0.95, threshold: 80000 },
  LEVEL3: { label: "心悦3级", discountRate: 0.90, threshold: 200000 },
} as const;

export type MembershipLevel = keyof typeof MEMBERSHIP_CONFIG;

export function getDiscountRate(level: MembershipLevel): number {
  return MEMBERSHIP_CONFIG[level].discountRate;
}

export function getLevelLabel(level: MembershipLevel): string {
  return MEMBERSHIP_CONFIG[level].label;
}

/**
 * 根据累计消费金额计算会员等级（只升不降）
 */
export function computeNewLevel(totalSpent: number, currentLevel: MembershipLevel): MembershipLevel {
  const tiers: { level: MembershipLevel; threshold: number }[] = [
    { level: "LEVEL3", threshold: 200000 },
    { level: "LEVEL2", threshold: 80000 },
    { level: "LEVEL1", threshold: 8000 },
  ];

  for (const tier of tiers) {
    if (totalSpent >= tier.threshold) {
      const levels: MembershipLevel[] = ["NONE", "LEVEL1", "LEVEL2", "LEVEL3"];
      const currentIndex = levels.indexOf(currentLevel);
      const newIndex = levels.indexOf(tier.level);
      return newIndex > currentIndex ? tier.level : currentLevel;
    }
  }
  return currentLevel;
}
