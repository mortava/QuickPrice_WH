/**
 * Inline Rate Results Display with Print/Share to PDF
 * Shows below search inputs with professional styling
 */

import { useRef } from 'react';

export function RateResultsDisplay({ results, formData, onClear }) {
  const printRef = useRef(null);

  if (!results) return null;

  const { program, ltv, ltvBucket, llpaTotal, adjustments, rates, error } = results;

  // Find par rate (closest to 100)
  const parRate = rates.length > 0
    ? rates.reduce((prev, curr) =>
        Math.abs(curr.finalPrice - 100) < Math.abs(prev.finalPrice - 100) ? curr : prev,
        rates[0]
      )
    : null;

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Handle print to PDF
  const handlePrint = () => {
    window.print();
  };

  // Handle share (copy link or native share)
  const handleShare = async () => {
    const shareData = {
      title: `${formData.scenarioName || 'Loan Scenario'} - Rate Quote`,
      text: `${program} Rate Quote\nLoan: ${formatCurrency(formData.loanAmount)} @ ${ltv}% LTV\nBest Rate: ${parRate ? parRate.rate.toFixed(3) + '%' : 'N/A'}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      const text = `${shareData.title}\n${shareData.text}`;
      navigator.clipboard.writeText(text);
      alert('Quote copied to clipboard!');
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="mt-6 animate-slide-up print:mt-0 print:animate-none" ref={printRef}>
      {/* Print Header - Only shows when printing */}
      <div className="hidden print:block mb-6 pb-4 border-b-2 border-[#09090B]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#09090B] rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">D</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#09090B]">Defy TPO</h1>
              <p className="text-sm text-[#71717A]">Wholesale Pricing Engine</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#71717A]">Generated</p>
            <p className="text-sm font-medium text-[#09090B]">{currentDate}</p>
          </div>
        </div>
      </div>

      {/* Results Container */}
      <div className="bg-white rounded-xl border border-[#E4E4E7] overflow-hidden shadow-sm print:shadow-none print:border-2">
        {/* Header with Actions */}
        <div className="px-5 py-4 border-b border-[#E4E4E7] bg-gradient-to-r from-[#09090B] to-[#27272A] print:bg-[#09090B]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-[#A1A1AA] uppercase tracking-wide">Rate Quote</p>
              <h2 className="text-xl font-bold text-white">
                {formData.scenarioName || program}
              </h2>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#007FFF] hover:bg-[#0066CC] text-white text-sm font-medium rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print PDF
              </button>
            </div>
          </div>
        </div>

        {/* Loan Summary Stats */}
        <div className="px-5 py-4 bg-[#FAFAFA] border-b border-[#E4E4E7] print:bg-[#F4F4F5]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] font-semibold text-[#71717A] uppercase tracking-wide">Loan Amount</p>
              <p className="text-lg font-bold text-[#09090B]">{formatCurrency(formData.loanAmount)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#71717A] uppercase tracking-wide">LTV</p>
              <p className="text-lg font-bold text-[#007FFF]">{ltv}%</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#71717A] uppercase tracking-wide">FICO</p>
              <p className="text-lg font-bold text-[#09090B]">{formData.creditScore}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#71717A] uppercase tracking-wide">Total Adj</p>
              <p className={`text-lg font-bold ${llpaTotal >= 0 ? 'text-[#10B981]' : 'text-[#DC2626]'}`}>
                {llpaTotal >= 0 ? '+' : ''}{llpaTotal?.toFixed(3)}
              </p>
            </div>
          </div>
        </div>

        {/* Scenario Details - Collapsible on screen, expanded for print */}
        <div className="px-5 py-3 border-b border-[#E4E4E7] print:py-4">
          <details className="group print:open" open>
            <summary className="flex items-center justify-between cursor-pointer text-[11px] font-semibold text-[#71717A] uppercase tracking-wide py-1 print:cursor-default">
              <span>Scenario Details</span>
              <svg className="w-4 h-4 transition-transform group-open:rotate-180 print:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#71717A]">Doc Type</span>
                <span className="font-medium text-[#09090B]">{formData.docType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717A]">Purpose</span>
                <span className="font-medium text-[#09090B]">{formData.loanPurpose}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717A]">Occupancy</span>
                <span className="font-medium text-[#09090B]">{formData.occupancy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717A]">Property</span>
                <span className="font-medium text-[#09090B]">{formData.propertyType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717A]">State</span>
                <span className="font-medium text-[#09090B]">{formData.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717A]">Lock Term</span>
                <span className="font-medium text-[#09090B]">{formData.lockTerm}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717A]">Product</span>
                <span className="font-medium text-[#09090B]">{formData.loanProduct}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717A]">LTV Bucket</span>
                <span className="font-medium text-[#09090B]">{ltvBucket}</span>
              </div>
            </div>
          </details>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 m-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg">
            <p className="text-sm text-[#DC2626] font-medium">{error}</p>
          </div>
        )}

        {/* Rate Grid */}
        {rates.length > 0 && (
          <div className="p-5">
            <p className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wide mb-3">
              Available Rates ({rates.length})
            </p>

            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-3 gap-4 px-4 py-2 bg-[#F4F4F5] rounded-t-lg text-[11px] font-semibold text-[#71717A] uppercase">
              <span>Rate</span>
              <span className="text-center">Price</span>
              <span className="text-right">Status</span>
            </div>

            <div className="space-y-2 sm:space-y-0">
              {rates.map((r, idx) => {
                const isPar = parRate && r.rate === parRate.rate;
                const isRebate = r.finalPrice > 100;

                return (
                  <div
                    key={idx}
                    className={`
                      flex sm:grid sm:grid-cols-3 items-center justify-between gap-4 p-4 sm:px-4 sm:py-3
                      rounded-lg sm:rounded-none border sm:border-0 sm:border-b transition-all
                      ${isPar
                        ? 'border-[#007FFF] bg-[#E6F2FF] sm:bg-[#E6F2FF]'
                        : 'border-[#E4E4E7] bg-white hover:bg-[#FAFAFA]'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-2.5 h-2.5 rounded-full
                        ${isPar ? 'bg-[#007FFF]' : isRebate ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}
                      `} />
                      <span className="text-lg font-bold text-[#09090B]">
                        {r.rate.toFixed(3)}%
                      </span>
                    </div>

                    <div className="text-center">
                      <span className={`
                        text-base font-mono font-semibold
                        ${isRebate ? 'text-[#10B981]' : 'text-[#F59E0B]'}
                      `}>
                        {r.finalPrice.toFixed(3)}
                      </span>
                    </div>

                    <div className="text-right">
                      {isPar ? (
                        <span className="inline-flex items-center px-2.5 py-1 bg-[#007FFF] text-white text-[11px] font-bold rounded-full uppercase">
                          Par Rate
                        </span>
                      ) : isRebate ? (
                        <span className="inline-flex items-center px-2.5 py-1 bg-[#DCFCE7] text-[#166534] text-[11px] font-semibold rounded-full">
                          Rebate
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 bg-[#FEF3C7] text-[#92400E] text-[11px] font-semibold rounded-full">
                          Cost
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Rates Message */}
        {rates.length === 0 && !error && (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-[#F4F4F5] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#71717A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[#71717A] text-sm">No rates available in the 99-101 price range for this scenario.</p>
          </div>
        )}

        {/* LLPA Breakdown */}
        {adjustments && adjustments.length > 0 && (
          <div className="px-5 pb-5">
            <details className="group print:open" open>
              <summary className="flex items-center justify-between text-[11px] font-semibold text-[#71717A] uppercase tracking-wide cursor-pointer py-2 hover:text-[#09090B] print:cursor-default">
                <span>LLPA Breakdown</span>
                <svg className="w-4 h-4 transition-transform group-open:rotate-180 print:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-2 p-4 bg-[#FAFAFA] rounded-lg border border-[#E4E4E7]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  {adjustments.map((adj, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-sm py-2 border-b border-[#E4E4E7] last:border-0"
                    >
                      <span className="text-[#71717A]">{adj.name}</span>
                      <span className={`font-mono font-medium ${
                        adj.value > 0 ? 'text-[#10B981]' : adj.value < 0 ? 'text-[#DC2626]' : 'text-[#71717A]'
                      }`}>
                        {adj.value > 0 ? '+' : ''}{adj.value.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm pt-3 mt-3 border-t-2 border-[#09090B]/20 font-bold">
                  <span className="text-[#09090B]">Total LLPA</span>
                  <span className={`font-mono ${llpaTotal >= 0 ? 'text-[#10B981]' : 'text-[#DC2626]'}`}>
                    {llpaTotal >= 0 ? '+' : ''}{llpaTotal?.toFixed(3)}
                  </span>
                </div>
              </div>
            </details>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-between print:hidden">
          <button
            onClick={onClear}
            className="px-4 py-2 text-sm font-medium text-[#71717A] hover:text-[#09090B] hover:bg-white rounded-lg transition-colors"
          >
            Clear Results
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-4 py-2 text-sm font-medium text-[#09090B] bg-white border border-[#E4E4E7] hover:bg-[#F4F4F5] rounded-lg transition-colors"
            >
              Share
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-sm font-medium text-white bg-[#007FFF] hover:bg-[#0066CC] rounded-lg transition-colors"
            >
              Print PDF
            </button>
          </div>
        </div>

        {/* Print Footer */}
        <div className="hidden print:block px-5 py-4 border-t-2 border-[#E4E4E7] mt-4">
          <div className="flex items-center justify-between text-xs text-[#71717A]">
            <span>Defy TPO Wholesale Pricing Engine</span>
            <span>Rates subject to change without notice. For professional use only.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RateResultsDisplay;
