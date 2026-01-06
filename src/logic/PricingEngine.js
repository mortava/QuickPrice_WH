/**
 * Pricing Engine for Defy TPO
 * Calculates final rates by applying LLPA adjustments to base rates
 */

import { BASE_RATES, PROGRAMS, LLPA_NONQM_C, LLPA_DSCR_C } from '../data/rateSheets';

export class PricingEngine {

  /**
   * Determine the program based on input parameters
   */
  static selectProgram(input) {
    const { docType, occupancy, loanAmount } = input;

    // DSCR programs
    if (docType === 'DSCR') {
      if (loanAmount >= 250000) {
        return 'DSCR-A';
      }
      return 'DSCR-C';
    }

    // NonQM programs
    if (loanAmount >= 1000000) {
      return 'NonQM-A';
    }
    return 'NonQM-C';
  }

  /**
   * Get LTV bucket string based on LTV value and program
   */
  static getLtvBucket(ltv, program) {
    const buckets = PROGRAMS[program]?.ltvBuckets || [];

    for (const bucket of buckets) {
      if (bucket.startsWith('≤')) {
        const max = parseFloat(bucket.replace('≤', ''));
        if (ltv <= max) return bucket;
      } else if (bucket.includes('-')) {
        const [min, max] = bucket.split('-').map(v => parseFloat(v));
        if (ltv > min && ltv <= max) return bucket;
      }
    }
    return null; // Out of bounds
  }

  /**
   * Get LLPA adjustment from a table
   */
  static getAdjustment(table, key, ltvBucket) {
    if (!table || !table[key] || !table[key][ltvBucket]) {
      return 0;
    }
    const value = table[key][ltvBucket];
    return value === null ? null : value; // null means ineligible
  }

  /**
   * Map credit score to bucket key
   */
  static mapCreditScore(score, isDSCR = false) {
    if (typeof score === 'string') {
      // Already a bucket string
      if (score.includes('780') || score === '≥780') return isDSCR ? '≥760' : '≥780';
      if (score.includes('760-779')) return isDSCR ? '≥760' : '760-779';
      if (score.includes('740-759')) return '740-759';
      if (score.includes('720-739')) return '720-739';
      if (score.includes('700-719')) return '700-719';
      if (score.includes('680-699')) return '680-699';
      if (score.includes('660-679')) return '660-679';
      if (score.includes('640-659')) return '640-659';
      return '≥780';
    }
    // Numeric score
    if (score >= 780) return isDSCR ? '≥760' : '≥780';
    if (score >= 760) return isDSCR ? '≥760' : '760-779';
    if (score >= 740) return '740-759';
    if (score >= 720) return '720-739';
    if (score >= 700) return '700-719';
    if (score >= 680) return '680-699';
    if (score >= 660) return '660-679';
    if (score >= 640) return '640-659';
    return '640-659';
  }

  /**
   * Map loan amount to bucket key
   */
  static mapLoanAmount(amount, isDSCR = false) {
    if (isDSCR) {
      if (amount >= 150000 && amount <= 200000) return '$150K-$200K';
      if (amount >= 200001 && amount <= 250000) return '$200K-$250K';
      if (amount >= 250001 && amount <= 999999) return '$250K-$999K';
      if (amount >= 1000000 && amount <= 1500000) return '$1M-$1.5M';
      if (amount >= 1500001 && amount <= 2000000) return '$1.5M-$2M';
      return '$250K-$999K';
    }
    if (amount >= 100000 && amount <= 149999) return '$100K-$149K';
    if (amount >= 150000 && amount <= 999999) return '$150K-$999K';
    if (amount >= 1000000 && amount <= 1999999) return '$1M-$1.99M';
    if (amount >= 2000000 && amount <= 3000000) return '$2M-$3M';
    return '$150K-$999K';
  }

  /**
   * Map product type to LLPA key
   */
  static mapProduct(product) {
    if (product.includes('Interest-Only') && product.includes('40')) return 'Interest-Only (40yr)';
    if (product.includes('Interest-Only')) return 'Interest-Only (30yr)';
    return '30yr Fixed';
  }

  /**
   * Map property type to LLPA key
   */
  static mapPropertyType(type, isDSCR = false) {
    if (type.includes('SFR') || type.includes('Single Family')) return 'SFR';
    if (type.includes('Condo')) return 'Condo';
    if (isDSCR) {
      if (type.includes('2 Unit') || type === '2 Unit') return '2 Unit';
      if (type.includes('3-4 Unit')) return '3-4 Unit';
    }
    if (type.includes('2-4')) return '2-4 Unit';
    return 'SFR';
  }

