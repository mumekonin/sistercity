import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { useThemeStore } from '../../store/theme.store';
import { authApi } from '../../api/auth.api';
import { useUnreadCount } from '../../hooks/useNotifications';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const unreadCount = useUnreadCount();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-[#0f172a] border-b border-blue-100 dark:border-slate-700 flex items-center justify-between px-4 md:px-6 transition-colors">

      {/* Left */}
      <div className="flex items-center gap-3">

        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* City badge */}
        <div className="flex items-center gap-2 bg-[#1a4a8a] text-white px-3 py-1.5 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-sm font-semibold">{user?.city ?? 'CITY'}</span>
        </div>

        {/* Search — hidden on mobile */}
        <form onSubmit={handleSearch} className="relative hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-blue-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, documents..."
            className="w-64 lg:w-80 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 dark:placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
          />
        </form>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">

        {/* Search icon — mobile only */}
        <button
          onClick={() => navigate('/search')}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-blue-400 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
        >
          {isDark ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 6.343l-.707-.707m12.728 12.728l-.707-.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative w-9 h-9 flex items-center justify-center rounded-lg text-blue-400 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg px-2 py-1.5 transition"
          >
            <div className="w-8 h-8 bg-[#1a4a8a] rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">
                {user?.fullName?.charAt(0) ?? 'U'}
              </span>
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-sm font-semibold text-[#1a4a8a] dark:text-white leading-none">
                {user?.fullName ?? 'User'}
              </p>
              <p className="text-xs text-blue-400 dark:text-slate-400 mt-0.5">
                {user?.jobTitle ?? 'Staff'}
              </p>
            </div>
            <svg className="w-4 h-4 text-blue-300 dark:text-slate-500 hidden lg:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl shadow-lg z-50">
              <div className="px-4 py-3 border-b border-blue-50 dark:border-slate-700">
                <p className="text-sm font-semibold text-[#1a4a8a] dark:text-white truncate">
                  {user?.fullName}
                </p>
                <p className="text-xs text-blue-400 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
              <div className="p-2">
                <button
                  onClick={() => { navigate('/settings'); setShowDropdown(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#1a4a8a] dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition"
                >
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile & Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}