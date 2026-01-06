import { useState, useEffect } from 'react';
import { PillGroup, SmartToggle } from './components';
import { DefyPricingLogic } from './logic/DefyPricingLogic';

export default function App() {
  // --- STATE ---
  const [formData, setFormData] = useState({
    scenarioName: '',
    citizenship: 'US Citizen',
    occupancy: 'Primary',
    fthb: false,
    creditScore: '720-739',
    adverseCredit: false,
    creditEvent: 'None',
    housingHistory: '0x30x12',
    docType: '1yr Full Doc',

    // Loan Details
    lienType: '1st',
    purchasePrice: 800000,
    loanAmount: 560000,
    loanPurpose: 'Purchase',
    loanProduct: '30yr Fixed Rate',
    propertyType: 'SFR/Single Family',
    dti: '≤43%',
    escrowWaiver: false,
    state: 'CA',
    lockTerm: '30 Day',

    // Investor Details
    prepayPeriod: '3yr',
    prepayFee: '5% (Standard)',
    dscrRatio: '≥1.25',
    dscrShortTermRental: false,
  });

  const [ltvBucket, setLtvBucket] = useState('');
  const [rawLtv, setRawLtv] = useState('');
  const [availableStates, setAvailableStates] = useState([]);
  const [error, setError] = useState(null);

  // --- REACTIVE TRIGGERS ---

  // 1. Borrower Trigger (Foreign National & FTHB)
  useEffect(() => {
    try {
      setError(null);
      const cleanData = DefyPricingLogic.applyTriggers(formData);
      if (JSON.stringify(cleanData) !== JSON.stringify(formData)) {
        setFormData(cleanData);
      }
    } catch (e) {
      setError(e.message);
    }
  }, [formData.citizenship, formData.fthb, formData.docType, formData.occupancy, formData.dscrRatio]);

  // 2. Math Trigger (LTV Calculation)
  useEffect(() => {
    const bucket = DefyPricingLogic.getLTVBucket(formData.loanAmount, formData.purchasePrice);
    const ltv = DefyPricingLogic.calculateLTV(formData.loanAmount, formData.purchasePrice);
    setLtvBucket(bucket);
    setRawLtv(ltv);
  }, [formData.purchasePrice, formData.loanAmount]);

  // 3. Licensing Filter
  useEffect(() => {
    setAvailableStates(DefyPricingLogic.getAllowedStates(formData.docType));
  }, [formData.docType]);

  // Format currency input
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // --- RENDER ---
  return (
    <div className="max-w-2xl mx-auto bg-gray-50 min-h-screen pb-28 font-sans">

      {/* Header */}
      <header className="bg-black text-white p-6 sticky top-0 z-50 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              DEFY <span className="text-green-400">TPO</span>
            </h1>
            <p className="text-xs text-gray-400">Quick Pricer - Wholesale</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">LTV</p>
            <p className="text-2xl font-bold text-green-400">{rawLtv}%</p>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500 text-white p-4 m-4 rounded-lg font-bold animate-fade-in">
          ⚠️ {error}
        </div>
      )}

      <div className="p-4 space-y-4">

        {/* SECTION 1: BORROWER */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-black uppercase tracking-tight mb-4 border-b pb-2">
            Borrower Data
          </h2>

          {/* Scenario Name */}
          <div className="mb-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Scenario Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Smith - Purchase"
              className="w-full p-3 border rounded-lg focus:border-black outline-none"
              value={formData.scenarioName}
              onChange={(e) => setFormData({ ...formData, scenarioName: e.target.value })}
            />
          </div>

          {/* Citizenship */}
          <PillGroup
            label="Citizenship"
            options={['US Citizen', 'Perm-Resident', 'Non-Perm Resident', 'Foreign National', 'ITIN']}
            selected={formData.citizenship}
            onChange={(val) => setFormData({ ...formData, citizenship: val })}
          />

          {/* Occupancy */}
          <PillGroup
            label="Occupancy"
            options={['Primary', 'Second Home', 'Investment']}
            selected={formData.occupancy}
            onChange={(val) => setFormData({ ...formData, occupancy: val })}
            disabledOptions={
              formData.citizenship === 'Foreign National' || formData.docType === 'DSCR'
                ? ['Primary', 'Second Home']
                : formData.fthb
                ? ['Second Home']
                : []
            }
          />

          {/* FTHB & Adverse Credit Toggles */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <SmartToggle
              label="First Time Buyer"
              checked={formData.fthb}
              onChange={(val) => setFormData({ ...formData, fthb: val })}
            />
            <SmartToggle
              label="Adverse Credit"
              checked={formData.adverseCredit}
              onChange={(val) => setFormData({ ...formData, adverseCredit: val })}
            />
          </div>

          {/* Credit Score */}
          <div className="mt-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Credit Score
            </label>
            <select
              className="w-full p-3 bg-gray-50 border rounded-lg font-semibold"
              value={formData.creditScore}
              onChange={(e) => setFormData({ ...formData, creditScore: e.target.value })}
            >
              <option>≥780</option>
              <option>760-779</option>
              <option>740-759</option>
              <option>720-739</option>
              <option>700-719</option>
              <option>680-699</option>
              <option>660-679</option>
              <option>640-659</option>
              <option>620-639</option>
              <option>Foreign National - No Score</option>
            </select>
          </div>

          {/* CONDITIONAL: Adverse Credit Details */}
          {formData.adverseCredit && (
            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg animate-fade-in">
              <h3 className="text-xs font-bold text-red-800 uppercase mb-3">
                Derogatory Details
              </h3>

              <div className="mb-3">
                <label className="text-xs font-bold text-gray-600">Credit Event (BK/FC)</label>
                <select
                  className="w-full mt-1 p-2 border rounded"
                  value={formData.creditEvent}
                  onChange={(e) => setFormData({ ...formData, creditEvent: e.target.value })}
                >
                  <option>None</option>
                  <option>≥48m</option>
                  <option>≤47m</option>
                  <option>≥36m</option>
                  <option>≥36m - 47m</option>
                  <option>≥24m - 35m</option>
                  <option>≥12m - 23m</option>
                  <option>≤11m (Null)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600">Housing History</label>
                <select
                  className="w-full mt-1 p-2 border rounded"
                  value={formData.housingHistory}
                  onChange={(e) => setFormData({ ...formData, housingHistory: e.target.value })}
                >
                  <option>None</option>
                  <option>0x30x12</option>
                  <option>0x30x24</option>
                  <option>1x30x12</option>
                  <option>≥1x30x12</option>
                  <option>≥2x30x12</option>
                  <option>≥0x60x12</option>
                  <option>≥1x60x12</option>
                  <option>0x90x12</option>
                  <option>1x90x12 (Null)</option>
                </select>
              </div>
            </div>
          )}

          {/* Income Doc Type */}
          <div className="mt-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Income Doc Type
            </label>
            <select
              className="w-full p-3 bg-gray-50 border rounded-lg font-semibold"
              value={formData.docType}
              onChange={(e) => setFormData({ ...formData, docType: e.target.value })}
            >
              <option>DSCR</option>
              <option>1yr Full Doc</option>
              <option>12m Bank Stmts</option>
              <option>2yr Full Doc</option>
              <option>24m Bank Stmts</option>
              <option>Asset Depletion-Utilization</option>
              <option>1yr 1099 Only</option>
              <option>1yr WVOE Only</option>
              <option>1yr CPA P&L w/2m Bank Stmts</option>
              <option>1yr CPA P&L ONLY</option>
              <option>Full Doc (other)</option>
              <option>Alt Doc (other)</option>
            </select>
          </div>
        </section>

        {/* SECTION 2: LOAN DETAILS */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-black uppercase tracking-tight mb-4 border-b pb-2">
            Loan Structure
          </h2>

          {/* Lien Type */}
          <PillGroup
            label="Lien Type"
            options={['1st', '2nd']}
            selected={formData.lienType}
            onChange={(val) => setFormData({ ...formData, lienType: val })}
          />

          {/* Price & Loan Amount */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Property Value
              </label>
              <input
                type="number"
                className="w-full text-lg font-mono p-3 border-b-2 border-gray-200 focus:border-black outline-none bg-transparent"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
              />
              <p className="text-xs text-gray-400 mt-1">{formatCurrency(formData.purchasePrice)}</p>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Loan Amount
              </label>
              <input
                type="number"
                className="w-full text-lg font-mono p-3 border-b-2 border-gray-200 focus:border-black outline-none bg-transparent"
                value={formData.loanAmount}
                onChange={(e) => setFormData({ ...formData, loanAmount: Number(e.target.value) })}
              />
              <p className="text-xs text-gray-400 mt-1">{formatCurrency(formData.loanAmount)}</p>
            </div>
          </div>

          {/* Calculated LTV Bucket Display */}
          <div className="bg-black text-white px-4 py-3 rounded-lg flex justify-between items-center mb-6">
            <span className="text-sm font-medium">LTV Bucket</span>
            <span className="text-lg font-bold text-green-400">{ltvBucket}</span>
          </div>

          {/* Loan Purpose */}
          <PillGroup
            label="Loan Purpose"
            options={['Purchase', 'Rate/Term', 'Cash-Out']}
            selected={formData.loanPurpose}
            onChange={(val) => setFormData({ ...formData, loanPurpose: val })}
          />

          {/* Loan Product */}
          <PillGroup
            label="Loan Product"
            options={['30yr Fixed Rate', 'Interest-Only (30yr)', 'Interest-Only (40yr)', '40yr Fixed', '15yr Fixed']}
            selected={formData.loanProduct}
            onChange={(val) => setFormData({ ...formData, loanProduct: val })}
          />

          {/* Property Type */}
          <div className="mt-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Property Type
            </label>
            <select
              className="w-full p-3 bg-gray-50 border rounded-lg font-semibold"
              value={formData.propertyType}
              onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
            >
              <option>SFR/Single Family</option>
              <option>Condo</option>
              <option>2-4 Unit</option>
              <option>Condo (Non-Warrantable)</option>
              <option>Condotel</option>
              <option>2 Unit</option>
              <option>3-4 Unit</option>
              <option>2-8 UNIT (Mixed Use)</option>
              <option>9-10 UNIT (Mixed Use)</option>
              <option>5-9 UNIT (Residential Use)</option>
            </select>
          </div>

          {/* DTI */}
          <PillGroup
            label="DTI"
            options={['≤43%', '43.01%-50%', '50.01%-55%']}
            selected={formData.dti}
            onChange={(val) => setFormData({ ...formData, dti: val })}
          />

          {/* Escrow Waiver */}
          <div className="mt-4">
            <SmartToggle
              label="Escrow Waiver"
              checked={formData.escrowWaiver}
              onChange={(val) => setFormData({ ...formData, escrowWaiver: val })}
            />
          </div>

          {/* State */}
          <div className="mt-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              State License
            </label>
            <select
              className="w-full p-3 bg-gray-50 border rounded-lg font-semibold"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            >
              {availableStates.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {formData.docType === 'DSCR' ? 'DSCR: All states available' : 'Limited states for this doc type'}
            </p>
          </div>

          {/* Lock Term */}
          <PillGroup
            label="Lock Term"
            options={['30 Day', '45 Day']}
            selected={formData.lockTerm}
            onChange={(val) => setFormData({ ...formData, lockTerm: val })}
          />
        </section>

        {/* SECTION 3: INVESTOR DETAILS (Conditional) */}
        {formData.occupancy === 'Investment' && (
          <section className="bg-blue-50 p-5 rounded-xl shadow-sm border border-blue-100 animate-slide-up">
            <h2 className="text-lg font-black uppercase tracking-tight text-blue-900 mb-4 border-b border-blue-200 pb-2">
              Investor Settings
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-blue-800 uppercase">Prepay Period</label>
                <select
                  className="w-full mt-1 p-3 bg-white border border-blue-200 rounded-lg"
                  value={formData.prepayPeriod}
                  onChange={(e) => setFormData({ ...formData, prepayPeriod: e.target.value })}
                >
                  <option>0 - No Prepay</option>
                  <option>1yr</option>
                  <option>2yr</option>
                  <option>3yr</option>
                  <option>4yr</option>
                  <option>5yr</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-blue-800 uppercase">Prepay Fee</label>
                <select
                  className="w-full mt-1 p-3 bg-white border border-blue-200 rounded-lg"
                  value={formData.prepayFee}
                  onChange={(e) => setFormData({ ...formData, prepayFee: e.target.value })}
                >
                  <option>5% (Standard)</option>
                  <option>6 Month Interest (≥3yr - AltPP)</option>
                  <option>Declining (≥3yr - AltPP)</option>
                </select>
              </div>
            </div>

            {/* CONDITIONAL: DSCR Fields */}
            {formData.docType === 'DSCR' && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <label className="text-xs font-bold text-blue-800 uppercase mb-2 block">
                  DSCR Ratio
                </label>
                <PillGroup
                  options={['≥1.25', '1.15-1.249', '1.00-1.149', '0.75-0.999', '0.50-0.749', '≤0.499 - No Ratio']}
                  selected={formData.dscrRatio}
                  onChange={(val) => setFormData({ ...formData, dscrRatio: val })}
                />

                <div className="mt-4">
                  <SmartToggle
                    label="Short Term Rental?"
                    checked={formData.dscrShortTermRental}
                    onChange={(val) => setFormData({ ...formData, dscrShortTermRental: val })}
                  />
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
        <div className="max-w-2xl mx-auto">
          <button className="w-full bg-green-500 hover:bg-green-600 text-black font-extrabold text-lg py-4 rounded-2xl shadow-xl transform transition hover:scale-[1.02] active:scale-95">
            GET RATES
          </button>
        </div>
      </div>
    </div>
  );
}
