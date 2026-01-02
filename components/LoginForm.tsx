import React, { useState } from 'react';

interface LoginFormProps {
  onLogin: (credentials: { username: string; password: string }) => void;
  loading?: boolean;
  error?: string | null;
  isRestMode?: boolean;
  onClearError?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, loading = false, error = null, isRestMode = false, onClearError }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ username: username.trim(), password });
  };

  return (
    <div
      className={`w-full max-w-md rounded-3xl shadow-2xl border overflow-hidden backdrop-blur-xl transition-colors duration-700 ${
        isRestMode ? 'bg-slate-900/80 border-slate-700 text-slate-100' : 'bg-white/90 border-slate-200 text-slate-900'
      }`}
    >
      <div className={`px-6 py-4 text-xs font-bold uppercase tracking-[0.3em] ${isRestMode ? 'text-indigo-200' : 'text-indigo-700'}`}>
        Acceso Seguro
      </div>
      <div className={`px-6 py-8 space-y-6 ${isRestMode ? 'bg-slate-900/60' : 'bg-slate-50'}`}>
        <div>
          <p className="text-sm font-semibold text-indigo-500 uppercase tracking-widest">TIEMPON'T</p>
          <h1 className="text-3xl font-black leading-tight">Ingresá a tu tablero</h1>
          <p className={`text-sm mt-2 ${isRestMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Usá tu usuario y contraseña para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <span className="w-6 text-center">👤</span>
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                if (error) onClearError?.();
                setUsername(e.target.value);
              }}
              className={`w-full px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                isRestMode
                  ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
              placeholder="tu.usuario"
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <span className="w-6 text-center">🔒</span>
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  if (error) onClearError?.();
                  setPassword(e.target.value);
                }}
                className={`w-full px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                  isRestMode
                    ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                }`}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute inset-y-0 right-3 my-auto px-3 text-sm font-semibold rounded-xl transition ${
                  isRestMode
                    ? 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800'
                    : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
                }`}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm font-semibold" aria-live="polite">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-2xl font-black text-lg tracking-tight shadow-lg transition-transform disabled:opacity-70 disabled:cursor-not-allowed ${
              isRestMode
                ? 'bg-indigo-500 text-white hover:scale-[1.01]'
                : 'bg-indigo-600 text-white hover:scale-[1.01]'
            }`}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className={`text-xs font-semibold uppercase tracking-widest flex items-center gap-2 ${isRestMode ? 'text-slate-500' : 'text-slate-500'}`}>
          <span className="h-px flex-1 bg-current/30"></span>
          Seguridad básica
          <span className="h-px flex-1 bg-current/30"></span>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
