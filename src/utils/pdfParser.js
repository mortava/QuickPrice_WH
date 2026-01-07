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

    // Load PDF document
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
 * Map common LLPA category names from PDFs to our config keys
 */
const CATEGORY_MAPPINGS = {
  'fico': 'ficoScore',
  'fico score': 'ficoScore',
  'credit score': 'ficoScore',
  'loan amount': 'loanAmount',
  'loan size': 'loanAmount',
  'income doc': 'incomeDocType',
  'doc type': 'incomeDocType',
  'documentation': 'incomeDocType',
  'dti': 'dtiRatio',
  'debt to income': 'dtiRatio',
  'product': 'loanProduct',
  'loan product': 'loanProduct',
  'amortization': 'loanProduct',
  'purpose': 'loanPurpose',
  'loan purpose': 'loanPurpose',
  'occupancy': 'occupancy',
  'property type': 'propertyType',
  'property': 'propertyType',
  'citizenship': 'citizenship',
  'residency': 'citizenship',
  'dscr': 'dscrRange',
  'dscr range': 'dscrRange',
  'prepay': 'prepayPeriod',
  'prepayment': 'prepayPeriod',
  'lock': 'lockTerm',
  'lock term': 'lockTerm',
  'state': 'stateAdjustments',
  'escrow': 'escrowWaiver',
  'credit event': 'creditEvent',
  'bankruptcy': 'creditEvent',
  'foreclosure': 'creditEvent',
  'mortgage history': 'mtgHistory',
  'mortgage late': 'mtgHistory',
  'first time': 'fthb',
  'fthb': 'fthb',
};

/**
 * Map option labels from PDFs to our option keys
 */
const OPTION_MAPPINGS = {
  // FICO Score mappings
  '780+': '≥780',
  '>=780': '≥780',
  '≥780': '≥780',
  '760-779': '760-779',
  '740-759': '740-759',
  '720-739': '720-739',
  '700-719': '700-719',
  '680-699': '680-699',
  '660-679': '660-679',
  '640-659': '640-659',
  '620-639': '620-639',
  '600-619': '600-619',
  '580-599': '580-599',
  // Loan purpose
  'purchase': 'purchase',
  'rate/term': 'rate-term',
  'rate & term': 'rate-term',
  'r/t': 'rate-term',
  'cash out': 'cash-out',
  'cash-out': 'cash-out',
  // Occupancy
  'primary': 'primary',
  'owner occupied': 'primary',
  'second home': 'second-home',
  '2nd home': 'second-home',
  'investment': 'investor',
  'investor': 'investor',
  'non-owner': 'investor',
  // Property type
  'sfr': 'sfr',
  'single family': 'sfr',
  'condo': 'condo',
  'townhome': 'pud',
  'townhouse': 'pud',
  'pud': 'pud',
  '2 unit': '2-unit',
  '2-unit': '2-unit',
  '3-4 unit': '3-4-unit',
  '2-4 unit': '2-4-unit',
  // Doc types
  'full doc': '2yr-full-doc',
  '2 year': '2yr-full-doc',
  '24 month bank': '24m-bank',
  '12 month bank': '12m-bank',
  'bank statement': '12m-bank',
  'dscr': 'dscr',
  'asset depletion': 'asset-depletion',
  'asset qual': 'asset-depletion',
  '1099': '1yr-1099',
  'p&l': '1yr-pl-only',
  // Products
  '30 year': '30yr-fixed',
  '30yr': '30yr-fixed',
  '30 fixed': '30yr-fixed',
  'interest only': 'io-30yr',
  'i/o': 'io-30yr',
  'arm': '5-6-arm',
  '5/1 arm': '5-6-arm',
  '5/6 arm': '5-6-arm',
  '7/1 arm': '7-6-arm',
  '7/6 arm': '7-6-arm',
};

/**
 * Parse LLPA values from text - handles various number formats
 */
