import React, { useMemo, useState } from 'react';
import ProgressBar from './ProgressBar';
import WorkChart from './WorkChart';
import { calculateWorkProgressStats, isHoliday, isWorkDay } from '../utils/dateHelpers';
import { WorkConfig } from '../constants';

interface PeriodCardProps {
  title: string;
  startDate: Date;
  endDate: Date;
  now: Date;
  config: WorkConfig;
  isRestMode: boolean; // Received from App
  isDarkMode?: boolean; // Global Dark Mode
  icon?: React.ReactNode;
  showChart?: boolean;
}

const PeriodCard: React.FC<PeriodCardProps> = ({ title, startDate, endDate, now, config, isRestMode, isDarkMode, icon, showChart = false }) => {
  const [isTodayView, setIsTodayView] = useState(false);

  const effectiveStartDate = useMemo(() => {
    if (isTodayView) {
        const d = new Date(now);
        d.setHours(0, 0, 0, 0);
        return d;
    }
    return startDate;
  }, [isTodayView, now, startDate]);

  const effectiveEndDate = useMemo(() => {
    if (isTodayView) {
        const d = new Date(now);
        d.setHours(23, 59, 59, 999);
        return d;
    }
    return endDate;
  }, [isTodayView, now, endDate]);

  const stats = useMemo(() => {
    const totalDuration = effectiveEndDate.getTime() - effectiveStartDate.getTime();
    const elapsedDuration = now.getTime() - effectiveStartDate.getTime();
    const calPercent = totalDuration === 0 ? 100 : Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
    const { total, elapsed } = calculateWorkProgressStats(effectiveStartDate, effectiveEndDate, now, config);
    const workPercent = total === 0 ? (elapsed > 0 ? 100 : 0) : Math.min(100, Math.max(0, (elapsed / total) * 100));

    let holidayCount = 0;
    let workDaysCount = 0;
    let totalDays = 0;
    let remainingDays = 0;
    
    const iter = new Date(effectiveStartDate);
    const endIter = new Date(effectiveEndDate);
    iter.setHours(0,0,0,0);
    endIter.setHours(0,0,0,0);
    
    while (iter <= endIter) {
      totalDays++;
      if (isHoliday(iter)) holidayCount++;
      if (isWorkDay(iter, config)) workDaysCount++;
      const iterEnd = new Date(iter);
      iterEnd.setHours(23,59,59,999);
      if (iterEnd > now) remainingDays++;
      iter.setDate(iter.getDate() + 1);
    }
    
    const offDays = totalDays - workDaysCount;
    const workHoursRemaining = Math.max(0, total - elapsed);

    return { calPercent, workPercent, workHoursRemaining, holidayCount, offDays, totalDays, remainingDays };
  }, [effectiveStartDate, effectiveEndDate, now, config]);

  const isAhead = stats.workPercent > stats.calPercent;
  const delta = stats.workPercent - stats.calPercent;

  // Style Selection Logic
  const isDark = isRestMode || isDarkMode;
  
  const cardBaseStyles = isRestMode 
    ? 'bg-slate-900/80 backdrop-blur-xl border-slate-700/50 text-slate-100 shadow-2xl ring-1 ring-white/10' 
    : (isDarkMode 
        ? 'bg-slate-800/90 backdrop-blur-xl border-slate-700 text-slate-100 shadow-lg ring-1 ring-white/5'
        : 'bg-white/95 backdrop-blur-xl border-white/50 text-slate-900 shadow-sm ring-1 ring-slate-900/5');

  const subCardStyles = isDark ? 'bg-slate-950/50 border-slate-700' : 'bg-slate-50 border-slate-200';
  const textPrimary = isDark ? 'text-white' : 'text-slate-800';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`rounded-3xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${cardBaseStyles} ${isTodayView ? (isRestMode ? 'border-indigo-500/50' : 'border-indigo-400') : ''}`}>
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          {/* Clean Icon Style */}
          <div className={`p-3 rounded-xl transition-colors ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
            {icon}
          </div>
          <div>
             <h3 className={`text-lg font-black leading-tight flex items-center gap-2 ${textPrimary}`}>
                {title}
                {isTodayView && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isDark ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>VISTA HOY</span>}
             </h3>
             <p className={`text-[10px] font-bold ${textSecondary} uppercase tracking-wider`}>
               {effectiveStartDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short'})}
               {!isTodayView && ` - ${effectiveEndDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short'})}`}
             </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
            <div className={`text-[10px] font-black uppercase px-2 py-1 rounded-md border transition-colors duration-500 ${isAhead ? (isDark ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-green-50 text-green-700 border-green-200') : (isDark ? 'bg-orange-900/30 text-orange-400 border-orange-800' : 'bg-orange-50 text-orange-700 border-orange-200')}`}>
            {isAhead ? 'Adelantado' : 'Rezagado'} {Math.abs(delta).toFixed(1)}%
            </div>
            
            <button 
                onClick={() => setIsTodayView(!isTodayView)}
                className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border transition-all ${
                    isTodayView 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                    : (isDark ? 'bg-slate-700 text-slate-300 border-slate-600 hover:border-indigo-500' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600')
                }`}
            >
                {isTodayView ? 'Ver Periodo' : 'Ver Hoy'}
            </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
           <ProgressBar 
            percentage={stats.calPercent} 
            colorClass={isRestMode ? "bg-indigo-600" : "bg-blue-500"} 
            label="Tiempo Cronológico"
            valueLabel={`${stats.calPercent.toFixed(1)}%`}
            height="h-2"
          />
        </div>

        <div>
           <ProgressBar 
            percentage={stats.workPercent} 
            colorClass={isRestMode ? "bg-emerald-600" : "bg-emerald-500"} 
            label="Tiempo Laboral"
            valueLabel={`${stats.workPercent.toFixed(1)}%`}
            height="h-2"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3 pt-2">
            <div className={`p-2 rounded-xl border transition-colors duration-500 ${subCardStyles}`}>
                <span className={`block text-[10px] uppercase font-bold ${textSecondary}`}>Horas Restantes</span>
                <span className={`block text-xl font-bold ${textPrimary}`}>{Math.round(stats.workHoursRemaining)}h</span>
            </div>
            <div className={`p-2 rounded-xl border transition-colors duration-500 ${subCardStyles}`}>
                <span className={`block text-[10px] uppercase font-bold ${textSecondary}`}>Días Restantes</span>
                <span className={`block text-xl font-bold ${textPrimary}`}>{isTodayView ? 0 : stats.remainingDays}</span>
            </div>
             <div className={`p-2 rounded-xl border col-span-2 flex justify-between items-center px-4 transition-colors duration-500 ${subCardStyles}`}>
                <div className="text-center">
                    <span className={`block text-lg font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{stats.holidayCount}</span>
                    <span className={`text-[9px] uppercase font-bold ${textSecondary}`}>Feriados</span>
                </div>
                <div className={`w-px h-6 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                <div className="text-center">
                    <span className={`block text-lg font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{stats.offDays}</span>
                    <span className={`text-[9px] uppercase font-bold ${textSecondary}`}>Libres</span>
                </div>
                 <div className={`w-px h-6 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                <div className="text-center">
                    <span className={`block text-lg font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{stats.totalDays}</span>
                    <span className={`text-[9px] uppercase font-bold ${textSecondary}`}>Total Días</span>
                </div>
            </div>
        </div>
      </div>

      {showChart && !isTodayView && (
        <div className={`mt-6 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <WorkChart startDate={effectiveStartDate} endDate={effectiveEndDate} now={now} config={config} />
        </div>
      )}
    </div>
  );
};

export default PeriodCard;