  /**
   * Map purpose with credit score consideration
   */
  static mapPurpose(purpose, creditScore, isDSCR = false) {
    if (purpose === 'Purchase') return 'Purchase';
    if (purpose === 'Rate/Term') return 'Rate/Term';
    if (isDSCR) return 'Cash-Out';
    // NonQM splits cash-out by credit score
    const scoreNum = typeof creditScore === 'string'
      ? parseInt(creditScore.match(/\d+/)?.[0] || '720')
      : creditScore;
    return scoreNum >= 720 ? 'Cash-Out ≥720' : 'Cash-Out ≤719';
  }

  /**
   * Map DSCR ratio to LLPA key
   */
  static mapDscrRatio(ratio) {
    if (typeof ratio === 'string') {
      if (ratio.includes('≥1.25') || ratio.includes('1.25')) return '≥1.250';
      return '1.000-1.249';
    }
    return ratio >= 1.25 ? '≥1.250' : '1.000-1.249';
  }

  /**
   * Map prepay period
   */
  static mapPrepayPeriod(period) {
    if (period.includes('0') || period.includes('No')) return '0-No Prepay';
    if (period.includes('1')) return '1yr';
    if (period.includes('2')) return '2yr';
    if (period.includes('3')) return '3yr';
    if (period.includes('4')) return '4yr';
    if (period.includes('5')) return '5yr';
    return '3yr';
  }

  /**
   * Map prepay fee
   */
  static mapPrepayFee(fee) {
    if (fee.includes('5%') || fee.includes('Standard')) return '5% Standard';
    if (fee.includes('6 Mo') || fee.includes('Interest')) return '6 Mo Interest';
    if (fee.includes('Declining')) return 'Declining';
    return '5% Standard';
  }

  /**
   * Calculate total LLPA adjustment for NonQM programs
   */
  static calculateNonQmLlpa(input, ltvBucket) {
    const llpa = LLPA_NONQM_C;
    const adjustments = [];
    let total = 0;

    // Credit Score
    const scoreKey = this.mapCreditScore(input.creditScore, false);
    const scoreAdj = this.getAdjustment(llpa.score, scoreKey, ltvBucket);
    if (scoreAdj === null) return { total: null, adjustments, ineligible: 'Credit Score' };
    adjustments.push({ name: 'Credit Score', key: scoreKey, value: scoreAdj });
    total += scoreAdj;

    // Loan Amount
    const loanKey = this.mapLoanAmount(input.loanAmount, false);
    const loanAdj = this.getAdjustment(llpa.loanAmount, loanKey, ltvBucket);
    if (loanAdj === null) return { total: null, adjustments, ineligible: 'Loan Amount' };
    adjustments.push({ name: 'Loan Amount', key: loanKey, value: loanAdj });
    total += loanAdj;

    // Purpose
    const purposeKey = this.mapPurpose(input.loanPurpose, input.creditScore, false);
    const purposeAdj = this.getAdjustment(llpa.purpose, purposeKey, ltvBucket);
    if (purposeAdj === null) return { total: null, adjustments, ineligible: 'Loan Purpose' };
    adjustments.push({ name: 'Purpose', key: purposeKey, value: purposeAdj });
    total += purposeAdj;

    // Product
    const productKey = this.mapProduct(input.loanProduct);
    const productAdj = this.getAdjustment(llpa.product, productKey, ltvBucket);
    if (productAdj === null) return { total: null, adjustments, ineligible: 'Loan Product' };
    adjustments.push({ name: 'Product', key: productKey, value: productAdj });
    total += productAdj;

    // Occupancy
    const occAdj = this.getAdjustment(llpa.occupancy, input.occupancy, ltvBucket);
    if (occAdj === null) return { total: null, adjustments, ineligible: 'Occupancy' };
    adjustments.push({ name: 'Occupancy', key: input.occupancy, value: occAdj });
    total += occAdj;

    // Property Type
    const propKey = this.mapPropertyType(input.propertyType, false);
    const propAdj = this.getAdjustment(llpa.propertyType, propKey, ltvBucket);
    if (propAdj === null) return { total: null, adjustments, ineligible: 'Property Type' };
    adjustments.push({ name: 'Property Type', key: propKey, value: propAdj });
    total += propAdj;

    // Citizenship
    const citKey = input.citizenship === 'US Citizen' ? 'US Citizen'
      : input.citizenship === 'Perm-Resident' ? 'Perm-Resident'
      : 'Non-Perm Resident';
    const citAdj = this.getAdjustment(llpa.citizenship, citKey, ltvBucket);
    if (citAdj !== null) {
      adjustments.push({ name: 'Citizenship', key: citKey, value: citAdj });
      total += citAdj;
    }

    // Income Doc Type
    const docKey = input.docType.includes('Full Doc') ? '1yr Full Doc'
      : input.docType.includes('1099') ? '1yr 1099 Only'
      : input.docType.includes('Bank') ? '12m Bank Stmts'
      : input.docType.includes('Asset') ? 'Asset Depletion'
      : '12m Bank Stmts';
    const docAdj = this.getAdjustment(llpa.incomeDocType, docKey, ltvBucket);
    if (docAdj !== null) {
      adjustments.push({ name: 'Doc Type', key: docKey, value: docAdj });
      total += docAdj;
    }

    // DTI
    const dtiKey = input.dti.includes('≤43') ? '≤43%' : '43.01-50%';
    const dtiAdj = this.getAdjustment(llpa.dti, dtiKey, ltvBucket);
    if (dtiAdj !== null) {
      adjustments.push({ name: 'DTI', key: dtiKey, value: dtiAdj });
      total += dtiAdj;
    }

    // Prepay Period
    const prepayKey = this.mapPrepayPeriod(input.prepayPeriod);
    const prepayAdj = this.getAdjustment(llpa.prepayPeriod, prepayKey, ltvBucket);
    if (prepayAdj !== null) {
      adjustments.push({ name: 'Prepay Period', key: prepayKey, value: prepayAdj });
      total += prepayAdj;
    }

    // Prepay Fee
    const feeKey = this.mapPrepayFee(input.prepayFee);
    const feeAdj = this.getAdjustment(llpa.prepayFee, feeKey, ltvBucket);
    if (feeAdj !== null) {
      adjustments.push({ name: 'Prepay Fee', key: feeKey, value: feeAdj });
      total += feeAdj;
    }

    // Escrow Waiver
    const escrowKey = input.escrowWaiver ? 'Yes' : 'No';
    const escrowAdj = this.getAdjustment(llpa.escrowWaiver, escrowKey, ltvBucket);
    if (escrowAdj !== null) {
      adjustments.push({ name: 'Escrow Waiver', key: escrowKey, value: escrowAdj });
      total += escrowAdj;
    }

    // Lock Term
    const lockAdj = this.getAdjustment(llpa.lockTerm, input.lockTerm, ltvBucket);
    if (lockAdj !== null) {
      adjustments.push({ name: 'Lock Term', key: input.lockTerm, value: lockAdj });
      total += lockAdj;
    }

    // State adjustment
    const stateAdj = this.getAdjustment(llpa.stateAdj, input.state, ltvBucket);
    if (stateAdj) {
      adjustments.push({ name: 'State', key: input.state, value: stateAdj });
      total += stateAdj;
    }

    return { total, adjustments, ineligible: null };
  }

