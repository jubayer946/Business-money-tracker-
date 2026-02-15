
import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-[#FBFBFE] dark:bg-[#0F172A] z-[1000] flex flex-col items-center justify-center p-6 transition-colors duration-500">
      <div className="relative mb-8">
        <div className="w-20 h-20 bg-slate-900 dark:bg-white rounded-[32px] flex items-center justify-center shadow-lg animate-in zoom-in duration-700">
           <span className="text-white dark:text-slate-900 font-black text-2xl tracking-tighter">NB</span>
        </div>
        <div className="absolute -inset-2 border border-slate-200 dark:border-slate-800 rounded-[40px] animate-pulse" />
      </div>
      
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Nobabigor</h2>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
          Crafting Business Excellence
        </p>
      </div>
      
      <div className="absolute bottom-16 flex space-x-1.5 justify-center">
        <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
        <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse [animation-delay:0.2s]" />
        <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse [animation-delay:0.4s]" />
      </div>
    </div>
  );
};
