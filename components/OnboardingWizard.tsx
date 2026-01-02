
import React, { useState, useEffect, useRef } from 'react';
import { userService } from '../services/userService';
import { User, UserPreferences, LocationConfig } from '../types/models';
import { DAYS_OF_WEEK, ModuleId, BackgroundTheme } from '../constants';

interface OnboardingWizardProps {
  onComplete: (user: User) => void;
}

type Step = 'welcome' | 'auth' | 'setup-location' | 'setup-schedule' | 'setup-vacation' | 'setup-modules' | 'setup-mode' | 'setup-theme';

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>('welcome');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'guest'>('login');
  
  // Auth Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Temporary User State (during setup)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Preference States
  const [locationConfig, setLocationConfig] = useState<LocationConfig>({ type: 'gps', city: '' });
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'success' | 'error'>('idle');
  const [manualCity, setManualCity] = useState('');
  
  const [startTimeStr, setStartTimeStr] = useState("09:00");
  const [endTimeStr, setEndTimeStr] = useState("17:00");
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [vacationDate, setVacationDate] = useState(new Date().toISOString().split('T')[0]);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [selectedBgTheme, setSelectedBgTheme] = useState<BackgroundTheme>('minimal');
  
  // Module selection state
  const [visibleModules, setVisibleModules] = useState<ModuleId[]>(['week', 'tracker', 'ai', 'maps', 'month', 'countdown']);

  const usernameRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'auth') setTimeout(() => usernameRef.current?.focus(), 100);
    if (step === 'setup-schedule') setTimeout(() => startTimeRef.current?.focus(), 100);
    if (step === 'setup-vacation') setTimeout(() => dateRef.current?.focus(), 100);
  }, [step]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        let res;
        if (authMode === 'guest') {
            res = await userService.register('Invitado', undefined, true);
        } else if (authMode === 'login') {
            res = await userService.login(username, password);
        } else {
            res = await userService.register(username, password);
        }

        setIsLoading(false);

        if (res.success && res.user) {
            setCurrentUser(res.user);
            if (authMode === 'login') {
                onComplete(res.user);
            } else {
                setStep('setup-location');
            }
        } else {
            setError(res.message || 'Error desconocido');
        }
    } catch (err) {
        setIsLoading(false);
        setError('Error de conexión.');
    }
  };

  const detectLocation = () => {
      setLocationStatus('locating');
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              (position) => {
                  setLocationConfig({
                      type: 'gps',
                      lat: position.coords.latitude,
                      lon: position.coords.longitude,
                      city: 'Ubicación Actual'
                  });
                  setLocationStatus('success');
              },
              (err) => {
                  console.error(err);
                  setLocationStatus('error');
                  setError('No pudimos acceder al GPS. Ingresa tu ciudad manualmente.');
              }
          );
      } else {
          setLocationStatus('error');
          setError('Navegador no soporta geolocalización.');
      }
  };

  const saveAndNext = async (nextStep: Step | 'finish') => {
    if (!currentUser) return;
    setIsLoading(true);

    const updates: Partial<UserPreferences> = {};
    
    if (step === 'setup-location') {
        const finalCity = locationConfig.type === 'gps' ? locationConfig.city : manualCity;
        if (locationConfig.type === 'manual' && !finalCity) {
            setError('Por favor ingresa una ciudad.');
            setIsLoading(false);
            return;
        }
        updates.locationConfig = { ...locationConfig, city: finalCity };
    } else if (step === 'setup-schedule') {
      const startHour = parseInt(startTimeStr.split(':')[0]);
      const endHour = parseInt(endTimeStr.split(':')[0]);
      if (isNaN(startHour) || isNaN(endHour) || startHour >= endHour) {
          setError('El horario de fin debe ser posterior al de inicio.');
          setIsLoading(false);
          return;
      }
      setError('');
      updates.workConfig = { ...currentUser.preferences.workConfig, startHour, endHour, workDays };
    } else if (step === 'setup-vacation') {
        if (!vacationDate) {
            setError('Selecciona una fecha.');
            setIsLoading(false);
            return;
        }
        updates.vacationDate = vacationDate + "T00:00:00";
    } else if (step === 'setup-modules') {
        const allModules: ModuleId[] = ['week', 'tracker', 'month', 'year', 'countdown', 'ai', 'nano', 'maps'];
        const minimized = allModules.filter(m => !visibleModules.includes(m));
        updates.uiConfig = { ...currentUser.preferences.uiConfig, minimized: minimized };
    } else if (step === 'setup-mode') {
        updates.theme = themeMode;
    } else if (step === 'setup-theme') {
        updates.workConfig = { ...currentUser.preferences.workConfig, backgroundTheme: selectedBgTheme };
    }

    const updatedUser = await userService.updatePreferences(currentUser.id, updates);
    if (updatedUser) setCurrentUser(updatedUser);

    setIsLoading(false);
    if (nextStep === 'finish' && updatedUser) {
        onComplete(updatedUser);
    } else {
        setStep(nextStep as Step);
    }
  };

  const toggleDay = (d: number) => {
    setWorkDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const toggleModuleVisibility = (id: ModuleId) => {
      setVisibleModules(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // --- UI COMPONENTS ---

  const BackButton = ({ target }: { target: Step }) => (
      <button 
        onClick={() => { setError(''); setStep(target); }}
        className="absolute top-8 left-8 text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-wider z-50 group"
      >
          <span className="transform group-hover:-translate-x-1 transition-transform">←</span> Atrás
      </button>
  );

  const SplitContainer = ({ 
    stepNumber, title, subtitle, children, onNext, prevStep, isValid = true
  }: { 
    stepNumber: number, title: string, subtitle: string, children: React.ReactNode, onNext: () => void, prevStep?: Step, isValid?: boolean
  }) => (
      <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col lg:flex-row">
          {prevStep && <BackButton target={prevStep} />}
          <div className="lg:w-[40%] bg-[#0f172a] p-12 lg:p-16 text-white flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
              <div className="relative z-10">
                  <div className="mb-8 inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-lg ring-4 ring-indigo-900">
                      {stepNumber}
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-6 leading-tight">{title}</h1>
                  <p className="text-lg text-slate-400 leading-relaxed max-w-md">{subtitle}</p>
              </div>
          </div>
          <div className="lg:w-[60%] flex flex-col items-center justify-center p-8 lg:p-16 bg-white overflow-y-auto">
              <div className="w-full max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                  {children}
                  {error && <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium rounded-r-lg">⚠️ {error}</div>}
                  <div className="pt-8 flex justify-end border-t border-slate-100">
                      <button onClick={onNext} disabled={!isValid || isLoading} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center gap-2">
                          {isLoading ? 'Guardando...' : (step === 'setup-theme' ? 'Finalizar' : 'Continuar')} <span>→</span>
                      </button>
                  </div>
              </div>
          </div>
      </div>
  );

  // --- STEPS ---

  if (step === 'welcome') {
      return (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col relative overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-slate-900 to-slate-950 z-0"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/30 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] animation-delay-2000"></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="mb-8 animate-in zoom-in-50 duration-700 delay-100">
                    <span className="inline-block py-1 px-3 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md mb-6">
                        Productividad Aumentada
                    </span>
                    <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter leading-none mb-6 drop-shadow-2xl">
                        TIEM<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">PON'T</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-lg mx-auto leading-relaxed">
                        Gestiona tu tiempo, monitorea tu entorno y visualiza tu progreso hacia la libertad.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mt-8 animate-in slide-in-from-bottom-10 duration-700 delay-300">
                    <button 
                        onClick={() => { setAuthMode('login'); setStep('auth'); }} 
                        className="group relative p-8 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-3xl transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">👋</div>
                        <div className="text-center">
                            <h3 className="text-white font-bold text-lg">Iniciar Sesión</h3>
                            <p className="text-slate-500 text-xs mt-1">Accede a tu cuenta</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => { setAuthMode('register'); setStep('auth'); }} 
                        className="group relative p-8 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/20 rounded-3xl transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/20 flex flex-col items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">✨</div>
                        <div className="text-center">
                            <h3 className="text-white font-bold text-lg">Crear Cuenta</h3>
                            <p className="text-indigo-200 text-xs mt-1">Empieza desde cero</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => { setAuthMode('guest'); handleAuth({ preventDefault: () => {} } as any); }} 
                        className="group relative p-8 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-3xl transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-slate-700/50 text-slate-300 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🕵️</div>
                        <div className="text-center">
                            <h3 className="text-white font-bold text-lg">Invitado</h3>
                            <p className="text-slate-500 text-xs mt-1">Prueba sin registro</p>
                        </div>
                    </button>
                </div>
            </div>
            
            <div className="absolute bottom-0 w-full p-6 text-center">
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">v3.2 • Powered by Gemini AI</p>
            </div>
        </div>
      );
  }

  if (step === 'auth') {
      return (
        <div className="fixed inset-0 z-[100] bg-slate-50 flex items-center justify-center p-4">
            <BackButton target="welcome" />
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full relative animate-in slide-in-from-bottom-8 duration-300 border border-slate-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">🔐</div>
                    <h2 className="text-2xl font-black text-slate-900">{authMode === 'login' ? 'Bienvenido de nuevo' : 'Crear Perfil'}</h2>
                    <p className="text-slate-500 text-sm mt-1">Tus datos se guardan localmente.</p>
                </div>
                
                <form onSubmit={handleAuth} className="space-y-5">
                    <input 
                        ref={usernameRef} type="text" value={username} onChange={e => setUsername(e.target.value)} 
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-800 transition-all placeholder:text-slate-300"
                        placeholder="Usuario" required 
                    />
                    <input 
                        type="password" value={password} onChange={e => setPassword(e.target.value)} 
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-800 transition-all placeholder:text-slate-300"
                        placeholder="Contraseña" required 
                    />
                    
                    {error && <div className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg">{error}</div>}
                    
                    <button type="submit" disabled={isLoading} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-800 hover:-translate-y-1 transition-all disabled:opacity-50">
                        {isLoading ? '...' : (authMode === 'login' ? 'Entrar' : 'Registrar')}
                    </button>
                </form>
            </div>
        </div>
      );
  }

  if (step === 'setup-location') {
      return (
          <SplitContainer 
            stepNumber={1} 
            title="Tu Ubicación" 
            subtitle="¿Dónde te encuentras? Esto activará el mapa y el clima local."
            onNext={() => saveAndNext('setup-schedule')}
            isValid={locationStatus === 'success' || manualCity.length > 0}
            prevStep="welcome"
          >
              <div className="space-y-6">
                  <button 
                    onClick={detectLocation}
                    disabled={locationStatus === 'success' || locationStatus === 'locating'}
                    className={`w-full p-6 rounded-2xl border-2 flex items-center gap-4 transition-all group ${locationStatus === 'success' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-slate-200 hover:border-indigo-500 hover:shadow-lg'}`}
                  >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${locationStatus === 'success' ? 'bg-green-100' : 'bg-indigo-50 text-indigo-600'}`}>
                          {locationStatus === 'locating' ? '⏳' : (locationStatus === 'success' ? '✅' : '📍')}
                      </div>
                      <div className="text-left flex-1">
                          <h3 className="font-bold text-lg">Usar GPS Automático</h3>
                          <p className="text-xs text-slate-500">
                              {locationStatus === 'success' ? 'Ubicación detectada correctamente.' : (locationStatus === 'locating' ? 'Detectando...' : 'Recomendado para mapas exactos.')}
                          </p>
                      </div>
                  </button>

                  <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-slate-200"></div>
                      <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">O Manualmente</span>
                      <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <div className={`transition-opacity ${locationStatus === 'success' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Ingresa tu Ciudad</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Buenos Aires" 
                        value={manualCity}
                        onChange={(e) => {
                            setManualCity(e.target.value);
                            setLocationConfig({ type: 'manual', city: e.target.value });
                            setLocationStatus('idle'); 
                        }}
                        className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-bold text-lg text-slate-800 transition-all placeholder:text-slate-300"
                      />
                  </div>
              </div>
          </SplitContainer>
      );
  }

  if (step === 'setup-schedule') {
      return (
          <SplitContainer stepNumber={2} title="Jornada" subtitle="Horario laboral." onNext={() => saveAndNext('setup-vacation')} prevStep="setup-location">
              <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entrada</label>
                      <input ref={startTimeRef} type="time" value={startTimeStr} onChange={e => setStartTimeStr(e.target.value)} className="w-full p-4 text-center bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-2xl text-slate-800 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Salida</label>
                      <input type="time" value={endTimeStr} onChange={e => setEndTimeStr(e.target.value)} className="w-full p-4 text-center bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-2xl text-slate-800 outline-none transition-all" />
                  </div>
              </div>
              <div className="space-y-4 pt-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">Días Laborales</label>
                  <div className="flex flex-wrap gap-3 justify-center">
                      {DAYS_OF_WEEK.map((day, idx) => (
                          <div key={day} tabIndex={0} role="button" onClick={() => toggleDay(idx)}
                            className={`w-12 h-14 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none border-2 outline-none focus:ring-4 focus:ring-indigo-100 ${workDays.includes(idx) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg translate-y-[-2px]' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}>
                              <span className="text-[10px] font-bold uppercase">{day.substring(0, 1)}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </SplitContainer>
      );
  }

  if (step === 'setup-vacation') {
      return (
          <SplitContainer stepNumber={3} title="Vacaciones" subtitle="Próximo descanso." onNext={() => saveAndNext('setup-modules')} prevStep="setup-schedule">
              <div className="py-8 text-center">
                  <div className="mb-6 text-6xl animate-bounce">✈️</div>
                  <input ref={dateRef} type="date" value={vacationDate} onChange={e => setVacationDate(e.target.value)} className="w-full p-6 text-center bg-slate-50 border-2 border-slate-200 rounded-3xl font-black text-2xl text-slate-800 outline-none focus:border-indigo-500 transition-all" />
              </div>
          </SplitContainer>
      );
  }

  if (step === 'setup-modules') {
      const allModules: {id: ModuleId, label: string, desc: string, icon: string}[] = [
          { id: 'maps', label: 'Mapa de Salida', desc: 'Locales abiertos post-trabajo.', icon: '🗺️' },
          { id: 'week', label: 'Resumen Semanal', desc: 'Progreso de la semana.', icon: '📅' },
          { id: 'tracker', label: 'Rastreador', desc: 'Pomodoro y hábitos.', icon: '⏱️' },
          { id: 'ai', label: 'Chatbot IA', desc: 'Asistente Gemini.', icon: '🤖' },
          { id: 'nano', label: 'Nano Studio', desc: 'Generador de imágenes.', icon: '🎨' },
          { id: 'countdown', label: 'Cuenta Regresiva', desc: 'Días para vacaciones.', icon: '🌴' }
      ];

      return (
          <SplitContainer stepNumber={4} title="Tu Espacio" subtitle="Elige qué ver. Lo desmarcado iniciará minimizado." onNext={() => saveAndNext('setup-mode')} prevStep="setup-vacation">
              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2">
                  {allModules.map(mod => (
                      <button 
                        key={mod.id} 
                        onClick={() => toggleModuleVisibility(mod.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between group ${visibleModules.includes(mod.id) ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                      >
                          <div className="flex items-center gap-3">
                              <span className="text-2xl">{mod.icon}</span>
                              <div>
                                  <h4 className={`font-bold text-sm ${visibleModules.includes(mod.id) ? 'text-indigo-700' : 'text-slate-500'}`}>{mod.label}</h4>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{mod.desc}</p>
                              </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${visibleModules.includes(mod.id) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-200'}`}>
                              {visibleModules.includes(mod.id) && <span className="text-white text-xs">✓</span>}
                          </div>
                      </button>
                  ))}
              </div>
          </SplitContainer>
      );
  }

  if (step === 'setup-mode') {
      return (
          <SplitContainer stepNumber={5} title="Iluminación" subtitle="Elige el ambiente." onNext={() => saveAndNext('setup-theme')} prevStep="setup-modules">
              <div className="grid grid-cols-2 gap-6 py-4">
                  <button onClick={() => setThemeMode('light')} className={`p-8 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 group ${themeMode === 'light' ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">☀️</div>
                      <span className={`font-black uppercase tracking-widest text-sm ${themeMode === 'light' ? 'text-indigo-700' : 'text-slate-400'}`}>Claro</span>
                  </button>
                  <button onClick={() => setThemeMode('dark')} className={`p-8 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 group ${themeMode === 'dark' ? 'border-slate-700 bg-slate-800 ring-4 ring-slate-700/20' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div className="w-16 h-16 bg-slate-900 rounded-full shadow-lg flex items-center justify-center text-3xl group-hover:scale-110 transition-transform text-white">🌙</div>
                      <span className={`font-black uppercase tracking-widest text-sm ${themeMode === 'dark' ? 'text-white' : 'text-slate-400'}`}>Oscuro</span>
                  </button>
              </div>
          </SplitContainer>
      );
  }

  if (step === 'setup-theme') {
      return (
          <SplitContainer stepNumber={6} title="Estilo" subtitle="El toque final." onNext={() => saveAndNext('finish')} prevStep="setup-mode">
              <div className="grid grid-cols-3 gap-4">
                  {[
                      { id: 'minimal', label: 'Minimal', color: 'bg-slate-100' },
                      { id: 'dynamic', label: 'Dinámico', color: 'bg-gradient-to-br from-blue-100 to-indigo-100' },
                      { id: 'geometric', label: 'Geo', color: 'bg-[url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIi8+CjxwYXRoIGQ9Ik0wIDBMODIDOFpNOCAwTDAgOFoiIHN0cm9rZT0iI2U1ZTdlYiIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==")]' }
                  ].map(t => (
                      <button key={t.id} onClick={() => setSelectedBgTheme(t.id as BackgroundTheme)}
                        className={`h-20 rounded-2xl border-2 transition-all overflow-hidden relative ${selectedBgTheme === t.id ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'}`}>
                          <div className={`absolute inset-0 ${t.color} opacity-50`}></div>
                          <span className="relative z-10 text-[10px] font-black uppercase text-slate-500 bg-white/80 px-2 py-1 rounded-full">{t.label}</span>
                      </button>
                  ))}
              </div>
          </SplitContainer>
      );
  }

  return null;
};

export default OnboardingWizard;
