import { create } from 'zustand'

export const useLineStore = create((set) => ({
  lines: [], // ✅ debe ser array
  setLines: (data) => set({ lines: data }),
}))