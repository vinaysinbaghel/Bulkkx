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
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
        <span>Price Lock Expired</span>
      </div>
    );
  }

  const isUrgent = timeLeft.hours < 4;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-mono font-medium ${isUrgent ? 'text-amber-400' : 'text-emerald-400'}`}>
        <Clock className="w-3 h-3" />
        {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium font-mono ${
      isUrgent
        ? 'bg-amber-950/40 text-amber-300 border-amber-800/80 animate-pulse'
        : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80'
    }`}>
      <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-amber-400' : 'text-emerald-400'}`} />
      <span>Price Locked: </span>
      <span className="font-bold tracking-wider">
        {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s
      </span>
    </div>
  );
};
