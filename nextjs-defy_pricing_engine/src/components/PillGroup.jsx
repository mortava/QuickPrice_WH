"use client";

export const PillGroup = ({ label, options, selected, onChange, disabledOptions = [] }) => (
  <div className="mb-4">
    {label && (
      <label className="label">{label}</label>
    )}
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const isSelected = selected === opt;
        const isDisabled = disabledOptions.includes(opt);

        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            disabled={isDisabled}
            className={`
              px-3 py-1.5 text-[13px] font-medium rounded-md border transition-all duration-150
              ${isSelected
                ? 'bg-[#09090B] text-white border-[#09090B]'
                : 'bg-white text-[#71717A] border-[#E4E4E7] hover:border-[#A1A1AA] hover:text-[#09090B]'
              }
              ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {opt}
          </button>
        );
      })}
    </div>
  </div>
);

export default PillGroup;
