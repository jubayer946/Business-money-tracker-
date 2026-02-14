
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X, ChevronDown } from 'lucide-react';
import { getLocalDateString } from '../utils';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onRangeChange: (start: string, end: string) => void;
  presets?: boolean;
  disabled?: boolean;
}

interface DayInfo {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isDisabled: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onRangeChange,
  presets = true,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);

  const today = getLocalDateString();

  const presetRanges = [
    { label: 'Today', start: today, end: today },
    { label: 'Yesterday', start: getLocalDateString(new Date(Date.now() - 86400000)), end: getLocalDateString(new Date(Date.now() - 86400000)) },
    { label: 'Last 7 Days', start: getLocalDateString(new Date(Date.now() - 7 * 86400000)), end: today },
    { label: 'Last 30 Days', start: getLocalDateString(new Date(Date.now() - 30 * 86400000)), end: today },
    { label: 'This Month', start: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`, end: today },
  ];

  const calendarDays = useMemo((): DayInfo[] => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();

    const days: DayInfo[] = [];

    // Previous month days
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      const dateStr = getLocalDateString(d);
      days.push({
        date: dateStr,
        day: d.getDate(),
        isCurrentMonth: false,
        isToday: dateStr === today,
        isSelected: dateStr === tempStart || dateStr === tempEnd,
        isInRange: !!(tempStart && tempEnd && dateStr > tempStart && dateStr < tempEnd),
        isDisabled: dateStr > today,
      });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const dateStr = getLocalDateString(d);
      days.push({
        date: dateStr,
        day: i,
        isCurrentMonth: true,
        isToday: dateStr === today,
        isSelected: dateStr === tempStart || dateStr === tempEnd,
        isInRange: !!(tempStart && tempEnd && dateStr > tempStart && dateStr < tempEnd),
        isDisabled: dateStr > today,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = getLocalDateString(d);
      days.push({
        date: dateStr,
        day: i,
        isCurrentMonth: false,
        isToday: dateStr === today,
        isSelected: dateStr === tempStart || dateStr === tempEnd,
        isInRange: !!(tempStart && tempEnd && dateStr > tempStart && dateStr < tempEnd),
        isDisabled: dateStr > today,
      });
    }

    return days;
  }, [viewDate, tempStart, tempEnd, today]);

  const handleDayClick = (day: DayInfo) => {
    if (day.isDisabled) return;

    if (!selectingEnd) {
      setTempStart(day.date);
      setTempEnd('');
      setSelectingEnd(true);
    } else {
      if (day.date < tempStart) {
        setTempStart(day.date);
        setTempEnd(tempStart);
      } else {
        setTempEnd(day.date);
      }
      setSelectingEnd(false);
    }
  };

  const handleApply = () => {
    onRangeChange(tempStart, tempEnd || tempStart);
    setIsOpen(false);
  };

  const handlePreset = (start: string, end: string) => {
    setTempStart(start);
    setTempEnd(end);
    onRangeChange(start, end);
    setIsOpen(false);
  };

  const formatDisplayRange = () => {
    if (!startDate) return 'Select date';
    const startObj = new Date(startDate + 'T00:00:00');
    const startStr = startObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (!endDate || endDate === startDate) return startStr;
    
    const endObj = new Date(endDate + 'T00:00:00');
    const endStr = endObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} — ${endStr}`;
  };

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-transparent rounded-2xl py-3.5 px-4 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all shadow-sm"
      >
        <div className="flex items-center space-x-3">
          <Calendar size={18} className="text-slate-400" />
          <span>{formatDisplayRange()}</span>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[110]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 left-0 right-0 sm:left-auto sm:right-0 z-[120] bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 p-5 w-full min-w-[300px] animate-in zoom-in-95 duration-200">
            {presets && (
              <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-slate-50 dark:border-slate-800">
                {presetRanges.map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePreset(preset.start, preset.end)}
                    className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
                className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs font-black uppercase tracking-widest">
                {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                type="button"
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
                className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-[9px] font-black text-slate-300 uppercase">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  disabled={day.isDisabled}
                  className={`aspect-square rounded-xl text-[10px] font-bold transition-all flex items-center justify-center ${
                    day.isCurrentMonth ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'
                  } ${day.isToday ? 'border border-indigo-500' : ''} ${
                    day.isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none scale-105' : ''
                  } ${day.isInRange ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''} ${
                    day.isDisabled ? 'opacity-20 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-90'
                  }`}
                >
                  {day.day}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!tempStart}
                className="px-5 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl disabled:opacity-50 shadow-lg shadow-indigo-100 dark:shadow-none"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