  /**
   * Calculate total LLPA adjustment for DSCR programs
   */
  static calculateDscrLlpa(input, ltvBucket) {
    const llpa = LLPA_DSCR_C;
    const adjustments = [];
    let total = 0;

    // Credit Score (DSCR uses different buckets)
    const scoreKey = this.mapCreditScore(input.creditScore, true);
    const scoreAdj = this.getAdjustment(llpa.score, scoreKey, ltvBucket);
    if (scoreAdj === null) return { total: null, adjustments, ineligible: 'Credit Score' };
    if (scoreAdj !== undefined) {
      adjustments.push({ name: 'Credit Score', key: scoreKey, value: scoreAdj });
      total += scoreAdj;
    }

    // DSCR Ratio
    const dscrKey = this.mapDscrRatio(input.dscrRatio);
    const dscrAdj = this.getAdjustment(llpa.dscrRatio, dscrKey, ltvBucket);
    if (dscrAdj !== null && dscrAdj !== undefined) {
      adjustments.push({ name: 'DSCR Ratio', key: dscrKey, value: dscrAdj });
      total += dscrAdj;
    }

    // STR
    const strKey = input.dscrShortTermRental ? 'Yes' : 'No';
    const strAdj = this.getAdjustment(llpa.str, strKey, ltvBucket);
    if (strAdj === null) return { total: null, adjustments, ineligible: 'Short Term Rental' };
    adjustments.push({ name: 'Short Term Rental', key: strKey, value: strAdj });
    total += strAdj;

    // Product
    const productKey = this.mapProduct(input.loanProduct);
    const productAdj = this.getAdjustment(llpa.product, productKey, ltvBucket);
    if (productAdj === null) return { total: null, adjustments, ineligible: 'Loan Product' };
    adjustments.push({ name: 'Product', key: productKey, value: productAdj });
    total += productAdj;

    // Loan Amount
    const loanKey = this.mapLoanAmount(input.loanAmount, true);
    const loanAdj = this.getAdjustment(llpa.loanAmount, loanKey, ltvBucket);
    if (loanAdj !== null && loanAdj !== undefined) {
      adjustments.push({ name: 'Loan Amount', key: loanKey, value: loanAdj });
      total += loanAdj;
    }

    // Purpose
    const purposeAdj = this.getAdjustment(llpa.purpose, input.loanPurpose, ltvBucket);
    if (purposeAdj === null) return { total: null, adjustments, ineligible: 'Loan Purpose' };
    adjustments.push({ name: 'Purpose', key: input.loanPurpose, value: purposeAdj });
    total += purposeAdj;

    // Property Type
    const propKey = this.mapPropertyType(input.propertyType, true);
    const propAdj = this.getAdjustment(llpa.propertyType, propKey, ltvBucket);
    if (propAdj !== null && propAdj !== undefined) {
      adjustments.push({ name: 'Property Type', key: propKey, value: propAdj });
      total += propAdj;
    }

    // Prepay Period
    const prepayKey = this.mapPrepayPeriod(input.prepayPeriod);
    const prepayAdj = this.getAdjustment(llpa.prepayPeriod, prepayKey, ltvBucket);
    if (prepayAdj !== null) {
      adjustments.push({ name: 'Prepay Period', key: prepayKey, value: prepayAdj });
      total += prepayAdj;
    }

    // Prepay Fee
    const feeKey = this.mapPrepayFee(input.prepayFee);
    const feeAdj = this.getAdjustment(llpa.prepayFee, feeKey, ltvBucket);
    if (feeAdj !== null) {
      adjustments.push({ name: 'Prepay Fee', key: feeKey, value: feeAdj });
      total += feeAdj;
    }

    // Escrow Waiver
    const escrowKey = input.escrowWaiver ? 'Yes' : 'No';
    const escrowAdj = this.getAdjustment(llpa.escrowWaiver, escrowKey, ltvBucket);
    if (escrowAdj !== null) {
      adjustments.push({ name: 'Escrow Waiver', key: escrowKey, value: escrowAdj });
      total += escrowAdj;
    }

    // Lock Term
    const lockAdj = this.getAdjustment(llpa.lockTerm, input.lockTerm, ltvBucket);
    if (lockAdj !== null) {
      adjustments.push({ name: 'Lock Term', key: input.lockTerm, value: lockAdj });
      total += lockAdj;
    }

    // State adjustment
    const stateAdj = this.getAdjustment(llpa.stateAdj, input.state, ltvBucket);
    if (stateAdj) {
      adjustments.push({ name: 'State', key: input.state, value: stateAdj });
      total += stateAdj;
    }

    return { total, adjustments, ineligible: null };
  }

