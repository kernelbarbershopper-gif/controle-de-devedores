import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, BookOpen, AlertCircle } from 'lucide-react';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm w-full max-w-sm overflow-hidden">
        <div className="px-6 py-8 text-center space-y-4">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-md shadow-indigo-200 inline-block">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Controle de Devedores</h1>
            <p className="text-xs text-slate-400 mt-0.5">Faça login para continuar</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="px-6 pb-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>{loading ? 'Entrando...' : 'Entrar'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
