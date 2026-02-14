
import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { writeRateLimiter } from '../utils/rateLimiter';

export const RateLimitIndicator: React.FC = () => {
  const [remaining, setRemaining] = useState(writeRateLimiter.getRemainingRequests());

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(writeRateLimiter.getRemainingRequests());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Only show when getting low
  if (remaining > 20) return null;

  const isLow = remaining < 10;
  
  return (
    <div className={`fixed top-4 right-4 z-[600] flex items-center space-x-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg animate-in slide-in-from-right-4 duration-500 ${
      isLow ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
    }`}>
      <Activity size={12} className={isLow ? 'animate-pulse' : ''} />
      <span>{remaining} actions left</span>
    </div>
  );
};
