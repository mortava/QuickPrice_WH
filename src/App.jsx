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

  useEffect(() => {
    const bucket = DefyPricingLogic.getLTVBucket(formData.loanAmount, formData.purchasePrice);
    const ltv = DefyPricingLogic.calculateLTV(formData.loanAmount, formData.purchasePrice);
    setLtvBucket(bucket);
    setRawLtv(ltv);
  }, [formData.purchasePrice, formData.loanAmount]);

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
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-white border-b border-[#E4E4E7] px-4 py-3 sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#09090B] rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">D</span>
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-[#09090B] leading-tight">Defy TPO</h1>
              <p className="text-[11px] text-[#71717A]">Wholesale Pricing</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#71717A] uppercase tracking-wide">LTV</p>
            <p className="text-lg font-semibold text-[#007FFF]">{rawLtv}%</p>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-lg mx-auto px-4 pt-3">
          <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] p-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        </div>
      )}

      <main className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4">

        {/* Borrower Section */}
        <section className="bg-white rounded-xl border border-[#E4E4E7] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E4E4E7]">
            <h2 className="text-[13px] font-semibold text-[#09090B]">Borrower</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="label">Scenario Name</label>
              <input
                type="text"
                placeholder="e.g., Smith - Purchase"
                className="input-base"
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

            <div className="grid grid-cols-2 gap-4 py-1 border-t border-b border-[#E4E4E7]">
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
              <label className="label">Credit Score</label>
              <select
                className="select-base"
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
              <div className="p-3 bg-[#FEF2F2] rounded-lg border border-[#FECACA] space-y-3 animate-fade-in">
                <p className="text-[11px] font-semibold text-[#DC2626] uppercase">Derogatory Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#71717A]">Credit Event</label>
                    <select
                      className="select-base mt-1"
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
                    <label className="text-[11px] text-[#71717A]">Housing History</label>
                    <select
                      className="select-base mt-1"
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
              </div>
            )}

            <div>
              <label className="label">Income Doc Type</label>
              <select
                className="select-base"
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
        <section className="bg-white rounded-xl border border-[#E4E4E7] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E4E4E7]">
            <h2 className="text-[13px] font-semibold text-[#09090B]">Loan Structure</h2>
          </div>
          <div className="p-4 space-y-4">
            <PillGroup
              label="Lien Type"
              options={['1st', '2nd']}
              selected={formData.lienType}
              onChange={(val) => setFormData({ ...formData, lienType: val })}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Property Value</label>
                <input
                  type="number"
                  className="input-base font-mono"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                />
                <p className="text-[11px] text-[#71717A] mt-1">{formatCurrency(formData.purchasePrice)}</p>
              </div>
              <div>
                <label className="label">Loan Amount</label>
                <input
                  type="number"
                  className="input-base font-mono"
                  value={formData.loanAmount}
                  onChange={(e) => setFormData({ ...formData, loanAmount: Number(e.target.value) })}
                />
                <p className="text-[11px] text-[#71717A] mt-1">{formatCurrency(formData.loanAmount)}</p>
              </div>
            </div>

            {/* LTV Bucket Display */}
            <div className="flex items-center justify-between p-3 bg-[#09090B] rounded-lg">
              <span className="text-[12px] text-[#A1A1AA]">LTV Bucket</span>
              <span className="text-[14px] font-semibold text-[#007FFF]">{ltvBucket}</span>
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
              <label className="label">Property Type</label>
              <select
                className="select-base"
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

            <div className="py-1 border-t border-[#E4E4E7]">
              <SmartToggle
                label="Escrow Waiver"
                checked={formData.escrowWaiver}
                onChange={(val) => setFormData({ ...formData, escrowWaiver: val })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">State</label>
                <select
                  className="select-base"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                >
                  {availableStates.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Lock Term</label>
                <select
                  className="select-base"
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
          <section className="bg-[#E6F2FF] rounded-xl border border-[#007FFF]/20 overflow-hidden animate-slide-up">
            <div className="px-4 py-3 border-b border-[#007FFF]/20 bg-[#007FFF]/5">
              <h2 className="text-[13px] font-semibold text-[#007FFF]">Investor Settings</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-[#007FFF]">Prepay Period</label>
                  <select
                    className="select-base border-[#007FFF]/30 focus:border-[#007FFF]"
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
                  <label className="label text-[#007FFF]">Prepay Fee</label>
                  <select
                    className="select-base border-[#007FFF]/30 focus:border-[#007FFF]"
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
                <div className="pt-3 border-t border-[#007FFF]/20 space-y-3">
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
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#E4E4E7]">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleGetRates}
            disabled={isLoading}
            className="w-full bg-[#007FFF] hover:bg-[#0066CC] active:bg-[#0052A3] text-white font-medium text-[15px] py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Calculating...
              </span>
            ) : (
              'Get Rates'
            )}
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
