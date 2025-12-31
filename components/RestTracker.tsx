
import React from 'react';
import { WorkConfig } from '../constants';

interface RestTrackerProps {
  now: Date;
  config: WorkConfig;
  isRestMode: boolean;
  // Props opcionales para usar horario específico del día, si no usa el de config global
  dayStartHour?: number;
  dayEndHour?: number;
}

const RestTracker: React.FC<RestTrackerProps> = ({ now, config, isRestMode, dayStartHour, dayEndHour }) => {
  if (!isRestMode) return null;

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  // Usar horarios específicos o defaults
  const startH = dayStartHour ?? config.startHour;
  const endH = dayEndHour ?? config.endHour;

  // Periodo total de reposo (ej: Fin 17:00 a Inicio 09:00 = 16 horas)
  let totalRestMinutes = (24 - endH + startH) * 60;
  
  // Calcular minutos transcurridos desde el inicio del reposo
  let elapsedMinutes = 0;
  if (currentHour >= endH) {
    elapsedMinutes = currentTimeInMinutes - (endH * 60);
  } else if (currentHour < startH) {
    elapsedMinutes = (24 - endH) * 60 + currentTimeInMinutes;
  }

  const percentage = Math.min(100, (elapsedMinutes / totalRestMinutes) * 100);
  
  // Definición de las 3 fases: 4h Ocio Post-Trabajo, 8h Sueño, 4h Ocio Pre-Trabajo
  const phase1Minutes = 4 * 60; // Ocio Inicial (4h)
  const phase2Minutes = 8 * 60; // Sueño (8h)
  const phase3Minutes = Math.max(0, totalRestMinutes - phase1Minutes - phase2Minutes); // Ocio Final (Resto)

  let currentPhase = "";
  let phaseIcon = "";
  let phaseColor = "";
  let remainingInPhase = 0;

  if (elapsedMinutes < phase1Minutes) {
    currentPhase = "Ocio Post-Trabajo";
    phaseIcon = "✨";
    phaseColor = "from-purple-500 to-indigo-500";
    remainingInPhase = phase1Minutes - elapsedMinutes;
  } else if (elapsedMinutes < phase1Minutes + phase2Minutes) {
    currentPhase = "Fase de Sueño";
    phaseIcon = "🌙";
    phaseColor = "from-indigo-600 to-blue-900";
    remainingInPhase = (phase1Minutes + phase2Minutes) - elapsedMinutes;
  } else {
    currentPhase = "Ocio Pre-Trabajo";
    phaseIcon = "☕";
    phaseColor = "from-amber-500 to-orange-500";
    remainingInPhase = totalRestMinutes - elapsedMinutes;
  }

  const p1Width = (phase1Minutes / totalRestMinutes) * 100;
  const p2Width = (phase2Minutes / totalRestMinutes) * 100;
  const p3Width = (phase3Minutes / totalRestMinutes) * 100;

  return (
    <div className="bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] border border-slate-800 p-8 flex flex-col gap-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className={`p-5 rounded-3xl border shadow-2xl transition-all duration-500 ${currentPhase.includes('Sueño') ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-800/50 border-slate-700 text-slate-300'}`}>
            <span className="text-4xl">{phaseIcon}</span>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase">Santuario Nocturno</h2>
            <p className="text-lg text-slate-400 font-medium">Estás en: <span className="text-indigo-400">{currentPhase}</span></p>
          </div>
        </div>

        <div className="text-right bg-slate-800/30 p-4 rounded-2xl border border-slate-800">
          <div className="text-5xl font-black text-white tabular-nums tracking-tighter">
            {Math.floor(remainingInPhase / 60)}h {Math.round(remainingInPhase % 60)}m
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">
            Para la siguiente fase
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-2">
          <span>{endH}:00 Salida</span>
          <span className="text-indigo-500">Progreso de Reposo</span>
          <span>{startH}:00 Entrada</span>
        </div>

        <div className="w-full bg-slate-950 rounded-full h-14 overflow-hidden shadow-inner border border-slate-800 p-2 relative">
          {/* Segmento 1: Ocio Inicial */}
          <div className="absolute inset-y-2 left-2 rounded-l-full bg-purple-900/20 border-r border-slate-800" style={{ width: `calc(${p1Width}% - 8px)` }}></div>
          {/* Segmento 2: Sueño */}
          <div className="absolute inset-y-2 bg-indigo-900/20 border-r border-slate-800" style={{ left: `${p1Width}%`, width: `${p2Width}%` }}></div>
          {/* Segmento 3: Ocio Final */}
          <div className="absolute inset-y-2 right-2 rounded-r-full bg-amber-900/10" style={{ left: `${p1Width + p2Width}%`, width: `calc(${p3Width}% - 8px)` }}></div>
          
          {/* Barra de progreso real */}
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_30px_rgba(99,102,241,0.4)] flex items-center justify-end pr-2 bg-gradient-to-r ${phaseColor}`}
            style={{ width: `${percentage}%` }}
          >
            <div className="w-8 h-8 bg-white rounded-full shadow-2xl flex items-center justify-center text-lg transform hover:scale-110 transition-transform">
              {phaseIcon}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-6">
           <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 text-center">
              <span className="block text-xs font-bold text-purple-400 mb-1">Ocio Post</span>
              <span className="text-lg font-black text-white">4h</span>
           </div>
           <div className="bg-slate-900/40 p-3 rounded-xl border border-indigo-900/50 text-center ring-1 ring-indigo-500/20">
              <span className="block text-xs font-bold text-indigo-400 mb-1">Sueño</span>
              <span className="text-lg font-black text-white">8h</span>
           </div>
           <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 text-center">
              <span className="block text-xs font-bold text-amber-400 mb-1">Ocio Pre</span>
              <span className="text-lg font-black text-white">{Math.round(phase3Minutes/60)}h</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default RestTracker;
