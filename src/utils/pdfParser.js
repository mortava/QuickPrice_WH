/**
 * PDF Parser Utility for Rate Sheet Import
 * Uses PDF.js v4.x to extract text and parse rate sheet data
 */

import * as pdfjsLib from 'pdfjs-dist';
import { LTV_BUCKETS, LLPA_CATEGORIES } from '../data/llpaConfig';

// Configure PDF.js worker - use CDN for v4.x
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

/**
 * Extract all text content from a PDF file
 * @param {File} file - The PDF file to parse
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromPdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
    });

    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter(item => item.str)
        .map(item => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }

    return fullText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to read PDF: ${error.message}`);
  }
}

/**
 * Direct mapping of PDF row labels to our LLPA category/option structure
 * Format: { 'pdf label pattern': { category: 'categoryKey', option: 'optionKey' } }
 */
const DIRECT_MAPPINGS = {
  // FICO Score
  '≥780': { category: 'ficoScore', option: '≥780' },
  '>=780': { category: 'ficoScore', option: '≥780' },
  '780+': { category: 'ficoScore', option: '≥780' },
  '760-779': { category: 'ficoScore', option: '760-779' },
  '740-759': { category: 'ficoScore', option: '740-759' },
  '720-739': { category: 'ficoScore', option: '720-739' },
  '700-719': { category: 'ficoScore', option: '700-719' },
  '680-699': { category: 'ficoScore', option: '680-699' },
  '660-679': { category: 'ficoScore', option: '660-679' },
  '640-659': { category: 'ficoScore', option: '640-659' },
  '620-639': { category: 'ficoScore', option: '620-639' },
  '600-619': { category: 'ficoScore', option: '600-619' },
  '580-599': { category: 'ficoScore', option: '580-599' },

  // Loan Amount - various formats
  '≥$150,000 - $300,000': { category: 'loanAmount', option: '$150K-$249K' },
  '$150,000 - $300,000': { category: 'loanAmount', option: '$150K-$249K' },
  '$300,001 - $1,000,000': { category: 'loanAmount', option: '$300K-$499K' },
  '$1,000,001 - $1,500,000': { category: 'loanAmount', option: '$1M-$1.49M' },
  '$1,500,001 - $2,000,000': { category: 'loanAmount', option: '$1.5M-$1.99M' },
  '$2,000,001 - $2,500,000': { category: 'loanAmount', option: '$2M-$2.49M' },
  '$2,500,001 - $3,000,000': { category: 'loanAmount', option: '$2.5M-$2.99M' },
  '$3,000,001 - $4,000,000': { category: 'loanAmount', option: '$3M-$3.49M' },
  '$3,000,001 - $3,500,000': { category: 'loanAmount', option: '$3M-$3.49M' },
  '$3,500,001 - $4,000,000': { category: 'loanAmount', option: '$3.5M-$3.99M' },
  '$4,000,001 - $4,500,000': { category: 'loanAmount', option: '$4M-$4.49M' },
  '$4,500,001 - $5,000,000': { category: 'loanAmount', option: '$4.5M-$5M' },

  // Income Doc Type
  '12m bank stmts': { category: 'incomeDocType', option: '12m-bank' },
  '12m bank stmt': { category: 'incomeDocType', option: '12m-bank' },
  '24m bank stmts': { category: 'incomeDocType', option: '24m-bank' },
  '24m bank stmt': { category: 'incomeDocType', option: '24m-bank' },
  '1yr 1099 only': { category: 'incomeDocType', option: '1yr-1099' },
  '1yr 1099': { category: 'incomeDocType', option: '1yr-1099' },
  'asset depletion': { category: 'incomeDocType', option: 'asset-depletion' },
  '1yr p&l w/2m bank stmts': { category: 'incomeDocType', option: '1yr-pl-2m-bank' },
  '1yr p&l w/2m bank': { category: 'incomeDocType', option: '1yr-pl-2m-bank' },
  '1yr p&l only': { category: 'incomeDocType', option: '1yr-pl-only' },
  '1yr wvoe only': { category: 'incomeDocType', option: '1yr-wvoe' },
  '1yr wvoe': { category: 'incomeDocType', option: '1yr-wvoe' },
  'dscr': { category: 'incomeDocType', option: 'dscr' },
  'full doc': { category: 'incomeDocType', option: '2yr-full-doc' },
  '2yr full doc': { category: 'incomeDocType', option: '2yr-full-doc' },
  '1yr full doc': { category: 'incomeDocType', option: '1yr-full-doc' },

  // DTI
  '≥43.01 - 50.00%': { category: 'dtiRatio', option: '43.01-50%' },
  '43.01 - 50.00%': { category: 'dtiRatio', option: '43.01-50%' },
  '43.01-50%': { category: 'dtiRatio', option: '43.01-50%' },
  '≥50.01 - 55.00%': { category: 'dtiRatio', option: '50.01-55%' },
  '50.01 - 55.00%': { category: 'dtiRatio', option: '50.01-55%' },
  '50.01-55%': { category: 'dtiRatio', option: '50.01-55%' },

  // Product / Loan Type
  'interest-only (30yr)': { category: 'loanProduct', option: 'io-30yr' },
  'interest only (30yr)': { category: 'loanProduct', option: 'io-30yr' },
  'i/o 30yr': { category: 'loanProduct', option: 'io-30yr' },
  'interest-only (40yr)': { category: 'loanProduct', option: 'io-40yr' },
  'interest only (40yr)': { category: 'loanProduct', option: 'io-40yr' },
  'i/o 40yr': { category: 'loanProduct', option: 'io-40yr' },
  '40 year fixed': { category: 'loanProduct', option: '40yr-fixed' },
  '40yr fixed': { category: 'loanProduct', option: '40yr-fixed' },
  '5/6 arm': { category: 'loanProduct', option: '5-6-arm' },
  '5/1 arm': { category: 'loanProduct', option: '5-6-arm' },
  '7/6 arm': { category: 'loanProduct', option: '7-6-arm' },
  '7/1 arm': { category: 'loanProduct', option: '7-6-arm' },
  '10/6 arm': { category: 'loanProduct', option: '10-6-arm' },

  // Purpose
  'cash-out': { category: 'loanPurpose', option: 'cash-out' },
  'cash out': { category: 'loanPurpose', option: 'cash-out' },
  'purpose cash-out': { category: 'loanPurpose', option: 'cash-out' },
  'rate & term': { category: 'loanPurpose', option: 'rate-term' },
  'rate/term': { category: 'loanPurpose', option: 'rate-term' },
  'r/t': { category: 'loanPurpose', option: 'rate-term' },

  // Occupancy
  'primary': { category: 'occupancy', option: 'primary' },
  'owner occupied': { category: 'occupancy', option: 'primary' },
  'second home': { category: 'occupancy', option: 'second-home' },
  '2nd home': { category: 'occupancy', option: 'second-home' },
  'investment': { category: 'occupancy', option: 'investor' },
  'investor': { category: 'occupancy', option: 'investor' },
  'non-owner': { category: 'occupancy', option: 'investor' },

  // Property Type
  'sfr': { category: 'propertyType', option: 'sfr' },
  'single family': { category: 'propertyType', option: 'sfr' },
  'condo': { category: 'propertyType', option: 'condo' },
  'condo (non-warrantable)': { category: 'propertyType', option: 'condo-non-warrant' },
  'non-warrantable': { category: 'propertyType', option: 'condo-non-warrant' },
  'condotel': { category: 'propertyType', option: 'condotel' },
  'townhome': { category: 'propertyType', option: 'pud' },
  'townhouse': { category: 'propertyType', option: 'pud' },
  'pud': { category: 'propertyType', option: 'pud' },
  '2 unit': { category: 'propertyType', option: '2-unit' },
  '2-unit': { category: 'propertyType', option: '2-unit' },
  '2 - 4 unit': { category: 'propertyType', option: '2-4-unit' },
  '2-4 unit': { category: 'propertyType', option: '2-4-unit' },
  '3-4 unit': { category: 'propertyType', option: '3-4-unit' },

  // Rural
  'rural yes': { category: 'ruralProperty', option: 'yes' },
  'rural': { category: 'ruralProperty', option: 'yes' },

  // Citizenship
  'non-perm resident': { category: 'citizenship', option: 'non-perm' },
  'non perm resident': { category: 'citizenship', option: 'non-perm' },
  'foreign national': { category: 'citizenship', option: 'foreign-national' },
  'foreign national/fn': { category: 'citizenship', option: 'foreign-national' },
  'itin': { category: 'citizenship', option: 'itin' },

  // Credit Event Period
  '≥48m': { category: 'creditEvent', option: '≥48m-none' },
  '>=48m': { category: 'creditEvent', option: '≥48m-none' },
  '48m+': { category: 'creditEvent', option: '≥48m-none' },
  '36m - 47m': { category: 'creditEvent', option: '36m-47m' },
  '36m-47m': { category: 'creditEvent', option: '36m-47m' },
  '24m - 35m': { category: 'creditEvent', option: '24m-35m' },
  '24m-35m': { category: 'creditEvent', option: '24m-35m' },
  '12m - 23m': { category: 'creditEvent', option: '12m-23m' },
  '12m-23m': { category: 'creditEvent', option: '12m-23m' },

  // Mortgage History
  '0x30x24': { category: 'mtgHistory', option: '0x30x24' },
  '1x30x12': { category: 'mtgHistory', option: '1x30x12' },
  '2x30x12': { category: 'mtgHistory', option: '2x30x12' },
  '3x30x12': { category: 'mtgHistory', option: '3x30x12' },
  '1x60x12': { category: 'mtgHistory', option: '1x60x12' },
  '≥1x60x12': { category: 'mtgHistory', option: '≥2x60x12' },
  '>=1x60x12': { category: 'mtgHistory', option: '≥2x60x12' },
  '≥2x60x12': { category: 'mtgHistory', option: '≥2x60x12' },

  // Lock Term
  '15 day': { category: 'lockTerm', option: '15-day' },
  '15day': { category: 'lockTerm', option: '15-day' },
  '30 day': { category: 'lockTerm', option: '30-day' },
  '30day': { category: 'lockTerm', option: '30-day' },
  '45 day': { category: 'lockTerm', option: '45-day' },
  '45day': { category: 'lockTerm', option: '45-day' },

  // Escrow Waiver
  'escrow waiver yes': { category: 'escrowWaiver', option: 'yes' },
  'waive escrow': { category: 'escrowWaiver', option: 'yes' },

  // DSCR Range
  '≥1.250': { category: 'dscrRange', option: '≥1.250' },
  '>=1.250': { category: 'dscrRange', option: '≥1.250' },
  '1.150-1.249': { category: 'dscrRange', option: '1.150-1.249' },
  '1.000-1.149': { category: 'dscrRange', option: '1.000-1.149' },
  '0.750-0.999': { category: 'dscrRange', option: '0.750-0.999' },

  // Prepay
  '0 - no prepay': { category: 'prepayPeriod', option: '0-no-prepay' },
  'no prepay': { category: 'prepayPeriod', option: '0-no-prepay' },
  '1 year': { category: 'prepayPeriod', option: '1yr' },
  '2 year': { category: 'prepayPeriod', option: '2yr' },
  '3 year': { category: 'prepayPeriod', option: '3yr' },
  '4 year': { category: 'prepayPeriod', option: '4yr' },
  '5 year': { category: 'prepayPeriod', option: '5yr' },

  // FTHB
  'fthb yes': { category: 'fthb', option: 'yes' },
  'first time home buyer': { category: 'fthb', option: 'yes' },
};

