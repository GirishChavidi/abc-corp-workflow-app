import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useStore from '../store';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['account_manager', 'client'] },
  { path: '/projects', label: 'Projects', icon: '📁', roles: ['account_manager', 'client'] },
  { path: '/clients', label: 'Clients', icon: '🏢', roles: ['account_manager', 'client'] },
  { path: '/vendors', label: 'Vendors', icon: '🔧', roles: ['account_manager'] },
  { path: '/trainees', label: 'Trainees', icon: '👥', roles: ['account_manager', 'client'] },
];

export default function Layout() {
  const { user, logout, sidebarOpen, toggleSidebar } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-900 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-gray-700">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
            ABC
          </div>
          {sidebarOpen && (
            <div>
              <h1 className="font-bold text-sm">ABC Corp</h1>
              <p className="text-gray-400 text-xs">Workflow Manager</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          {filteredNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors text-sm ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-700">
          {sidebarOpen && (
            <div className="mb-3">
              <p className="font-medium text-sm truncate">{user?.name}</p>
              <p className="text-gray-400 text-xs capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full text-left text-gray-400 hover:text-white text-sm py-2 px-2 rounded hover:bg-gray-800 transition-colors"
          >
            {sidebarOpen ? '🚪 Logout' : '🚪'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <span className={`badge ${user?.role === 'account_manager' ? 'badge-active' : 'badge-training'}`}>
              {user?.role === 'account_manager' ? 'Account Manager' : 'Client'}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
