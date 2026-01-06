/**
 * Rate Sheet Storage Configuration
 * Manages multiple investor rate sheets with base pricing, LLPAs, and margin holdback
 */

import { LTV_BUCKETS, LLPA_CATEGORIES } from './llpaConfig';

// Storage key for localStorage
export const RATE_SHEET_STORAGE_KEY = 'quickprice_rate_sheets';

// Default margin holdback (hidden from client)
export const DEFAULT_MARGIN_HOLDBACK = -1.625;

// Default rate sheet template
export const createDefaultRateSheet = (id, name, programType = 'NonQM') => ({
  id,
  name,
  programType, // 'NonQM', 'DSCR', 'HELOAN', 'RTL'
  description: '',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  // Margin holdback (deducted from base pricing on backend)
  marginHoldback: DEFAULT_MARGIN_HOLDBACK,

  // LTV Buckets for this program
  ltvBuckets: [...LTV_BUCKETS],

  // Base Rates Grid
  baseRates: [
    { rate: 6.000, price: 99.000 },
    { rate: 6.125, price: 99.375 },
    { rate: 6.250, price: 99.750 },
    { rate: 6.375, price: 100.125 },
    { rate: 6.500, price: 100.500 },
    { rate: 6.625, price: 100.875 },
    { rate: 6.750, price: 101.250 },
    { rate: 6.875, price: 101.625 },
    { rate: 7.000, price: 102.000 },
    { rate: 7.125, price: 102.375 },
    { rate: 7.250, price: 102.750 },
    { rate: 7.375, price: 103.125 },
    { rate: 7.500, price: 103.500 },
    { rate: 7.625, price: 103.875 },
    { rate: 7.750, price: 104.250 },
    { rate: 7.875, price: 104.625 },
    { rate: 8.000, price: 105.000 },
  ],

  // LLPA Overrides (category -> option -> bucket -> value)
  llpaOverrides: {},

  // N/A Overrides (to allow editing previously null values)
  naOverrides: {}, // category -> option -> bucket -> value (or null to keep N/A)

  // Program-specific settings
  settings: {
    minFico: 620,
    maxLTV: 90,
    minLoanAmount: 75000,
    maxLoanAmount: 5000000,
    requiresDSCR: false,
    allowedStates: [],
    allowedDocTypes: [],
    allowedPropertyTypes: [],
  }
});

