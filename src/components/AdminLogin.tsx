// صفحه ورود مدیر
import { useState } from 'react';
import { login } from '../store';
import Logo from './Logo';

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
}

export default function AdminLogin({ onLogin, onBack }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const auth = login(username, password);
      if (auth.isAuthenticated) {
        onLogin();
      } else {
        setError('نام کاربری یا رمز عبور اشتباه است');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-laziz-dark via-[#1a2744] to-[#0d1b30] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* لوگو */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" light />
          </div>
          <p className="text-white/60 text-sm">پنل مدیریت سیستم</p>
        </div>

        {/* فرم ورود */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-laziz-dark mb-6 text-center">
            ورود به پنل مدیریت
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                نام کاربری
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-laziz-red focus:outline-none transition-colors text-gray-800"
                placeholder="نام کاربری خود را وارد کنید"
                required
                aria-required="true"
                dir="ltr"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                رمز عبور
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-laziz-red focus:outline-none transition-colors text-gray-800"
                placeholder="رمز عبور خود را وارد کنید"
                required
                aria-required="true"
                dir="ltr"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center animate-fade-in" role="alert">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-laziz-red hover:bg-laziz-red-dark text-white font-bold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  در حال ورود...
                </span>
              ) : (
                'ورود'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400 mb-2">
              نام کاربری: admin | رمز عبور: admin123
            </p>
          </div>
        </div>

        {/* دکمه بازگشت */}
        <div className="text-center mt-6">
          <button
            onClick={onBack}
            className="text-white/60 hover:text-white text-sm transition-colors"
          >
            ← بازگشت به صفحه اصلی
          </button>
        </div>
      </div>
    </div>
  );
}
