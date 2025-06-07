
import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ProgressBar = ({ value, max = 100, className, size = 'md' }: ProgressBarProps) => {
  const percentage = (value / max) * 100;
  
  const getColorClass = () => {
    if (percentage < 40) return 'bg-red-500';
    if (percentage < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'h-1.5';
      case 'lg': return 'h-3';
      default: return 'h-2';
    }
  };
  
  return (
    <div className={cn("w-full bg-muted rounded-full overflow-hidden", getSizeClass(), className)}>
      <div 
        className={cn("transition-all duration-500", getColorClass(), getSizeClass())}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export default ProgressBar;
