/**
 * LLPA Configuration - Master Key Structure
 * Based on rate_sheet_master_key.pdf
 */

// LTV Buckets
export const LTV_BUCKETS = [
  '≤50.00',
  '50.01-55.00',
  '55.01-60.00',
  '60.01-65.00',
  '65.01-70.00',
  '70.01-75.00',
  '75.01-80.00',
  '80.01-85.00',
  '85.01-90.00'
];

// Default null grid (all zeros)
const defaultGrid = () => LTV_BUCKETS.reduce((acc, bucket) => ({ ...acc, [bucket]: 0 }), {});
const nullGrid = (nullBuckets = []) => {
  const grid = defaultGrid();
  nullBuckets.forEach(bucket => { grid[bucket] = null; });
  return grid;
};

// LLPA Field Categories
export const LLPA_CATEGORIES = {
  ficoScore: {
    label: 'FICO Score',
    options: [
      { key: '≥780', label: '≥780', values: defaultGrid() },
      { key: '760-779', label: '760-779', values: defaultGrid() },
      { key: '740-759', label: '740-759', values: defaultGrid() },
      { key: '720-739', label: '720-739', values: defaultGrid() },
      { key: '700-719', label: '700-719', values: defaultGrid() },
      { key: '680-699', label: '680-699', values: defaultGrid() },
      { key: '660-679', label: '660-679', values: nullGrid(['85.01-90.00']) },
      { key: '640-659', label: '640-659', values: nullGrid(['85.01-90.00']) },
      { key: '620-639', label: '620-639', values: nullGrid(['80.01-85.00', '85.01-90.00']) },
      { key: '600-619', label: '600-619', values: nullGrid(['75.01-80.00', '80.01-85.00', '85.01-90.00']) },
      { key: '580-599', label: '580-599', values: nullGrid(LTV_BUCKETS) },
      { key: 'FN-NoScore', label: 'Foreign National - No Score', values: nullGrid(['75.01-80.00', '80.01-85.00', '85.01-90.00']) },
    ]
  },
  loanAmount: {
    label: 'Loan Amount',
    options: [
      { key: '$75K-$99K', label: '$75,000 - $99,999', values: defaultGrid() },
      { key: '$100K-$124K', label: '$100,000 - $124,999', values: defaultGrid() },
      { key: '$125K-$149K', label: '$125,000 - $149,999', values: defaultGrid() },
      { key: '$150K-$249K', label: '$150,000 - $249,999', values: defaultGrid() },
      { key: '$250K-$299K', label: '$250,000 - $299,999', values: defaultGrid() },
      { key: '$300K-$499K', label: '$300,000 - $499,999', values: defaultGrid() },
      { key: '$500K-$999K', label: '$500,000 - $999,999', values: defaultGrid() },
      { key: '$1M-$1.49M', label: '$1,000,000 - $1,499,999', values: defaultGrid() },
      { key: '$1.5M-$1.99M', label: '$1,500,000 - $1,999,999', values: defaultGrid() },
      { key: '$2M-$2.49M', label: '$2,000,000 - $2,499,999', values: defaultGrid() },
      { key: '$2.5M-$2.99M', label: '$2,500,000 - $2,999,999', values: defaultGrid() },
      { key: '$3M-$3.49M', label: '$3,000,000 - $3,499,999', values: defaultGrid() },
      { key: '$3.5M-$3.99M', label: '$3,500,000 - $3,999,999', values: nullGrid(['80.01-85.00', '85.01-90.00']) },
      { key: '$4M-$4.49M', label: '$4,000,000 - $4,499,999', values: nullGrid(['80.01-85.00', '85.01-90.00']) },
      { key: '$4.5M-$5M', label: '$4,500,000 - $5,000,000', values: nullGrid(['75.01-80.00', '80.01-85.00', '85.01-90.00']) },
      { key: '$50K-$74K', label: '$50,000 - $74,999 (HELOAN Only)', values: defaultGrid() },
    ]
  },
  incomeDocType: {
    label: 'Income Document Type',
    options: [
      { key: '2yr-full-doc', label: '2yr Full Doc (Default)', values: defaultGrid(), isDefault: true },
      { key: '1yr-full-doc', label: '1yr Full Doc', values: defaultGrid() },
      { key: 'dscr', label: 'DSCR', values: nullGrid(['85.01-90.00']) },
      { key: '12m-bank', label: '12m Bank Statements', values: defaultGrid() },
      { key: '24m-bank', label: '24m Bank Statements', values: defaultGrid() },
      { key: 'asset-depletion', label: 'Asset Depletion', values: defaultGrid() },
      { key: '1yr-pl-only', label: '1yr P&L Only', values: defaultGrid() },
      { key: '1yr-pl-2m-bank', label: '1yr P&L w/2m Bank Stmts', values: defaultGrid() },
      { key: '1yr-1099', label: '1yr 1099 Only', values: defaultGrid() },
      { key: '1yr-wvoe', label: '1yr WVOE Only', values: defaultGrid() },
    ]
  },
  dtiRatio: {
    label: 'DTI Ratio',
    options: [
      { key: '≤43%', label: '≤43.00% (Default)', values: defaultGrid(), isDefault: true },
      { key: '43.01-50%', label: '43.01% - 50.00%', values: defaultGrid() },
      { key: '50.01-55%', label: '50.01% - 55.00%', values: nullGrid(['85.01-90.00']) },
    ]
  },
  loanProduct: {
    label: 'Loan Product Type',
    options: [
      { key: '30yr-fixed', label: '30yr Fixed (Default)', values: defaultGrid(), isDefault: true },
      { key: 'io-30yr', label: 'Interest-Only (30yr)', values: nullGrid(['85.01-90.00']) },
      { key: 'io-40yr', label: 'Interest-Only (40yr)', values: nullGrid(['85.01-90.00']) },
      { key: '40yr-fixed', label: '40 Year Fixed', values: defaultGrid() },
      { key: '15yr-fixed', label: '15yr Fixed', values: defaultGrid() },
      { key: '20yr-fixed', label: '20yr Fixed (HELOAN Only)', values: defaultGrid() },
      { key: '25yr-fixed', label: '25yr Fixed (HELOAN Only)', values: defaultGrid() },
      { key: '5-6-arm', label: '5/6 ARM', values: defaultGrid() },
      { key: '7-6-arm', label: '7/6 ARM', values: defaultGrid() },
      { key: '10-6-arm', label: '10/6 ARM', values: defaultGrid() },
      { key: '12m-io-rtl', label: '12m I/O (RTL/Fix & Flip)', values: nullGrid(LTV_BUCKETS) },
    ]
  },
  loanPurpose: {
    label: 'Loan Purpose',
    options: [
      { key: 'purchase', label: 'Purchase (Default)', values: defaultGrid(), isDefault: true },
      { key: 'rate-term', label: 'Rate & Term', values: defaultGrid() },
      { key: 'cash-out', label: 'Cash-Out', values: nullGrid(['85.01-90.00']) },
    ]
  },
  escrowWaiver: {
    label: 'Escrow Waiver',
    options: [
      { key: 'no', label: 'No (Default)', values: defaultGrid(), isDefault: true },
      { key: 'yes', label: 'Yes (Waive Escrow)', values: LTV_BUCKETS.reduce((acc, b) => ({ ...acc, [b]: -0.250 }), {}) },
    ]
  },
  occupancy: {
    label: 'Occupancy',
    options: [
      { key: 'primary', label: 'Primary (Default)', values: defaultGrid(), isDefault: true },
      { key: 'second-home', label: 'Second Home', values: defaultGrid() },
      { key: 'investor', label: 'Investor', values: nullGrid(['85.01-90.00']) },
    ]
  },
  fthb: {
    label: 'First Time Home Buyer',
    options: [
      { key: 'no', label: 'No', values: defaultGrid() },
      { key: 'yes', label: 'Yes', values: defaultGrid() },
    ]
  },
  propertyType: {
    label: 'Property Type',
    options: [
      { key: 'sfr', label: 'SFR / Single Family (Default)', values: defaultGrid(), isDefault: true },
      { key: 'pud', label: 'PUD / ROW / Town Home', values: defaultGrid() },
      { key: 'condo', label: 'Condo', values: defaultGrid() },
      { key: 'condo-non-warrant', label: 'Condo (Non-Warrantable)', values: nullGrid(['80.01-85.00', '85.01-90.00']) },
      { key: 'condotel', label: 'Condotel', values: nullGrid(['80.01-85.00', '85.01-90.00']) },
      { key: '2-unit', label: '2 Unit', values: defaultGrid() },
      { key: '2-4-unit', label: '2-4 Unit', values: defaultGrid() },
      { key: '3-4-unit', label: '3-4 Unit', values: defaultGrid() },
      { key: '2-8-mixed', label: '2-8 Unit Mixed Use', values: nullGrid(['75.01-80.00', '80.01-85.00', '85.01-90.00']) },
      { key: '9-10-mixed', label: '9-10 Unit Mixed Use', values: nullGrid(['75.01-80.00', '80.01-85.00', '85.01-90.00']) },
      { key: 'blanket', label: 'Blanket/Cross Collateral', values: nullGrid(['75.01-80.00', '80.01-85.00', '85.01-90.00']) },
      { key: '5-9-resi', label: '5-9 Unit Residential', values: nullGrid(['75.01-80.00', '80.01-85.00', '85.01-90.00']) },
      { key: 'commercial', label: 'Small Balance Commercial', values: nullGrid(LTV_BUCKETS) },
    ]
  },
  ruralProperty: {
    label: 'Rural Property',
    options: [
      { key: 'no', label: 'No (Default)', values: defaultGrid(), isDefault: true },
      { key: 'yes', label: 'Yes', values: nullGrid(['80.01-85.00', '85.01-90.00']) },
    ]
  },
  citizenship: {
    label: 'Citizenship',
    options: [
      { key: 'us-citizen', label: 'US Citizen (Default)', values: defaultGrid(), isDefault: true },
      { key: 'perm-resident', label: 'Permanent Resident', values: defaultGrid() },
      { key: 'non-perm', label: 'Non-Perm Resident', values: defaultGrid() },
      { key: 'foreign-national', label: 'Foreign National/FN', values: nullGrid(['80.01-85.00', '85.01-90.00']) },
      { key: 'itin', label: 'ITIN', values: nullGrid(['80.01-85.00', '85.01-90.00']) },
    ]
  },
  dscrRange: {
    label: 'DSCR Range',
    dscrOnly: true,
    options: [
      { key: '≥1.250', label: '≥1.250%', values: nullGrid(['85.01-90.00']) },
      { key: '1.150-1.249', label: '1.150% - 1.249%', values: nullGrid(['85.01-90.00']) },
      { key: '1.000-1.149', label: '1.000% - 1.149% (Default)', values: nullGrid(['85.01-90.00']), isDefault: true },
      { key: '0.750-0.999', label: '0.750% - 0.999%', values: nullGrid(['≤50.00', '85.01-90.00']) },
      { key: '0.500-0.749', label: '0.500% - 0.749%', values: nullGrid(['≤50.00', '50.01-55.00', '75.01-80.00', '80.01-85.00', '85.01-90.00']) },
      { key: '≤0.499', label: '≤0.499% - No Ratio', values: nullGrid(['≤50.00', '50.01-55.00', '55.01-60.00', '75.01-80.00', '80.01-85.00', '85.01-90.00']) },
      { key: '≥1.40-5-9', label: '≥1.40% (5-9 Units Resi Only)', values: nullGrid(['≤50.00', '50.01-55.00', '55.01-60.00', '75.01-80.00', '80.01-85.00', '85.01-90.00']) },
    ]
  },
  prepayPeriod: {
    label: 'Prepay Period',
    dscrOnly: true,
    options: [
      { key: '0-no-prepay', label: '0 - No Prepay', values: nullGrid(['85.01-90.00']) },
      { key: '1yr', label: '1 Year', values: nullGrid(['85.01-90.00']) },
      { key: '2yr', label: '2 Year', values: nullGrid(['85.01-90.00']) },
      { key: '3yr', label: '3 Year', values: nullGrid(['85.01-90.00']) },
      { key: '4yr', label: '4 Year', values: nullGrid(['85.01-90.00']) },
      { key: '5yr', label: '5 Year', values: nullGrid(['85.01-90.00']) },
    ]
  },
  prepayFeeType: {
    label: 'Prepay Fee Type',
    dscrOnly: true,
    options: [
      { key: 'standard-5', label: 'Standard 5% (Default)', values: nullGrid(['85.01-90.00']), isDefault: true },
      { key: '6mo-interest', label: '6 Month Interest (ALT ≥3yr)', values: nullGrid(['85.01-90.00']) },
      { key: 'declining', label: 'Declining (ALT ≥3yr)', values: nullGrid(['85.01-90.00']) },
    ]
  },
  str: {
    label: 'Short Term Rental (STR)',
    dscrOnly: true,
    options: [
      { key: 'no', label: 'No (Default)', values: nullGrid(['85.01-90.00']), isDefault: true },
      { key: 'yes', label: 'Yes', values: nullGrid(['80.01-85.00', '85.01-90.00']) },
    ]
  },
  titleVesting: {
    label: 'Title Vesting',
    dscrOnly: true,
    options: [
      { key: 'individual', label: 'Individual', values: nullGrid(['85.01-90.00']) },
      { key: 'llc-corp', label: 'LLC/Corp/Other', values: nullGrid(['85.01-90.00']) },
    ]
  },
  creditEvent: {
    label: 'Credit Event (FC/BK/SS/DIL)',
    conditional: 'adverseCredit',
    options: [
      { key: '≥48m-none', label: '≥48m / None (Default)', values: defaultGrid(), isDefault: true },
      { key: '36m-47m', label: '36m - 47m', values: defaultGrid() },
      { key: '24m-35m', label: '24m - 35m', values: nullGrid(['85.01-90.00']) },
      { key: '12m-23m', label: '12m - 23m / Settled', values: nullGrid(['75.01-80.00', '80.01-85.00', '85.01-90.00']) },
      { key: '≤11m', label: '≤11m', values: nullGrid(LTV_BUCKETS) },
      { key: '≥84m-2nd', label: '≥84m (2nd Lien Only)', values: defaultGrid() },
      { key: '≤83m-2nd', label: '≤83m (2nd Lien Only)', values: nullGrid(LTV_BUCKETS) },
    ]
  },
  mtgHistory: {
    label: 'Mortgage History',
    conditional: 'adverseCredit',
    options: [
      { key: '0x30x24', label: '0x30x24 / None (Default)', values: defaultGrid(), isDefault: true },
      { key: '1x30x12', label: '1x30x12', values: defaultGrid() },
      { key: '2x30x12', label: '2x30x12', values: nullGrid(['80.01-85.00', '85.01-90.00']) },
      { key: '3x30x12', label: '3x30x12', values: defaultGrid() },
      { key: '1x60x12', label: '1x60x12', values: nullGrid(['70.01-75.00', '75.01-80.00', '80.01-85.00', '85.01-90.00']) },
      { key: '≥2x60x12', label: '≥2x60x12', values: nullGrid(LTV_BUCKETS) },
      { key: '≥1x90x24', label: '≥1x90x24', values: nullGrid(LTV_BUCKETS) },
      { key: '≥1x30x24-heloan', label: '≥1x30x24 (HELOAN Only)', values: nullGrid(LTV_BUCKETS) },
    ]
  },
  lockTerm: {
    label: 'Lock Term',
    options: [
      { key: '15-day', label: '15 Day', values: defaultGrid() },
      { key: '30-day', label: '30 Day Lock (Default)', values: defaultGrid(), isDefault: true },
      { key: '45-day', label: '45 Day', values: LTV_BUCKETS.reduce((acc, b) => ({ ...acc, [b]: -0.250 }), {}) },
    ]
  },
  stateAdjustments: {
    label: 'State Adjustments',
    options: [
      { key: 'none', label: 'None (Default)', values: defaultGrid(), isDefault: true },
      { key: 'FL', label: 'Florida', values: defaultGrid() },
      { key: 'GA', label: 'Georgia', values: defaultGrid() },
      { key: 'OH', label: 'Ohio', values: defaultGrid() },
      { key: 'TX', label: 'Texas', values: defaultGrid() },
    ]
  },
  fthbDscr: {
    label: 'FTHB - DSCR',
    dscrOnly: true,
    conditional: 'otherDetails',
    options: [
      { key: 'no', label: 'No (Default)', values: defaultGrid(), isDefault: true },
      { key: 'yes', label: 'Yes', values: { ...LTV_BUCKETS.slice(0, 7).reduce((acc, b) => ({ ...acc, [b]: -0.125 }), {}), '80.01-85.00': -0.250, '85.01-90.00': null } },
    ]
  },
  limitedTradelines: {
    label: 'Limited Tradelines',
    conditional: 'otherDetails',
    options: [
      { key: 'no', label: 'No (Default)', values: defaultGrid(), isDefault: true },
      { key: 'yes', label: 'Yes (<2x24 Open & Active)', values: nullGrid(['80.01-85.00', '85.01-90.00']) },
    ]
  },
  guidelineException: {
    label: 'Guideline Exception',
    conditional: 'otherDetails',
    options: [
      { key: 'no', label: 'No (Default)', values: defaultGrid(), isDefault: true },
      { key: 'yes', label: 'Yes', values: LTV_BUCKETS.reduce((acc, b) => ({ ...acc, [b]: -0.875 }), {}) },
    ]
  },
  waiveUwFee: {
    label: 'Waive UW Fee',
    conditional: 'otherDetails',
    options: [
      { key: 'no', label: 'No (Default)', values: defaultGrid(), isDefault: true },
      { key: 'yes', label: 'Yes (Calculate: $1895 / Loan Amount)', values: defaultGrid() },
    ]
  }
};

// States configuration
export const STATES_CONFIG = {
  nonDscr: ['CA', 'CO', 'TN', 'TX', 'AL', 'GA', 'FL'],
  dscr: [
    'AL', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI',
    'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MS', 'MO',
    'MT', 'NE', 'NH', 'NM', 'NY', 'OH', 'OK', 'PA', 'RI', 'SC',
    'TN', 'TX', 'VA', 'WA', 'WV', 'WI', 'WY'
  ]
};

// Helper to get category options
export const getCategoryOptions = (categoryKey) => {
  return LLPA_CATEGORIES[categoryKey]?.options || [];
};

// Helper to get all categories
export const getAllCategories = () => {
  return Object.entries(LLPA_CATEGORIES).map(([key, cat]) => ({
    key,
    ...cat
  }));
};

export default {
  LTV_BUCKETS,
  LLPA_CATEGORIES,
  STATES_CONFIG,
  getCategoryOptions,
  getAllCategories
};
