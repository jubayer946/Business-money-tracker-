import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'delivery_presets';
const DEFAULT_PRESETS = [0, 70, 120];  // ◄── YOUR VALUES

export const useDeliveryPresets = () => {
  const [presets, setPresets] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_PRESETS;
    } catch {
      return DEFAULT_PRESETS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  }, [presets]);

  const addPreset = useCallback((value: number) => {
    setPresets(prev => {
      if (prev.includes(value) || prev.length >= 10) return prev;
      return [...prev, value].sort((a, b) => a - b);
    });
  }, []);

  const removePreset = useCallback((value: number) => {
    setPresets(prev => prev.filter(p => p !== value));
  }, []);

  const updatePreset = useCallback((oldValue: number, newValue: number) => {
    setPresets(prev => {
      if (oldValue !== newValue && prev.includes(newValue)) return prev;
      return prev.map(p => p === oldValue ? newValue : p).sort((a, b) => a - b);
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setPresets(DEFAULT_PRESETS);
  }, []);

  return {
    presets,
    addPreset,
    removePreset,
    updatePreset,
    resetToDefaults,
    isDefault: JSON.stringify(presets) === JSON.stringify(DEFAULT_PRESETS),
  };
};
