import React, { useState } from 'react';
import { Mail, Lock, Sparkles, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';

export const Login = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('dr.sharma@college.edu');
    setPassword('faculty1234');
    setError('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-navy-950 bg-grid-pattern relative">
      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-brand-500/25 mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Class<span className="text-brand-500">Pick</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            College Faculty Authentication Portal
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
              Faculty Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                id="login-email"
                placeholder="faculty@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                id="login-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            id="login-submit-btn"
            className="w-full py-3 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? 'Signing in...' : 'Sign In to Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Credentials Quick-Fill Pill */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            type="button"
            onClick={handleFillDemo}
            id="fill-demo-credentials-btn"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 hover:bg-brand-100 dark:hover:bg-brand-900/50 border border-brand-200 dark:border-brand-900/60 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Fill Demo Faculty Credentials</span>
          </button>
          <p className="text-[11px] text-slate-400 mt-1">
            dr.sharma@college.edu / faculty1234
          </p>
        </div>

        {/* Switch to Register link */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6 font-medium">
          New faculty member?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-brand-600 dark:text-brand-400 font-bold hover:underline"
          >
            Create an Account
          </button>
        </p>
      </div>
    </div>
  );
};
