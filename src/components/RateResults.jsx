/**
 * Rate Results Display Component
 * Stripe-inspired clean design with shadcn styling
 */

export function RateResults({ results, onClose }) {
  if (!results) return null;

  const { program, ltv, ltvBucket, llpaTotal, adjustments, rates, error } = results;

  // Find par rate (closest to 100)
  const parRate = rates.length > 0
    ? rates.reduce((prev, curr) =>
        Math.abs(curr.finalPrice - 100) < Math.abs(prev.finalPrice - 100) ? curr : prev,
        rates[0]
      )
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fade-in">
      <div className="bg-white w-full max-w-md max-h-[85vh] overflow-hidden rounded-t-xl sm:rounded-xl shadow-2xl animate-slide-up flex flex-col">

        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E4E4E7] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-[#71717A] uppercase tracking-wide">Rate Sheet</p>
            <h2 className="text-lg font-semibold text-[#09090B]">{program}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#F4F4F5] text-[#71717A] hover:text-[#09090B] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4L4 12M4 4l8 8" />
            </svg>
          </button>
        </div>

        {/* Stats Row */}
        <div className="px-5 py-3 bg-[#FAFAFA] border-b border-[#E4E4E7] flex gap-4">
          <div>
            <p className="text-[10px] font-medium text-[#71717A] uppercase">LTV</p>
            <p className="text-sm font-semibold text-[#09090B]">{ltv}%</p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-[#71717A] uppercase">Bucket</p>
            <p className="text-sm font-semibold text-[#09090B]">{ltvBucket}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-[#71717A] uppercase">Adj</p>
            <p className={`text-sm font-semibold ${llpaTotal >= 0 ? 'text-[#007FFF]' : 'text-[#DC2626]'}`}>
              {llpaTotal >= 0 ? '+' : ''}{llpaTotal?.toFixed(3)}
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">

          {/* Error State */}
          {error && (
            <div className="p-4 m-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg">
              <p className="text-sm text-[#DC2626] font-medium">{error}</p>
            </div>
          )}

          {/* Rate Grid */}
          {rates.length > 0 && (
            <div className="p-4">
              <p className="text-[11px] font-medium text-[#71717A] uppercase tracking-wide mb-3">
                Available Rates ({rates.length})
              </p>
              <div className="space-y-2">
                {rates.map((r, idx) => {
                  const isPar = parRate && r.rate === parRate.rate;
                  const isRebate = r.finalPrice > 100;

                  return (
                    <div
                      key={idx}
                      className={`
                        flex items-center justify-between p-3 rounded-lg border transition-all
                        ${isPar
                          ? 'border-[#007FFF] bg-[#E6F2FF]'
                          : 'border-[#E4E4E7] bg-white hover:border-[#A1A1AA]'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-2 h-2 rounded-full
                          ${isPar ? 'bg-[#007FFF]' : isRebate ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}
                        `} />
                        <span className="text-base font-semibold text-[#09090B]">
                          {r.rate.toFixed(3)}%
                        </span>
                        {isPar && (
                          <span className="text-[10px] font-semibold text-[#007FFF] bg-white px-2 py-0.5 rounded">
                            PAR
                          </span>
                        )}
                      </div>
                      <span className={`
                        text-sm font-mono font-semibold
                        ${isRebate ? 'text-[#10B981]' : 'text-[#F59E0B]'}
                      `}>
                        {r.finalPrice.toFixed(3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Rates Message */}
          {rates.length === 0 && !error && (
            <div className="p-8 text-center">
              <p className="text-[#71717A] text-sm">No rates available in the 99-101 price range for this scenario.</p>
            </div>
          )}

          {/* LLPA Breakdown */}
          {adjustments && adjustments.length > 0 && (
            <div className="px-4 pb-4">
              <details className="group">
                <summary className="flex items-center justify-between text-[11px] font-medium text-[#71717A] uppercase tracking-wide cursor-pointer py-2 hover:text-[#09090B]">
                  <span>LLPA Breakdown</span>
                  <svg
                    className="w-4 h-4 transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-2 p-3 bg-[#FAFAFA] rounded-lg border border-[#E4E4E7]">
                  {adjustments.map((adj, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-[13px] py-1.5 border-b border-[#E4E4E7] last:border-0"
                    >
                      <span className="text-[#71717A]">{adj.name}</span>
                      <span className={`font-mono font-medium ${
                        adj.value > 0 ? 'text-[#10B981]' : adj.value < 0 ? 'text-[#DC2626]' : 'text-[#71717A]'
                      }`}>
                        {adj.value > 0 ? '+' : ''}{adj.value.toFixed(3)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[13px] pt-2 mt-2 border-t border-[#09090B]/10 font-semibold">
                    <span className="text-[#09090B]">Total</span>
                    <span className={`font-mono ${llpaTotal >= 0 ? 'text-[#10B981]' : 'text-[#DC2626]'}`}>
                      {llpaTotal >= 0 ? '+' : ''}{llpaTotal?.toFixed(3)}
                    </span>
                  </div>
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E4E4E7] bg-[#FAFAFA]">
          <button
            onClick={onClose}
            className="w-full bg-[#09090B] hover:bg-[#27272A] text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default RateResults;
