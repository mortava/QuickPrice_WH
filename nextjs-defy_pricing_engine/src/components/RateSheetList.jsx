"use client";

/**
 * Rate Sheet List Component
 * Displays list of investor rate sheets/programs for selection
 */

import { useState } from 'react';
import { PROGRAM_TYPES, createDefaultRateSheet, generateExportTemplate, generateBlankTemplate } from '@/data/rateSheetStorage';

export function RateSheetList({
  rateSheets,
  onSelect,
  onDelete,
  onDuplicate,
  onAdd,
  onImport,
  onExportAll
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  const [newSheetType, setNewSheetType] = useState('NonQM');

  const handleAdd = () => {
    if (!newSheetName.trim()) return;
    const id = newSheetName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    const newSheet = createDefaultRateSheet(id, newSheetName.trim(), newSheetType);
    onAdd(newSheet);
    setShowAddModal(false);
    setNewSheetName('');
    setNewSheetType('NonQM');
  };

  const handleExportTemplate = () => {
    const template = generateBlankTemplate();
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rate_sheet_template_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    onImport(file);
    e.target.value = '';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#E4E4E7] bg-[#FAFAFA]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-[#09090B]">Rate Sheet Storage</h2>
            <p className="text-xs text-[#71717A]">{rateSheets.length} investor program{rateSheets.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#007FFF] hover:bg-[#0066CC] text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Program
          </button>
        </div>

        {/* Import/Export Row */}
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E4E4E7] hover:bg-[#F4F4F5] text-[#71717A] hover:text-[#09090B] text-xs font-medium rounded-lg cursor-pointer transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
            <input
              type="file"
              accept=".json,.pdf,.xlsx,.xls,.csv"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
          <button
            onClick={onExportAll}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E4E4E7] hover:bg-[#F4F4F5] text-[#71717A] hover:text-[#09090B] text-xs font-medium rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export All
          </button>
          <button
            onClick={handleExportTemplate}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E4E4E7] hover:bg-[#F4F4F5] text-[#71717A] hover:text-[#09090B] text-xs font-medium rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Blank Template
          </button>
        </div>
      </div>

      {/* Rate Sheet Cards */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid gap-3">
          {rateSheets.map((sheet) => (
            <div
              key={sheet.id}
              className="bg-white rounded-xl border border-[#E4E4E7] overflow-hidden hover:border-[#007FFF]/50 transition-colors group"
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#09090B] truncate">{sheet.name}</h3>
                      <span className={`
                        px-2 py-0.5 text-[10px] font-semibold rounded-full
                        ${sheet.programType === 'DSCR' ? 'bg-[#E6F2FF] text-[#007FFF]' :
                          sheet.programType === 'HELOAN' ? 'bg-[#FEF3C7] text-[#92400E]' :
                          sheet.programType === 'RTL' ? 'bg-[#FEE2E2] text-[#991B1B]' :
                          'bg-[#F4F4F5] text-[#71717A]'}
                      `}>
                        {sheet.programType}
                      </span>
                      {sheet.isActive && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#DCFCE7] text-[#166534]">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#71717A] mt-1 truncate">{sheet.description || 'No description'}</p>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 mt-3 text-xs text-[#71717A]">
                  <div>
                    <span className="font-medium text-[#09090B]">{sheet.baseRates?.length || 0}</span> rates
                  </div>
                  <div>
                    <span className="font-medium text-[#09090B]">{sheet.ltvBuckets?.length || 9}</span> LTV buckets
                  </div>
                  <div>
                    Margin: <span className="font-mono font-medium text-[#DC2626]">{sheet.marginHoldback}</span>
                  </div>
                </div>

                {/* Settings Preview */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className="px-1.5 py-0.5 text-[10px] bg-[#F4F4F5] text-[#71717A] rounded">
                    FICO: {sheet.settings?.minFico || 620}+
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] bg-[#F4F4F5] text-[#71717A] rounded">
                    Max LTV: {sheet.settings?.maxLTV || 90}%
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] bg-[#F4F4F5] text-[#71717A] rounded">
                    {sheet.settings?.allowedStates?.length || 0} states
                  </span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-4 py-2.5 bg-[#FAFAFA] border-t border-[#E4E4E7] flex items-center justify-between">
                <button
                  onClick={() => onSelect(sheet)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#007FFF] hover:bg-[#0066CC] text-white text-xs font-medium rounded-lg transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Rate Sheet
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDuplicate(sheet)}
                    className="p-1.5 hover:bg-white rounded-lg text-[#71717A] hover:text-[#09090B] transition-colors"
                    title="Duplicate"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      const template = generateExportTemplate(sheet);
                      const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${sheet.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="p-1.5 hover:bg-white rounded-lg text-[#71717A] hover:text-[#09090B] transition-colors"
                    title="Export JSON"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${sheet.name}"? This cannot be undone.`)) {
                        onDelete(sheet.id);
                      }
                    }}
                    className="p-1.5 hover:bg-[#FEE2E2] rounded-lg text-[#71717A] hover:text-[#DC2626] transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {rateSheets.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#F4F4F5] rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[#71717A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[#09090B] mb-1">No Rate Sheets</h3>
            <p className="text-sm text-[#71717A] mb-4">Create your first investor program to get started.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#007FFF] hover:bg-[#0066CC] text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              New Program
            </button>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="p-4 border-b border-[#E4E4E7]">
              <h3 className="text-lg font-semibold text-[#09090B]">New Rate Sheet</h3>
              <p className="text-sm text-[#71717A]">Create a new investor program</p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#71717A] mb-1.5">Program Name</label>
                <input
                  type="text"
                  value={newSheetName}
                  onChange={(e) => setNewSheetName(e.target.value)}
                  placeholder="e.g., Investor DSCR Premier"
                  className="w-full px-3 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007FFF] focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#71717A] mb-1.5">Program Type</label>
                <select
                  value={newSheetType}
                  onChange={(e) => setNewSheetType(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E4E4E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007FFF] focus:border-transparent"
                >
                  {PROGRAM_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-[#E4E4E7] flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewSheetName('');
                }}
                className="px-4 py-2 text-sm font-medium text-[#71717A] hover:text-[#09090B] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!newSheetName.trim()}
                className="px-4 py-2 bg-[#007FFF] hover:bg-[#0066CC] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Create Program
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RateSheetList;
