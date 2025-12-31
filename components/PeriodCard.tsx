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
  icon?: React.ReactNode;
  showChart?: boolean;
}

const PeriodCard: React.FC<PeriodCardProps> = ({ title, startDate, endDate, now, config, isRestMode, icon, showChart = false }) => {
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

  const cardBaseStyles = isRestMode 
    ? 'bg-slate-900/80 backdrop-blur-xl border-slate-700/50 text-slate-100 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/10' 
    : 'bg-white/95 backdrop-blur-xl border-white/50 text-slate-900 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] ring-1 ring-slate-900/5';

  const subCardStyles = isRestMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200';

  return (
    <div className={`rounded-3xl p-6 border transition-all duration-500 hover:scale-[1.01] ${cardBaseStyles} ${isTodayView ? (isRestMode ? 'border-indigo-500/50' : 'border-indigo-400') : ''}`}>
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl shadow-lg transition-colors duration-500 ${isRestMode ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-indigo-200'}`}>
            {icon}
          </div>
          <div>
             <h3 className={`text-lg font-black leading-tight flex items-center gap-2 ${isRestMode ? 'text-white' : 'text-slate-800'}`}>
                {title}
                {isTodayView && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isRestMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>VISTA HOY</span>}
             </h3>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
               {effectiveStartDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short'})}
               {!isTodayView && ` - ${effectiveEndDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short'})}`}
             </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
            <div className={`text-[10px] font-black uppercase px-2 py-1 rounded-md border transition-colors duration-500 ${isAhead ? (isRestMode ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-green-50 text-green-700 border-green-200') : (isRestMode ? 'bg-orange-900/30 text-orange-400 border-orange-800' : 'bg-orange-50 text-orange-700 border-orange-200')}`}>
            {isAhead ? 'Adelantado' : 'Rezagado'} {Math.abs(delta).toFixed(1)}%
            </div>
            
            <button 
                onClick={() => setIsTodayView(!isTodayView)}
                className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border transition-all ${
                    isTodayView 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                    : (isRestMode ? 'bg-slate-800 text-slate-400 border-slate-700 hover:border-indigo-500' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600')
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
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Horas Restantes</span>
                <span className={`block text-xl font-bold ${isRestMode ? 'text-white' : 'text-slate-700'}`}>{Math.round(stats.workHoursRemaining)}h</span>
            </div>
            <div className={`p-2 rounded-xl border transition-colors duration-500 ${subCardStyles}`}>
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Días Restantes</span>
                <span className={`block text-xl font-bold ${isRestMode ? 'text-white' : 'text-slate-700'}`}>{isTodayView ? 0 : stats.remainingDays}</span>
            </div>
             <div className={`p-2 rounded-xl border col-span-2 flex justify-between items-center px-4 transition-colors duration-500 ${subCardStyles}`}>
                <div className="text-center">
                    <span className={`block text-lg font-bold ${isRestMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{stats.holidayCount}</span>
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Feriados</span>
                </div>
                <div className={`w-px h-6 ${isRestMode ? 'bg-slate-800' : 'bg-slate-300'}`}></div>
                <div className="text-center">
                    <span className={`block text-lg font-bold ${isRestMode ? 'text-purple-400' : 'text-purple-600'}`}>{stats.offDays}</span>
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Libres</span>
                </div>
                 <div className={`w-px h-6 ${isRestMode ? 'bg-slate-800' : 'bg-slate-300'}`}></div>
                <div className="text-center">
                    <span className={`block text-lg font-bold ${isRestMode ? 'text-slate-300' : 'text-slate-600'}`}>{stats.totalDays}</span>
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Total Días</span>
                </div>
            </div>
        </div>
      </div>

      {showChart && !isTodayView && (
        <div className={`mt-6 pt-4 border-t ${isRestMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <WorkChart startDate={effectiveStartDate} endDate={effectiveEndDate} now={now} config={config} />
        </div>
      )}
    </div>
  );
};

export default PeriodCard;