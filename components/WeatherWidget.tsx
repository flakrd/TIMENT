import React, { useEffect, useState, useRef } from 'react';
import { WeatherData, HourlyForecast } from '../utils/weatherService';
import { WEATHER_CODES } from '../constants';

interface WeatherWidgetProps {
    weather: WeatherData | null;
    loading: boolean;
    onRetry: () => void;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather, loading, onRetry }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

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
            <span className="text-[10px] font-bold text-gray-400 mb-1">{h.formattedTime}</span>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 flex flex-col items-center w-full shadow-sm">
                <span className="text-xl mb-1">{icon}</span>
                <span className="text-xs font-bold text-slate-700">{Math.round(h.temperature)}°</span>
            </div>
        </div>
    );
  };

  if (loading) return <div className="animate-pulse h-12 w-32 bg-white/40 rounded-xl"></div>;

  if (!weather) return (
      <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-xl border border-red-200 shadow-sm text-red-600 cursor-pointer" onClick={onRetry}>
        <span className="text-xl">⚠️</span>
        <span className="text-xs font-bold">Reintentar Clima</span>
      </div>
  );

  return (
    <div className="relative" ref={wrapperRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/50 shadow-lg shadow-indigo-500/10 transition-all hover:scale-105 hover:bg-white group ${isOpen ? 'ring-2 ring-indigo-400 bg-white' : ''}`}
      >
        <span className="text-3xl filter drop-shadow-sm group-hover:animate-bounce" role="img" aria-label={weather.weatherLabel}>
            {weather.weatherIcon}
        </span>
        <div className="flex flex-col items-start text-left">
          <div className="flex items-baseline gap-1">
             <span className="text-xl font-black text-gray-800 leading-none">{weather.temperature}°</span>
             <span className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[100px]">{weather.locationName}</span>
          </div>
          <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wide">
             {isOpen ? 'Cerrar Panel' : 'Ver Detalles'}
          </span>
        </div>
      </button>

      {/* Expanded Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 p-0 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5 overflow-hidden">
            
            {/* Header / Location Status */}
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pronóstico Local</span>
                <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Córdoba Capital</span>
            </div>

            <div className="p-5 space-y-6">
                
                {/* Recommendation Card */}
                <div className={`rounded-xl p-4 flex items-start gap-4 border ${weather.recommendation.color.replace('text', 'border').replace('bg', 'border')}/20 ${weather.recommendation.color.split(' ')[0]}`}>
                    <div className="text-3xl bg-white/50 p-2 rounded-full shadow-sm">
                        {weather.recommendation.icon}
                    </div>
                    <div>
                        <h4 className={`font-bold text-sm mb-1 ${weather.recommendation.color.split(' ')[1]}`}>
                            {weather.recommendation.title}
                        </h4>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                            {weather.recommendation.activity}
                        </p>
                    </div>
                </div>

                {/* Timeline: Work */}
                {weather.workForecast.length > 0 && (
                    <div>
                        <h5 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span>💼</span> Durante la Jornada
                            <span className="h-px flex-1 bg-amber-100"></span>
                        </h5>
                        <div className="flex overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
                            {weather.workForecast.map(renderTimelineItem)}
                        </div>
                    </div>
                )}

                {/* Timeline: After Work */}
                <div>
                    <h5 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span>🏠</span> Post-Trabajo
                        <span className="h-px flex-1 bg-indigo-100"></span>
                    </h5>
                    {weather.afterWorkForecast.length > 0 ? (
                        <div className="flex overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
                            {weather.afterWorkForecast.map(renderTimelineItem)}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 italic">No hay datos para el resto del día.</p>
                    )}
                </div>

            </div>
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;