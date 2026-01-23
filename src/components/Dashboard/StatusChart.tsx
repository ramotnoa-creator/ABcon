import { memo, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { StatusDistribution } from '../../types';

interface StatusChartProps {
  distribution: StatusDistribution[];
}

const colorMap = {
  blue: '#3b82f6',
  orange: '#f97316',
  red: '#ef4444',
};

const StatusChart = memo(function StatusChart({ distribution }: StatusChartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [animateChart, setAnimateChart] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setIsVisible(true), 200);
    const timer2 = setTimeout(() => setAnimateChart(true), 400);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Calculate SVG path for donut chart
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const totalPercentage = distribution.reduce((sum, item) => sum + item.percentage, 0);

  const segments = useMemo(() => {
    return distribution.reduce<Array<typeof distribution[number] & { strokeDasharray: number; strokeDashoffset: number }>>((acc, item) => {
      const currentOffset = acc.reduce((sum, seg) => sum + seg.strokeDasharray, 0);
      const percentage = (item.percentage / totalPercentage) * 100;
      const strokeDasharray = (percentage / 100) * circumference;
      const strokeDashoffset = circumference - strokeDasharray - currentOffset;

      return [...acc, { ...item, strokeDasharray, strokeDashoffset }];
    }, []);
  }, [distribution, totalPercentage, circumference]);

  return (
    <div 
      className={`bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6 transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">התפלגות סטטוס פרויקטים</h3>
        <Link
          to="#"
          className="text-sm text-primary hover:text-primary-hover transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-1"
        >
          צפה בדוח מלא
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        </Link>
      </div>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative size-48 flex items-center justify-center group">
          <svg className="size-full transform rotate-[-90deg]" viewBox="0 0 140 140">
            {/* Background circle */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="20"
              className="text-gray-100 dark:text-gray-800"
            />
            {/* Animated segments */}
            {segments.map((segment, index) => (
              <circle
                key={index}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={colorMap[segment.color]}
                strokeWidth="20"
                strokeLinecap="round"
                strokeDasharray={animateChart ? segment.strokeDasharray : 0}
                strokeDashoffset={animateChart ? segment.strokeDashoffset : circumference}
                className="transition-all duration-1000 ease-smooth"
                style={{ transitionDelay: `${index * 200}ms` }}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center transition-transform duration-300 group-hover:scale-110">
              <p className="text-2xl font-black tabular-nums">100%</p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">סה"כ</p>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          {distribution.map((item, index) => (
            <div 
              key={index} 
              className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 hover:bg-background-light dark:hover:bg-background-dark cursor-pointer ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
              }`}
              style={{ transitionDelay: `${600 + index * 100}ms` }}
            >
              <div
                className="size-4 rounded-full transition-transform duration-200 hover:scale-125"
                style={{ backgroundColor: colorMap[item.color] }}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-sm font-bold tabular-nums">{item.percentage}%</span>
                </div>
                {/* Mini progress bar */}
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-smooth"
                    style={{ 
                      backgroundColor: colorMap[item.color],
                      width: animateChart ? `${item.percentage}%` : '0%',
                      transitionDelay: `${800 + index * 100}ms`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default StatusChart;