function parseValue(str) {
  if (!str) return null;
  const cleaned = str.replace(/[()%$,]/g, '').trim();
  if (cleaned.toLowerCase() === 'n/a' || cleaned === '-' || cleaned === '') return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Try to find LTV bucket from header text
 */
function matchLtvBucket(text) {
  const cleaned = text.replace(/\s+/g, '').replace(/LTV/gi, '');

  for (const bucket of LTV_BUCKETS) {
    const bucketClean = bucket.replace(/\s+/g, '');
    if (cleaned.includes(bucketClean) || bucketClean.includes(cleaned)) {
      return bucket;
    }
  }

  // Try numeric matching
  const numMatch = cleaned.match(/(\d+\.?\d*)/);
  if (numMatch) {
    const num = parseFloat(numMatch[1]);
    if (num <= 50) return '≤50.00';
    if (num <= 55) return '50.01-55.00';
    if (num <= 60) return '55.01-60.00';
    if (num <= 65) return '60.01-65.00';
    if (num <= 70) return '65.01-70.00';
    if (num <= 75) return '70.01-75.00';
    if (num <= 80) return '75.01-80.00';
    if (num <= 85) return '80.01-85.00';
    if (num <= 90) return '85.01-90.00';
  }

  return null;
}

/**
 * Match category from text
 */
function matchCategory(text) {
  const lower = text.toLowerCase().trim();
  for (const [key, value] of Object.entries(CATEGORY_MAPPINGS)) {
    if (lower.includes(key)) {
      return value;
    }
  }
  return null;
}

/**
 * Match option from text within a category
 */
function matchOption(text, categoryKey) {
  const lower = text.toLowerCase().trim();
  const category = LLPA_CATEGORIES[categoryKey];
  if (!category) return null;

  // Try direct option key/label match
  for (const option of category.options) {
    if (lower.includes(option.key.toLowerCase()) ||
        lower.includes(option.label.toLowerCase())) {
      return option.key;
    }
  }

  // Try mapped values
  for (const [key, value] of Object.entries(OPTION_MAPPINGS)) {
    if (lower.includes(key)) {
      // Verify this option exists in the category
      if (category.options.find(o => o.key === value)) {
        return value;
      }
    }
  }

  return null;
}

/**
 * Parse LLPA grid data from extracted PDF text
 * @param {string} text - Extracted PDF text
 * @returns {Object} - LLPA overrides structure
 */
export function parseLlpaFromText(text) {
  const llpaOverrides = {};

  // Split text into lines for analysis
  const lines = text.split(/\n/).filter(l => l.trim());

  let currentCategory = null;
  let ltvHeaders = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if this line contains LTV headers
    const ltvMatches = line.match(/(\d{2,3}(?:\.\d{1,2})?%?)/g);
    if (ltvMatches && ltvMatches.length >= 3) {
      ltvHeaders = ltvMatches.map(m => matchLtvBucket(m)).filter(Boolean);
      continue;
    }

    // Check if this is a category header
    const categoryMatch = matchCategory(line);
    if (categoryMatch) {
      currentCategory = categoryMatch;
      if (!llpaOverrides[currentCategory]) {
        llpaOverrides[currentCategory] = {};
      }
      continue;
    }

    // Try to parse row data (option + values)
    if (currentCategory && ltvHeaders.length > 0) {
      const optionKey = matchOption(line, currentCategory);
      if (optionKey) {
        // Extract numeric values from the line
        const values = line.match(/-?\d+\.?\d*/g);
        if (values && values.length > 0) {
          if (!llpaOverrides[currentCategory][optionKey]) {
            llpaOverrides[currentCategory][optionKey] = {};
          }

          values.forEach((val, idx) => {
            if (idx < ltvHeaders.length && ltvHeaders[idx]) {
              const numVal = parseValue(val);
              if (numVal !== null) {
                llpaOverrides[currentCategory][optionKey][ltvHeaders[idx]] = numVal;
              }
            }
          });
        }
      }
    }
  }

  // Also try pattern-based extraction for common LLPA formats
  const patternOverrides = extractLlpaPatterns(text);

  // Merge pattern-based extractions
  for (const [cat, options] of Object.entries(patternOverrides)) {
    if (!llpaOverrides[cat]) llpaOverrides[cat] = {};
    for (const [opt, buckets] of Object.entries(options)) {
      if (!llpaOverrides[cat][opt]) llpaOverrides[cat][opt] = {};
      Object.assign(llpaOverrides[cat][opt], buckets);
    }
  }

  return llpaOverrides;
}

