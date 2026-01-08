/**
 * Defy TPO Pricing Logic Engine
 * Handles cascading rules, LTV calculations, and state license filtering
 */

export class DefyPricingLogic {

  /**
   * 1. BORROWER TRIGGERS (Cascading Rules)
   * Enforces the "Foreign National" and "FTHB" constraints.
   */
  static applyTriggers(input) {
    const adjusted = { ...input };

    // --- RULE: Foreign National Cascade ---
    // IF "Foreign National" -> Set Occupancy=Investment AND DocType=DSCR
    if (adjusted.citizenship === 'Foreign National') {
      adjusted.occupancy = 'Investment';
      adjusted.docType = 'DSCR';
    }

    // --- RULE: DSCR Logic ---
    // IF DocType is DSCR -> Occupancy must be Investment
    if (adjusted.docType === 'DSCR') {
      adjusted.occupancy = 'Investment';
    }

    // --- RULE: First Time Home Buyer (FTHB) ---
    if (adjusted.fthb) {
      if (adjusted.occupancy === 'Second Home') {
        throw new Error("FTHB cannot select Second Home.");
      }

      // VALIDATION: FTHB + Investor + DSCR requires DSCR >= 1.15
      if (adjusted.occupancy === 'Investment' && adjusted.docType === 'DSCR') {
        const dscrValue = parseFloat(adjusted.dscrRatio) || 0;
        if (dscrValue < 1.150 && dscrValue > 0) {
          throw new Error("Hard Stop: FTHB Investor DSCR must be ≥ 1.150");
        }
      }
    }

    return adjusted;
  }

  /**
   * 2. AUTO-CALCULATION & BUCKETING
   * Calculates LTV and finds the "Rate Sheet Bucket"
   */
  static getLTVBucket(loan, value, programLtvBreaks = null) {
    if (!value || value === 0) return "N/A";

    const ltv = (loan / value) * 100;
    const defaultBreaks = programLtvBreaks || [50, 55, 60, 65, 70, 75, 80, 85, 90];
    const sortedBreaks = [...defaultBreaks].sort((a, b) => a - b);

    for (let i = 0; i < sortedBreaks.length; i++) {
      const ceiling = sortedBreaks[i];
      const floor = i === 0 ? 0 : sortedBreaks[i - 1] + 0.01;

      if (ltv <= ceiling) {
        return i === 0 ? `≤${ceiling}%` : `${floor.toFixed(2)}% - ${ceiling.toFixed(2)}%`;
      }
    }
    return "Out of Bounds";
  }

  /**
   * 3. Calculate raw LTV percentage
   */
  static calculateLTV(loan, value) {
    if (!value || value === 0) return 0;
    return ((loan / value) * 100).toFixed(2);
  }

  /**
   * 4. STATE LICENSE FILTERING
   * Per pricing_logic.md: State eligibility based on doc type and occupancy
   */
  static getAllowedStates(docType, occupancy = null) {
    // DSCR states (expanded list)
    const dscrStates = [
      "AL", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI",
      "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MS", "MO",
      "MT", "NE", "NH", "NJ", "NM", "NY", "OH", "OK", "PA", "RI",
      "SC", "TN", "TX", "VA", "WA", "WV", "WI", "WY"
    ];

    // Primary/Second Home and Non-DSCR states (limited list)
    const limitedStates = ["CA", "CO", "GA", "FL", "TX", "AL", "TN"];

    // IF DocType == DSCR -> Show DSCR state list
    if (docType === 'DSCR') {
      return dscrStates;
    }

    // All other doc types get limited states
    return limitedStates;
  }

  /**
   * 5. LOAN AMOUNT BUCKET MAPPING
   */
  static getLoanAmountBucket(amount) {
    const buckets = [
      { min: 50000, max: 100000, label: "$50K - $100K" },
      { min: 100001, max: 150000, label: "$100K - $150K" },
      { min: 150001, max: 200000, label: "$150K - $200K" },
      { min: 200001, max: 250000, label: "$200K - $250K" },
      { min: 250001, max: 500000, label: "$250K - $500K" },
      { min: 500001, max: 1000000, label: "$500K - $1M" },
      { min: 1000001, max: 1500000, label: "$1M - $1.5M" },
      { min: 1500001, max: 2000000, label: "$1.5M - $2M" },
      { min: 2000001, max: 2500000, label: "$2M - $2.5M" },
      { min: 2500001, max: 3000000, label: "$2.5M - $3M" },
      { min: 3000001, max: 4000000, label: "$3M - $4M" },
      { min: 4000001, max: 5000000, label: "$4M - $5M" },
    ];

    for (const bucket of buckets) {
      if (amount >= bucket.min && amount <= bucket.max) {
        return bucket.label;
      }
    }
    return amount > 5000000 ? ">$5M" : "<$50K";
  }

  /**
   * 6. CREDIT SCORE BUCKET MAPPING
   */
  static getCreditScoreBucket(score) {
    if (score >= 780) return "≥780";
    if (score >= 760) return "760-779";
    if (score >= 740) return "740-759";
    if (score >= 720) return "720-739";
    if (score >= 700) return "700-719";
    if (score >= 680) return "680-699";
    if (score >= 660) return "660-679";
    if (score >= 640) return "640-659";
    if (score >= 620) return "620-639";
    return "<620";
  }
}

export default DefyPricingLogic;
