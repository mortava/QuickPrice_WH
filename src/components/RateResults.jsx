/**
 * Rate Results Display Component
 * Shows calculated rates in a clean, professional format
 */

export function RateResults({ results, onClose }) {
  if (!results) return null;

  const { program, ltv, ltvBucket, llpaTotal, adjustments, rates, error } = results;

  // Find par rate (closest to 100)
  const parRate = rates.reduce((prev, curr) =>
    Math.abs(curr.finalPrice - 100) < Math.abs(prev.finalPrice - 100) ? curr : prev,
    rates[0]
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up">

        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-5 sticky top-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Program</p>
              <h2 className="text-xl font-bold">{program}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* LTV Badge */}
          <div className="flex gap-4 mt-3">
            <div className="bg-white/10 px-3 py-1.5 rounded-lg">
              <span className="text-xs text-gray-400">LTV</span>
              <span className="text-sm font-bold ml-2 text-green-400">{ltv}%</span>
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded-lg">
              <span className="text-xs text-gray-400">Bucket</span>
              <span className="text-sm font-bold ml-2 text-green-400">{ltvBucket}</span>
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded-lg">
              <span className="text-xs text-gray-400">LLPA</span>
              <span className={`text-sm font-bold ml-2 ${llpaTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {llpaTotal >= 0 ? '+' : ''}{llpaTotal.toFixed(3)}
              </span>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-5 bg-red-50 border-b border-red-100">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        )}

        {/* Rate Grid */}
        {rates.length > 0 && (
          <div className="p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Available Rates
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {rates.slice(0, 12).map((r, idx) => {
                const isPar = r.rate === parRate?.rate;
                const isRebate = r.finalPrice > 100;
                const isCost = r.finalPrice < 100;

                return (
                  <div
                    key={idx}
                    className={`
                      p-3 rounded-lg border-2 transition-all cursor-pointer hover:scale-105
                      ${isPar
                        ? 'border-green-500 bg-green-50 shadow-lg'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'}
                    `}
                  >
                    <div className="text-center">
                      <p className={`text-lg font-black ${isPar ? 'text-green-700' : 'text-gray-900'}`}>
                        {r.rate.toFixed(3)}%
                      </p>
                      <p className={`text-sm font-bold ${
                        isRebate ? 'text-green-600' : isCost ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {r.finalPrice.toFixed(3)}
                      </p>
                      {isPar && (
                        <span className="text-[10px] uppercase font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                          Par
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LLPA Breakdown */}
        {adjustments && adjustments.length > 0 && (
          <div className="p-4 border-t">
            <details className="group">
              <summary className="text-xs font-bold uppercase tracking-wider text-gray-500 cursor-pointer flex items-center justify-between">
                LLPA Breakdown
                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-3 space-y-1">
                {adjustments.map((adj, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-gray-600">
                      {adj.name} <span className="text-gray-400">({adj.key})</span>
                    </span>
                    <span className={`font-mono font-bold ${
                      adj.value > 0 ? 'text-green-600' : adj.value < 0 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {adj.value > 0 ? '+' : ''}{adj.value.toFixed(3)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-sm py-2 border-t-2 border-gray-200 font-bold">
                  <span>Total LLPA</span>
                  <span className={`font-mono ${
                    llpaTotal > 0 ? 'text-green-600' : llpaTotal < 0 ? 'text-red-600' : 'text-gray-700'
                  }`}>
                    {llpaTotal > 0 ? '+' : ''}{llpaTotal.toFixed(3)}
                  </span>
                </div>
              </div>
            </details>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default RateResults;
