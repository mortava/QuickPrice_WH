import { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { LTV_BUCKETS, LLPA_CATEGORIES, STATES_CONFIG } from '../data/llpaConfig';

// Local storage key for LLPA data
const LLPA_STORAGE_KEY = 'quickprice_llpa_data';

export function AdminPanel({ onBack }) {
  const { logout } = useAdmin();
  const [activeCategory, setActiveCategory] = useState('ficoScore');
  const [llpaData, setLlpaData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load saved LLPA data on mount
  useEffect(() => {
    const saved = localStorage.getItem(LLPA_STORAGE_KEY);
    if (saved) {
      try {
        setLlpaData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load LLPA data:', e);
      }
    }
  }, []);

  // Get current category data
  const getCurrentCategoryData = () => {
    const category = LLPA_CATEGORIES[activeCategory];
    if (!category) return null;

    return {
      ...category,
      options: category.options.map(opt => ({
        ...opt,
        values: llpaData[activeCategory]?.[opt.key] || opt.values
      }))
    };
  };

  // Update a single cell value
  const updateCellValue = (optionKey, ltvBucket, value) => {
    const numValue = value === '' ? 0 : value === 'null' ? null : parseFloat(value);

    setLlpaData(prev => ({
      ...prev,
      [activeCategory]: {
        ...prev[activeCategory],
        [optionKey]: {
          ...(prev[activeCategory]?.[optionKey] || LLPA_CATEGORIES[activeCategory]?.options.find(o => o.key === optionKey)?.values || {}),
          [ltvBucket]: numValue
        }
      }
    }));
    setHasChanges(true);
  };

  // Save changes
  const saveChanges = () => {
    localStorage.setItem(LLPA_STORAGE_KEY, JSON.stringify(llpaData));
    setHasChanges(false);
    setSaveMessage('Changes saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Reset category to defaults
  const resetCategory = () => {
    if (window.confirm(`Reset ${LLPA_CATEGORIES[activeCategory]?.label} to defaults?`)) {
      setLlpaData(prev => {
        const newData = { ...prev };
        delete newData[activeCategory];
        return newData;
      });
      setHasChanges(true);
    }
  };

  // Export config
  const exportConfig = () => {
    const dataStr = JSON.stringify(llpaData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `llpa_config_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import config
  const importConfig = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        setLlpaData(imported);
        setHasChanges(true);
        setSaveMessage('Configuration imported! Remember to save.');
      } catch (err) {
        alert('Failed to import configuration. Invalid file format.');
      }
    };
    reader.readAsText(file);
  };

  const categoryData = getCurrentCategoryData();
  const categories = Object.entries(LLPA_CATEGORIES);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-[#E4E4E7] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-[#F4F4F5] rounded-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="font-semibold text-[#09090B]">LLPA Admin</h1>
        <button onClick={logout} className="text-[#DC2626] text-sm font-medium">Logout</button>
      </header>

      {/* Sidebar */}
      <aside className={`
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40
        w-72 bg-white border-r border-[#E4E4E7] flex flex-col
        transition-transform lg:transition-none
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#E4E4E7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#09090B] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">D</span>
            </div>
            <div>
              <h2 className="font-semibold text-[#09090B]">Rate Sheet Admin</h2>
              <p className="text-xs text-[#71717A]">LLPA Configuration</p>
            </div>
          </div>
        </div>

        {/* Categories List */}
        <nav className="flex-1 overflow-y-auto p-2">
          <p className="px-3 py-2 text-[10px] font-semibold text-[#71717A] uppercase tracking-wider">Categories</p>
          {categories.map(([key, cat]) => (
            <button
              key={key}
              onClick={() => {
                setActiveCategory(key);
                setMobileMenuOpen(false);
              }}
              className={`
                w-full text-left px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors
                ${activeCategory === key
                  ? 'bg-[#007FFF] text-white'
                  : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B]'
                }
                ${cat.dscrOnly ? 'border-l-2 border-[#007FFF]/30 ml-2' : ''}
                ${cat.conditional ? 'italic' : ''}
              `}
            >
              {cat.label}
              {cat.dscrOnly && <span className="text-[10px] ml-1 opacity-70">(DSCR)</span>}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#E4E4E7] space-y-2">
          <button
            onClick={onBack}
            className="w-full text-left px-3 py-2 text-sm text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5] rounded-lg transition-colors"
          >
            ← Back to Pricing
          </button>
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 text-sm text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="bg-white border-b border-[#E4E4E7] px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 lg:top-0 z-20">
          <div>
            <h1 className="text-lg font-semibold text-[#09090B]">{categoryData?.label}</h1>
            <p className="text-xs text-[#71717A]">
              {categoryData?.options.length} options • {LTV_BUCKETS.length} LTV buckets
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {saveMessage && (
              <span className="text-[#10B981] text-sm font-medium animate-fade-in">{saveMessage}</span>
            )}

            <button
              onClick={resetCategory}
              className="px-3 py-1.5 text-sm text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5] rounded-lg transition-colors"
            >
              Reset
            </button>

            <label className="px-3 py-1.5 text-sm text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5] rounded-lg transition-colors cursor-pointer">
              Import
              <input type="file" accept=".json" onChange={importConfig} className="hidden" />
            </label>

            <button
              onClick={exportConfig}
              className="px-3 py-1.5 text-sm text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5] rounded-lg transition-colors"
            >
              Export
            </button>

            <button
              onClick={saveChanges}
              disabled={!hasChanges}
              className="px-4 py-1.5 bg-[#007FFF] hover:bg-[#0066CC] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </div>

        {/* Grid Editor */}
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="bg-white rounded-xl border border-[#E4E4E7] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-[#F4F4F5]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#71717A] uppercase tracking-wider sticky left-0 bg-[#F4F4F5] z-10 min-w-[200px]">
                      Option
                    </th>
                    {LTV_BUCKETS.map(bucket => (
                      <th key={bucket} className="px-2 py-3 text-xs font-semibold text-[#71717A] text-center min-w-[90px]">
                        {bucket}%
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categoryData?.options.map((option, idx) => (
                    <tr key={option.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
                      <td className="px-4 py-2 text-sm text-[#09090B] font-medium sticky left-0 bg-inherit z-10 border-r border-[#E4E4E7]">
                        <div className="flex items-center gap-2">
                          {option.label}
                          {option.isDefault && (
                            <span className="text-[9px] bg-[#007FFF]/10 text-[#007FFF] px-1.5 py-0.5 rounded font-semibold">
                              DEFAULT
                            </span>
                          )}
                        </div>
                      </td>
                      {LTV_BUCKETS.map(bucket => {
                        const value = option.values[bucket];
                        const isNull = value === null;

                        return (
                          <td key={bucket} className="px-1 py-1 text-center">
                            {isNull ? (
                              <div className="w-full h-8 bg-[#18181B] rounded flex items-center justify-center">
                                <span className="text-[10px] text-[#71717A] font-medium">N/A</span>
                              </div>
                            ) : (
                              <input
                                type="number"
                                step="0.001"
                                value={value || 0}
                                onChange={(e) => updateCellValue(option.key, bucket, e.target.value)}
                                className={`
                                  w-full h-8 px-2 text-center text-sm font-mono rounded border transition-colors
                                  ${value > 0 ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#166534]' :
                                    value < 0 ? 'bg-[#FEE2E2] border-[#FECACA] text-[#991B1B]' :
                                    'bg-white border-[#E4E4E7] text-[#71717A]'}
                                  focus:outline-none focus:ring-2 focus:ring-[#007FFF] focus:border-transparent
                                `}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#71717A]">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#DCFCE7] border border-[#86EFAC] rounded" />
              <span>Positive Adjustment (Rebate)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#FEE2E2] border border-[#FECACA] rounded" />
              <span>Negative Adjustment (Cost)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#18181B] rounded" />
              <span>Not Available (NULL)</span>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-[#F4F4F5] rounded-lg">
            <h3 className="text-sm font-semibold text-[#09090B] mb-2">Tips</h3>
            <ul className="text-xs text-[#71717A] space-y-1">
              <li>• Enter values as decimals (e.g., -0.250 for a 0.25% cost)</li>
              <li>• Positive values = Rebate (money back to broker)</li>
              <li>• Negative values = Cost (reduces price)</li>
              <li>• NULL cells indicate ineligible combinations</li>
              <li>• Changes are saved to browser storage until exported</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminPanel;