/**
 * Pattern-based LLPA extraction for common rate sheet formats
 */
function extractLlpaPatterns(text) {
  const overrides = {};

  // Pattern: "FICO Score" section with rows like "≥780  0.000  0.000  0.125  ..."
  const ficoPattern = /([≥><]?\d{3}(?:\s*-\s*\d{3})?)\s+((?:-?\d+\.\d{3}\s*)+)/gi;
  let match;
  while ((match = ficoPattern.exec(text)) !== null) {
    const range = match[1].trim();
    const values = match[2].trim().split(/\s+/).map(v => parseFloat(v));

    // Map to our FICO keys
    let optionKey = null;
    if (range.includes('780')) optionKey = '≥780';
    else if (range.includes('760')) optionKey = '760-779';
    else if (range.includes('740')) optionKey = '740-759';
    else if (range.includes('720')) optionKey = '720-739';
    else if (range.includes('700')) optionKey = '700-719';
    else if (range.includes('680')) optionKey = '680-699';
    else if (range.includes('660')) optionKey = '660-679';
    else if (range.includes('640')) optionKey = '640-659';
    else if (range.includes('620')) optionKey = '620-639';

    if (optionKey && values.length > 0) {
      if (!overrides.ficoScore) overrides.ficoScore = {};
      if (!overrides.ficoScore[optionKey]) overrides.ficoScore[optionKey] = {};

      values.forEach((val, idx) => {
        if (idx < LTV_BUCKETS.length && !isNaN(val)) {
          overrides.ficoScore[optionKey][LTV_BUCKETS[idx]] = val;
        }
      });
    }
  }

  // Pattern: Loan amount ranges like "$100K-$150K  -0.250  0.000  ..."
  const loanPattern = /\$?(\d+)[kK]?\s*-\s*\$?(\d+)[kK]?\s+((?:-?\d+\.\d{3}\s*)+)/gi;
  while ((match = loanPattern.exec(text)) !== null) {
    const lowAmt = parseInt(match[1]) * (match[1].length <= 3 ? 1000 : 1);
    const values = match[3].trim().split(/\s+/).map(v => parseFloat(v));

    // Map to our loan amount keys
    let optionKey = null;
    if (lowAmt >= 75000 && lowAmt < 100000) optionKey = '$75K-$99K';
    else if (lowAmt >= 100000 && lowAmt < 125000) optionKey = '$100K-$124K';
    else if (lowAmt >= 125000 && lowAmt < 150000) optionKey = '$125K-$149K';
    else if (lowAmt >= 150000 && lowAmt < 250000) optionKey = '$150K-$249K';
    else if (lowAmt >= 250000 && lowAmt < 300000) optionKey = '$250K-$299K';
    else if (lowAmt >= 300000 && lowAmt < 500000) optionKey = '$300K-$499K';
    else if (lowAmt >= 500000 && lowAmt < 1000000) optionKey = '$500K-$999K';
    else if (lowAmt >= 1000000 && lowAmt < 1500000) optionKey = '$1M-$1.49M';
    else if (lowAmt >= 1500000 && lowAmt < 2000000) optionKey = '$1.5M-$1.99M';
    else if (lowAmt >= 2000000 && lowAmt < 2500000) optionKey = '$2M-$2.49M';

    if (optionKey && values.length > 0) {
      if (!overrides.loanAmount) overrides.loanAmount = {};
      if (!overrides.loanAmount[optionKey]) overrides.loanAmount[optionKey] = {};

      values.forEach((val, idx) => {
        if (idx < LTV_BUCKETS.length && !isNaN(val)) {
          overrides.loanAmount[optionKey][LTV_BUCKETS[idx]] = val;
        }
      });
    }
  }

  return overrides;
}

