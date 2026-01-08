/**
 * Pricing Engine for Defy TPO
 * Calculates final rates by applying LLPA adjustments to base rates
 */

import { BASE_RATES, PROGRAMS, LLPA_NONQM_C, LLPA_DSCR_C } from '../data/rateSheets';
import { loadRateSheets, DEFAULT_MARGIN_HOLDBACK } from '../data/rateSheetStorage';
import { shouldApplyAdjustment } from './ProgramOverlays';

function getActiveRateSheets() {
  try {
    const sheets = loadRateSheets();
    return sheets.filter(s => s.isActive !== false);
  } catch (e) {
    console.error('Failed to load rate sheets:', e);
    return [];
  }
}

function isProgramActive(programKey) {
  const keyToSheetId = {
    'NonQM-C': 'defy-nonqm-c',
    'NonQM-A': 'defy-nonqm-a',
    'DSCR-C': 'defy-dscr-c',
    'DSCR-A': 'defy-dscr-a'
  };
  const activeSheets = getActiveRateSheets();
  const sheetId = keyToSheetId[programKey];
  return activeSheets.some(s => s.id === sheetId);
}

const MARGIN_DEDUCTION = -1.625;

export class PricingEngine {
  static selectProgram(input) {
    const { docType, loanAmount } = input;
    if (docType === 'DSCR') {
      return loanAmount >= 250000 ? 'DSCR-A' : 'DSCR-C';
    }
    return loanAmount >= 1000000 ? 'NonQM-A' : 'NonQM-C';
  }

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
    return null;
  }

  static getAdjustment(table, key, ltvBucket) {
    if (!table || !table[key] || !table[key][ltvBucket]) return 0;
    const value = table[key][ltvBucket];
    return value === null ? null : value;
  }

  static mapCreditScore(score, isDSCR = false) {
    if (typeof score === 'string') {
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

  static mapProduct(product) {
    if (product.includes('Interest-Only') && product.includes('40')) return 'Interest-Only (40yr)';
    if (product.includes('Interest-Only')) return 'Interest-Only (30yr)';
    return '30yr Fixed';
  }

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

  static mapPurpose(purpose, creditScore, isDSCR = false) {
    if (purpose === 'Purchase') return 'Purchase';
    if (purpose === 'Rate/Term') return 'Rate/Term';
    if (isDSCR) return 'Cash-Out';
    const scoreNum = typeof creditScore === 'string' ? parseInt(creditScore.match(/d+/)?.[0] || '720') : creditScore;
    return scoreNum >= 720 ? 'Cash-Out ≥720' : 'Cash-Out ≤719';
  }

  static mapDscrRatio(ratio) {
    if (typeof ratio === 'string') {
      if (ratio.includes('≥1.25') || ratio.includes('1.25')) return '≥1.250';
      return '1.000-1.249';
    }
    return ratio >= 1.25 ? '≥1.250' : '1.000-1.249';
  }

  static mapPrepayPeriod(period) {
    if (period.includes('0') || period.includes('No')) return '0-No Prepay';
    if (period.includes('1')) return '1yr';
    if (period.includes('2')) return '2yr';
    if (period.includes('3')) return '3yr';
    if (period.includes('4')) return '4yr';
    if (period.includes('5')) return '5yr';
    return '3yr';
  }

  static mapPrepayFee(fee) {
    if (fee.includes('5%') || fee.includes('Standard')) return '5% Standard';
    if (fee.includes('6 Mo') || fee.includes('Interest')) return '6 Mo Interest';
    if (fee.includes('Declining')) return 'Declining';
    return '5% Standard';
  }

  static calculateNonQmLlpa(input, ltvBucket) {
    const llpa = LLPA_NONQM_C;
    const adjustments = [];
    let total = 0;

    const scoreKey = this.mapCreditScore(input.creditScore, false);
    const scoreAdj = this.getAdjustment(llpa.score, scoreKey, ltvBucket);
    if (scoreAdj === null) return { total: null, adjustments, ineligible: 'Credit Score' };
    adjustments.push({ name: 'Credit Score', key: scoreKey, value: scoreAdj });
    total += scoreAdj;

    const loanKey = this.mapLoanAmount(input.loanAmount, false);
    const loanAdj = this.getAdjustment(llpa.loanAmount, loanKey, ltvBucket);
    if (loanAdj === null) return { total: null, adjustments, ineligible: 'Loan Amount' };
    adjustments.push({ name: 'Loan Amount', key: loanKey, value: loanAdj });
    total += loanAdj;

    const purposeKey = this.mapPurpose(input.loanPurpose, input.creditScore, false);
    const purposeAdj = this.getAdjustment(llpa.purpose, purposeKey, ltvBucket);
    if (purposeAdj === null) return { total: null, adjustments, ineligible: 'Loan Purpose' };
    adjustments.push({ name: 'Purpose', key: purposeKey, value: purposeAdj });
    total += purposeAdj;

    const productKey = this.mapProduct(input.loanProduct);
    const productAdj = this.getAdjustment(llpa.product, productKey, ltvBucket);
    if (productAdj === null) return { total: null, adjustments, ineligible: 'Loan Product' };
    adjustments.push({ name: 'Product', key: productKey, value: productAdj });
    total += productAdj;

    const occAdj = this.getAdjustment(llpa.occupancy, input.occupancy, ltvBucket);
    if (occAdj === null) return { total: null, adjustments, ineligible: 'Occupancy' };
    adjustments.push({ name: 'Occupancy', key: input.occupancy, value: occAdj });
    total += occAdj;

    const propKey = this.mapPropertyType(input.propertyType, false);
    const propAdj = this.getAdjustment(llpa.propertyType, propKey, ltvBucket);
    if (propAdj === null) return { total: null, adjustments, ineligible: 'Property Type' };
    adjustments.push({ name: 'Property Type', key: propKey, value: propAdj });
    total += propAdj;

    const citKey = input.citizenship === 'US Citizen' ? 'US Citizen' : input.citizenship === 'Perm-Resident' ? 'Perm-Resident' : 'Non-Perm Resident';
    const citAdj = this.getAdjustment(llpa.citizenship, citKey, ltvBucket);
    if (citAdj !== null) { adjustments.push({ name: 'Citizenship', key: citKey, value: citAdj }); total += citAdj; }

    const docKey = input.docType.includes('Full Doc') ? '1yr Full Doc' : input.docType.includes('1099') ? '1yr 1099 Only' : input.docType.includes('Bank') ? '12m Bank Stmts' : input.docType.includes('Asset') ? 'Asset Depletion' : '12m Bank Stmts';
    const docAdj = this.getAdjustment(llpa.incomeDocType, docKey, ltvBucket);
    if (docAdj !== null) { adjustments.push({ name: 'Doc Type', key: docKey, value: docAdj }); total += docAdj; }

    const dtiKey = input.dti.includes('≤43') ? '≤43%' : '43.01-50%';
    const dtiAdj = this.getAdjustment(llpa.dti, dtiKey, ltvBucket);
    if (dtiAdj !== null) { adjustments.push({ name: 'DTI', key: dtiKey, value: dtiAdj }); total += dtiAdj; }

    // Prepay adjustments only apply for Investment occupancy (Program Overlay)
    if (shouldApplyAdjustment('prepayPeriod', input)) {
      const prepayKey = this.mapPrepayPeriod(input.prepayPeriod);
      const prepayAdj = this.getAdjustment(llpa.prepayPeriod, prepayKey, ltvBucket);
      if (prepayAdj !== null) { adjustments.push({ name: 'Prepay Period', key: prepayKey, value: prepayAdj }); total += prepayAdj; }
    }

    if (shouldApplyAdjustment('prepayFee', input)) {
      const feeKey = this.mapPrepayFee(input.prepayFee);
      const feeAdj = this.getAdjustment(llpa.prepayFee, feeKey, ltvBucket);
      if (feeAdj !== null) { adjustments.push({ name: 'Prepay Fee', key: feeKey, value: feeAdj }); total += feeAdj; }
    }

    const escrowKey = input.escrowWaiver ? 'Yes' : 'No';
    const escrowAdj = this.getAdjustment(llpa.escrowWaiver, escrowKey, ltvBucket);
    if (escrowAdj !== null) { adjustments.push({ name: 'Escrow Waiver', key: escrowKey, value: escrowAdj }); total += escrowAdj; }

    const lockAdj = this.getAdjustment(llpa.lockTerm, input.lockTerm, ltvBucket);
    if (lockAdj !== null) { adjustments.push({ name: 'Lock Term', key: input.lockTerm, value: lockAdj }); total += lockAdj; }

    const stateAdj = this.getAdjustment(llpa.stateAdj, input.state, ltvBucket);
    if (stateAdj) { adjustments.push({ name: 'State', key: input.state, value: stateAdj }); total += stateAdj; }

    return { total, adjustments, ineligible: null };
  }

  static calculateDscrLlpa(input, ltvBucket) {
    const llpa = LLPA_DSCR_C;
    const adjustments = [];
    let total = 0;

    const scoreKey = this.mapCreditScore(input.creditScore, true);
    const scoreAdj = this.getAdjustment(llpa.score, scoreKey, ltvBucket);
    if (scoreAdj === null) return { total: null, adjustments, ineligible: 'Credit Score' };
    if (scoreAdj !== undefined) { adjustments.push({ name: 'Credit Score', key: scoreKey, value: scoreAdj }); total += scoreAdj; }

    const dscrKey = this.mapDscrRatio(input.dscrRatio);
    const dscrAdj = this.getAdjustment(llpa.dscrRatio, dscrKey, ltvBucket);
    if (dscrAdj !== null && dscrAdj !== undefined) { adjustments.push({ name: 'DSCR Ratio', key: dscrKey, value: dscrAdj }); total += dscrAdj; }

    const strKey = input.dscrShortTermRental ? 'Yes' : 'No';
    const strAdj = this.getAdjustment(llpa.str, strKey, ltvBucket);
    if (strAdj === null) return { total: null, adjustments, ineligible: 'Short Term Rental' };
    adjustments.push({ name: 'Short Term Rental', key: strKey, value: strAdj });
    total += strAdj;

    const productKey = this.mapProduct(input.loanProduct);
    const productAdj = this.getAdjustment(llpa.product, productKey, ltvBucket);
    if (productAdj === null) return { total: null, adjustments, ineligible: 'Loan Product' };
    adjustments.push({ name: 'Product', key: productKey, value: productAdj });
    total += productAdj;

    const loanKey = this.mapLoanAmount(input.loanAmount, true);
    const loanAdj = this.getAdjustment(llpa.loanAmount, loanKey, ltvBucket);
    if (loanAdj !== null && loanAdj !== undefined) { adjustments.push({ name: 'Loan Amount', key: loanKey, value: loanAdj }); total += loanAdj; }

    const purposeAdj = this.getAdjustment(llpa.purpose, input.loanPurpose, ltvBucket);
    if (purposeAdj === null) return { total: null, adjustments, ineligible: 'Loan Purpose' };
    adjustments.push({ name: 'Purpose', key: input.loanPurpose, value: purposeAdj });
    total += purposeAdj;

    const propKey = this.mapPropertyType(input.propertyType, true);
    const propAdj = this.getAdjustment(llpa.propertyType, propKey, ltvBucket);
    if (propAdj !== null && propAdj !== undefined) { adjustments.push({ name: 'Property Type', key: propKey, value: propAdj }); total += propAdj; }

    // Prepay adjustments only apply for Investment occupancy (Program Overlay)
    if (shouldApplyAdjustment('prepayPeriod', input)) {
      const prepayKey = this.mapPrepayPeriod(input.prepayPeriod);
      const prepayAdj = this.getAdjustment(llpa.prepayPeriod, prepayKey, ltvBucket);
      if (prepayAdj !== null) { adjustments.push({ name: 'Prepay Period', key: prepayKey, value: prepayAdj }); total += prepayAdj; }
    }

    if (shouldApplyAdjustment('prepayFee', input)) {
      const feeKey = this.mapPrepayFee(input.prepayFee);
      const feeAdj = this.getAdjustment(llpa.prepayFee, feeKey, ltvBucket);
      if (feeAdj !== null) { adjustments.push({ name: 'Prepay Fee', key: feeKey, value: feeAdj }); total += feeAdj; }
    }

    const escrowKey = input.escrowWaiver ? 'Yes' : 'No';
    const escrowAdj = this.getAdjustment(llpa.escrowWaiver, escrowKey, ltvBucket);
    if (escrowAdj !== null) { adjustments.push({ name: 'Escrow Waiver', key: escrowKey, value: escrowAdj }); total += escrowAdj; }

    const lockAdj = this.getAdjustment(llpa.lockTerm, input.lockTerm, ltvBucket);
    if (lockAdj !== null) { adjustments.push({ name: 'Lock Term', key: input.lockTerm, value: lockAdj }); total += lockAdj; }

    const stateAdj = this.getAdjustment(llpa.stateAdj, input.state, ltvBucket);
    if (stateAdj) { adjustments.push({ name: 'State', key: input.state, value: stateAdj }); total += stateAdj; }

    return { total, adjustments, ineligible: null };
  }

  // Calculate rates for a specific program
  static calculateRatesForProgram(input, programKey) {
    const ltv = (input.loanAmount / input.purchasePrice) * 100;

    // Check if program is active
    if (!isProgramActive(programKey)) {
      return { error: PROGRAMS[programKey]?.name + ' is currently unavailable', rates: [], programKey };
    }

    const program = PROGRAMS[programKey];
    if (!program) return { error: 'Program not found', rates: [], programKey };

    const ltvBucket = this.getLtvBucket(ltv, programKey);
    if (!ltvBucket) return { error: 'LTV exceeds program maximum', rates: [], programKey };

    const isDSCR = programKey.includes('DSCR');
    const llpaResult = isDSCR ? this.calculateDscrLlpa(input, ltvBucket) : this.calculateNonQmLlpa(input, ltvBucket);

    if (llpaResult.total === null) {
      return { error: 'Ineligible: ' + llpaResult.ineligible, rates: [], adjustments: llpaResult.adjustments, programKey };
    }

    const baseRates = program.baseRates;
    const adjustedRates = baseRates.map(({ rate, price }) => ({
      rate,
      basePrice: price,
      llpaTotal: llpaResult.total,
      finalPrice: parseFloat((price + llpaResult.total + MARGIN_DEDUCTION).toFixed(3))
    }));

    // Find best rate (closest to 100.000)
    const eligibleRates = adjustedRates.filter(r => r.finalPrice >= 99 && r.finalPrice <= 101);
    const bestRate = eligibleRates.length > 0 
      ? eligibleRates.reduce((best, r) => Math.abs(r.finalPrice - 100) < Math.abs(best.finalPrice - 100) ? r : best)
      : null;

    return {
      program: program.name,
      programKey,
      ltv: ltv.toFixed(2),
      ltvBucket,
      llpaTotal: llpaResult.total,
      adjustments: llpaResult.adjustments,
      rates: eligibleRates.sort((a, b) => a.rate - b.rate),
      bestRate,
      allRates: adjustedRates
    };
  }

  // Calculate rates for ALL active programs
  static calculateAllProgramRates(input) {
    const allPrograms = ['NonQM-C', 'NonQM-A', 'DSCR-C', 'DSCR-A'];
    const results = [];

    for (const programKey of allPrograms) {
      const result = this.calculateRatesForProgram(input, programKey);
      if (!result.error && result.rates.length > 0) {
        results.push(result);
      }
    }

    // Sort by best rate's distance to 100
    results.sort((a, b) => {
      if (!a.bestRate) return 1;
      if (!b.bestRate) return -1;
      return Math.abs(a.bestRate.finalPrice - 100) - Math.abs(b.bestRate.finalPrice - 100);
    });

    return results;
  }

  static calculateRates(input) {
    const ltv = (input.loanAmount / input.purchasePrice) * 100;
    const programKey = this.selectProgram(input);

    // Check if the selected program is active
    if (!isProgramActive(programKey)) {
      const programName = PROGRAMS[programKey]?.name || programKey;
      return { error: programName + ' is currently unavailable', rates: [] };
    }

    const program = PROGRAMS[programKey];
    if (!program) return { error: 'No matching program found', rates: [] };

    const ltvBucket = this.getLtvBucket(ltv, programKey);
    if (!ltvBucket) return { error: 'LTV ' + ltv.toFixed(2) + '% exceeds program maximum', rates: [] };

    const isDSCR = programKey.includes('DSCR');
    const llpaResult = isDSCR ? this.calculateDscrLlpa(input, ltvBucket) : this.calculateNonQmLlpa(input, ltvBucket);

    if (llpaResult.total === null) {
      return { error: 'Ineligible: ' + llpaResult.ineligible + ' combination not available at this LTV', rates: [], adjustments: llpaResult.adjustments };
    }

    const baseRates = program.baseRates;
    const adjustedRates = baseRates.map(({ rate, price }) => ({
      rate,
      basePrice: price,
      llpaTotal: llpaResult.total,
      finalPrice: parseFloat((price + llpaResult.total + MARGIN_DEDUCTION).toFixed(3))
    }));

    const sortedRates = [...adjustedRates].sort((a, b) => a.rate - b.rate);
    const eligibleRates = [];
    for (const rateObj of sortedRates) {
      if (rateObj.finalPrice >= 99 && rateObj.finalPrice <= 101) {
        eligibleRates.push(rateObj);
        if (rateObj.finalPrice >= 101) break;
      }
    }
    eligibleRates.sort((a, b) => a.rate - b.rate);

    return {
      program: program.name,
      programKey,
      ltv: ltv.toFixed(2),
      ltvBucket,
      llpaTotal: llpaResult.total,
      adjustments: llpaResult.adjustments,
      rates: eligibleRates,
      allRates: adjustedRates
    };
  }
}

export default PricingEngine;
