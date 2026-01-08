"use client";

export const SmartToggle = ({ label, checked, onChange, disabled }) => (
  <div className={`flex items-center justify-between py-2.5 ${disabled ? 'opacity-50' : ''}`}>
    <span className="text-[13px] font-medium text-[#09090B]">{label}</span>
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`
        relative w-11 h-6 rounded-full transition-colors duration-200
        ${checked ? 'bg-[#007FFF]' : 'bg-[#E4E4E7]'}
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow-sm
          transition-transform duration-200
          ${checked ? 'translate-x-5' : ''}
        `}
      />
    </button>
  </div>
);

export default SmartToggle;
