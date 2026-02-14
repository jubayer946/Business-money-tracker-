import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-[#FBFBFE] dark:bg-[#0F172A] z-[1000] flex flex-col items-center justify-center p-6 transition-colors duration-500">
      <div className="relative mb-8">
        <div className="w-20 h-20 bg-indigo-600 rounded-[28px] flex items-center justify-center shadow-2xl shadow-indigo-500/20 animate-bounce">
           <span className="text-white font-black text-2xl tracking-tighter">BM</span>
        </div>
        <div className="absolute -inset-4 border-2 border-indigo-600/20 rounded-[40px] animate-ping" />
      </div>
      
      <div className="text-center space-y-2">
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">BizMaster</h2>
        <div className="flex items-center space-x-1.5 justify-center">
          <div className="w-1 h-1 bg-indigo-600 rounded-full animate-pulse" />
          <div className="w-1 h-1 bg-indigo-600 rounded-full animate-pulse [animation-delay:0.2s]" />
          <div className="w-1 h-1 bg-indigo-600 rounded-full animate-pulse [animation-delay:0.4s]" />
        </div>
      </div>
      
      <p className="absolute bottom-12 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600">
        Secure Cloud Sync
      </p>
    </div>
  );
};