/**
 * Parse a value - handles numbers and Null
 */
function parseValue(str) {
  if (!str) return null;
  const cleaned = str.trim().toLowerCase();
  if (cleaned === 'null' || cleaned === 'n/a' || cleaned === '-' || cleaned === '') {
    return null;
  }
  const num = parseFloat(str.replace(/[^\d.-]/g, ''));
  return isNaN(num) ? null : num;
}

/**
 * Try to match a row label to our LLPA structure
 */
function matchRowLabel(label) {
  const lower = label.toLowerCase().trim();

  // Try direct mapping first
  for (const [pattern, mapping] of Object.entries(DIRECT_MAPPINGS)) {
    if (lower === pattern.toLowerCase() || lower.includes(pattern.toLowerCase())) {
      return mapping;
    }
  }

  // Try partial matches for loan amounts with different formats
  if (lower.includes('$') && (lower.includes('-') || lower.includes('to'))) {
    // Extract numbers from the string
    const nums = lower.match(/[\d,]+/g);
    if (nums && nums.length >= 1) {
      const firstNum = parseInt(nums[0].replace(/,/g, ''));

      if (firstNum >= 75000 && firstNum < 100000) return { category: 'loanAmount', option: '$75K-$99K' };
      if (firstNum >= 100000 && firstNum < 125000) return { category: 'loanAmount', option: '$100K-$124K' };
      if (firstNum >= 125000 && firstNum < 150000) return { category: 'loanAmount', option: '$125K-$149K' };
      if (firstNum >= 150000 && firstNum < 250000) return { category: 'loanAmount', option: '$150K-$249K' };
      if (firstNum >= 250000 && firstNum < 300000) return { category: 'loanAmount', option: '$250K-$299K' };
      if (firstNum >= 300000 && firstNum < 500000) return { category: 'loanAmount', option: '$300K-$499K' };
      if (firstNum >= 500000 && firstNum < 1000000) return { category: 'loanAmount', option: '$500K-$999K' };
      if (firstNum >= 1000000 && firstNum < 1500000) return { category: 'loanAmount', option: '$1M-$1.49M' };
      if (firstNum >= 1500000 && firstNum < 2000000) return { category: 'loanAmount', option: '$1.5M-$1.99M' };
      if (firstNum >= 2000000 && firstNum < 2500000) return { category: 'loanAmount', option: '$2M-$2.49M' };
      if (firstNum >= 2500000 && firstNum < 3000000) return { category: 'loanAmount', option: '$2.5M-$2.99M' };
      if (firstNum >= 3000000 && firstNum < 3500000) return { category: 'loanAmount', option: '$3M-$3.49M' };
      if (firstNum >= 3500000 && firstNum < 4000000) return { category: 'loanAmount', option: '$3.5M-$3.99M' };
      if (firstNum >= 4000000 && firstNum < 4500000) return { category: 'loanAmount', option: '$4M-$4.49M' };
      if (firstNum >= 4500000) return { category: 'loanAmount', option: '$4.5M-$5M' };
    }
  }

  return null;
}

