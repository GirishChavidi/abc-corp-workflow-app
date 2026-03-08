import { create } from 'zustand';

const useStore = create((set, get) => ({
  // ─── Auth state ─────────────────────────────────────────────────────────
  user: JSON.parse(localStorage.getItem('abc_user') || 'null'),
  token: localStorage.getItem('abc_token') || null,

  setAuth: (user, token) => {
    localStorage.setItem('abc_user', JSON.stringify(user));
    localStorage.setItem('abc_token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('abc_user');
    localStorage.removeItem('abc_token');
    set({ user: null, token: null });
  },

  isManager: () => get().user?.role === 'account_manager',
  isClient: () => get().user?.role === 'client',

  // ─── UI state ───────────────────────────────────────────────────────────
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // ─── Notification ─────────────────────────────────────────────────────
  notification: null,
  showNotification: (message, type = 'success') => {
    set({ notification: { message, type } });
    setTimeout(() => set({ notification: null }), 4000);
  },
}));

export default useStore;