// Default investor rate sheets
export const DEFAULT_RATE_SHEETS = [
  {
    ...createDefaultRateSheet('defy-nonqm-c', 'Defy NonQM-C', 'NonQM'),
    description: 'Non-QM Standard Program',
    baseRates: [
      { rate: 5.999, price: 99.323 },
      { rate: 6.125, price: 99.686 },
      { rate: 6.250, price: 100.038 },
      { rate: 6.375, price: 100.538 },
      { rate: 6.499, price: 101.038 },
      { rate: 6.625, price: 101.538 },
      { rate: 6.750, price: 101.913 },
      { rate: 6.875, price: 102.288 },
      { rate: 6.999, price: 102.663 },
      { rate: 7.125, price: 103.038 },
      { rate: 7.250, price: 103.413 },
      { rate: 7.375, price: 103.663 },
      { rate: 7.499, price: 103.913 },
      { rate: 7.620, price: 104.163 },
      { rate: 7.750, price: 104.413 },
      { rate: 7.875, price: 104.663 },
      { rate: 7.999, price: 104.913 },
      { rate: 8.125, price: 105.163 },
      { rate: 8.250, price: 105.413 },
      { rate: 8.375, price: 105.538 },
      { rate: 8.499, price: 105.663 },
      { rate: 8.625, price: 105.788 },
      { rate: 8.750, price: 105.913 },
      { rate: 8.875, price: 106.038 },
      { rate: 8.990, price: 106.163 },
    ],
    settings: {
      minFico: 680,
      maxLTV: 80,
      minLoanAmount: 100000,
      maxLoanAmount: 3000000,
      requiresDSCR: false,
      allowedStates: ['CA', 'GA', 'FL', 'TX', 'CO', 'AL', 'TN'],
      allowedDocTypes: ['2yr Full Doc', '1yr Full Doc', '12m Bank Stmts', '24m Bank Stmts', 'Asset Depletion', '1yr 1099 Only', '1yr WVOE Only'],
      allowedPropertyTypes: ['SFR/Single Family', 'PUD/Town Home', 'Condo', '2 Unit', '2-4 Unit'],
    }
  },
  {
    ...createDefaultRateSheet('defy-dscr-c', 'Defy DSCR-C', 'DSCR'),
    description: 'DSCR Investment Program',
    baseRates: [
      { rate: 5.990, price: 98.073 },
      { rate: 6.125, price: 98.436 },
      { rate: 6.250, price: 98.788 },
      { rate: 6.375, price: 99.128 },
      { rate: 6.499, price: 99.456 },
      { rate: 6.625, price: 99.772 },
      { rate: 6.750, price: 100.076 },
      { rate: 6.875, price: 100.378 },
      { rate: 6.990, price: 100.678 },
      { rate: 7.125, price: 100.951 },
      { rate: 7.250, price: 101.238 },
      { rate: 7.375, price: 101.532 },
      { rate: 7.499, price: 101.844 },
      { rate: 7.625, price: 102.091 },
      { rate: 7.750, price: 102.352 },
      { rate: 7.875, price: 102.627 },
      { rate: 7.999, price: 102.876 },
      { rate: 8.125, price: 103.119 },
      { rate: 8.250, price: 103.355 },
      { rate: 8.375, price: 103.586 },
      { rate: 8.499, price: 103.810 },
      { rate: 8.625, price: 104.029 },
      { rate: 8.750, price: 104.241 },
      { rate: 8.875, price: 104.448 },
      { rate: 8.999, price: 104.648 },
    ],
    settings: {
      minFico: 720,
      maxLTV: 80,
      minLoanAmount: 150000,
      maxLoanAmount: 2000000,
      requiresDSCR: true,
      allowedStates: ['AL', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'IN', 'IA', 'KY', 'LA', 'ME', 'MA', 'MO', 'MT', 'NE', 'NH', 'NJ', 'NY', 'OH', 'OK', 'PA', 'SC', 'TN', 'TX', 'VA', 'WA', 'WV', 'WY'],
      allowedDocTypes: ['DSCR'],
      allowedPropertyTypes: ['SFR/Single Family', 'PUD/Town Home', 'Condo', '2 Unit', '3-4 Unit', '2-8 Unit Mixed Use'],
    }
  },
  {
    ...createDefaultRateSheet('defy-dscr-a', 'Defy DSCR-A', 'DSCR'),
    description: 'DSCR Premium Program',
    baseRates: [
      { rate: 6.250, price: 100.340 },
      { rate: 6.375, price: 101.340 },
      { rate: 6.500, price: 102.015 },
      { rate: 6.625, price: 102.515 },
      { rate: 6.750, price: 103.015 },
      { rate: 6.875, price: 103.490 },
      { rate: 6.990, price: 103.940 },
      { rate: 7.125, price: 104.390 },
      { rate: 7.250, price: 104.840 },
      { rate: 7.375, price: 105.215 },
      { rate: 7.500, price: 105.590 },
      { rate: 7.625, price: 105.965 },
      { rate: 7.750, price: 106.340 },
      { rate: 7.875, price: 106.715 },
      { rate: 7.990, price: 107.090 },
      { rate: 8.125, price: 107.465 },
      { rate: 8.250, price: 107.805 },
      { rate: 8.375, price: 108.105 },
      { rate: 8.500, price: 108.405 },
    ],
    settings: {
      minFico: 640,
      maxLTV: 80,
      minLoanAmount: 150000,
      maxLoanAmount: 3500000,
      requiresDSCR: true,
      allowedStates: ['AL', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MS', 'MO', 'MT', 'NE', 'NH', 'NJ', 'NM', 'NY', 'OH', 'OK', 'PA', 'RI', 'SC', 'TN', 'TX', 'VA', 'WA', 'WV', 'WI', 'WY'],
      allowedDocTypes: ['DSCR'],
      allowedPropertyTypes: ['SFR/Single Family', 'PUD/Town Home', 'Condo', 'Condo (Non-Warrantable)', '2 Unit', '3-4 Unit', '5-9 Unit Residential'],
    }
  },
  {
    ...createDefaultRateSheet('defy-nonqm-a', 'Defy NonQM-A', 'NonQM'),
    description: 'Non-QM High Balance Program',
    ltvBuckets: ['≤50.00', '50.01-55.00', '55.01-60.00', '60.01-65.00', '65.01-70.00', '70.01-75.00', '75.01-80.00', '80.01-85.00', '85.01-90.00'],
    baseRates: [
      { rate: 6.375, price: 100.315 },
      { rate: 6.500, price: 101.090 },
      { rate: 6.625, price: 101.690 },
      { rate: 6.750, price: 102.240 },
      { rate: 6.875, price: 102.690 },
      { rate: 6.990, price: 103.140 },
      { rate: 7.125, price: 103.515 },
      { rate: 7.250, price: 103.915 },
      { rate: 7.375, price: 104.290 },
      { rate: 7.500, price: 104.615 },
      { rate: 7.625, price: 104.865 },
      { rate: 7.750, price: 105.140 },
      { rate: 7.875, price: 105.390 },
      { rate: 7.990, price: 105.640 },
      { rate: 8.125, price: 105.890 },
      { rate: 8.250, price: 106.140 },
      { rate: 8.375, price: 106.390 },
      { rate: 8.500, price: 106.640 },
      { rate: 8.625, price: 106.890 },
      { rate: 8.750, price: 107.140 },
    ],
    settings: {
      minFico: 660,
      maxLTV: 90,
      minLoanAmount: 100000,
      maxLoanAmount: 5000000,
      requiresDSCR: false,
      allowedStates: ['CA', 'CO', 'GA', 'FL', 'TX', 'AL', 'TN'],
      allowedDocTypes: ['12m Bank Stmts', 'Asset Depletion', '1yr P&L w/2m Bank Stmts', '1yr P&L Only'],
      allowedPropertyTypes: ['SFR/Single Family', 'PUD/Town Home', 'Condo', 'Condo (Non-Warrantable)', '2 Unit', '2-4 Unit', '3-4 Unit'],
    }
  },
];

// Program type options
export const PROGRAM_TYPES = [
  { value: 'NonQM', label: 'Non-QM' },
  { value: 'DSCR', label: 'DSCR' },
  { value: 'HELOAN', label: 'HELOAN' },
  { value: 'RTL', label: 'RTL/Bridge' },
];

// All US States
export const ALL_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
  'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
  'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
  'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
  'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

// All Doc Types
export const ALL_DOC_TYPES = [
  '2yr Full Doc', '1yr Full Doc', 'DSCR', '12m Bank Stmts', '24m Bank Stmts',
  'Asset Depletion', '1yr P&L Only', '1yr P&L w/2m Bank Stmts', '1yr 1099 Only', '1yr WVOE Only'
];

// All Property Types
export const ALL_PROPERTY_TYPES = [
  'SFR/Single Family', 'PUD/Town Home', 'Condo', 'Condo (Non-Warrantable)', 'Condotel',
  '2 Unit', '2-4 Unit', '3-4 Unit', '2-8 Unit Mixed Use', '9-10 Unit Mixed Use',
  '5-9 Unit Residential', 'Blanket/Cross Collateral', 'Small Balance Commercial'
];

// Helper to load rate sheets from storage
export const loadRateSheets = () => {
  try {
    const saved = localStorage.getItem(RATE_SHEET_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load rate sheets:', e);
  }
  return DEFAULT_RATE_SHEETS;
};

// Helper to save rate sheets to storage
export const saveRateSheets = (rateSheets) => {
  try {
    localStorage.setItem(RATE_SHEET_STORAGE_KEY, JSON.stringify(rateSheets));
    return true;
  } catch (e) {
    console.error('Failed to save rate sheets:', e);
    return false;
  }
};

// Generate full JSON export template
export const generateExportTemplate = (rateSheet) => {
  const template = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    rateSheet: {
      ...rateSheet,
      llpaCategories: Object.keys(LLPA_CATEGORIES).reduce((acc, catKey) => {
        const cat = LLPA_CATEGORIES[catKey];
        acc[catKey] = {
          label: cat.label,
          dscrOnly: cat.dscrOnly || false,
          conditional: cat.conditional || null,
          options: cat.options.map(opt => ({
            key: opt.key,
            label: opt.label,
            isDefault: opt.isDefault || false,
            values: rateSheet.llpaOverrides?.[catKey]?.[opt.key] || opt.values
          }))
        };
        return acc;
      }, {})
    }
  };
  return template;
};

// Generate blank template for new rate sheet
export const generateBlankTemplate = () => {
  return {
    version: '1.0',
    rateSheet: {
      id: '',
      name: '',
      programType: 'NonQM',
      description: '',
      marginHoldback: DEFAULT_MARGIN_HOLDBACK,
      ltvBuckets: [...LTV_BUCKETS],
      baseRates: [],
      llpaOverrides: {},
      naOverrides: {},
      settings: {
        minFico: 620,
        maxLTV: 90,
        minLoanAmount: 75000,
        maxLoanAmount: 5000000,
        requiresDSCR: false,
        allowedStates: [],
        allowedDocTypes: [],
        allowedPropertyTypes: [],
      }
    },
    llpaCategories: LLPA_CATEGORIES
  };
};

export default {
  RATE_SHEET_STORAGE_KEY,
  DEFAULT_MARGIN_HOLDBACK,
  DEFAULT_RATE_SHEETS,
  PROGRAM_TYPES,
  ALL_STATES,
  ALL_DOC_TYPES,
  ALL_PROPERTY_TYPES,
  createDefaultRateSheet,
  loadRateSheets,
  saveRateSheets,
  generateExportTemplate,
  generateBlankTemplate,
};
