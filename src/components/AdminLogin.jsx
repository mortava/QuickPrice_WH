import { useState } from 'react';
import { useAdmin } from '../context/AdminContext';

export function AdminLogin({ onBack }) {
  const { login } = useAdmin();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const success = login(passcode);
      if (!success) {
        setError('Invalid passcode. Please try again.');
        setPasscode('');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-[#09090B] text-2xl font-bold">D</span>
          </div>
          <h1 className="text-white text-xl font-semibold">Admin Access</h1>
          <p className="text-[#71717A] text-sm mt-1">Enter passcode to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode"
              className="w-full px-4 py-3 bg-[#18181B] border border-[#27272A] rounded-lg text-white placeholder-[#71717A] focus:outline-none focus:border-[#007FFF] focus:ring-1 focus:ring-[#007FFF] transition-colors text-center text-lg tracking-widest"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-lg p-3">
              <p className="text-[#DC2626] text-sm text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!passcode || isLoading}
            className="w-full bg-[#007FFF] hover:bg-[#0066CC] text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verifying...
              </span>
            ) : (
              'Access Admin Panel'
            )}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full text-[#71717A] hover:text-white text-sm py-2 transition-colors"
          >
            ← Back to Pricing
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
