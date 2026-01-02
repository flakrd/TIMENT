
import React, { useState, useEffect } from 'react';
import { 
  getCordobaTime, 
  isWorkDay, 
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  getStartOfYear,
  getEndOfYear,
  isHoliday,
  getDailyWorkHours
} from './utils/dateHelpers';
import { DEFAULT_WORK_CONFIG, WorkConfig, VACATION_DATE_STR, DEFAULT_UI_CONFIG, UIConfig, ModuleId } from './constants';
import { fetchWeather, WeatherData } from './utils/weatherService';
import Countdown from './components/Countdown';
import PeriodCard from './components/PeriodCard';
import WeatherWidget from './components/WeatherWidget';
import TrackerWidget from './components/TrackerWidget';
import SettingsModal from './components/SettingsModal';
import AIChatWidget from './components/AIChatWidget';
import NanoBananaWidget from './components/NanoBananaWidget';
import MapsWidget from './components/MapsWidget';
import RestTracker from './components/RestTracker';
import OnboardingWizard from './components/OnboardingWizard';
import { userService } from './services/userService';
import { User, LocationConfig } from './types/models';

type Theme = 'light' | 'dark' | 'system';

const App: React.FC = () => {
  // --- AUTH & USER STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOnboarding, setIsOnboarding] = useState(true);

  // --- APP STATE ---
  const [now, setNow] = useState<Date>(getCordobaTime());
  const [workConfig, setWorkConfig] = useState<WorkConfig>(DEFAULT_WORK_CONFIG);
  const [uiConfig, setUIConfig] = useState<UIConfig>(DEFAULT_UI_CONFIG);
  const [locationConfig, setLocationConfig] = useState<LocationConfig | undefined>(undefined);
  const [vacationDate, setVacationDate] = useState<Date>(new Date(VACATION_DATE_STR));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Theme State
  const [theme, setTheme] = useState<Theme>('system');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Edit Mode State
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ id: ModuleId, sourceCol: 'left' | 'right' } | null>(null);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  // --- INITIALIZATION ---
  useEffect(() => {
    const activeSession = userService.getCurrentSession();
    if (activeSession) {
      loadUserData(activeSession);
      setIsOnboarding(false);
    } else {
      setIsOnboarding(true);
    }
  }, []);

  const loadUserData = (user: User) => {
    setCurrentUser(user);
    setWorkConfig(user.preferences.workConfig);
    
    // MIGRATION: Ensure correct UI structure
    const safeUIConfig = { ...DEFAULT_UI_CONFIG, ...user.preferences.uiConfig };
    
    // Ensure maps exists
    const hasMaps = safeUIConfig.leftColumn.includes('maps') || safeUIConfig.rightColumn.includes('maps');
    if (!hasMaps) {
        safeUIConfig.rightColumn = ['maps', ...safeUIConfig.rightColumn];
        userService.updatePreferences(user.id, { uiConfig: safeUIConfig });
    }

    setUIConfig(safeUIConfig);
    setLocationConfig(user.preferences.locationConfig);
    setVacationDate(new Date(user.preferences.vacationDate));
    setTheme(user.preferences.theme);
  };

  const handleOnboardingComplete = (user: User) => {
    loadUserData(user);
    setIsOnboarding(false);
  };

  const handleLogout = () => {
      userService.logout();
      setCurrentUser(null);
      setIsOnboarding(true);
      setWorkConfig(DEFAULT_WORK_CONFIG);
      setUIConfig(DEFAULT_UI_CONFIG);
      setLocationConfig(undefined);
  };

  // --- THEME LOGIC ---
  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = (dark: boolean) => {
        setIsDarkMode(dark);
        if (dark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    };

    if (theme === 'system') {
        const systemPref = window.matchMedia('(prefers-color-scheme: dark)');
        applyTheme(systemPref.matches);
        const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
        systemPref.addEventListener('change', listener);
        return () => systemPref.removeEventListener('change', listener);
    } else {
        applyTheme(theme === 'dark');
    }
  }, [theme]);

  const toggleTheme = async () => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      if (currentUser) {
          await userService.updatePreferences(currentUser.id, { theme: newTheme });
      }
  };

  // --- SAVE SETTINGS ---
  const handleSaveSettings = async (newConfig: WorkConfig, newVacationDate: Date, newUIConfig: UIConfig, newLocationConfig: LocationConfig) => {
    setWorkConfig(newConfig);
    setVacationDate(newVacationDate);
    // Merge existing minimized state to prevent loss if settings modal didn't pass it fully
    setUIConfig(prev => ({ ...newUIConfig, minimized: prev.minimized })); 
    setLocationConfig(newLocationConfig);
    
    if (currentUser) {
        const updatedUser = await userService.updatePreferences(currentUser.id, {
            workConfig: newConfig,
            uiConfig: { ...newUIConfig, minimized: uiConfig.minimized },
            locationConfig: newLocationConfig,
            vacationDate: newVacationDate.toISOString()
        });
        if (updatedUser) setCurrentUser(updatedUser);
    }
    
    setIsSettingsOpen(false);
  };

  // --- WEATHER ---
  const handleLoadWeather = async () => {
    setLoadingWeather(true);
    const lat = locationConfig?.type === 'gps' ? locationConfig.lat : undefined;
    const lon = locationConfig?.type === 'gps' ? locationConfig.lon : undefined;
    
    const data = await fetchWeather(lat, lon, workConfig);
    setWeather(data);
    setLoadingWeather(false);
  };

  useEffect(() => {
    if (!isOnboarding) {
        handleLoadWeather();
        const interval = setInterval(handleLoadWeather, 1000 * 60 * 15);
        return () => clearInterval(interval);
    }
  }, [workConfig, locationConfig, isOnboarding]);

  const handleSetCustomBackground = (imageData: string) => {
      const newConfig = {
          ...workConfig,
          backgroundTheme: 'custom' as const,
          customBackgroundImage: imageData
      };
      setWorkConfig(newConfig);
      if (currentUser) {
          userService.updatePreferences(currentUser.id, { workConfig: newConfig });
      }
  };

  // --- TIME TICKER ---
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(getCordobaTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- CALCULATION LOGIC ---
  const currentHour = now.getHours();
  const { start: todayStart, end: todayEnd } = getDailyWorkHours(now, workConfig);
  const isWorkingDay = isWorkDay(now, workConfig);
  const isHolidayToday = isHoliday(now);
  const isOffHours = currentHour < todayStart || currentHour >= todayEnd;
  const isRestMode = !isWorkingDay || isHolidayToday || isOffHours;

  const getDailyProgress = () => {
    const currentMinute = now.getMinutes();
    const totalWorkMinutes = (todayEnd - todayStart) * 60;
    const elapsedMinutes = (currentHour * 60 + currentMinute) - (todayStart * 60);
    let percentage = 0;
    let statusText = "";
    
    if (!isRestMode) {
        percentage = (elapsedMinutes / totalWorkMinutes) * 100;
        statusText = "En plena Jornada";
    } else {
        percentage = 100;
        if (isHolidayToday) statusText = "Feriado";
        else if (!isWorkingDay) statusText = "Día Libre";
        else if (currentHour < todayStart) { statusText = "Pre-Jornada"; percentage = 0; }
        else statusText = "Descanso";
    }
    return { percentage, statusText };
  };

  const dailyStats = getDailyProgress();
  const weekStart = getStartOfWeek(now);
  const weekEnd = getEndOfWeek(now);
  const monthStart = getStartOfMonth(now);
  const monthEnd = getEndOfMonth(now);
  const yearStart = getStartOfYear(now);
  const yearEnd = getEndOfYear(now);

  const renderBackground = () => {
      if (workConfig.backgroundTheme === 'custom' && workConfig.customBackgroundImage) {
          return (
              <div className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: `url(${workConfig.customBackgroundImage})` }}>
                  <div className={`absolute inset-0 ${isRestMode || isDarkMode ? 'bg-slate-900/70' : 'bg-white/60 backdrop-blur-[2px]'}`}></div>
              </div>
          );
      }
      switch(workConfig.backgroundTheme) {
          case 'geometric':
              return <div className={`fixed inset-0 z-0 opacity-[0.03] pointer-events-none transition-colors duration-1000 ${isRestMode || isDarkMode ? 'bg-slate-900 invert' : 'bg-[#f0f2f5]'}`} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>;
          case 'dynamic':
              return (
                <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className={`absolute top-0 left-0 w-full h-full opacity-90 transition-colors duration-1000 ${isRestMode || isDarkMode ? 'bg-slate-950' : 'bg-slate-200'}`}></div>
                    <div className={`absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full filter blur-[100px] opacity-40 animate-blob transition-colors duration-1000 ${isRestMode || isDarkMode ? 'bg-purple-900' : 'bg-blue-300'}`}></div>
                    <div className={`absolute top-20 -right-40 w-[500px] h-[500px] rounded-full filter blur-[100px] opacity-40 animate-blob animation-delay-2000 transition-colors duration-1000 ${isRestMode || isDarkMode ? 'bg-indigo-900' : 'bg-purple-300'}`}></div>
                </div>
              );
          case 'minimal': default:
              return <div className={`fixed inset-0 z-0 pointer-events-none transition-colors duration-1000 ${isRestMode || isDarkMode ? 'bg-[#0f172a]' : 'bg-[#f1f5f9]'}`}></div>;
      }
  };

  const renderModuleContent = (id: ModuleId) => {
    const title = uiConfig.titles[id];

    switch (id) {
      case 'week': return <PeriodCard title={title} startDate={weekStart} endDate={weekEnd} now={now} config={workConfig} isRestMode={isRestMode} isDarkMode={isDarkMode} showChart={true} icon={<span>📅</span>} />;
      case 'tracker': return <div className="h-full min-h-[400px]"><TrackerWidget title={title} isRestMode={isRestMode} isDarkMode={isDarkMode} /></div>;
      case 'month': return <PeriodCard title={title} startDate={monthStart} endDate={monthEnd} now={now} config={workConfig} isRestMode={isRestMode} isDarkMode={isDarkMode} showChart={true} icon={<span>🗓️</span>} />;
      case 'year': return <PeriodCard title={title} startDate={yearStart} endDate={yearEnd} now={now} config={workConfig} isRestMode={isRestMode} isDarkMode={isDarkMode} showChart={false} icon={<span>📆</span>} />;
      case 'countdown': return <Countdown targetDate={vacationDate} isRestMode={isRestMode} isDarkMode={isDarkMode} />;
      case 'ai': return <AIChatWidget title={title} workConfig={workConfig} dailyStats={dailyStats} now={now} vacationDate={vacationDate} weather={weather} isRestMode={isRestMode} isDarkMode={isDarkMode} />;
      case 'nano': return <NanoBananaWidget title={title} onSetBackground={handleSetCustomBackground} isRestMode={isRestMode} isDarkMode={isDarkMode} />;
      case 'maps': return <MapsWidget title={title} workConfig={workConfig} locationConfig={locationConfig} isRestMode={isRestMode} isDarkMode={isDarkMode} />;
      default: return null;
    }
  };

  // Toggle Minimize
  const toggleMinimize = (id: ModuleId, e: React.MouseEvent) => {
      e.stopPropagation();
      const minimized = uiConfig.minimized || [];
      const isMin = minimized.includes(id);
      const newMin = isMin ? minimized.filter(i => i !== id) : [...minimized, id];
      const newConfig = { ...uiConfig, minimized: newMin };
      setUIConfig(newConfig);
      if(currentUser) userService.updatePreferences(currentUser.id, { uiConfig: newConfig });
  };

  // Drag & Drop
  const handleDragStart = (e: React.DragEvent, id: ModuleId, col: 'left' | 'right') => {
    if (!isEditMode) return;
    setDraggedItem({ id, sourceCol: col });
    e.dataTransfer.setData('text/plain', id);
  };
  const handleDrop = (e: React.DragEvent, targetId: ModuleId | null, targetCol: 'left' | 'right') => {
    if (!isEditMode || !draggedItem) return;
    e.preventDefault();
    const { id: sourceId, sourceCol } = draggedItem;
    const newUI = { ...uiConfig };
    const sourceList = sourceCol === 'left' ? [...newUI.leftColumn] : [...newUI.rightColumn];
    const targetList = targetCol === 'left' ? [...newUI.leftColumn] : [...newUI.rightColumn];
    const sourceIndex = sourceList.indexOf(sourceId);
    if (sourceIndex === -1) return;

    sourceList.splice(sourceIndex, 1);
    if (targetId) {
        const targetIndex = targetList.indexOf(targetId);
        if (targetIndex !== -1) targetList.splice(targetIndex, 0, sourceId);
        else targetList.push(sourceId);
    } else {
        targetList.push(sourceId);
    }
    
    if (sourceCol === 'left') newUI.leftColumn = sourceList; else newUI.rightColumn = sourceList;
    if (targetCol === 'left') newUI.leftColumn = targetList; else newUI.rightColumn = targetList;
    
    setUIConfig(newUI);
    setDraggedItem(null);
  };
  const toggleSize = (id: ModuleId) => {
    setUIConfig({ ...uiConfig, sizes: { ...uiConfig.sizes, [id]: uiConfig.sizes[id] === 'normal' ? 'wide' : 'normal' } });
  };

  const renderDraggableItem = (id: ModuleId, col: 'left' | 'right') => {
      const size = uiConfig.sizes[id] || 'wide';
      const isMinimized = uiConfig.minimized?.includes(id);
      const spanClass = col === 'left' ? 'w-full' : (size === 'wide' ? 'md:col-span-2' : 'md:col-span-1');
      
      return (
          <div 
            key={id}
            className={`relative group/drag ${spanClass} transition-all duration-300 ease-in-out`}
            draggable={isEditMode}
            onDragStart={(e) => handleDragStart(e, id, col)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, id, col)}
          >
              {isEditMode && (
                  <div className="absolute top-0 right-0 z-[60] flex gap-2 p-2">
                       {col === 'right' && (
                           <button onClick={(e) => { e.stopPropagation(); toggleSize(id); }} className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-lg text-indigo-600 flex items-center justify-center hover:scale-110">↔</button>
                       )}
                       <div className="w-8 h-8 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center cursor-grab">⠿</div>
                  </div>
              )}
              
              {/* Minimized Header */}
              {isMinimized && (
                 <div className={`p-4 rounded-xl border flex justify-between items-center ${isRestMode || isDarkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-white'}`}>
                     <span className={`font-bold text-sm ${isRestMode || isDarkMode ? 'text-white' : 'text-slate-700'}`}>{uiConfig.titles[id]}</span>
                     <button onClick={(e) => toggleMinimize(id, e)} className="text-xs font-bold text-indigo-500 uppercase">Mostrar</button>
                 </div>
              )}

              {/* Full Content */}
              <div className={`${isMinimized ? 'hidden' : 'block'} ${isEditMode ? 'opacity-80 scale-[0.98]' : ''}`}>
                  <div className="relative group">
                     {!isEditMode && (
                        <button 
                            onClick={(e) => toggleMinimize(id, e)} 
                            className="absolute top-4 right-4 z-20 w-6 h-6 rounded-full bg-black/10 hover:bg-black/20 text-black/50 hover:text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all"
                            title="Minimizar"
                        >
                            _
                        </button>
                     )}
                     {renderModuleContent(id)}
                  </div>
              </div>
          </div>
      );
  };

  // --- MAIN RENDER ---
  if (isOnboarding) return <OnboardingWizard onComplete={handleOnboardingComplete} />;

  return (
    <div className={`min-h-screen transition-colors duration-1000 font-sans pb-12 overflow-x-hidden ${isRestMode || isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      {renderBackground()}
      
      {/* Header */}
      <header className={`relative z-50 border-b backdrop-blur-md sticky top-0 shadow-sm transition-colors duration-1000 ${isRestMode || isDarkMode ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white/80 border-slate-200/50'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className={`font-black text-2xl px-4 py-2 rounded-xl transform -skew-x-6 shadow-xl ${isRestMode ? 'bg-indigo-600 text-white' : (isDarkMode ? 'bg-slate-800 text-white border border-slate-700' : 'bg-slate-900 text-white')}`}>
              <span className="transform skew-x-6 inline-block tracking-tighter">TIEMPON'T</span>
            </div>
            <div className={`hidden sm:block h-10 w-px ${isRestMode || isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
            <div>
               <p className={`text-[10px] font-bold uppercase tracking-widest ${isRestMode || isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
               <p className="flex items-center gap-2">
                   <span className={`text-2xl font-mono font-bold leading-none ${isRestMode || isDarkMode ? 'text-white' : 'text-slate-800'}`}>{now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                   {currentUser && <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">@{currentUser.username}</span>}
               </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isEditMode && <div className="hidden sm:block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-black uppercase animate-pulse border border-indigo-200">Edición Activa</div>}
            <WeatherWidget weather={weather} loading={loadingWeather} onRetry={handleLoadWeather} isRestMode={isRestMode} isDarkMode={isDarkMode} />
            <button onClick={toggleTheme} className={`p-2 rounded-xl transition-all border shadow-sm ${isRestMode || isDarkMode ? 'bg-slate-800 text-yellow-400 border-slate-700' : 'bg-white text-slate-400 hover:text-yellow-500 border-slate-200'}`}>{theme === 'light' ? '☀️' : '🌙'}</button>
            <button onClick={() => setIsEditMode(!isEditMode)} className={`p-2 rounded-xl transition-all border shadow-sm ${isEditMode ? 'bg-indigo-600 text-white border-indigo-500' : (isRestMode || isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-600 border-slate-200')}`}>✏️</button>
            <button onClick={() => setIsSettingsOpen(true)} className={`p-2 rounded-xl transition-all ${isRestMode || isDarkMode ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-white text-slate-600 border border-slate-200'}`}>⚙️</button>
            <button onClick={handleLogout} className={`p-2 rounded-xl transition-all ${isRestMode || isDarkMode ? 'bg-slate-800 text-red-400 border border-slate-700' : 'bg-white text-red-500 border border-slate-200'}`}>🚪</button>
          </div>
        </div>
      </header>

      {isSettingsOpen && currentUser && (
        <SettingsModal config={workConfig} uiConfig={uiConfig} locationConfig={locationConfig || { type: 'manual', city: '' }} currentVacationDate={vacationDate} onSave={handleSaveSettings} onClose={() => setIsSettingsOpen(false)} />
      )}

      <main className="relative z-10 max-w-7xl mx-auto px-4 pt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {isRestMode ? (
          <RestTracker now={now} dayStartHour={todayStart} dayEndHour={todayEnd} config={workConfig} isRestMode={isRestMode} />
        ) : (
          <section className={`backdrop-blur-xl rounded-[2rem] shadow-sm p-8 flex flex-col justify-center gap-8 ${isDarkMode ? 'bg-slate-800/80 border border-slate-700' : 'bg-white/90 border border-white/50'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-2xl shadow-lg border transition-all duration-300 transform hover:scale-110 ${dailyStats.percentage >= 100 ? 'bg-green-50 text-green-600 border-green-100' : (isDarkMode ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-slate-50 text-slate-600 border-slate-100')}`}>
                      <span className="text-3xl font-black">{dailyStats.percentage >= 100 ? '🎉' : '💼'}</span>
                  </div>
                  <div>
                      <h2 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Estado Actual</h2>
                      <div className="flex items-center gap-2">
                        <p className={`text-lg font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{dailyStats.statusText}</p>
                        {(todayStart !== workConfig.startHour || todayEnd !== workConfig.endHour) && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase">Horario Especial</span>}
                      </div>
                  </div>
              </div>
              <div className="text-right">
                  <span className={`text-7xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{dailyStats.percentage.toFixed(0)}<span className="text-3xl text-slate-500 ml-1">%</span></span>
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-wider block -mt-1">Progreso del Día</span>
              </div>
            </div>
            <div className={`w-full rounded-full h-8 overflow-hidden shadow-inner border p-1 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200/50'}`}>
              <div className="h-full rounded-full bg-orange-500 transition-all duration-1000 ease-out shadow-sm" style={{ width: `${dailyStats.percentage}%` }}></div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className={`space-y-6 lg:col-span-1 flex flex-col transition-all rounded-3xl ${isEditMode ? 'bg-white/10 border-2 border-dashed border-slate-400/50 p-4 min-h-[200px]' : ''}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, null, 'left')}>
               {uiConfig.leftColumn.map(id => renderDraggableItem(id, 'left'))}
           </div>
           <div className={`space-y-6 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 content-start transition-all rounded-3xl ${isEditMode ? 'bg-white/10 border-2 border-dashed border-slate-400/50 p-4 min-h-[200px]' : ''}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, null, 'right')}>
               {uiConfig.rightColumn.map(id => renderDraggableItem(id, 'right'))}
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;