/**
 * Parse rate sheet data from extracted PDF text
 * @param {string} text - Extracted PDF text
 * @returns {Object} - Parsed rate sheet data
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

  // Try to extract program name from common patterns
  const programNamePatterns = [
    /Program\s*[:\-]?\s*([A-Za-z0-9\s\-\/]+?)(?:\n|$)/i,
    /Rate\s*Sheet\s*[:\-]?\s*([A-Za-z0-9\s\-\/]+?)(?:\n|$)/i,
    /(NonQM|DSCR|HELOAN|RTL)[\s\-\/]*([A-Za-z0-9]+)?/i,
  ];

  for (const pattern of programNamePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.programName = match[1]?.trim() || match[0]?.trim();
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

  // Extract base rates - look for rate/price pairs
  const ratePatterns = [
    /(\d{1,2}\.\d{2,3})%?\s+(\d{2,3}\.\d{2,3})/g,
    /Rate[:\s]*(\d{1,2}\.\d{2,3}).*?Price[:\s]*(\d{2,3}\.\d{2,3})/gi,
  ];

  const foundRates = new Set();

  for (const pattern of ratePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const rate = parseFloat(match[1]);
      const price = parseFloat(match[2]);

      if (rate >= 4 && rate <= 15 && price >= 90 && price <= 115) {
        const key = `${rate.toFixed(3)}-${price.toFixed(3)}`;
        if (!foundRates.has(key)) {
          foundRates.add(key);
          result.baseRates.push({ rate, price });
        }
      }
    }
  }

  result.baseRates.sort((a, b) => a.rate - b.rate);

  // Extract FICO requirements
  const ficoMatch = text.match(/Min(?:imum)?\s*FICO[:\s]*(\d{3})/i);
  if (ficoMatch) {
    result.settings.minFico = parseInt(ficoMatch[1]);
  }

  // Extract Max LTV
  const ltvMatch = text.match(/Max(?:imum)?\s*LTV[:\s]*(\d{2,3})%?/i);
  if (ltvMatch) {
    result.settings.maxLTV = parseInt(ltvMatch[1]);
  }

  // Extract loan amount limits
  const minLoanMatch = text.match(/Min(?:imum)?\s*(?:Loan\s*)?Amount[:\s]*\$?([\d,]+)/i);
  if (minLoanMatch) {
    result.settings.minLoanAmount = parseInt(minLoanMatch[1].replace(/,/g, ''));
  }

  const maxLoanMatch = text.match(/Max(?:imum)?\s*(?:Loan\s*)?Amount[:\s]*\$?([\d,]+)/i);
  if (maxLoanMatch) {
    result.settings.maxLoanAmount = parseInt(maxLoanMatch[1].replace(/,/g, ''));
  }

  // Parse LLPA grid data
  result.llpaData = parseLlpaFromText(text);

  // Count extracted LLPA entries
  let llpaCount = 0;
  for (const cat of Object.values(result.llpaData)) {
    for (const opt of Object.values(cat)) {
      llpaCount += Object.keys(opt).length;
    }
  }

  // Add warnings if parsing was incomplete
  if (result.baseRates.length === 0) {
    result.parseWarnings.push('Could not extract base rates from PDF. Please enter manually.');
  }
  if (!result.programName) {
    result.parseWarnings.push('Could not detect program name. Please enter manually.');
    result.programName = 'Imported Rate Sheet';
  }
  if (llpaCount === 0) {
    result.parseWarnings.push('Could not extract LLPA adjustments. Please enter manually in the LLPA Grid tab.');
  } else {
    result.parseWarnings.push(`Extracted ${llpaCount} LLPA adjustment values. Please review in the LLPA Grid tab.`);
  }

  return result;
}

/**
 * Parse a PDF file and return structured rate sheet data
 * @param {File} file - The PDF file to parse
 * @returns {Promise<Object>} - Parsed rate sheet data
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
 * @param {Object} parsedData - Data from parsePdfRateSheet
 * @returns {Object} - Rate sheet object ready for storage
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

export default {
  extractTextFromPdf,
  parseRateSheetFromText,
  parsePdfRateSheet,
  parseLlpaFromText,
  convertToRateSheet,
};
