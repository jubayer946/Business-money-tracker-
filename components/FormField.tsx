import React from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, error, children }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
      {label}
    </label>
    {children}
    {error && (
      <p className="text-[10px] font-bold text-red-500 animate-in slide-in-from-top-1">
        {error}
      </p>
    )}
  </div>
);
