import React, { useState } from 'react';
import { Bell, User, Sun, Moon, Shield } from 'lucide-react';

export default function TopBar({ operator, unreadAlertsCount, onNavigateToAlerts, darkMode, toggleDarkMode }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Get initials for operator avatar
  const getInitials = (name) => {
    if (!name) return 'OP';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand logo */}
      <div className="flex items-center gap-2">
        <span className="text-xl tracking-tight text-slate-800 dark:text-slate-100">
          Copy<span className="font-extrabold text-brand">Campus</span>
        </span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-light hidden sm:inline-block">
          Staff Terminal
        </span>
      </div>

      {/* Operator User Actions & Notifications */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Alerts Bell notification icon */}
        <button
          onClick={onNavigateToAlerts}
          className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-brand dark:hover:text-brand-light hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-all focus:outline-none"
          title="View Alerts"
        >
          <Bell className="w-5 h-5" />
          {unreadAlertsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />

        {/* Operator Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 focus:outline-none hover:opacity-90 transition-opacity"
          >
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{operator?.name || 'Operator'}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{operator?.shop_name || 'Campus Copy Desk'}</span>
            </div>
            
            {/* Initials Avatar */}
            <div className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm ring-2 ring-brand/10 select-none shadow-sm">
              {getInitials(operator?.name)}
            </div>
          </button>

          {dropdownOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              
              {/* Dropdown glassmorphism container */}
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/40 dark:border-slate-800/40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 shadow-xl space-y-3.5 z-50 animate-scale-up text-left text-slate-800 dark:text-slate-100">
                {/* Operator info */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block leading-tight">{operator?.name || 'Operator Mayank'}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1">{operator?.shop_name || 'CopyCampus Library Canteen'}</span>
                </div>

                {/* Role badge */}
                <div className="flex items-center gap-1.5 bg-brand/5 dark:bg-brand/10 border border-brand/10 dark:border-brand/20 p-2 rounded-xl">
                  <Shield className="w-4 h-4 text-brand dark:text-brand-light shrink-0" />
                  <span className="text-[11px] font-extrabold text-brand dark:text-brand-light">Administrator / Staff Desk</span>
                </div>

                {/* Dark Mode Switcher */}
                <div className="flex items-center justify-between border-t border-b border-slate-100 dark:border-slate-800 py-2">
                  <span className="text-xs font-bold text-slate-650 dark:text-slate-350">Dark Mode</span>
                  <button
                    type="button"
                    onClick={() => toggleDarkMode()}
                    className="p-1.5 bg-slate-150/60 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {darkMode ? (
                      <Sun className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Moon className="w-4 h-4 text-slate-650" />
                    )}
                  </button>
                </div>

                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium text-center">
                  CopyCampus Operator Terminal
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
