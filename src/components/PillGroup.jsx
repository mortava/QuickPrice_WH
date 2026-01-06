export const PillGroup = ({ label, options, selected, onChange, disabledOptions = [] }) => (
  <div className="mb-4">
    {label && (
      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
        {label}
      </label>
    )}
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          disabled={disabledOptions.includes(opt)}
          className={`
            px-4 py-2 text-sm font-bold rounded-full border transition-all duration-200
            ${selected === opt
              ? 'bg-black text-white border-black shadow-lg scale-105'
              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
            }
            ${disabledOptions.includes(opt) ? 'opacity-30 cursor-not-allowed bg-gray-100' : ''}
          `}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

export default PillGroup;
