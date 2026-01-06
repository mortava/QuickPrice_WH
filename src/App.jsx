import { useState, useEffect } from 'react';
import { PillGroup, SmartToggle, RateResults } from './components';
import { DefyPricingLogic } from './logic/DefyPricingLogic';
import { PricingEngine } from './logic/PricingEngine';

export default function App({ onAdminClick }) {
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
    ruralProperty: false,
    otherDetails: false,
    limitedTradelines: false,
    guidelineException: false,
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
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#09090B] rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-bold">D</span>
            </div>
            <div>
              <h1 className="text-[17px] font-semibold text-[#09090B] leading-tight">Defy TPO</h1>
              <p className="text-[11px] text-[#71717A]">Wholesale Pricing Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* LTV Display */}
            <div className="hidden sm:block text-right">
              <p className="text-[10px] text-[#71717A] uppercase tracking-wide">Current LTV</p>
              <p className="text-xl font-semibold text-[#007FFF]">{rawLtv}%</p>
            </div>

            {/* Admin Link */}
            {onAdminClick && (
              <button
                onClick={onAdminClick}
                className="p-2 hover:bg-[#F4F4F5] rounded-lg transition-colors group"
                title="Admin Panel"
              >
                <svg className="w-5 h-5 text-[#71717A] group-hover:text-[#09090B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile LTV Bar */}
      <div className="sm:hidden bg-[#09090B] px-4 py-2 flex items-center justify-between">
        <span className="text-[11px] text-[#A1A1AA]">Loan-to-Value</span>
        <span className="text-lg font-semibold text-[#007FFF]">{rawLtv}%</span>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] p-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        </div>
      )}

      {/* Main Content - Responsive Grid */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column - Borrower & Property */}
          <div className="lg:col-span-4 space-y-6">
            {/* Borrower Section */}
            <section className="bg-white rounded-xl border border-[#E4E4E7] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E4E4E7] bg-[#FAFAFA]">
                <h2 className="text-[13px] font-semibold text-[#09090B]">Borrower Information</h2>
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

                <div>
                  <label className="label">Credit Score (FICO)</label>
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
                    <option>600-619</option>
                    <option>580-599</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-[#E4E4E7] space-y-2">
                  <SmartToggle
                    label="First Time Home Buyer"
                    checked={formData.fthb}
                    onChange={(val) => setFormData({ ...formData, fthb: val })}
                  />
                  <SmartToggle
                    label="Adverse Credit History"
                    checked={formData.adverseCredit}
                    onChange={(val) => setFormData({ ...formData, adverseCredit: val })}
                  />
                </div>

                {formData.adverseCredit && (
                  <div className="p-3 bg-[#FEF2F2] rounded-lg border border-[#FECACA] space-y-3 animate-fade-in">
                    <p className="text-[11px] font-semibold text-[#DC2626] uppercase">Derogatory Details</p>
                    <div>
                      <label className="text-[11px] text-[#71717A]">Credit Event (FC/BK/SS)</label>
                      <select
                        className="select-base mt-1"
                        value={formData.creditEvent}
                        onChange={(e) => setFormData({ ...formData, creditEvent: e.target.value })}
                      >
                        <option>≥48m / None</option>
                        <option>36m - 47m</option>
                        <option>24m - 35m</option>
                        <option>12m - 23m</option>
                        <option>≤11m</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-[#71717A]">Mortgage History</label>
                      <select
                        className="select-base mt-1"
                        value={formData.housingHistory}
                        onChange={(e) => setFormData({ ...formData, housingHistory: e.target.value })}
                      >
                        <option>0x30x24 / None</option>
                        <option>1x30x12</option>
                        <option>2x30x12</option>
                        <option>3x30x12</option>
                        <option>1x60x12</option>
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="label">Income Documentation</label>
                  <select
                    className="select-base"
                    value={formData.docType}
                    onChange={(e) => setFormData({ ...formData, docType: e.target.value })}
                  >
                    <option>2yr Full Doc</option>
                    <option>1yr Full Doc</option>
                    <option>DSCR</option>
                    <option>12m Bank Stmts</option>
                    <option>24m Bank Stmts</option>
                    <option>Asset Depletion</option>
                    <option>1yr P&L Only</option>
                    <option>1yr P&L w/2m Bank Stmts</option>
                    <option>1yr 1099 Only</option>
                    <option>1yr WVOE Only</option>
                  </select>
                </div>

                <PillGroup
                  label="DTI Ratio"
                  options={['≤43%', '43.01%-50%', '50.01%-55%']}
                  selected={formData.dti}
                  onChange={(val) => setFormData({ ...formData, dti: val })}
                />
              </div>
            </section>

            {/* Property Section */}
            <section className="bg-white rounded-xl border border-[#E4E4E7] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E4E4E7] bg-[#FAFAFA]">
                <h2 className="text-[13px] font-semibold text-[#09090B]">Property Details</h2>
              </div>
              <div className="p-4 space-y-4">
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

                <div>
                  <label className="label">Property Type</label>
                  <select
                    className="select-base"
                    value={formData.propertyType}
                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  >
                    <option>SFR/Single Family</option>
                    <option>PUD/Town Home</option>
                    <option>Condo</option>
                    <option>Condo (Non-Warrantable)</option>
                    <option>Condotel</option>
                    <option>2 Unit</option>
                    <option>2-4 Unit</option>
                    <option>3-4 Unit</option>
                    <option>2-8 Unit Mixed Use</option>
                    <option>9-10 Unit Mixed Use</option>
                    <option>5-9 Unit Residential</option>
                  </select>
                </div>

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
                  <p className="text-[10px] text-[#71717A] mt-1">
                    {formData.docType === 'DSCR' ? 'DSCR states available' : 'Limited to select states'}
                  </p>
                </div>

                <SmartToggle
                  label="Rural Property"
                  checked={formData.ruralProperty}
                  onChange={(val) => setFormData({ ...formData, ruralProperty: val })}
                />
              </div>
            </section>
          </div>

          {/* Middle Column - Loan Details */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white rounded-xl border border-[#E4E4E7] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E4E4E7] bg-[#FAFAFA]">
                <h2 className="text-[13px] font-semibold text-[#09090B]">Loan Structure</h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Property Value</label>
                    <input
                      type="number"
                      className="input-base font-mono"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    />
                    <p className="text-[10px] text-[#71717A] mt-1">{formatCurrency(formData.purchasePrice)}</p>
                  </div>
                  <div>
                    <label className="label">Loan Amount</label>
                    <input
                      type="number"
                      className="input-base font-mono"
                      value={formData.loanAmount}
                      onChange={(e) => setFormData({ ...formData, loanAmount: Number(e.target.value) })}
                    />
                    <p className="text-[10px] text-[#71717A] mt-1">{formatCurrency(formData.loanAmount)}</p>
                  </div>
                </div>

                {/* LTV Display */}
                <div className="bg-[#09090B] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-[#A1A1AA] uppercase">LTV Calculation</span>
                    <span className="text-2xl font-bold text-[#007FFF]">{rawLtv}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#A1A1AA]">Bucket</span>
                    <span className="text-sm font-medium text-white">{ltvBucket}</span>
                  </div>
                </div>

                <PillGroup
                  label="Lien Type"
                  options={['1st', '2nd']}
                  selected={formData.lienType}
                  onChange={(val) => setFormData({ ...formData, lienType: val })}
                />

                <PillGroup
                  label="Loan Purpose"
                  options={['Purchase', 'Rate/Term', 'Cash-Out']}
                  selected={formData.loanPurpose}
                  onChange={(val) => setFormData({ ...formData, loanPurpose: val })}
                />

                <div>
                  <label className="label">Loan Product</label>
                  <select
                    className="select-base"
                    value={formData.loanProduct}
                    onChange={(e) => setFormData({ ...formData, loanProduct: e.target.value })}
                  >
                    <option>30yr Fixed Rate</option>
                    <option>Interest-Only (30yr)</option>
                    <option>Interest-Only (40yr)</option>
                    <option>40yr Fixed</option>
                    <option>15yr Fixed</option>
                    <option>5/6 ARM</option>
                    <option>7/6 ARM</option>
                    <option>10/6 ARM</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Lock Term</label>
                    <select
                      className="select-base"
                      value={formData.lockTerm}
                      onChange={(e) => setFormData({ ...formData, lockTerm: e.target.value })}
                    >
                      <option>15 Day</option>
                      <option>30 Day</option>
                      <option>45 Day</option>
                    </select>
                  </div>
                  <div className="flex items-end pb-1">
                    <SmartToggle
                      label="Escrow Waiver"
                      checked={formData.escrowWaiver}
                      onChange={(val) => setFormData({ ...formData, escrowWaiver: val })}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Other Details */}
            <section className="bg-white rounded-xl border border-[#E4E4E7] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E4E4E7] bg-[#FAFAFA]">
                <h2 className="text-[13px] font-semibold text-[#09090B]">Other Details</h2>
              </div>
              <div className="p-4 space-y-2">
                <SmartToggle
                  label="Limited Tradelines (<2x24)"
                  checked={formData.limitedTradelines}
                  onChange={(val) => setFormData({ ...formData, limitedTradelines: val })}
                />
                <SmartToggle
                  label="Guideline Exception"
                  checked={formData.guidelineException}
                  onChange={(val) => setFormData({ ...formData, guidelineException: val })}
                />
              </div>
            </section>
          </div>

          {/* Right Column - DSCR / Investor Settings */}
          <div className="lg:col-span-4 space-y-6">
            {formData.occupancy === 'Investment' && (
              <section className="bg-[#E6F2FF] rounded-xl border border-[#007FFF]/20 overflow-hidden animate-slide-up">
                <div className="px-4 py-3 border-b border-[#007FFF]/20 bg-[#007FFF]/5">
                  <h2 className="text-[13px] font-semibold text-[#007FFF]">Investor / DSCR Settings</h2>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label text-[#007FFF]">Prepay Period</label>
                      <select
                        className="select-base border-[#007FFF]/30"
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
                      <label className="label text-[#007FFF]">Prepay Fee Type</label>
                      <select
                        className="select-base border-[#007FFF]/30"
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
                    <div className="pt-3 border-t border-[#007FFF]/20 space-y-4">
                      <PillGroup
                        label="DSCR Ratio"
                        options={['≥1.25', '1.15-1.249', '1.00-1.149', '0.75-0.999', '0.50-0.749', 'No Ratio']}
                        selected={formData.dscrRatio}
                        onChange={(val) => setFormData({ ...formData, dscrRatio: val })}
                      />
                      <SmartToggle
                        label="Short Term Rental (STR)"
                        checked={formData.dscrShortTermRental}
                        onChange={(val) => setFormData({ ...formData, dscrShortTermRental: val })}
                      />
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Summary Card */}
            <section className="bg-white rounded-xl border border-[#E4E4E7] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E4E4E7] bg-[#FAFAFA]">
                <h2 className="text-[13px] font-semibold text-[#09090B]">Scenario Summary</h2>
              </div>
              <div className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">Program</span>
                    <span className="font-medium text-[#09090B]">
                      {formData.docType === 'DSCR' ? 'DSCR' : 'NonQM'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">Loan Amount</span>
                    <span className="font-medium text-[#09090B]">{formatCurrency(formData.loanAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">LTV</span>
                    <span className="font-medium text-[#007FFF]">{rawLtv}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">FICO</span>
                    <span className="font-medium text-[#09090B]">{formData.creditScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">Doc Type</span>
                    <span className="font-medium text-[#09090B]">{formData.docType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">Purpose</span>
                    <span className="font-medium text-[#09090B]">{formData.loanPurpose}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Desktop Get Rates Button */}
            <div className="hidden lg:block">
              <button
                onClick={handleGetRates}
                disabled={isLoading}
                className="w-full bg-[#007FFF] hover:bg-[#0066CC] active:bg-[#0052A3] text-white font-semibold text-base py-4 rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-[#007FFF]/25"
              >
                {isLoading ? 'Calculating...' : 'Get Rates'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Button - Mobile Only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#E4E4E7] safe-area-pb">
        <button
          onClick={handleGetRates}
          disabled={isLoading}
          className="w-full bg-[#007FFF] hover:bg-[#0066CC] active:bg-[#0052A3] text-white font-medium text-[15px] py-3.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Calculating...
            </span>
          ) : (
            'Get Rates'
          )}
        </button>
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
