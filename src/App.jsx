import { useState, useEffect } from 'react';
import { PillGroup, SmartToggle, RateResults } from './components';
import { DefyPricingLogic } from './logic/DefyPricingLogic';
import { PricingEngine } from './logic/PricingEngine';

export default function App() {
  const [formData, setFormData] = useState({
    scenarioName: '',
    citizenship: 'US Citizen',
    occupancy: 'Primary',
    fthb: false,
    creditScore: '720-739',
    adverseCredit: false,
    creditEvent: 'None',
    housingHistory: '0x30x12',
    docType: '12m Bank Stmts',
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
    prepayPeriod: '3yr',
    prepayFee: '5% (Standard)',
    dscrRatio: '≥1.25',
    dscrShortTermRental: false,
  });

  const [ltvBucket, setLtvBucket] = useState('');
  const [rawLtv, setRawLtv] = useState('');
  const [availableStates, setAvailableStates] = useState([]);
  const [error, setError] = useState(null);
  const [rateResults, setRateResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Borrower Trigger
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

  // LTV Calculation
  useEffect(() => {
    const bucket = DefyPricingLogic.getLTVBucket(formData.loanAmount, formData.purchasePrice);
    const ltv = DefyPricingLogic.calculateLTV(formData.loanAmount, formData.purchasePrice);
    setLtvBucket(bucket);
    setRawLtv(ltv);
  }, [formData.purchasePrice, formData.loanAmount]);

  // State Licensing Filter
  useEffect(() => {
    setAvailableStates(DefyPricingLogic.getAllowedStates(formData.docType));
  }, [formData.docType]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleGetRates = () => {
    setIsLoading(true);
    setTimeout(() => {
      const results = PricingEngine.calculateRates(formData);
      setRateResults(results);
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-900 text-white px-4 py-4 sticky top-0 z-40">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              DEFY <span className="text-emerald-400">TPO</span>
            </h1>
            <p className="text-[11px] text-gray-500">Quick Pricer</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase">LTV</p>
            <p className="text-xl font-bold text-emerald-400">{rawLtv}%</p>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-xl mx-auto px-4 pt-3">
          <div className="bg-red-500 text-white p-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        </div>
      )}

      <main className="max-w-xl mx-auto px-4 py-4 pb-24 space-y-4">

        {/* Borrower Section */}
        <section className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-800 mb-4 pb-2 border-b">
            Borrower
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-1.5">
                Scenario Name
              </label>
              <input
                type="text"
                placeholder="e.g., Smith - Purchase"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-gray-400 focus:outline-none"
                value={formData.scenarioName}
                onChange={(e) => setFormData({ ...formData, scenarioName: e.target.value })}
              />
            </div>

            <PillGroup
              label="Citizenship"
              options={['US Citizen', 'Perm-Resident', 'Non-Perm Resident', 'Foreign National', 'ITIN']}
              selected={formData.citizenship}
              onChange={(val) => setFormData({ ...formData, citizenship: val })}
            />

            <PillGroup
              label="Occupancy"
              options={['Primary', 'Second Home', 'Investment']}
              selected={formData.occupancy}
              onChange={(val) => setFormData({ ...formData, occupancy: val })}
              disabledOptions={
                formData.citizenship === 'Foreign National' || formData.docType === 'DSCR'
                  ? ['Primary', 'Second Home']
                  : formData.fthb ? ['Second Home'] : []
              }
            />

            <div className="grid grid-cols-2 gap-3">
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

            <div>
              <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-1.5">
                Credit Score
              </label>
              <select
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium bg-white focus:border-gray-400 focus:outline-none"
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
              </select>
            </div>

            {formData.adverseCredit && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-100 space-y-3">
                <p className="text-[11px] font-bold uppercase text-red-700">Derogatory Details</p>
                <div>
                  <label className="block text-[11px] text-gray-600 mb-1">Credit Event</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    value={formData.creditEvent}
                    onChange={(e) => setFormData({ ...formData, creditEvent: e.target.value })}
                  >
                    <option>None</option>
                    <option>≥48m</option>
                    <option>≤47m</option>
                    <option>≥36m</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-gray-600 mb-1">Housing History</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    value={formData.housingHistory}
                    onChange={(e) => setFormData({ ...formData, housingHistory: e.target.value })}
                  >
                    <option>0x30x12</option>
                    <option>0x30x24</option>
                    <option>1x30x12</option>
                    <option>≥1x30x12</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-1.5">
                Income Doc Type
              </label>
              <select
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium bg-white focus:border-gray-400 focus:outline-none"
                value={formData.docType}
                onChange={(e) => setFormData({ ...formData, docType: e.target.value })}
              >
                <option>DSCR</option>
                <option>1yr Full Doc</option>
                <option>12m Bank Stmts</option>
                <option>24m Bank Stmts</option>
                <option>Asset Depletion</option>
                <option>1yr 1099 Only</option>
                <option>1yr WVOE Only</option>
              </select>
            </div>
          </div>
        </section>

        {/* Loan Structure Section */}
        <section className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-800 mb-4 pb-2 border-b">
            Loan Structure
          </h2>

          <div className="space-y-4">
            <PillGroup
              label="Lien Type"
              options={['1st', '2nd']}
              selected={formData.lienType}
              onChange={(val) => setFormData({ ...formData, lienType: val })}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-1.5">
                  Property Value
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:border-gray-400 focus:outline-none"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                />
                <p className="text-[10px] text-gray-400 mt-1">{formatCurrency(formData.purchasePrice)}</p>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-1.5">
                  Loan Amount
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:border-gray-400 focus:outline-none"
                  value={formData.loanAmount}
                  onChange={(e) => setFormData({ ...formData, loanAmount: Number(e.target.value) })}
                />
                <p className="text-[10px] text-gray-400 mt-1">{formatCurrency(formData.loanAmount)}</p>
              </div>
            </div>

            <div className="bg-gray-900 text-white px-4 py-3 rounded-lg flex justify-between items-center">
              <span className="text-xs font-medium text-gray-400">LTV Bucket</span>
              <span className="text-base font-bold text-emerald-400">{ltvBucket}</span>
            </div>

            <PillGroup
              label="Loan Purpose"
              options={['Purchase', 'Rate/Term', 'Cash-Out']}
              selected={formData.loanPurpose}
              onChange={(val) => setFormData({ ...formData, loanPurpose: val })}
            />

            <PillGroup
              label="Loan Product"
              options={['30yr Fixed Rate', 'Interest-Only (30yr)', 'Interest-Only (40yr)']}
              selected={formData.loanProduct}
              onChange={(val) => setFormData({ ...formData, loanProduct: val })}
            />

            <div>
              <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-1.5">
                Property Type
              </label>
              <select
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium bg-white focus:border-gray-400 focus:outline-none"
                value={formData.propertyType}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
              >
                <option>SFR/Single Family</option>
                <option>Condo</option>
                <option>2-4 Unit</option>
                <option>2 Unit</option>
                <option>3-4 Unit</option>
              </select>
            </div>

            <PillGroup
              label="DTI"
              options={['≤43%', '43.01%-50%', '50.01%-55%']}
              selected={formData.dti}
              onChange={(val) => setFormData({ ...formData, dti: val })}
            />

            <SmartToggle
              label="Escrow Waiver"
              checked={formData.escrowWaiver}
              onChange={(val) => setFormData({ ...formData, escrowWaiver: val })}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-1.5">
                  State
                </label>
                <select
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium bg-white focus:border-gray-400 focus:outline-none"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                >
                  {availableStates.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-1.5">
                  Lock Term
                </label>
                <select
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium bg-white focus:border-gray-400 focus:outline-none"
                  value={formData.lockTerm}
                  onChange={(e) => setFormData({ ...formData, lockTerm: e.target.value })}
                >
                  <option>30 Day</option>
                  <option>45 Day</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Investor Settings (Conditional) */}
        {formData.occupancy === 'Investment' && (
          <section className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-100">
            <h2 className="text-sm font-bold uppercase tracking-wide text-blue-800 mb-4 pb-2 border-b border-blue-200">
              Investor Settings
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-blue-700 mb-1.5">
                    Prepay Period
                  </label>
                  <select
                    className="w-full px-3 py-2.5 border border-blue-200 rounded-lg text-sm font-medium bg-white focus:border-blue-400 focus:outline-none"
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
                  <label className="block text-[11px] font-semibold uppercase text-blue-700 mb-1.5">
                    Prepay Fee
                  </label>
                  <select
                    className="w-full px-3 py-2.5 border border-blue-200 rounded-lg text-sm font-medium bg-white focus:border-blue-400 focus:outline-none"
                    value={formData.prepayFee}
                    onChange={(e) => setFormData({ ...formData, prepayFee: e.target.value })}
                  >
                    <option>5% (Standard)</option>
                    <option>6 Month Interest</option>
                    <option>Declining</option>
                  </select>
                </div>
              </div>

              {formData.docType === 'DSCR' && (
                <>
                  <PillGroup
                    label="DSCR Ratio"
                    options={['≥1.25', '1.15-1.249', '1.00-1.149', '0.75-0.999']}
                    selected={formData.dscrRatio}
                    onChange={(val) => setFormData({ ...formData, dscrRatio: val })}
                  />
                  <SmartToggle
                    label="Short Term Rental"
                    checked={formData.dscrShortTermRental}
                    onChange={(val) => setFormData({ ...formData, dscrShortTermRental: val })}
                  />
                </>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
        <div className="max-w-xl mx-auto">
          <button
            onClick={handleGetRates}
            disabled={isLoading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-base py-4 rounded-xl shadow-lg transition disabled:opacity-50"
          >
            {isLoading ? 'Calculating...' : 'GET RATES'}
          </button>
        </div>
      </div>

      {/* Rate Results Modal */}
      {rateResults && (
        <RateResults
          results={rateResults}
          onClose={() => setRateResults(null)}
        />
      )}
    </div>
  );
}
