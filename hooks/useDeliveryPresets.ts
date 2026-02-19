import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'delivery_presets';
const DEFAULT_PRESETS = [0, 5, 10, 15, 20, 25];

export const useDeliveryPresets = () => {
  const [presets, setPresets] = useState<number[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse delivery presets', e);
      }
    }
    return DEFAULT_PRESETS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  }, [presets]);

  const addPreset = useCallback((value: number) => {
    setPresets(prev => {
      if (prev.includes(value)) return prev;
      return [...prev, value].sort((a, b) => a - b);
    });
  }, []);

  const removePreset = useCallback((value: number) => {
    setPresets(prev => prev.filter(p => p !== value));
  }, []);

  const updatePreset = useCallback((oldValue: number, newValue: number) => {
    setPresets(prev => {
      const filtered = prev.filter(p => p !== oldValue);
      if (filtered.includes(newValue)) return filtered.sort((a, b) => a - b);
      return [...filtered, newValue].sort((a, b) => a - b);
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setPresets(DEFAULT_PRESETS);
  }, []);

  const isDefault = JSON.stringify(presets) === JSON.stringify(DEFAULT_PRESETS);

  return {
    presets,
    addPreset,
    removePreset,
    updatePreset,
    resetToDefaults,
    isDefault,
  };
};
