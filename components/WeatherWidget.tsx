import React, { useEffect, useState, useRef } from 'react';
import { WeatherData, HourlyForecast } from '../utils/weatherService';
import { WEATHER_CODES } from '../constants';

interface WeatherWidgetProps {
    weather: WeatherData | null;
    loading: boolean;
    onRetry: () => void;
    isRestMode: boolean; // Received from App
    isDarkMode?: boolean;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather, loading, onRetry, isRestMode, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isDark = isRestMode || isDarkMode;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const renderTimelineItem = (h: HourlyForecast) => {
    const icon = WEATHER_CODES[h.weatherCode]?.icon || '❓';
    return (
        <div key={h.time} className="flex flex-col items-center min-w-[3.5rem] p-2 first:pl-0">
            <span className={`text-[10px] font-bold mb-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{h.formattedTime}</span>
            <div className={`rounded-xl p-2 flex flex-col items-center w-full shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-xl mb-1">{icon}</span>
                <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{Math.round(h.temperature)}°</span>
            </div>
        </div>
    );
  };

  if (loading) return <div className={`animate-pulse h-12 w-32 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-white/40'}`}></div>;

  if (!weather) return (
      <div className="flex items-center gap-2 bg-red-900/20 px-3 py-2 rounded-xl border border-red-800 shadow-sm text-red-400 cursor-pointer" onClick={onRetry}>
        <span className="text-xl">⚠️</span>
        <span className="text-xs font-bold">Error Clima</span>
      </div>
  );

  return (
    <div className="relative" ref={wrapperRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 backdrop-blur-md px-4 py-2 rounded-xl border shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl group ${isDark ? 'bg-slate-900/80 border-slate-800 text-white shadow-indigo-900/10' : 'bg-white/80 border-white/50 text-slate-800 shadow-indigo-500/10'} ${isOpen ? 'ring-2 ring-indigo-500' : ''}`}
      >
        <span className="text-3xl filter drop-shadow-md group-hover:rotate-12 transition-transform">
            {weather.weatherIcon}
        </span>
        <div className="flex flex-col items-start text-left">
          <div className="flex items-baseline gap-1">
             <span className="text-xl font-black leading-none">{weather.temperature}°</span>
             <span className={`text-[9px] font-black uppercase truncate max-w-[80px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{weather.locationName.split(' ')[0]}</span>
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
             {isOpen ? 'Ocultar' : 'Info'}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-4 w-80 rounded-2xl shadow-3xl border z-50 animate-in fade-in zoom-in-95 duration-300 origin-top-right overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800 ring-1 ring-white/10' : 'bg-white border-gray-200 ring-1 ring-black/5'}`}>
            <div className={`px-5 py-3 border-b flex justify-between items-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Pronóstico local</span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${isDark ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>CÓRDOBA</span>
            </div>

            <div className="p-5 space-y-6">
                <div className={`rounded-2xl p-4 flex items-start gap-4 border ${isDark ? 'bg-indigo-900/20 border-indigo-800 text-indigo-100' : weather.recommendation.color + ' border-indigo-100'}`}>
                    <div className="text-3xl p-2 bg-white/10 rounded-full">{weather.recommendation.icon}</div>
                    <div>
                        <h4 className="font-black text-sm mb-1 uppercase tracking-tight">{weather.recommendation.title}</h4>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{weather.recommendation.activity}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h5 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        <span>🕒</span> Línea de Tiempo
                    </h5>
                    <div className="flex overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-indigo-500/20">
                        {[...weather.workForecast, ...weather.afterWorkForecast].slice(0, 8).map(renderTimelineItem)}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;