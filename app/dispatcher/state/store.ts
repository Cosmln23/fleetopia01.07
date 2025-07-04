// app/dispatcher/state/store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DispatcherState {
  // Agent state
  agentEnabled: boolean
  autoAssignEnabled: boolean
  
  // Per-vehicle auto-assign state
  vehicleAutoAssign: Record<string, boolean>
  
  // GPS fallback state  
  gpsFallbackAllowed: boolean
  
  // Actions
  setAgentEnabled: (enabled: boolean) => void
  setAutoAssignEnabled: (enabled: boolean) => void
  setVehicleAutoAssign: (vehicleId: string, enabled: boolean) => void
  setGpsFallbackAllowed: (allowed: boolean) => void
  
  // Sync with server
  syncWithServer: (data: Partial<DispatcherState>) => Promise<void>
}

export const useDispatcherStore = create<DispatcherState>()(
  persist(
    (set, get) => ({
      // Initial state
      agentEnabled: false,
      autoAssignEnabled: false,
      vehicleAutoAssign: {},
      gpsFallbackAllowed: false,
      
      // Actions
      setAgentEnabled: (enabled: boolean) => {
        set({ agentEnabled: enabled })
        // Sync with server
        get().syncWithServer({ agentEnabled: enabled })
      },
      
      setAutoAssignEnabled: (enabled: boolean) => {
        set({ autoAssignEnabled: enabled })
        // Sync with server
        get().syncWithServer({ autoAssignEnabled: enabled })
      },
      
      setVehicleAutoAssign: (vehicleId: string, enabled: boolean) => {
        set((state) => ({
          vehicleAutoAssign: {
            ...state.vehicleAutoAssign,
            [vehicleId]: enabled
          }
        }))
        // Sync with server
        get().syncWithServer({ 
          vehicleAutoAssign: get().vehicleAutoAssign 
        })
      },
      
      setGpsFallbackAllowed: (allowed: boolean) => {
        set({ gpsFallbackAllowed: allowed })
      },
      
      // Sync with server settings
      syncWithServer: async (data: Partial<DispatcherState>) => {
        try {
          await fetch('/api/settings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agentOn: data.agentEnabled,
              autoAssign: data.autoAssignEnabled,
              vehicleAutoAssign: data.vehicleAutoAssign
            })
          })
        } catch (error) {
          console.error('Failed to sync dispatcher settings with server:', error)
        }
      }
    }),
    {
      name: 'dispatcher-storage',
      partialize: (state) => ({
        agentEnabled: state.agentEnabled,
        autoAssignEnabled: state.autoAssignEnabled,
        vehicleAutoAssign: state.vehicleAutoAssign,
        gpsFallbackAllowed: state.gpsFallbackAllowed,
      }),
    }
  )
)