/**
 * Rate Sheet Editor Component
 * Full editor for investor rate sheets with base rates, LLPA grid, and margin holdback
 */

import { useState, useRef } from 'react';
import { LTV_BUCKETS, LLPA_CATEGORIES } from '../data/llpaConfig';
import { PROGRAM_TYPES, ALL_STATES, ALL_DOC_TYPES, ALL_PROPERTY_TYPES, generateExportTemplate } from '../data/rateSheetStorage';
import { parsePdfRateSheet } from '../utils/pdfParser';
import { LlpaInput } from './LlpaInput';

export function RateSheetEditor({ rateSheet, onSave, onBack }) {
  const [sheet, setSheet] = useState({ ...rateSheet });
  const [activeTab, setActiveTab] = useState('overview'); // overview, baseRates, llpa, settings
  const [activeLlpaCategory, setActiveLlpaCategory] = useState('ficoScore');
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const fileInputRef = useRef(null);

  // Update sheet data
  const updateSheet = (updates) => {
    setSheet(prev => ({ ...prev, ...updates, updatedAt: new Date().toISOString() }));
    setHasChanges(true);
  };

  // Update settings
  const updateSettings = (key, value) => {
    setSheet(prev => ({
      ...prev,
      settings: { ...prev.settings, [key]: value },
      updatedAt: new Date().toISOString()
    }));
    setHasChanges(true);
  };

  // Update base rate
  const updateBaseRate = (index, field, value) => {
    const newRates = [...sheet.baseRates];
    newRates[index] = { ...newRates[index], [field]: parseFloat(value) || 0 };
    updateSheet({ baseRates: newRates });
  };

  // Add base rate row
  const addBaseRate = () => {
    const lastRate = sheet.baseRates[sheet.baseRates.length - 1] || { rate: 6.0, price: 100 };
    updateSheet({
      baseRates: [...sheet.baseRates, { rate: lastRate.rate + 0.125, price: lastRate.price + 0.375 }]
    });
  };

  // Remove base rate row
  const removeBaseRate = (index) => {
    updateSheet({ baseRates: sheet.baseRates.filter((_, i) => i !== index) });
  };

  // Update LLPA value
  const updateLlpaValue = (categoryKey, optionKey, bucket, value) => {
    const numValue = value === '' ? 0 : value === 'null' ? null : parseFloat(value);
    setSheet(prev => ({
      ...prev,
      llpaOverrides: {
        ...prev.llpaOverrides,
        [categoryKey]: {
          ...prev.llpaOverrides?.[categoryKey],
          [optionKey]: {
            ...prev.llpaOverrides?.[categoryKey]?.[optionKey],
            [bucket]: numValue
          }
        }
      },
      updatedAt: new Date().toISOString()
    }));
    setHasChanges(true);
  };

  // Toggle N/A override
  const toggleNaOverride = (categoryKey, optionKey, bucket, currentValue) => {
    const isCurrentlyNull = currentValue === null;
    const newValue = isCurrentlyNull ? 0 : null;
    updateLlpaValue(categoryKey, optionKey, bucket, newValue === null ? 'null' : newValue);
  };

  // Get effective LLPA value
  const getEffectiveLlpaValue = (categoryKey, optionKey, bucket) => {
    const override = sheet.llpaOverrides?.[categoryKey]?.[optionKey]?.[bucket];
    if (override !== undefined) return override;
    const defaultOpt = LLPA_CATEGORIES[categoryKey]?.options.find(o => o.key === optionKey);
    return defaultOpt?.values?.[bucket] ?? 0;
  };

  // Handle save
  const handleSave = () => {
    onSave(sheet);
    setHasChanges(false);
    setSaveMessage('Changes saved!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Export current sheet
  const handleExport = () => {
    const template = generateExportTemplate(sheet);
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sheet.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle file import
  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.rateSheet) {
            // Full template import
            const imported = data.rateSheet;
            setSheet(prev => ({
              ...prev,
              ...imported,
              id: prev.id, // Keep original ID
              name: imported.name || prev.name,
              updatedAt: new Date().toISOString()
            }));
            setHasChanges(true);
            setSaveMessage('JSON imported! Review and save.');
          } else if (data.baseRates) {
            // Partial import - just rates
            updateSheet({ baseRates: data.baseRates });
            setSaveMessage('Base rates imported!');
          }
        } catch (err) {
          alert('Failed to parse JSON file. Please check the format.');
        }
      };
      reader.readAsText(file);
    } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      alert('Excel/CSV import: Please export your spreadsheet data to JSON format.\n\nUse the "Export JSON" button to see the expected format.');
    } else if (ext === 'pdf') {
      // PDF OCR Import
      setSaveMessage('Parsing PDF with OCR...');
      try {
        const result = await parsePdfRateSheet(file);
        if (result.success) {
          const parsed = result.data;

          // Update sheet with parsed data
          setSheet(prev => ({
            ...prev,
            name: parsed.programName || prev.name,
            programType: parsed.programType || prev.programType,
            baseRates: parsed.baseRates.length > 0 ? parsed.baseRates : prev.baseRates,
            settings: {
              ...prev.settings,
              minFico: parsed.settings?.minFico || prev.settings?.minFico,
              maxLTV: parsed.settings?.maxLTV || prev.settings?.maxLTV,
              minLoanAmount: parsed.settings?.minLoanAmount || prev.settings?.minLoanAmount,
              maxLoanAmount: parsed.settings?.maxLoanAmount || prev.settings?.maxLoanAmount,
            },
            updatedAt: new Date().toISOString()
          }));
          setHasChanges(true);

          // Show warnings if any
          if (parsed.parseWarnings && parsed.parseWarnings.length > 0) {
            setSaveMessage(`PDF imported with ${parsed.parseWarnings.length} warning(s). Review data.`);
            console.log('PDF Parse Warnings:', parsed.parseWarnings);
          } else {
            setSaveMessage(`PDF imported! Found ${parsed.baseRates.length} rates. Review and save.`);
          }
        } else {
          alert(`PDF parsing failed: ${result.error}\n\nPlease try a different PDF or manually enter the data.`);
          setSaveMessage('');
        }
      } catch (err) {
        console.error('PDF import error:', err);
        alert('Failed to parse PDF file. Please check the file and try again.');
        setSaveMessage('');
      }
    }

    e.target.value = '';
  };

  const currentCategory = LLPA_CATEGORIES[activeLlpaCategory];

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-white border-b border-[#E4E4E7] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-[#F4F4F5] rounded-lg text-[#71717A] hover:text-[#09090B] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-[#09090B]">{sheet.name}</h1>
              <span className={`
                px-2 py-0.5 text-[10px] font-semibold rounded-full
                ${sheet.programType === 'DSCR' ? 'bg-[#E6F2FF] text-[#007FFF]' : 'bg-[#F4F4F5] text-[#71717A]'}
              `}>
                {sheet.programType}
              </span>
            </div>
            <p className="text-xs text-[#71717A]">{sheet.description || 'No description'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveMessage && (
            <span className="text-sm text-[#10B981] font-medium animate-fade-in">{saveMessage}</span>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.pdf,.xlsx,.xls,.csv"
            onChange={handleFileImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-sm text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5] rounded-lg transition-colors"
          >
            Import
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-sm text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5] rounded-lg transition-colors"
          >
            Export JSON
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-4 py-1.5 bg-[#007FFF] hover:bg-[#0066CC] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Save Changes
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-[#E4E4E7] px-4">
        <div className="flex gap-1">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'baseRates', label: 'Base Rates & Pricing' },
            { id: 'llpa', label: 'LLPA Grid' },
            { id: 'settings', label: 'Program Settings' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-[#007FFF] text-[#007FFF]'
                  : 'border-transparent text-[#71717A] hover:text-[#09090B]'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="max-w-3xl space-y-6">
            <div className="bg-white rounded-xl border border-[#E4E4E7] p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[#09090B]">Program Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#71717A] mb-1.5">Program Name</label>
                  <input
                    type="text"
                    value={sheet.name}
                    onChange={(e) => updateSheet({ name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007FFF]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#71717A] mb-1.5">Program Type</label>
                  <select
                    value={sheet.programType}
                    onChange={(e) => updateSheet({ programType: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007FFF]"
                  >
                    {PROGRAM_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#71717A] mb-1.5">Description</label>
                <textarea
                  value={sheet.description}
                  onChange={(e) => updateSheet({ description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007FFF]"
                  placeholder="Brief description of this program..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={sheet.isActive}
                  onChange={(e) => updateSheet({ isActive: e.target.checked })}
                  className="w-4 h-4 text-[#007FFF] rounded"
                />
                <label htmlFor="isActive" className="text-sm text-[#09090B]">Program is active</label>
              </div>
            </div>

            {/* Margin Holdback */}
            <div className="bg-[#18181B] rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Margin Holdback</h2>
                  <p className="text-sm text-[#A1A1AA]">Hidden from client-facing pricing</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    value={sheet.marginHoldback}
                    onChange={(e) => updateSheet({ marginHoldback: parseFloat(e.target.value) || 0 })}
                    className="w-24 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-center font-mono focus:outline-none focus:ring-2 focus:ring-[#007FFF]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[#A1A1AA]">Quick set:</span>
                {[-1.000, -1.250, -1.500, -1.625, -1.750, -2.000].map(val => (
                  <button
                    key={val}
                    onClick={() => updateSheet({ marginHoldback: val })}
                    className={`px-2 py-1 rounded ${sheet.marginHoldback === val ? 'bg-[#007FFF]' : 'bg-white/10 hover:bg-white/20'}`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-[#E4E4E7] p-4">
                <p className="text-xs text-[#71717A] uppercase font-medium">Base Rates</p>
                <p className="text-2xl font-bold text-[#09090B]">{sheet.baseRates?.length || 0}</p>
              </div>
              <div className="bg-white rounded-xl border border-[#E4E4E7] p-4">
                <p className="text-xs text-[#71717A] uppercase font-medium">LTV Buckets</p>
                <p className="text-2xl font-bold text-[#09090B]">{sheet.ltvBuckets?.length || 9}</p>
              </div>
              <div className="bg-white rounded-xl border border-[#E4E4E7] p-4">
                <p className="text-xs text-[#71717A] uppercase font-medium">Min FICO</p>
                <p className="text-2xl font-bold text-[#09090B]">{sheet.settings?.minFico || 620}</p>
              </div>
              <div className="bg-white rounded-xl border border-[#E4E4E7] p-4">
                <p className="text-xs text-[#71717A] uppercase font-medium">Max LTV</p>
                <p className="text-2xl font-bold text-[#007FFF]">{sheet.settings?.maxLTV || 90}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Base Rates Tab */}
        {activeTab === 'baseRates' && (
          <div className="max-w-4xl">
            <div className="bg-white rounded-xl border border-[#E4E4E7] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-[#09090B]">Base Rates & Pricing Grid</h2>
                  <p className="text-xs text-[#71717A]">{sheet.baseRates?.length || 0} rate tiers</p>
                </div>
                <button
                  onClick={addBaseRate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#007FFF] hover:bg-[#0066CC] text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Rate
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F4F4F5]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#71717A] uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#71717A] uppercase">Rate (%)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#71717A] uppercase">Base Price</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#71717A] uppercase">
                        Net Price
                        <span className="font-normal normal-case ml-1">(after {sheet.marginHoldback} margin)</span>
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-[#71717A] uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.baseRates?.map((rate, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
                        <td className="px-4 py-2 text-sm text-[#71717A]">{idx + 1}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="0.001"
                            value={rate.rate}
                            onChange={(e) => updateBaseRate(idx, 'rate', e.target.value)}
                            className="w-24 px-2 py-1 border border-[#E4E4E7] rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#007FFF]"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="0.001"
                            value={rate.price}
                            onChange={(e) => updateBaseRate(idx, 'price', e.target.value)}
                            className="w-24 px-2 py-1 border border-[#E4E4E7] rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#007FFF]"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <span className={`font-mono text-sm ${(rate.price + sheet.marginHoldback) >= 100 ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>
                            {(rate.price + sheet.marginHoldback).toFixed(3)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => removeBaseRate(idx)}
                            className="p-1 text-[#71717A] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {(!sheet.baseRates || sheet.baseRates.length === 0) && (
                <div className="p-8 text-center">
                  <p className="text-[#71717A]">No base rates defined. Click "Add Rate" to start.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LLPA Grid Tab */}
        {activeTab === 'llpa' && (
          <div className="flex gap-6">
            {/* Category Sidebar */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-xl border border-[#E4E4E7] overflow-hidden sticky top-4">
                <div className="px-4 py-3 border-b border-[#E4E4E7] bg-[#FAFAFA]">
                  <h3 className="font-semibold text-[#09090B] text-sm">LLPA Categories</h3>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-2">
                  {Object.entries(LLPA_CATEGORIES).map(([key, cat]) => (
                    <button
                      key={key}
                      onClick={() => setActiveLlpaCategory(key)}
                      className={`
                        w-full text-left px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors
                        ${activeLlpaCategory === key
                          ? 'bg-[#007FFF] text-white'
                          : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B]'}
                        ${cat.dscrOnly ? 'border-l-2 border-[#007FFF]/30 ml-1' : ''}
                      `}
                    >
                      {cat.label}
                      {cat.dscrOnly && <span className="text-[10px] ml-1 opacity-70">(DSCR)</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* LLPA Grid */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-xl border border-[#E4E4E7] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E4E4E7] bg-[#FAFAFA]">
                  <h2 className="font-semibold text-[#09090B]">{currentCategory?.label}</h2>
                  <p className="text-xs text-[#71717A]">
                    Click N/A cells to enable them. Click enabled cells and set to "null" to disable.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="bg-[#F4F4F5]">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#71717A] uppercase sticky left-0 bg-[#F4F4F5] z-10 min-w-[180px]">
                          Option
                        </th>
                        {LTV_BUCKETS.map(bucket => (
                          <th key={bucket} className="px-2 py-3 text-xs font-semibold text-[#71717A] text-center min-w-[80px]">
                            {bucket}%
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentCategory?.options.map((option, idx) => (
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
                            const value = getEffectiveLlpaValue(activeLlpaCategory, option.key, bucket);

                            return (
                              <td key={bucket} className="px-1 py-1 text-center">
                                <LlpaInput
                                  value={value}
                                  onChange={(newValue) => updateLlpaValue(activeLlpaCategory, option.key, bucket, newValue === null ? 'null' : newValue)}
                                />
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
                  <span>Positive (Rebate)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#FEE2E2] border border-[#FECACA] rounded" />
                  <span>Negative (Cost)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#18181B] rounded" />
                  <span>N/A (Type "NA" or "NULL" to disable)</span>
                </div>
              </div>

              {/* Help Text */}
              <div className="mt-4 p-4 bg-[#F4F4F5] rounded-lg">
                <h3 className="text-sm font-semibold text-[#09090B] mb-2">How to Edit LLPA Values</h3>
                <ul className="text-xs text-[#71717A] space-y-1">
                  <li>- Click any cell to edit the value</li>
                  <li>- Enter decimal values (e.g., -0.250 for -0.25% cost)</li>
                  <li>- Type <strong>NA</strong>, <strong>N/A</strong>, or <strong>NULL</strong> to mark as not available</li>
                  <li>- Press Enter to confirm, Escape to cancel</li>
                  <li>- Positive = Rebate (green), Negative = Cost (red)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl space-y-6">
            {/* Eligibility */}
            <div className="bg-white rounded-xl border border-[#E4E4E7] p-6">
              <h2 className="text-lg font-semibold text-[#09090B] mb-4">Eligibility Requirements</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#71717A] mb-1.5">Min FICO</label>
                  <input
                    type="number"
                    value={sheet.settings?.minFico || 620}
                    onChange={(e) => updateSettings('minFico', parseInt(e.target.value) || 620)}
                    className="w-full px-3 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007FFF]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#71717A] mb-1.5">Max LTV (%)</label>
                  <input
                    type="number"
                    value={sheet.settings?.maxLTV || 90}
                    onChange={(e) => updateSettings('maxLTV', parseInt(e.target.value) || 90)}
                    className="w-full px-3 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007FFF]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#71717A] mb-1.5">Min Loan Amount</label>
                  <input
                    type="number"
                    value={sheet.settings?.minLoanAmount || 75000}
                    onChange={(e) => updateSettings('minLoanAmount', parseInt(e.target.value) || 75000)}
                    className="w-full px-3 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007FFF]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#71717A] mb-1.5">Max Loan Amount</label>
                  <input
                    type="number"
                    value={sheet.settings?.maxLoanAmount || 5000000}
                    onChange={(e) => updateSettings('maxLoanAmount', parseInt(e.target.value) || 5000000)}
                    className="w-full px-3 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007FFF]"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requiresDSCR"
                  checked={sheet.settings?.requiresDSCR || false}
                  onChange={(e) => updateSettings('requiresDSCR', e.target.checked)}
                  className="w-4 h-4 text-[#007FFF] rounded"
                />
                <label htmlFor="requiresDSCR" className="text-sm text-[#09090B]">Requires DSCR calculation</label>
              </div>
            </div>

            {/* Allowed States */}
            <div className="bg-white rounded-xl border border-[#E4E4E7] p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#09090B]">Allowed States</h2>
                  <p className="text-xs text-[#71717A]">{sheet.settings?.allowedStates?.length || 0} states selected</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateSettings('allowedStates', [...ALL_STATES])}
                    className="text-xs text-[#007FFF] hover:underline"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => updateSettings('allowedStates', [])}
                    className="text-xs text-[#71717A] hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_STATES.map(state => (
                  <label
                    key={state}
                    className={`
                      px-2.5 py-1 text-sm rounded-lg cursor-pointer transition-colors
                      ${sheet.settings?.allowedStates?.includes(state)
                        ? 'bg-[#007FFF] text-white'
                        : 'bg-[#F4F4F5] text-[#71717A] hover:bg-[#E4E4E7]'}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={sheet.settings?.allowedStates?.includes(state) || false}
                      onChange={(e) => {
                        const current = sheet.settings?.allowedStates || [];
                        updateSettings('allowedStates',
                          e.target.checked
                            ? [...current, state]
                            : current.filter(s => s !== state)
                        );
                      }}
                      className="sr-only"
                    />
                    {state}
                  </label>
                ))}
              </div>
            </div>

            {/* Doc Types */}
            <div className="bg-white rounded-xl border border-[#E4E4E7] p-6">
              <h2 className="text-lg font-semibold text-[#09090B] mb-4">Allowed Doc Types</h2>
              <div className="flex flex-wrap gap-2">
                {ALL_DOC_TYPES.map(docType => (
                  <label
                    key={docType}
                    className={`
                      px-3 py-1.5 text-sm rounded-lg cursor-pointer transition-colors
                      ${sheet.settings?.allowedDocTypes?.includes(docType)
                        ? 'bg-[#007FFF] text-white'
                        : 'bg-[#F4F4F5] text-[#71717A] hover:bg-[#E4E4E7]'}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={sheet.settings?.allowedDocTypes?.includes(docType) || false}
                      onChange={(e) => {
                        const current = sheet.settings?.allowedDocTypes || [];
                        updateSettings('allowedDocTypes',
                          e.target.checked
                            ? [...current, docType]
                            : current.filter(d => d !== docType)
                        );
                      }}
                      className="sr-only"
                    />
                    {docType}
                  </label>
                ))}
              </div>
            </div>

            {/* Property Types */}
            <div className="bg-white rounded-xl border border-[#E4E4E7] p-6">
              <h2 className="text-lg font-semibold text-[#09090B] mb-4">Allowed Property Types</h2>
              <div className="flex flex-wrap gap-2">
                {ALL_PROPERTY_TYPES.map(propType => (
                  <label
                    key={propType}
                    className={`
                      px-3 py-1.5 text-sm rounded-lg cursor-pointer transition-colors
                      ${sheet.settings?.allowedPropertyTypes?.includes(propType)
                        ? 'bg-[#007FFF] text-white'
                        : 'bg-[#F4F4F5] text-[#71717A] hover:bg-[#E4E4E7]'}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={sheet.settings?.allowedPropertyTypes?.includes(propType) || false}
                      onChange={(e) => {
                        const current = sheet.settings?.allowedPropertyTypes || [];
                        updateSettings('allowedPropertyTypes',
                          e.target.checked
                            ? [...current, propType]
                            : current.filter(p => p !== propType)
                        );
                      }}
                      className="sr-only"
                    />
                    {propType}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RateSheetEditor;
