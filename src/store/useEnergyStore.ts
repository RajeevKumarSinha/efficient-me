import { create } from 'zustand';
import { EnergyLog } from '../types';
import { energyRepository } from '../database/repositories/energyRepository';

interface EnergyState {
  todayCheckIn: EnergyLog | null;
  recentLogs: EnergyLog[];
  isLowEnergyMode: boolean;
  isLoading: boolean;
  loadTodayCheckIn: () => Promise<void>;
  logCheckIn: (energyScore: number, moodScore: number, tags: string[], notes?: string) => Promise<void>;
  toggleLowEnergyMode: () => void;
  setLowEnergyMode: (active: boolean) => void;
}

export const useEnergyStore = create<EnergyState>((set, get) => ({
  todayCheckIn: null,
  recentLogs: [],
  isLowEnergyMode: false,
  isLoading: false,

  loadTodayCheckIn: async () => {
    set({ isLoading: true });
    try {
      const [today, recent] = await Promise.all([
        energyRepository.getLatestToday(),
        energyRepository.getRecentHistory(7),
      ]);

      const shouldAutoTriggerLowEnergy = today ? today.energyScore <= 2 : false;

      set({
        todayCheckIn: today,
        recentLogs: recent,
        isLowEnergyMode: shouldAutoTriggerLowEnergy,
        isLoading: false,
      });
    } catch (error) {
      console.error('[EnergyStore] Failed to load energy check-in:', error);
      set({ isLoading: false });
    }
  },

  logCheckIn: async (energyScore, moodScore, tags, notes) => {
    try {
      const newLog = await energyRepository.logEnergyCheckIn(energyScore, moodScore, tags, notes);
      const isLow = energyScore <= 2;
      set((state) => ({
        todayCheckIn: newLog,
        recentLogs: [newLog, ...state.recentLogs.slice(0, 6)],
        isLowEnergyMode: isLow,
      }));
    } catch (error) {
      console.error('[EnergyStore] Failed to log check-in:', error);
    }
  },

  toggleLowEnergyMode: () => {
    set((state) => ({ isLowEnergyMode: !state.isLowEnergyMode }));
  },

  setLowEnergyMode: (active) => {
    set({ isLowEnergyMode: active });
  },
}));
