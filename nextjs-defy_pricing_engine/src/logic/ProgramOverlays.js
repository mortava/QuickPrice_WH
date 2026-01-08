/**
 * Program Overlays - Business Rules for Pricing Logic
 *
 * This module contains business rule overrides that apply to pricing calculations.
 * Add new rules here when pricing logic needs to be conditionally applied based on
 * loan characteristics.
 */

/**
 * Overlay Rules Configuration
 * Each rule specifies conditions under which certain LLPA adjustments should be skipped
 */
export const OVERLAY_RULES = {
  /**
   * Prepay Period is only allowed for Investment properties
   * Primary and 2nd Home occupancy types should NOT have prepay adjustments applied
   */
  prepayPeriodInvestmentOnly: {
    name: 'Prepay Period - Investment Only',
    description: 'Prepay period adjustments only apply to Investment occupancy',
    affectedAdjustments: ['prepayPeriod', 'prepayFee'],
    condition: (input) => {
      const occupancy = input.occupancy?.toLowerCase() || '';
      // Only apply prepay adjustments for Investment properties
      return occupancy.includes('investment');
    }
  }
};

/**
 * Check if a specific LLPA adjustment should be applied based on overlay rules
 * @param {string} adjustmentType - The type of adjustment (e.g., 'prepayPeriod', 'prepayFee')
 * @param {object} input - The loan input parameters
 * @returns {boolean} - True if the adjustment should be applied, false if it should be skipped
 */
export function shouldApplyAdjustment(adjustmentType, input) {
  for (const ruleKey of Object.keys(OVERLAY_RULES)) {
    const rule = OVERLAY_RULES[ruleKey];

    // Check if this rule affects the adjustment type
    if (rule.affectedAdjustments.includes(adjustmentType)) {
      // If condition returns false, skip the adjustment
      if (!rule.condition(input)) {
        return false;
      }
    }
  }

  // Default: apply the adjustment
  return true;
}

/**
 * Get a list of all skipped adjustments with reasons
 * @param {object} input - The loan input parameters
 * @returns {Array} - Array of { adjustment, rule, reason } for skipped adjustments
 */
export function getSkippedAdjustments(input) {
  const skipped = [];

  for (const ruleKey of Object.keys(OVERLAY_RULES)) {
    const rule = OVERLAY_RULES[ruleKey];

    // If condition is not met, the adjustments will be skipped
    if (!rule.condition(input)) {
      for (const adj of rule.affectedAdjustments) {
        skipped.push({
          adjustment: adj,
          rule: rule.name,
          reason: rule.description
        });
      }
    }
  }

  return skipped;
}

export default { OVERLAY_RULES, shouldApplyAdjustment, getSkippedAdjustments };
