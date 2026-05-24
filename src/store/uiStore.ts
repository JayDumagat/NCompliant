import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string | null) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeWorkspaceId: null,
      setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ncompliant-ui-storage',
      partialize: (state) => ({ activeWorkspaceId: state.activeWorkspaceId, sidebarOpen: state.sidebarOpen, theme: state.theme }),
    }
  )
);
