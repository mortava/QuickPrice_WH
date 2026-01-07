/**
 * Admin Panel Component
 * Full rate sheet management with storage, LLPA editor, and import/export
 */

import { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { RateSheetList } from './RateSheetList';
import { RateSheetEditor } from './RateSheetEditor';
import { loadRateSheets, saveRateSheets, DEFAULT_RATE_SHEETS, generateExportTemplate } from '../data/rateSheetStorage';
import { LTV_BUCKETS, LLPA_CATEGORIES } from '../data/llpaConfig';

// Local storage key for LLPA data (legacy)
const LLPA_STORAGE_KEY = 'quickprice_llpa_data';

export function AdminPanel({ onBack, onPushUpdates }) {
  const { logout } = useAdmin();
  const [view, setView] = useState('storage'); // 'storage', 'editor', 'llpa'
  const [rateSheets, setRateSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pushMessage, setPushMessage] = useState('');

  // Legacy LLPA state (for backwards compatibility)
  const [activeCategory, setActiveCategory] = useState('ficoScore');
  const [llpaData, setLlpaData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load rate sheets on mount
  useEffect(() => {
    const sheets = loadRateSheets();
    setRateSheets(sheets.length > 0 ? sheets : DEFAULT_RATE_SHEETS);
  }, []);

  // Load legacy LLPA data on mount
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

  // Handle rate sheet selection
  const handleSelectSheet = (sheet) => {
    setSelectedSheet(sheet);
    setView('editor');
  };

  // Handle rate sheet save
  const handleSaveSheet = (updatedSheet) => {
    const newSheets = rateSheets.map(s => s.id === updatedSheet.id ? updatedSheet : s);
    setRateSheets(newSheets);
    saveRateSheets(newSheets);
    setSelectedSheet(updatedSheet);
  };

  // Handle add rate sheet
  const handleAddSheet = (newSheet) => {
    const newSheets = [...rateSheets, newSheet];
    setRateSheets(newSheets);
    saveRateSheets(newSheets);
  };

  // Handle delete rate sheet
  const handleDeleteSheet = (id) => {
    const newSheets = rateSheets.filter(s => s.id !== id);
    setRateSheets(newSheets);
    saveRateSheets(newSheets);
  };

  // Handle duplicate rate sheet
  const handleDuplicateSheet = (sheet) => {
    const newSheet = {
      ...sheet,
      id: sheet.id + '-copy-' + Date.now(),
      name: sheet.name + ' (Copy)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    handleAddSheet(newSheet);
  };

  // Handle push updates to application
  const handlePushUpdates = () => {
    if (onPushUpdates) {
      onPushUpdates();
    }
    setPushMessage('Updates pushed to pricing engine!');
    setTimeout(() => setPushMessage(''), 3000);
  };

  // Handle file import
  const handleImportFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);

          // Check if it's a full rate sheet or array of sheets
          if (Array.isArray(data)) {
            // Multiple sheets
            const newSheets = [...rateSheets, ...data];
            setRateSheets(newSheets);
            saveRateSheets(newSheets);
            setSaveMessage(`Imported ${data.length} rate sheets!`);
          } else if (data.rateSheet) {
            // Single sheet in template format
            const newSheet = {
              ...data.rateSheet,
              id: data.rateSheet.id || 'imported-' + Date.now(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            handleAddSheet(newSheet);
            setSaveMessage('Rate sheet imported!');
          } else if (data.id && data.name) {
            // Single sheet direct format
            handleAddSheet({
              ...data,
              id: data.id + '-' + Date.now(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            setSaveMessage('Rate sheet imported!');
          }
          setTimeout(() => setSaveMessage(''), 3000);
        } catch (err) {
          alert('Failed to parse JSON file. Please check the format.');
        }
      };
      reader.readAsText(file);
    } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      alert('Excel/CSV import: Please export your spreadsheet data to JSON format first.\n\nTemplate structure available via "Blank Template" button.');
    } else if (ext === 'pdf') {
      alert('PDF import: PDF files require OCR processing.\n\nPlease manually extract rate data to JSON format, or contact support for bulk imports.');
    }
  };

  // Handle export all
  const handleExportAll = () => {
    const exportData = rateSheets.map(sheet => generateExportTemplate(sheet));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_rate_sheets_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Legacy LLPA functions
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

  const saveLlpaChanges = () => {
    localStorage.setItem(LLPA_STORAGE_KEY, JSON.stringify(llpaData));
    setHasChanges(false);
    setSaveMessage('Changes saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const categoryData = getCurrentCategoryData();
  const categories = Object.entries(LLPA_CATEGORIES);

  // If editing a rate sheet, show editor
  if (view === 'editor' && selectedSheet) {
    return (
      <RateSheetEditor
        rateSheet={selectedSheet}
        onSave={handleSaveSheet}
        onBack={() => {
          setView('storage');
          setSelectedSheet(null);
        }}
      />
    );
  }

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
        <h1 className="font-semibold text-[#09090B]">Admin Panel</h1>
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
              <p className="text-xs text-[#71717A]">Manage Pricing & LLPAs</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <p className="px-3 py-2 text-[10px] font-semibold text-[#71717A] uppercase tracking-wider">Main</p>

          <button
            onClick={() => { setView('storage'); setMobileMenuOpen(false); }}
            className={`
              w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1 flex items-center gap-3 transition-colors
              ${view === 'storage'
                ? 'bg-[#007FFF] text-white'
                : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B]'}
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Rate Sheet Storage
          </button>

          <button
            onClick={() => { setView('llpa'); setMobileMenuOpen(false); }}
            className={`
              w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1 flex items-center gap-3 transition-colors
              ${view === 'llpa'
                ? 'bg-[#007FFF] text-white'
                : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B]'}
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            Global LLPA Editor
          </button>

          {view === 'llpa' && (
            <div className="ml-4 mt-1 space-y-0.5">
              {categories.map(([key, cat]) => (
                <button
                  key={key}
                  onClick={() => { setActiveCategory(key); setMobileMenuOpen(false); }}
                  className={`
                    w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors
                    ${activeCategory === key
                      ? 'bg-[#E6F2FF] text-[#007FFF]'
                      : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B]'}
                    ${cat.dscrOnly ? 'border-l-2 border-[#007FFF]/30 ml-1' : ''}
                  `}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#E4E4E7] space-y-2">
          {/* Push Updates Button */}
          <button
            onClick={handlePushUpdates}
            className="w-full px-3 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Push Updates to App
          </button>

          {pushMessage && (
            <p className="text-xs text-center text-[#10B981] font-medium animate-fade-in">{pushMessage}</p>
          )}

          <button
            onClick={onBack}
            className="w-full text-left px-3 py-2 text-sm text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5] rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Pricing
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
        {view === 'storage' && (
          <RateSheetList
            rateSheets={rateSheets}
            onSelect={handleSelectSheet}
            onDelete={handleDeleteSheet}
            onDuplicate={handleDuplicateSheet}
            onAdd={handleAddSheet}
            onImport={handleImportFile}
            onExportAll={handleExportAll}
          />
        )}

        {view === 'llpa' && (
          <>
            {/* Toolbar */}
            <div className="bg-white border-b border-[#E4E4E7] px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 lg:top-0 z-20">
              <div>
                <h1 className="text-lg font-semibold text-[#09090B]">{categoryData?.label}</h1>
                <p className="text-xs text-[#71717A]">
                  {categoryData?.options.length} options - {LTV_BUCKETS.length} LTV buckets
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {saveMessage && (
                  <span className="text-[#10B981] text-sm font-medium animate-fade-in">{saveMessage}</span>
                )}

                <button
                  onClick={saveLlpaChanges}
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
                                  <button
                                    onClick={() => updateCellValue(option.key, bucket, 0)}
                                    className="w-full h-8 bg-[#18181B] hover:bg-[#27272A] rounded flex items-center justify-center transition-colors group"
                                    title="Click to enable"
                                  >
                                    <span className="text-[10px] text-[#71717A] group-hover:text-white font-medium">N/A</span>
                                  </button>
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
                  <span>Not Available (Click to enable)</span>
                </div>
              </div>

              {/* Help Text */}
              <div className="mt-6 p-4 bg-[#F4F4F5] rounded-lg">
                <h3 className="text-sm font-semibold text-[#09090B] mb-2">Tips</h3>
                <ul className="text-xs text-[#71717A] space-y-1">
                  <li>- Enter values as decimals (e.g., -0.250 for a 0.25% cost)</li>
                  <li>- Positive values = Rebate (money back to broker)</li>
                  <li>- Negative values = Cost (reduces price)</li>
                  <li>- Click N/A cells to enable them for specific scenarios</li>
                  <li>- Changes are saved to browser storage until exported</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminPanel;
