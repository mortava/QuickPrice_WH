export const SmartToggle = ({ label, checked, onChange, disabled }) => (
  <div className={`flex items-center justify-between p-3 border rounded-lg ${disabled ? 'opacity-50' : 'bg-white'}`}>
    <span className="font-bold text-gray-700">{label}</span>
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative w-14 h-8 rounded-full transition-colors duration-200 ${checked ? 'bg-black' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-6' : ''}`} />
    </button>
  </div>
);

export default SmartToggle;
