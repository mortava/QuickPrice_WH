/**
 * PDF Parser Utility for Rate Sheet Import
 * Uses PDF.js to extract text and parse rate sheet data
 */

import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extract all text content from a PDF file
 * @param {File} file - The PDF file to parse
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n\n';
  }

  return fullText;
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
    // Pattern: "6.000% 100.500" or "6.000 100.500"
    /(\d{1,2}\.\d{2,3})%?\s+(\d{2,3}\.\d{2,3})/g,
    // Pattern: "Rate: 6.000 Price: 100.500"
    /Rate[:\s]*(\d{1,2}\.\d{2,3}).*?Price[:\s]*(\d{2,3}\.\d{2,3})/gi,
  ];

  const foundRates = new Set();

  for (const pattern of ratePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const rate = parseFloat(match[1]);
      const price = parseFloat(match[2]);

      // Validate rate range (typically 4% - 15%)
      if (rate >= 4 && rate <= 15 && price >= 90 && price <= 115) {
        const key = `${rate.toFixed(3)}-${price.toFixed(3)}`;
        if (!foundRates.has(key)) {
          foundRates.add(key);
          result.baseRates.push({ rate, price });
        }
      }
    }
  }

  // Sort rates by rate value
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

  // Try to extract LLPA values from tables
  // Look for patterns like "720-739 -0.250" or FICO score adjustments
  const llpaPatterns = [
    // FICO score adjustments
    {
      category: 'ficoScore',
      pattern: /(≥?\d{3}(?:\s*-\s*\d{3})?)\s+(-?\d+\.\d{2,3})/g
    },
    // Loan amount adjustments
    {
      category: 'loanAmount',
      pattern: /\$?([\d,]+)\s*-\s*\$?([\d,]+)\s+(-?\d+\.\d{2,3})/g
    },
  ];

  for (const { category, pattern } of llpaPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (!result.llpaData[category]) {
        result.llpaData[category] = {};
      }
      const key = match[1].replace(/,/g, '');
      const value = parseFloat(match[match.length - 1]);
      result.llpaData[category][key] = value;
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
    ltvBuckets: ['≤50.00', '50.01-55.00', '55.01-60.00', '60.01-65.00', '65.01-70.00', '70.01-75.00', '75.01-80.00', '80.01-85.00', '85.01-90.00'],
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
  convertToRateSheet,
};
