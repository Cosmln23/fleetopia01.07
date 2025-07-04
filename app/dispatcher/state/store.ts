// app/dispatcher/state/store.ts
import { create } from 'zustand'

interface DispatcherState {
  // Agent state
  agentEnabled: boolean
  autoAssignEnabled: boolean
  
  // GPS fallback state  
  gpsFallbackAllowed: boolean
  
  // Actions
  setAgentEnabled: (enabled: boolean) => void
  setAutoAssignEnabled: (enabled: boolean) => void
  setGpsFallbackAllowed: (allowed: boolean) => void
}

export const useDispatcherStore = create<DispatcherState>((set) => ({
  // Initial state
  agentEnabled: false,
  autoAssignEnabled: false,
  gpsFallbackAllowed: false,
  
  // Actions
  setAgentEnabled: (enabled: boolean) => set({ agentEnabled: enabled }),
  setAutoAssignEnabled: (enabled: boolean) => set({ autoAssignEnabled: enabled }),
  setGpsFallbackAllowed: (allowed: boolean) => set({ gpsFallbackAllowed: allowed }),
}))