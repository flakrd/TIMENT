import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  getCordobaTime, 
  isWorkDay, 
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  getStartOfYear,
  getEndOfYear,
  isHoliday
} from './utils/dateHelpers';
import { DEFAULT_WORK_CONFIG, WorkConfig, VACATION_DATE_STR } from './constants';
import { fetchWeather, WeatherData } from './utils/weatherService';
import Countdown from './components/Countdown';
import PeriodCard from './components/PeriodCard';
import WeatherWidget from './components/WeatherWidget';
import TrackerWidget from './components/TrackerWidget';
import SettingsModal from './components/SettingsModal';
import AIChatWidget from './components/AIChatWidget';

const App: React.FC = () => {
  const [now, setNow] = useState<Date>(getCordobaTime());
  const [workConfig, setWorkConfig] = useState<WorkConfig>(DEFAULT_WORK_CONFIG);
  const [vacationDate, setVacationDate] = useState<Date>(new Date(VACATION_DATE_STR));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Shared Weather State
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('app_work_config');
    if (savedConfig) {
      try {
        setWorkConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error("Failed to parse saved config");
      }
    }

    const savedVacation = localStorage.getItem('app_vacation_date');
    if (savedVacation) {
        setVacationDate(new Date(savedVacation));
    }
  }, []);

  // Weather Fetching Logic
  const handleLoadWeather = useCallback(async () => {
    setLoadingWeather(true);

    try {
      const data = await fetchWeather(undefined, undefined, workConfig);
      setWeather(data);
    } catch (error) {
      console.error('Error al cargar el clima', error);
      setWeather(null);
    } finally {
      setLoadingWeather(false);
    }
  }, [workConfig]);

  useEffect(() => {
    handleLoadWeather();
    const interval = setInterval(handleLoadWeather, 1000 * 60 * 15); // Update every 15 mins
    return () => clearInterval(interval);
  }, [handleLoadWeather]);

  // Save settings
  const handleSaveSettings = (newConfig: WorkConfig, newVacationDate: Date) => {
    setWorkConfig(newConfig);
    setVacationDate(newVacationDate);
    
    localStorage.setItem('app_work_config', JSON.stringify(newConfig));
    localStorage.setItem('app_vacation_date', newVacationDate.toISOString());
    
    setIsSettingsOpen(false);
  };

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(getCordobaTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Daily Progress Logic
  const dailyStats = useMemo(() => {
    const isWorkingDay = isWorkDay(now, workConfig);
    const isHolidayToday = isHoliday(now);

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const start = new Date(now);
    start.setHours(workConfig.startHour, 0, 0, 0);

    const end = new Date(now);
    end.setHours(workConfig.endHour, 0, 0, 0);

    const totalWorkMinutes = Math.max((workConfig.endHour - workConfig.startHour) * 60, 1);
    const elapsedMinutes = (currentHour * 60 + currentMinute) - (workConfig.startHour * 60);

    let statusText = "";
    let percentage = 0;
    let colorClass = "bg-gray-400";

    const isInsideWorkHours = now >= start && now <= end;

    if (isInsideWorkHours) {
        percentage = (elapsedMinutes / totalWorkMinutes) * 100;
        colorClass = "bg-orange-500";

        if (isHolidayToday) {
            statusText = "Feriado (Horario de Oficina)";
        } else if (!isWorkingDay) {
            statusText = "Día Libre (Horario de Oficina)";
        } else {
            statusText = "En plena Jornada Laboral.";
        }
    } else {
        if (isHolidayToday) {
            statusText = "¡Es Feriado! Disfruta tu libertad.";
            percentage = 100;
            colorClass = "bg-purple-500";
        } else if (!isWorkingDay) {
            statusText = "Día Libre. Relájate.";
            percentage = 100;
            colorClass = "bg-emerald-500";
        } else if (now < start) {
            statusText = "Pre-Jornada. Café y preparación.";
            percentage = 0;
            colorClass = "bg-amber-400";
        } else if (now > end) {
            statusText = "Jornada Finalizada. Tiempo libre ganado.";
            percentage = 100;
            colorClass = "bg-emerald-500";
        }
    }

    return {
      percentage: Math.min(Math.max(percentage, 0), 100),
      statusText,
      colorClass,
    };
  }, [now, workConfig]);

  const weekStart = useMemo(() => getStartOfWeek(now), [now]);
  const weekEnd = useMemo(() => getEndOfWeek(now), [now]);

  const monthStart = useMemo(() => getStartOfMonth(now), [now]);
  const monthEnd = useMemo(() => getEndOfMonth(now), [now]);

  const yearStart = useMemo(() => getStartOfYear(now), [now]);
  const yearEnd = useMemo(() => getEndOfYear(now), [now]);

  return (
    // Fondo oscurecido para mayor contraste
    <div className="min-h-screen bg-slate-200 text-slate-900 pb-12 font-sans selection:bg-indigo-200">
      
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full bg-slate-200 opacity-90"></div>
         <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob"></div>
         <div className="absolute top-20 -right-40 w-[500px] h-[500px] bg-purple-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-2000"></div>
         <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-pink-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-md border-b border-white/40 sticky top-0 shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 text-white font-black text-2xl px-4 py-2 rounded-xl transform -skew-x-6 shadow-xl shadow-slate-900/20">
              <span className="transform skew-x-6 inline-block tracking-tighter">TIEMPON'T</span>
            </div>
            <div className="hidden sm:block h-10 w-px bg-slate-300"></div>
            <div>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
               </p>
               <p className="text-2xl font-mono font-bold text-slate-800 tabular-nums leading-none">
                 {now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
               </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <WeatherWidget 
              weather={weather} 
              loading={loadingWeather} 
              onRetry={handleLoadWeather} 
            />
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-white/50 hover:bg-white rounded-xl transition-colors text-slate-600 hover:text-indigo-600"
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
          currentVacationDate={vacationDate}
          onSave={handleSaveSettings} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}

      <main className="relative z-10 max-w-7xl mx-auto px-4 pt-8 space-y-8">
        
        {/* Section 1: The Now - Clean Solid Design */}
        <section className="bg-white/90 backdrop-blur rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white p-8 flex flex-col justify-center gap-8 transform transition-all hover:scale-[1.005]">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
             <div className="flex items-center gap-6">
                {/* Interactive Icon Container */}
                <div className={`p-4 rounded-2xl shadow-sm border border-slate-100 transition-all duration-300 transform hover:scale-110 hover:rotate-3 hover:shadow-md cursor-pointer group ${dailyStats.percentage >= 100 ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
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
                    <p className="text-lg text-slate-600 font-medium">{dailyStats.statusText}</p>
                </div>
             </div>
             
             <div className="text-right">
                <span className="text-7xl font-black text-slate-800 tracking-tighter transition-all duration-300 hover:text-indigo-600 cursor-default">
                    {dailyStats.percentage.toFixed(0)}<span className="text-3xl text-slate-400 ml-1">%</span>
                </span>
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider block -mt-1">Progreso del Día</span>
             </div>
          </div>

          {/* Simple Solid Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-8 overflow-hidden shadow-inner border border-slate-200/50 p-1">
             <div 
                className={`h-full rounded-full ${dailyStats.colorClass} transition-all duration-1000 ease-out shadow-sm`}
                style={{ width: `${dailyStats.percentage}%` }}
             >
             </div>
          </div>
        </section>

        {/* Section 2: Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Columna Izquierda: Semana y Tracker */}
           <div className="space-y-6 lg:col-span-1 flex flex-col">
              <PeriodCard 
                  title="Esta Semana" 
                  startDate={weekStart} 
                  endDate={weekEnd} 
                  now={now}
                  config={workConfig}
                  showChart={true}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                />
               
               {/* Tracker Widget with overflow protection */}
               <div className="flex-1 min-h-0">
                  <TrackerWidget />
               </div>
           </div>

           {/* Columna Central y Derecha: Mes, Año, Cuenta Regresiva, Chat */}
           <div className="space-y-6 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 content-start">
              <div className="md:col-span-2">
                 <PeriodCard 
                  title="Este Mes" 
                  startDate={monthStart} 
                  endDate={monthEnd} 
                  now={now}
                  config={workConfig}
                  showChart={true}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                />
              </div>

              <PeriodCard 
                  title="Año 2025" 
                  startDate={yearStart} 
                  endDate={yearEnd} 
                  now={now}
                  config={workConfig}
                  showChart={false}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
                
              <Countdown targetDate={vacationDate} />

              <div className="md:col-span-2">
                  <AIChatWidget 
                    workConfig={workConfig}
                    dailyStats={dailyStats}
                    now={now}
                    vacationDate={vacationDate}
                    weather={weather}
                  />
              </div>
           </div>
        </div>
        
        <footer className="text-center text-slate-500 text-sm py-8 font-medium">
           <p>TIEMPON'T © 2025 - Gestiona tu existencia con precisión</p>
        </footer>

      </main>
    </div>
  );
};

export default App;