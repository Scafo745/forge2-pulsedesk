import React, { useState } from 'react';
import { Lock, Mail, Loader } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('admin@acme.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectDemoUser = (email) => {
    setEmail(email);
    setPassword('password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0e12] p-4 text-gray-200">
      <div className="absolute inset-0 bg-radial-gradient from-purple-900/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md bg-[#16171d] border border-gray-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500" />
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 mb-3">
            <span className="font-bold text-xl">P</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">PulseDesk</h2>
          <p className="text-gray-400 text-sm mt-1">Multi-Tenant Help-Desk SaaS</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                required
                className="w-full bg-[#1e2028] border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
                placeholder="you@acme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                required
                className="w-full bg-[#1e2028] border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-xl py-3 font-semibold transition-all shadow-lg shadow-purple-600/20 active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 border-t border-gray-800 pt-6">
          <p className="text-center text-xs font-semibold text-gray-400 mb-4">OR CHOOSE DEMO ROLE</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => selectDemoUser('admin@acme.com')}
              className="text-xs py-2 px-1 text-center bg-[#1e2028] hover:bg-[#272932] border border-gray-800 hover:border-purple-500/50 rounded-lg text-purple-400 font-medium transition-all"
            >
              Admin
            </button>
            <button
              onClick={() => selectDemoUser('agent1@acme.com')}
              className="text-xs py-2 px-1 text-center bg-[#1e2028] hover:bg-[#272932] border border-gray-800 hover:border-purple-500/50 rounded-lg text-blue-400 font-medium transition-all"
            >
              Agent
            </button>
            <button
              onClick={() => selectDemoUser('customer1@acme.com')}
              className="text-xs py-2 px-1 text-center bg-[#1e2028] hover:bg-[#272932] border border-gray-800 hover:border-purple-500/50 rounded-lg text-green-400 font-medium transition-all"
            >
              Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
