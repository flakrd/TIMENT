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
  icon?: React.ReactNode;
  showChart?: boolean;
}

const PeriodCard: React.FC<PeriodCardProps> = ({ title, startDate, endDate, now, config, icon, showChart = false }) => {
  const [isTodayView, setIsTodayView] = useState(false);

  // Determine effective dates based on toggle
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
    // 1. Calendar Progress
    const totalDuration = effectiveEndDate.getTime() - effectiveStartDate.getTime();
    const elapsedDuration = now.getTime() - effectiveStartDate.getTime();
    const calPercent = totalDuration === 0 ? 100 : Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));

    // 2. Work Progress
    const { total, elapsed } = calculateWorkProgressStats(effectiveStartDate, effectiveEndDate, now, config);
    const workPercent = total === 0 ? (elapsed > 0 ? 100 : 0) : Math.min(100, Math.max(0, (elapsed / total) * 100));

    // Advanced Stats
    let holidayCount = 0;
    let workDaysCount = 0;
    let totalDays = 0;
    let remainingDays = 0;
    
    const iter = new Date(effectiveStartDate);
    const endIter = new Date(effectiveEndDate);
    // Reset hours to iterate correctly day by day
    iter.setHours(0,0,0,0);
    endIter.setHours(0,0,0,0);
    
    while (iter <= endIter) {
      totalDays++;
      if (isHoliday(iter)) holidayCount++;
      if (isWorkDay(iter, config)) workDaysCount++;
      
      // Compare dates without time for remaining days calculation in 'Today' view context
      const iterEnd = new Date(iter);
      iterEnd.setHours(23,59,59,999);
      
      if (iterEnd > now) remainingDays++;
      
      iter.setDate(iter.getDate() + 1);
    }
    
    // Derived stats
    const offDays = totalDays - workDaysCount;
    const workHoursRemaining = Math.max(0, total - elapsed);

    return {
      calPercent,
      workPercent,
      workHoursTotal: total,
      workHoursElapsed: elapsed,
      workHoursRemaining,
      holidayCount,
      offDays,
      totalDays,
      remainingDays
    };
  }, [effectiveStartDate, effectiveEndDate, now, config]);

  // Determine if Work is ahead or behind Chronological (Good/Bad indicator)
  const isAhead = stats.workPercent > stats.calPercent;
  const delta = stats.workPercent - stats.calPercent;

  return (
    <div className={`bg-white/90 backdrop-blur rounded-2xl shadow-xl shadow-slate-200/50 p-6 border transition-all duration-300 ${isTodayView ? 'border-indigo-400 ring-4 ring-indigo-50' : 'border-white hover:border-indigo-200'}`}>
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-xl shadow-lg shadow-indigo-200">
            {icon}
          </div>
          <div>
             <h3 className="text-lg font-black text-slate-800 leading-tight flex items-center gap-2">
                {title}
                {isTodayView && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">VISTA HOY</span>}
             </h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
               {effectiveStartDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short'})}
               {!isTodayView && ` - ${effectiveEndDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short'})}`}
             </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
            <div className={`text-[10px] font-black uppercase px-2 py-1 rounded-md border ${isAhead ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
            {isAhead ? 'Adelantado' : 'Rezagado'} {Math.abs(delta).toFixed(1)}%
            </div>
            
            <button 
                onClick={() => setIsTodayView(!isTodayView)}
                className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border transition-all ${
                    isTodayView 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
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
            colorClass="bg-blue-500" 
            label="Tiempo Cronológico"
            valueLabel={`${stats.calPercent.toFixed(1)}%`}
            height="h-2"
          />
        </div>

        <div>
           <ProgressBar 
            percentage={stats.workPercent} 
            colorClass="bg-emerald-500" 
            label="Tiempo Laboral"
            valueLabel={`${stats.workPercent.toFixed(1)}%`}
            height="h-2"
          />
        </div>
        
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Horas Restantes</span>
                <span className="block text-xl font-bold text-slate-700">{Math.round(stats.workHoursRemaining)}h</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Días Restantes</span>
                <span className="block text-xl font-bold text-slate-700">{isTodayView ? (stats.remainingDays > 0 ? 0 : 0) : stats.remainingDays}</span>
            </div>
             <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 col-span-2 flex justify-between items-center px-4">
                <div className="text-center">
                    <span className="block text-lg font-bold text-indigo-600">{stats.holidayCount}</span>
                    <span className="text-[9px] text-slate-400 uppercase font-bold">Feriados</span>
                </div>
                <div className="w-px h-6 bg-slate-200"></div>
                <div className="text-center">
                    <span className="block text-lg font-bold text-purple-600">{stats.offDays}</span>
                    <span className="text-[9px] text-slate-400 uppercase font-bold">Libres</span>
                </div>
                 <div className="w-px h-6 bg-slate-200"></div>
                <div className="text-center">
                    <span className="block text-lg font-bold text-slate-600">{stats.totalDays}</span>
                    <span className="text-[9px] text-slate-400 uppercase font-bold">Total Días</span>
                </div>
            </div>
        </div>
      </div>

      {showChart && !isTodayView && (
        <div className="mt-6 pt-4 border-t border-slate-100">
          <WorkChart startDate={effectiveStartDate} endDate={effectiveEndDate} now={now} config={config} />
        </div>
      )}
    </div>
  );
};

export default PeriodCard;