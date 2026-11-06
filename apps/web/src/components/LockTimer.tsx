import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface LockTimerProps {
  expiresAt: string;
  onExpire?: () => void;
  compact?: boolean;
}

export const LockTimer: React.FC<LockTimerProps> = ({ expiresAt, onExpire, compact = false }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        if (onExpire) onExpire();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (timeLeft.isExpired) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
        <span>Price Lock Expired</span>
      </div>
    );
  }

  const isUrgent = timeLeft.hours < 4;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-mono font-medium ${
        isUrgent ? 'text-amber-600' : 'text-[#00a87e]'
      }`}>
        <Clock className="w-3.5 h-3.5" />
        {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium font-mono ${
      isUrgent
        ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
        : 'bg-[#e6f9f4] text-[#00a87e] border-[#b2edd9]'
    }`}>
      <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-amber-600' : 'text-[#00a87e]'}`} />
      <span className="font-sans font-semibold text-[11px]">Price Locked: </span>
      <span className="font-bold tracking-wider">
        {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s
      </span>
    </div>
  );
};