  /**
   * Main pricing calculation
   * Returns array of rate/price combinations with adjustments applied
   */
  static calculateRates(input) {
    // Calculate LTV
    const ltv = (input.loanAmount / input.purchasePrice) * 100;

    // Select program
    const programKey = this.selectProgram(input);
    const program = PROGRAMS[programKey];

    if (!program) {
      return { error: 'No matching program found', rates: [] };
    }

    // Get LTV bucket
    const ltvBucket = this.getLtvBucket(ltv, programKey);
    if (!ltvBucket) {
      return { error: `LTV ${ltv.toFixed(2)}% exceeds program maximum`, rates: [] };
    }

    // Calculate LLPA
    const isDSCR = programKey.includes('DSCR');
    const llpaResult = isDSCR
      ? this.calculateDscrLlpa(input, ltvBucket)
      : this.calculateNonQmLlpa(input, ltvBucket);

    if (llpaResult.total === null) {
      return {
        error: `Ineligible: ${llpaResult.ineligible} combination not available at this LTV`,
        rates: [],
        adjustments: llpaResult.adjustments
      };
    }

    // Apply LLPA to base rates
    const baseRates = program.baseRates;
    const adjustedRates = baseRates.map(({ rate, price }) => ({
      rate: rate,
      basePrice: price,
      llpaTotal: llpaResult.total,
      finalPrice: parseFloat((price + llpaResult.total).toFixed(3)),
    }));

    // Filter to show rates where finalPrice is reasonable (95-105 range typically)
    const eligibleRates = adjustedRates.filter(r => r.finalPrice >= 97 && r.finalPrice <= 106);

    return {
      program: program.name,
      programKey,
      ltv: ltv.toFixed(2),
      ltvBucket,
      llpaTotal: llpaResult.total,
      adjustments: llpaResult.adjustments,
      rates: eligibleRates.length > 0 ? eligibleRates : adjustedRates.slice(0, 10),
      allRates: adjustedRates,
    };
  }
}

export default PricingEngine;