/**
 * Parse LLPA grid data from extracted PDF text
 */
export function parseLlpaFromText(text) {
  const llpaOverrides = {};

  // Standard regex to find rows with label followed by 9 numeric values
  // Pattern: Label followed by numbers (possibly with Null)
  const rowPattern = /([A-Za-z0-9≥<>$,.\-\/\s&%()]+?)\s+((?:-?\d+\.\d+|Null)\s+){2,}/gi;

  let match;
  while ((match = rowPattern.exec(text)) !== null) {
    const fullMatch = match[0].trim();

    // Split into label and values
    // Find where the numeric values start
    const valueStart = fullMatch.search(/\s+-?\d+\.\d+|\s+Null/i);
    if (valueStart === -1) continue;

    const label = fullMatch.substring(0, valueStart).trim();
    const valuesStr = fullMatch.substring(valueStart).trim();

    // Parse the values
    const valueMatches = valuesStr.match(/-?\d+\.\d+|Null/gi);
    if (!valueMatches || valueMatches.length < 2) continue;

    // Try to match the label
    const mapping = matchRowLabel(label);
    if (!mapping) continue;

    const { category, option } = mapping;

    // Initialize category and option if needed
    if (!llpaOverrides[category]) llpaOverrides[category] = {};
    if (!llpaOverrides[category][option]) llpaOverrides[category][option] = {};

    // Map values to LTV buckets
    valueMatches.forEach((val, idx) => {
      if (idx < LTV_BUCKETS.length) {
        const numVal = parseValue(val);
        llpaOverrides[category][option][LTV_BUCKETS[idx]] = numVal;
      }
    });
  }

  // Also try line-by-line parsing for edge cases
  const lines = text.split(/\n/);
  for (const line of lines) {
    // Skip short lines
    if (line.length < 20) continue;

    // Look for patterns like "Label  0.000  0.000  -0.250..."
    const parts = line.trim().split(/\s{2,}/);
    if (parts.length < 3) continue;

    const label = parts[0];
    const mapping = matchRowLabel(label);
    if (!mapping) continue;

    const { category, option } = mapping;

    // Extract numeric values from remaining parts
    const values = [];
    for (let i = 1; i < parts.length; i++) {
      const val = parseValue(parts[i]);
      if (val !== undefined) {
        values.push(val);
      }
    }

    if (values.length >= 2) {
      if (!llpaOverrides[category]) llpaOverrides[category] = {};
      if (!llpaOverrides[category][option]) llpaOverrides[category][option] = {};

      values.forEach((val, idx) => {
        if (idx < LTV_BUCKETS.length) {
          llpaOverrides[category][option][LTV_BUCKETS[idx]] = val;
        }
      });
    }
  }

  return llpaOverrides;
}

