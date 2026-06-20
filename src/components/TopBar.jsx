import React from 'react';
import { Bell, User } from 'lucide-react';

export default function TopBar({ operator, unreadAlertsCount, onNavigateToAlerts }) {
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
    <header className="h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand logo */}
      <div className="flex items-center gap-2">
        <span className="text-xl tracking-tight text-slate-800">
          Copy<span className="font-extrabold text-brand">Campus</span>
        </span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
          Staff Terminal
        </span>
      </div>

      {/* Operator User Actions & Notifications */}
      <div className="flex items-center gap-4">
        {/* Alerts Bell notification icon */}
        <button
          onClick={onNavigateToAlerts}
          className="relative p-2 text-slate-500 hover:text-brand hover:bg-slate-50 rounded-full transition-all focus:outline-none"
          title="View Alerts"
        >
          <Bell className="w-5 h-5" />
          {unreadAlertsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200" />

        {/* Operator Profile */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-700">{operator?.name || 'Loading Operator...'}</span>
            <span className="text-xs text-slate-500">{operator?.shop_name || 'Loading Shop...'}</span>
          </div>
          
          {/* Initials Avatar */}
          <div className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm ring-2 ring-brand/10 select-none">
            {getInitials(operator?.name)}
          </div>
        </div>
      </div>
    </header>
  );
}
