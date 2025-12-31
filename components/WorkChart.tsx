import React, { useMemo, useState } from 'react';
import { isWorkDay } from '../utils/dateHelpers';
import { WorkConfig } from '../constants';

interface WorkChartProps {
  startDate: Date;
  endDate: Date;
  now: Date;
  config: WorkConfig;
}

const WorkChart: React.FC<WorkChartProps> = ({ startDate, endDate, now, config }) => {
  const [hoverData, setHoverData] = useState<{ x: number, y: number, date: string, label: string } | null>(null);

  const chartData = useMemo(() => {
    const points: { x: number; y: number; date: Date; cumulativeHours: number }[] = [];
    let cumulativeHours = 0;
    const totalDuration = endDate.getTime() - startDate.getTime();

    // Generate points per day (noon) to create the line
    const iter = new Date(startDate);
    iter.setHours(0, 0, 0, 0);
    
    // Safety check for very long ranges to prevent performance issues
    const maxPoints = 370; // Cap at roughly a year
    let step = 1;
    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    if(daysDiff > maxPoints) {
       step = Math.ceil(daysDiff / maxPoints);
    }

    while (iter <= endDate) {
      const isWorking = isWorkDay(iter, config);
      // We plot the point at the END of the work day for visualization
      const dayWorkHours = isWorking ? (config.endHour - config.startHour) : 0;
      
      cumulativeHours += dayWorkHours;
      
      const timeRatio = (iter.getTime() - startDate.getTime()) / totalDuration;
      
      points.push({
        x: timeRatio * 100,
        y: cumulativeHours,
        date: new Date(iter),
        cumulativeHours
      });

      iter.setDate(iter.getDate() + step);
    }

    // Normalize Y to 0-100 scale
    const maxHours = points[points.length - 1]?.cumulativeHours || 1;
    return points.map(p => ({
      ...p,
      normalizedY: 100 - ((p.cumulativeHours / maxHours) * 100) // Invert for SVG (0 is top)
    }));
  }, [startDate, endDate, config]);

  const currentX = useMemo(() => {
     const totalDuration = endDate.getTime() - startDate.getTime();
     const elapsed = now.getTime() - startDate.getTime();
     return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }, [startDate, endDate, now]);

  // Construct SVG Path
  const polylinePoints = chartData.map(p => `${p.x},${p.normalizedY}`).join(' ');

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - svgRect.left;
    const width = svgRect.width;
    const xPercent = (x / width) * 100;

    // Find closest point
    const closest = chartData.reduce((prev, curr) => {
      return (Math.abs(curr.x - xPercent) < Math.abs(prev.x - xPercent) ? curr : prev);
    });

    setHoverData({
      x: closest.x,
      y: closest.normalizedY,
      date: closest.date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
      label: `${closest.cumulativeHours}h acumuladas`
    });
  };

  return (
    <div className="w-full h-24 mt-4 relative group">
       {/* Tooltip */}
       {hoverData && (
        <div 
          className="absolute bg-gray-900 text-white text-xs rounded py-1 px-2 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 z-10 whitespace-nowrap"
          style={{ left: `${hoverData.x}%`, top: '-10px' }}
        >
          <div className="font-bold">{hoverData.date}</div>
          <div>{hoverData.label}</div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      )}

      <svg 
        className="w-full h-full overflow-visible" 
        preserveAspectRatio="none" 
        viewBox="0 0 100 100"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverData(null)}
      >
        {/* Background Grid */}
        <line x1="0" y1="25" x2="100" y2="25" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4 4" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4 4" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4 4" />

        {/* The Data Line */}
        <polyline 
          points={polylinePoints} 
          fill="none" 
          stroke="#10b981" 
          strokeWidth="2" 
          strokeLinejoin="round"
          className="drop-shadow-sm"
        />

        {/* Current Time Indicator Line */}
        <line 
          x1={currentX} 
          y1="0" 
          x2={currentX} 
          y2="100" 
          stroke="#6366f1" 
          strokeWidth="1.5" 
          strokeDasharray="4 2"
        />
        
        {/* Hover Circle */}
        {hoverData && (
          <circle cx={hoverData.x} cy={hoverData.y} r="3" fill="#10b981" stroke="white" strokeWidth="2" />
        )}
      </svg>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1 uppercase tracking-wider">
         <span>Inicio</span>
         <span className="text-indigo-500 font-bold">Hoy</span>
         <span>Fin</span>
      </div>
    </div>
  );
};

export default WorkChart;