/**
 * Parse rate sheet data from extracted PDF text
 */
export function parseRateSheetFromText(text) {
  const result = {
    programName: '',
    programType: 'NonQM',
    baseRates: [],
    llpaData: {},
    settings: {
      minFico: 620,
      maxLTV: 90,
      minLoanAmount: 75000,
      maxLoanAmount: 5000000,
    },
    rawText: text,
    parseWarnings: [],
  };

  // Extract program name
  const programPatterns = [
    /^(NonQM|DSCR|HELOAN|RTL)[\s\/]*([A-Z])?/im,
    /Program[:\s]*([A-Za-z0-9\s\-\/]+)/i,
  ];

  for (const pattern of programPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.programName = match[0].trim();
      break;
    }
  }

  // Detect program type
  if (/DSCR/i.test(text)) {
    result.programType = 'DSCR';
  } else if (/HELOAN/i.test(text)) {
    result.programType = 'HELOAN';
  } else if (/RTL|Bridge|Fix.*Flip/i.test(text)) {
    result.programType = 'RTL';
  }

  // Extract base rates - pattern: "5.750 97.625" or "5.750% 97.625"
  const ratePattern = /(\d{1,2}\.\d{2,3})%?\s+(\d{2,3}\.\d{2,3})/g;
  const foundRates = new Set();

  let rateMatch;
  while ((rateMatch = ratePattern.exec(text)) !== null) {
    const rate = parseFloat(rateMatch[1]);
    const price = parseFloat(rateMatch[2]);

    if (rate >= 4 && rate <= 15 && price >= 90 && price <= 115) {
      const key = `${rate.toFixed(3)}-${price.toFixed(3)}`;
      if (!foundRates.has(key)) {
        foundRates.add(key);
        result.baseRates.push({ rate, price });
      }
    }
  }

  result.baseRates.sort((a, b) => a.rate - b.rate);

  // Extract settings
  const ficoMatch = text.match(/Min(?:imum)?\s*FICO[:\s]*(\d{3})/i);
  if (ficoMatch) result.settings.minFico = parseInt(ficoMatch[1]);

  const ltvMatch = text.match(/Max(?:imum)?\s*LTV[:\s]*(\d{2,3})%?/i);
  if (ltvMatch) result.settings.maxLTV = parseInt(ltvMatch[1]);

  // Parse LLPA grid
  result.llpaData = parseLlpaFromText(text);

  // Count LLPA entries
  let llpaCount = 0;
  let categoryCount = 0;
  for (const [cat, options] of Object.entries(result.llpaData)) {
    categoryCount++;
    for (const opt of Object.values(options)) {
      llpaCount += Object.keys(opt).length;
    }
  }

  // Warnings
  if (result.baseRates.length === 0) {
    result.parseWarnings.push('Could not extract base rates. Enter manually.');
  }
  if (!result.programName) {
    result.programName = 'Imported Rate Sheet';
    result.parseWarnings.push('Could not detect program name.');
  }
  if (llpaCount === 0) {
    result.parseWarnings.push('Could not extract LLPA adjustments. Enter manually in LLPA Grid tab.');
  } else {
    result.parseWarnings.push(`Extracted ${llpaCount} LLPA values across ${categoryCount} categories.`);
  }

  return result;
}

