import React, { useState, useEffect, useRef } from 'react';
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
import RestTracker from './components/RestTracker';

const App: React.FC = () => {
  const [now, setNow] = useState<Date>(getCordobaTime());
  const [workConfig, setWorkConfig] = useState<WorkConfig>(DEFAULT_WORK_CONFIG);
  const [uiConfig, setUIConfig] = useState<UIConfig>(DEFAULT_UI_CONFIG);
  const [vacationDate, setVacationDate] = useState<Date>(new Date(VACATION_DATE_STR));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Edit Mode State
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ id: ModuleId, sourceCol: 'left' | 'right' } | null>(null);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  // Load Config
  useEffect(() => {
    const savedConfig = localStorage.getItem('app_work_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (!parsed.backgroundTheme) parsed.backgroundTheme = 'minimal';
        setWorkConfig(parsed);
      } catch (e) { console.error("Error config"); }
    }

    const savedUI = localStorage.getItem('app_ui_config');
    if (savedUI) {
      try {
        const parsedUI = JSON.parse(savedUI);
        // Ensure sizes exist for backward compatibility
        if (!parsedUI.sizes) parsedUI.sizes = DEFAULT_UI_CONFIG.sizes;
        setUIConfig(parsedUI);
      } catch (e) { console.error("Error UI config"); }
    }

    const savedVacation = localStorage.getItem('app_vacation_date');
    if (savedVacation) setVacationDate(new Date(savedVacation));
  }, []);

  // Save Config on Change
  useEffect(() => {
    if (!isEditMode) { 
        localStorage.setItem('app_ui_config', JSON.stringify(uiConfig));
    }
  }, [uiConfig, isEditMode]);

  useEffect(() => {
     // Persist work config when it changes (e.g. background changes)
     localStorage.setItem('app_work_config', JSON.stringify(workConfig));
  }, [workConfig]);

  // Weather Logic
  const handleLoadWeather = async () => {
    setLoadingWeather(true);
    const data = await fetchWeather(undefined, undefined, workConfig);
    setWeather(data);
    setLoadingWeather(false);
  };

  useEffect(() => {
    handleLoadWeather();
    const interval = setInterval(handleLoadWeather, 1000 * 60 * 15);
    return () => clearInterval(interval);
  }, [workConfig]);

  const handleSaveSettings = (newConfig: WorkConfig, newVacationDate: Date, newUIConfig: UIConfig) => {
    setWorkConfig(newConfig);
    setVacationDate(newVacationDate);
    setUIConfig(newUIConfig);
    localStorage.setItem('app_work_config', JSON.stringify(newConfig));
    localStorage.setItem('app_vacation_date', newVacationDate.toISOString());
    setIsSettingsOpen(false);
  };

  const handleSetCustomBackground = (imageData: string) => {
      setWorkConfig(prev => ({
          ...prev,
          backgroundTheme: 'custom',
          customBackgroundImage: imageData
      }));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(getCordobaTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Date/Status Logic ---
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
    
    let statusText = "";
    let percentage = 0;
    
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

  // --- Drag & Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, id: ModuleId, col: 'left' | 'right') => {
    if (!isEditMode) return;
    setDraggedItem({ id, sourceCol: col });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isEditMode) return;
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
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

    if (sourceCol === targetCol) {
        sourceList.splice(sourceIndex, 1);
        if (targetId) {
            const targetIndex = sourceList.indexOf(targetId);
            if (targetIndex !== -1) {
                sourceList.splice(targetIndex, 0, sourceId);
            } else {
                sourceList.push(sourceId);
            }
        } else {
            sourceList.push(sourceId);
        }
        
        if (sourceCol === 'left') newUI.leftColumn = sourceList;
        else newUI.rightColumn = sourceList;

    } else {
        sourceList.splice(sourceIndex, 1);
        if (targetId) {
            const targetIndex = targetList.indexOf(targetId);
             if (targetIndex !== -1) targetList.splice(targetIndex, 0, sourceId);
             else targetList.push(sourceId);
        } else {
            targetList.push(sourceId);
        }

        if (sourceCol === 'left') {
            newUI.leftColumn = sourceList;
            newUI.rightColumn = targetList;
        } else {
            newUI.rightColumn = sourceList;
            newUI.leftColumn = targetList;
        }
    }

    setUIConfig(newUI);
    setDraggedItem(null);
  };

  const toggleSize = (id: ModuleId) => {
    const current = uiConfig.sizes[id] || 'wide';
    setUIConfig({
        ...uiConfig,
        sizes: {
            ...uiConfig.sizes,
            [id]: current === 'normal' ? 'wide' : 'normal'
        }
    });
  };

  // --- Render Logic ---
  const renderBackground = () => {
      // Check for custom background first
      if (workConfig.backgroundTheme === 'custom' && workConfig.customBackgroundImage) {
          return (
              <div 
                className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-1000"
                style={{ backgroundImage: `url(${workConfig.customBackgroundImage})` }}
              >
                  {/* Overlay to ensure readability */}
                  <div className={`absolute inset-0 ${isRestMode ? 'bg-slate-900/70' : 'bg-white/60 backdrop-blur-[2px]'}`}></div>
              </div>
          );
      }

      switch(workConfig.backgroundTheme) {
          case 'geometric':
              return (
                  <div className={`fixed inset-0 z-0 opacity-[0.03] pointer-events-none transition-colors duration-1000 ${isRestMode ? 'bg-slate-900 invert' : 'bg-[#f0f2f5]'}`} 
                       style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
                  </div>
              );
          case 'dynamic':
              return (
                <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className={`absolute top-0 left-0 w-full h-full opacity-90 transition-colors duration-1000 ${isRestMode ? 'bg-slate-950' : 'bg-slate-200'}`}></div>
                    <div className={`absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob transition-colors duration-1000 ${isRestMode ? 'bg-purple-900' : 'bg-blue-300'}`}></div>
                    <div className={`absolute top-20 -right-40 w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-2000 transition-colors duration-1000 ${isRestMode ? 'bg-indigo-900' : 'bg-purple-300'}`}></div>
                    <div className={`absolute -bottom-40 left-1/3 w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-4000 transition-colors duration-1000 ${isRestMode ? 'bg-blue-900' : 'bg-pink-300'}`}></div>
                </div>
              );
          case 'minimal':
          default:
              return (
                  <div className={`fixed inset-0 z-0 pointer-events-none transition-colors duration-1000 ${isRestMode ? 'bg-[#0f172a]' : 'bg-[#f1f5f9]'}`}></div>
              );
      }
  };

  const renderModuleContent = (id: ModuleId) => {
    const title = uiConfig.titles[id];

    switch (id) {
      case 'week':
        return <PeriodCard title={title} startDate={weekStart} endDate={weekEnd} now={now} config={workConfig} isRestMode={isRestMode} showChart={true} icon={<span>📅</span>} />;
      case 'tracker':
        return <div className="h-full min-h-[400px]"><TrackerWidget title={title} isRestMode={isRestMode} /></div>;
      case 'month':
        return <PeriodCard title={title} startDate={monthStart} endDate={monthEnd} now={now} config={workConfig} isRestMode={isRestMode} showChart={true} icon={<span>🗓️</span>} />;
      case 'year':
        return <PeriodCard title={title} startDate={yearStart} endDate={yearEnd} now={now} config={workConfig} isRestMode={isRestMode} showChart={false} icon={<span>📆</span>} />;
      case 'countdown':
        return <Countdown targetDate={vacationDate} isRestMode={isRestMode} />;
      case 'ai':
        return <AIChatWidget title={title} workConfig={workConfig} dailyStats={dailyStats} now={now} vacationDate={vacationDate} weather={weather} isRestMode={isRestMode} />;
      case 'nano':
        return <NanoBananaWidget title={title} onSetBackground={handleSetCustomBackground} isRestMode={isRestMode} />;
      default:
        return null;
    }
  };

  const renderDraggableItem = (id: ModuleId, col: 'left' | 'right') => {
      // Determine Grid Span
      const size = uiConfig.sizes[id] || 'wide';
      // In Left Col, always full width relative to sidebar. In Right col, dynamic.
      const spanClass = col === 'left' ? 'w-full' : (size === 'wide' ? 'md:col-span-2' : 'md:col-span-1');
      
      return (
          <div 
            key={id}
            className={`relative group/drag ${spanClass} transition-all duration-300 ease-in-out`}
            draggable={isEditMode}
            onDragStart={(e) => handleDragStart(e, id, col)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, id, col)}
          >
              {/* Edit Mode Overlays */}
              {isEditMode && (
                  <div className="absolute -inset-2 border-2 border-dashed border-indigo-400/50 rounded-3xl z-50 pointer-events-none bg-indigo-50/10 backdrop-blur-[1px]"></div>
              )}
              
              {isEditMode && (
                  <div className="absolute top-2 right-2 z-[60] flex gap-2">
                       {/* Resize Button (Only in Grid/Right column) */}
                       {col === 'right' && (
                           <button 
                                onClick={(e) => { e.stopPropagation(); toggleSize(id); }}
                                className="w-8 h-8 rounded-full bg-white shadow-lg text-indigo-600 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                                title="Cambiar Tamaño"
                           >
                               ↔
                           </button>
                       )}
                       {/* Drag Handle Icon */}
                       <div className="w-8 h-8 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing">
                           ⠿
                       </div>
                  </div>
              )}

              {/* Content */}
              <div className={`${isEditMode ? 'opacity-90 pointer-events-none transform scale-[0.98]' : ''} transition-all`}>
                  {renderModuleContent(id)}
              </div>
          </div>
      );
  };

  return (
    <div className={`min-h-screen transition-colors duration-1000 font-sans selection:bg-indigo-200 pb-12 overflow-x-hidden ${isRestMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {renderBackground()}

      {/* Header */}
      <header className={`relative z-10 border-b border-white/10 backdrop-blur-md sticky top-0 shadow-sm z-50 transition-colors duration-1000 ${isRestMode ? 'bg-slate-900/80' : 'bg-white/80'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className={`font-black text-2xl px-4 py-2 rounded-xl transform -skew-x-6 shadow-xl transition-colors duration-1000 ${isRestMode ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white shadow-slate-900/20'}`}>
              <span className="transform skew-x-6 inline-block tracking-tighter">TIEMPON'T</span>
            </div>
            <div className={`hidden sm:block h-10 w-px ${isRestMode ? 'bg-slate-800' : 'bg-slate-300'}`}></div>
            <div>
               <p className={`text-[10px] font-bold uppercase tracking-widest ${isRestMode ? 'text-slate-500' : 'text-slate-500'}`}>
                {now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
               </p>
               <p className={`text-2xl font-mono font-bold tabular-nums leading-none ${isRestMode ? 'text-white' : 'text-slate-800'}`}>
                 {now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
               </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {isEditMode && (
                <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-black uppercase animate-pulse border border-indigo-200">
                    Modo Edición Activo
                </div>
            )}
            
            <WeatherWidget weather={weather} loading={loadingWeather} onRetry={handleLoadWeather} isRestMode={isRestMode} />
            
            {/* Edit Mode Toggle */}
            <button 
                onClick={() => setIsEditMode(!isEditMode)}
                className={`p-2 rounded-xl transition-all border shadow-sm ${isEditMode ? 'bg-indigo-600 text-white border-indigo-500 ring-2 ring-indigo-300' : (isRestMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700' : 'bg-white text-slate-600 hover:text-indigo-600 border-slate-200')}`}
                title="Editar Diseño"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
            </button>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2 rounded-xl transition-all ${isRestMode ? 'bg-slate-800 text-slate-400 hover:text-indigo-400 hover:bg-slate-700' : 'bg-white text-slate-600 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200 shadow-sm'}`}
              title="Configuración"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {isSettingsOpen && (
        <SettingsModal 
          config={workConfig} 
          uiConfig={uiConfig}
          currentVacationDate={vacationDate}
          onSave={handleSaveSettings} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}

      <main className="relative z-10 max-w-7xl mx-auto px-4 pt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {isRestMode ? (
          <RestTracker 
            now={now} 
            dayStartHour={todayStart}
            dayEndHour={todayEnd}
            config={workConfig} 
            isRestMode={isRestMode} 
          />
        ) : (
          <section className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] border border-white/50 p-8 flex flex-col justify-center gap-8 transform transition-all hover:scale-[1.005]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-2xl shadow-lg border transition-all duration-300 transform hover:scale-110 hover:rotate-3 cursor-pointer group ${dailyStats.percentage >= 100 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                      {dailyStats.percentage >= 100 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 transition-transform duration-300 group-hover:scale-110 group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                  </div>
                  <div>
                      <h2 className="text-3xl font-black text-slate-800 tracking-tight">Estado Actual</h2>
                      <div className="flex items-center gap-2">
                        <p className="text-lg text-slate-600 font-medium">{dailyStats.statusText}</p>
                        {(todayStart !== workConfig.startHour || todayEnd !== workConfig.endHour) && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                Horario Especial ({todayStart} - {todayEnd})
                            </span>
                        )}
                      </div>
                  </div>
              </div>
              <div className="text-right">
                  <span className="text-7xl font-black text-slate-800 tracking-tighter transition-all duration-300 hover:text-indigo-600 cursor-default">
                      {dailyStats.percentage.toFixed(0)}<span className="text-3xl text-slate-400 ml-1">%</span>
                  </span>
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-wider block -mt-1">Progreso del Día</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-8 overflow-hidden shadow-inner border border-slate-200/50 p-1">
              <div className={`h-full rounded-full bg-orange-500 transition-all duration-1000 ease-out shadow-sm`} style={{ width: `${dailyStats.percentage}%` }}></div>
            </div>
          </section>
        )}

        {/* Dynamic Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Left Column (Stack) */}
           <div 
             className={`space-y-6 lg:col-span-1 flex flex-col transition-all rounded-3xl ${isEditMode ? 'bg-white/30 border-2 border-dashed border-slate-300 p-4 min-h-[200px]' : ''}`}
             onDragOver={handleDragOver}
             onDrop={(e) => handleDrop(e, null, 'left')} // Drop on empty space
           >
               {uiConfig.leftColumn.length === 0 && isEditMode && (
                   <div className="h-full flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-widest">Columna Lateral Vacía</div>
               )}
               {uiConfig.leftColumn.map(id => renderDraggableItem(id, 'left'))}
           </div>

           {/* Right Column (Grid within grid) */}
           <div 
             className={`space-y-6 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 content-start transition-all rounded-3xl ${isEditMode ? 'bg-white/30 border-2 border-dashed border-slate-300 p-4 min-h-[200px]' : ''}`}
             onDragOver={handleDragOver}
             onDrop={(e) => handleDrop(e, null, 'right')} // Drop on empty space
            >
               {uiConfig.rightColumn.length === 0 && isEditMode && (
                   <div className="col-span-full h-32 flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-widest">Columna Principal Vacía</div>
               )}
               {uiConfig.rightColumn.map(id => renderDraggableItem(id, 'right'))}
           </div>
        </div>
        
        <footer className={`text-center text-sm py-8 font-medium ${isRestMode ? 'text-slate-600' : 'text-slate-500'}`}>
           <p>TIEMPON'T © 2025 - Gestiona tu existencia con precisión</p>
        </footer>
      </main>
    </div>
  );
};

export default App;