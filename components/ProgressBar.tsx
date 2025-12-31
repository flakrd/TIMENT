import React from 'react';

interface ProgressBarProps {
  percentage: number;
  colorClass: string;
  label?: string;
  valueLabel?: string;
  height?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  percentage, 
  colorClass, 
  label, 
  valueLabel,
  height = "h-4"
}) => {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className="w-full mb-4">
      <div className="flex justify-between mb-1">
        {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
        {valueLabel && <span className="text-sm font-medium text-gray-700">{valueLabel}</span>}
      </div>
      <div className={`w-full bg-gray-200 rounded-full ${height} dark:bg-gray-700 overflow-hidden`}>
        <div
          className={`${height} rounded-full ${colorClass} transition-all duration-500 ease-out`}
          style={{ width: `${clampedPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;