/**
 * Parse a PDF file and return structured rate sheet data
 */
export async function parsePdfRateSheet(file) {
  try {
    const text = await extractTextFromPdf(file);
    const parsed = parseRateSheetFromText(text);
    return {
      success: true,
      data: parsed,
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    return {
      success: false,
      error: error.message || 'Failed to parse PDF file',
    };
  }
}

/**
 * Convert parsed PDF data to rate sheet format
 */
export function convertToRateSheet(parsedData) {
  const id = 'imported-' + Date.now();

  return {
    id,
    name: parsedData.programName || 'Imported Rate Sheet',
    programType: parsedData.programType || 'NonQM',
    description: 'Imported from PDF',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    marginHoldback: -1.625,
    ltvBuckets: LTV_BUCKETS,
    baseRates: parsedData.baseRates || [],
    llpaOverrides: parsedData.llpaData || {},
    naOverrides: {},
    settings: {
      minFico: parsedData.settings?.minFico || 620,
      maxLTV: parsedData.settings?.maxLTV || 90,
      minLoanAmount: parsedData.settings?.minLoanAmount || 75000,
      maxLoanAmount: parsedData.settings?.maxLoanAmount || 5000000,
      requiresDSCR: parsedData.programType === 'DSCR',
      allowedStates: [],
      allowedDocTypes: [],
      allowedPropertyTypes: [],
    },
    importMetadata: {
      importedAt: new Date().toISOString(),
      rawTextLength: parsedData.rawText?.length || 0,
      warnings: parsedData.parseWarnings || [],
    }
  };
}

/**
 * Parse ONLY LLPA data from a PDF file (for dedicated LLPA import)
 */
export async function parseLlpaOnlyFromPdf(file) {
  try {
    const text = await extractTextFromPdf(file);
    const llpaData = parseLlpaFromText(text);

    // Count extracted values
    let totalValues = 0;
    let categoryCount = 0;
    for (const [cat, options] of Object.entries(llpaData)) {
      categoryCount++;
      for (const opt of Object.values(options)) {
        totalValues += Object.keys(opt).length;
      }
    }

    return {
      success: true,
      data: {
        llpaData,
        stats: {
          categories: categoryCount,
          totalValues,
        }
      },
    };
  } catch (error) {
    console.error('LLPA PDF parsing error:', error);
    return {
      success: false,
      error: error.message || 'Failed to parse LLPA data from PDF',
    };
  }
}

/**
 * Parse ONLY base rates/pricing from a PDF file (for dedicated rates import)
 */
export async function parseBaseRatesOnlyFromPdf(file) {
  try {
    const text = await extractTextFromPdf(file);

    const result = {
      baseRates: [],
      programName: '',
      programType: 'NonQM',
      settings: {},
    };

    // Extract program name
    const programPatterns = [
      /^(NonQM|DSCR|HELOAN|RTL)[\s\/]*([A-Z])?/im,
      /Program[:\s]*([A-Za-z0-9\s\-\/]+)/i,
    ];

    for (const pattern of programPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.programName = match[0].trim();
        break;
      }
    }

    // Detect program type
    if (/DSCR/i.test(text)) {
      result.programType = 'DSCR';
    } else if (/HELOAN/i.test(text)) {
      result.programType = 'HELOAN';
    } else if (/RTL|Bridge|Fix.*Flip/i.test(text)) {
      result.programType = 'RTL';
    }

    // Extract base rates - pattern: "5.750 97.625" or "5.750% 97.625"
    const ratePattern = /(\d{1,2}\.\d{2,3})%?\s+(\d{2,3}\.\d{2,3})/g;
    const foundRates = new Set();

    let rateMatch;
    while ((rateMatch = ratePattern.exec(text)) !== null) {
      const rate = parseFloat(rateMatch[1]);
      const price = parseFloat(rateMatch[2]);

      if (rate >= 4 && rate <= 15 && price >= 90 && price <= 115) {
        const key = `${rate.toFixed(3)}-${price.toFixed(3)}`;
        if (!foundRates.has(key)) {
          foundRates.add(key);
          result.baseRates.push({ rate, price });
        }
      }
    }

    result.baseRates.sort((a, b) => a.rate - b.rate);

    // Extract settings
    const ficoMatch = text.match(/Min(?:imum)?\s*FICO[:\s]*(\d{3})/i);
    if (ficoMatch) result.settings.minFico = parseInt(ficoMatch[1]);

    const ltvMatch = text.match(/Max(?:imum)?\s*LTV[:\s]*(\d{2,3})%?/i);
    if (ltvMatch) result.settings.maxLTV = parseInt(ltvMatch[1]);

    const minLoanMatch = text.match(/Min(?:imum)?\s*Loan[:\s]*\$?([\d,]+)/i);
    if (minLoanMatch) result.settings.minLoanAmount = parseInt(minLoanMatch[1].replace(/,/g, ''));

    const maxLoanMatch = text.match(/Max(?:imum)?\s*Loan[:\s]*\$?([\d,]+)/i);
    if (maxLoanMatch) result.settings.maxLoanAmount = parseInt(maxLoanMatch[1].replace(/,/g, ''));

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Base rates PDF parsing error:', error);
    return {
      success: false,
      error: error.message || 'Failed to parse base rates from PDF',
    };
  }
}

export default {
  extractTextFromPdf,
  parseRateSheetFromText,
  parsePdfRateSheet,
  parseLlpaFromText,
  convertToRateSheet,
  parseLlpaOnlyFromPdf,
  parseBaseRatesOnlyFromPdf,
};
