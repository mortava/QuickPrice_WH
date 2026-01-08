"use client";

/**
 * Rate Results Display with passcode-protected More Options
 */
import { useRef, useState } from 'react';

export function RateResultsDisplay({ results, formData, onClear }) {
  const printRef = useRef(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  const [isPasscodeUnlocked, setIsPasscodeUnlocked] = useState(false);

  if (!results) return null;

  const primaryResult = results.primary || results;
  const allPrograms = results.allPrograms || [];
  const { program, ltv, ltvBucket, llpaTotal, adjustments, rates, bestRate: engineBestRate, error } = primaryResult;
  const otherPrograms = allPrograms.filter(p => p.programKey !== primaryResult.programKey);

  const handlePasscodeSubmit = () => {
    if (passcodeInput === '5555') {
      setIsPasscodeUnlocked(true);
      setShowMoreOptions(true);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
      setTimeout(() => setPasscodeError(false), 2000);
    }
  };

  // Use engine's bestRate (rebate cap logic) or fallback to closest to par
  const parRate = engineBestRate || (rates && rates.length > 0 ? rates.reduce((prev, curr) => Math.abs(curr.finalPrice - 100) < Math.abs(prev.finalPrice - 100) ? curr : prev, rates[0]) : null);
  const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  const handlePrint = () => window.print();
  const handleShare = async () => {
    const text = (formData.scenarioName || 'Loan Scenario') + ' - ' + program + ' Rate Quote';
    if (navigator.share) { try { await navigator.share({ title: 'Rate Quote', text }); } catch (e) {} }
    else { navigator.clipboard.writeText(text); alert('Quote copied!'); }
  };

  return (
    <div className="mt-6 animate-slide-up" ref={printRef}>
      <div className="bg-white rounded-xl border border-[#E4E4E7] overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-[#E4E4E7] bg-gradient-to-r from-[#09090B] to-[#27272A]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-[#A1A1AA] uppercase tracking-wide">Best Rate Quote</p>
              <h2 className="text-xl font-bold text-white">{formData.scenarioName || program}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleShare} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg">Share</button>
              <button onClick={handlePrint} className="px-3 py-1.5 bg-[#007FFF] hover:bg-[#0066CC] text-white text-sm font-medium rounded-lg">Print PDF</button>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 bg-[#FAFAFA] border-b border-[#E4E4E7]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div><p className="text-[10px] font-semibold text-[#71717A] uppercase">Loan Amount</p><p className="text-lg font-bold text-[#09090B]">{formatCurrency(formData.loanAmount)}</p></div>
            <div><p className="text-[10px] font-semibold text-[#71717A] uppercase">LTV</p><p className="text-lg font-bold text-[#007FFF]">{ltv}%</p></div>
            <div><p className="text-[10px] font-semibold text-[#71717A] uppercase">FICO</p><p className="text-lg font-bold text-[#09090B]">{formData.creditScore}</p></div>
            <div><p className="text-[10px] font-semibold text-[#71717A] uppercase">Total Adj</p><p className={llpaTotal >= 0 ? 'text-lg font-bold text-[#10B981]' : 'text-lg font-bold text-[#DC2626]'}>{llpaTotal >= 0 ? '+' : ''}{llpaTotal?.toFixed(3)}</p></div>
          </div>
        </div>

        {error && <div className="p-4 m-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg"><p className="text-sm text-[#DC2626] font-medium">{error}</p></div>}

        {parRate && (
          <div className="p-5 border-b border-[#E4E4E7]">
            <p className="text-[11px] font-semibold text-[#71717A] uppercase mb-3">Best Rate</p>
            <div className="bg-[#E6F2FF] border-2 border-[#007FFF] rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#007FFF] rounded-lg flex items-center justify-center"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></div>
                <div><p className="text-2xl font-bold text-[#007FFF]">{parRate.rate.toFixed(3)}%</p><p className="text-sm text-[#71717A]">{program}</p></div>
              </div>
              <div className="text-right"><p className="text-xl font-mono font-bold text-[#09090B]">{parRate.finalPrice.toFixed(3)}</p><span className="inline-flex items-center px-2.5 py-1 bg-[#007FFF] text-white text-[11px] font-bold rounded-full uppercase">Par Rate</span></div>
            </div>
          </div>
        )}

        {rates && rates.length > 1 && (
          <div className="p-5">
            <p className="text-[11px] font-semibold text-[#71717A] uppercase mb-3">Other Options ({rates.length - 1})</p>
            <div className="space-y-2">
              {rates.filter(r => r !== parRate).map((r, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-lg border border-[#E4E4E7]">
                  <span className="text-lg font-bold text-[#09090B]">{r.rate.toFixed(3)}%</span>
                  <div className="flex items-center gap-3">
                    <span className={r.finalPrice > 100 ? 'font-mono font-semibold text-[#10B981]' : 'font-mono font-semibold text-[#F59E0B]'}>{r.finalPrice.toFixed(3)}</span>
                    <span className={r.finalPrice > 100 ? 'inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#DCFCE7] text-[#166534]' : 'inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#FEF3C7] text-[#92400E]'}>{r.finalPrice > 100 ? 'Rebate' : 'Cost'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {otherPrograms.length > 0 && (
          <div className="border-t border-[#E4E4E7]">
            <div className="px-5 py-4">
              {!isPasscodeUnlocked ? (
                <>
                  <button onClick={() => setShowMoreOptions(!showMoreOptions)} className="flex items-center gap-2 text-sm font-medium text-[#71717A] hover:text-[#09090B]">
                    <svg className={showMoreOptions ? 'w-4 h-4 rotate-90' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    More Options ({otherPrograms.length} programs)
                  </button>
                  {showMoreOptions && (
                    <div className="mt-4 p-4 bg-[#F4F4F5] rounded-lg">
                      <p className="text-sm text-[#71717A] mb-3">Enter passcode to view additional programs:</p>
                      <div className="flex items-center gap-2">
                        <input type="password" maxLength={4} value={passcodeInput} onChange={(e) => setPasscodeInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePasscodeSubmit()} placeholder="****" className={passcodeError ? 'w-24 px-3 py-2 text-center text-lg font-mono rounded-lg border border-[#DC2626] bg-[#FEF2F2]' : 'w-24 px-3 py-2 text-center text-lg font-mono rounded-lg border border-[#E4E4E7]'} />
                        <button onClick={handlePasscodeSubmit} className="px-4 py-2 bg-[#09090B] hover:bg-[#27272A] text-white text-sm font-medium rounded-lg">Unlock</button>
                      </div>
                      {passcodeError && <p className="mt-2 text-sm text-[#DC2626]">Incorrect passcode</p>}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-[#10B981] mb-4">Viewing all {otherPrograms.length + 1} programs</p>
                  <div className="space-y-4">
                    {otherPrograms.map((prog, idx) => (
                      <div key={idx} className="border border-[#E4E4E7] rounded-xl overflow-hidden">
                        <div className="px-4 py-3 bg-[#FAFAFA] border-b border-[#E4E4E7] flex items-center justify-between">
                          <div><p className="font-semibold text-[#09090B]">{prog.program}</p><p className="text-xs text-[#71717A]">LTV: {prog.ltv}%</p></div>
                          {prog.bestRate && <div className="text-right"><p className="text-lg font-bold text-[#007FFF]">{prog.bestRate.rate.toFixed(3)}%</p><p className="text-sm font-mono text-[#71717A]">@ {prog.bestRate.finalPrice.toFixed(3)}</p></div>}
                        </div>
                        <div className="p-3 space-y-1">
                          {prog.rates.slice(0, 3).map((r, rIdx) => (
                            <div key={rIdx} className="flex items-center justify-between text-sm py-1">
                              <span className="font-medium text-[#09090B]">{r.rate.toFixed(3)}%</span>
                              <span className={r.finalPrice > 100 ? 'font-mono text-[#10B981]' : 'font-mono text-[#F59E0B]'}>{r.finalPrice.toFixed(3)}</span>
                            </div>
                          ))}
                          {prog.rates.length > 3 && <p className="text-xs text-[#71717A] pt-1">+{prog.rates.length - 3} more</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {(!rates || rates.length === 0) && !error && <div className="p-8 text-center"><p className="text-[#71717A] text-sm">No rates available in the 99-101 price range.</p></div>}

        {adjustments && adjustments.length > 0 && (
          <div className="px-5 pb-5">
            <details className="group" open>
              <summary className="flex items-center justify-between text-[11px] font-semibold text-[#71717A] uppercase cursor-pointer py-2"><span>LLPA Breakdown ({adjustments.length} adjustments)</span></summary>
              <div className="mt-2 p-4 bg-[#FAFAFA] rounded-lg border border-[#E4E4E7]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  {adjustments.map((adj, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-2 border-b border-[#E4E4E7] last:border-0">
                      <span className="text-[#71717A]">{adj.name}</span>
                      <span className={adj.value > 0 ? 'font-mono font-medium text-[#10B981]' : adj.value < 0 ? 'font-mono font-medium text-[#DC2626]' : 'font-mono font-medium text-[#71717A]'}>{adj.value > 0 ? '+' : ''}{adj.value.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm pt-3 mt-3 border-t-2 border-[#09090B]/20 font-bold"><span className="text-[#09090B]">Total LLPA</span><span className={llpaTotal >= 0 ? 'font-mono text-[#10B981]' : 'font-mono text-[#DC2626]'}>{llpaTotal >= 0 ? '+' : ''}{llpaTotal?.toFixed(3)}</span></div>
              </div>
            </details>
          </div>
        )}

        <div className="px-5 py-4 border-t border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-between">
          <button onClick={onClear} className="px-4 py-2 text-sm font-medium text-[#71717A] hover:text-[#09090B] hover:bg-white rounded-lg">Clear Results</button>
          <div className="flex items-center gap-2">
            <button onClick={handleShare} className="px-4 py-2 text-sm font-medium text-[#09090B] bg-white border border-[#E4E4E7] hover:bg-[#F4F4F5] rounded-lg">Share</button>
            <button onClick={handlePrint} className="px-4 py-2 text-sm font-medium text-white bg-[#007FFF] hover:bg-[#0066CC] rounded-lg">Print PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RateResultsDisplay;
