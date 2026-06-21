import React from 'react';
import { 
  LayoutGrid, 
  FileText, 
  IndianRupee, 
  MessageSquare, 
  Users, 
  AlertCircle, 
  Settings 
} from 'lucide-react';

export default function Sidebar({ currentSection, onSelectSection, unreadAlertsCount }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'orders', label: 'Orders', icon: FileText },
    { id: 'earnings', label: 'Earnings', icon: IndianRupee },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'alerts', label: 'Alerts', icon: AlertCircle, showBadge: true },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex w-64 border-r border-slate-200/80 bg-white flex-col justify-between h-[calc(100vh-64px)] sticky top-16 z-30 select-none">
      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-150 group font-medium ${
                isActive 
                  ? 'bg-brand text-white shadow-sm shadow-brand/20' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 transition-transform duration-150 group-hover:scale-105 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                }`} />
                <span className="text-sm">{item.label}</span>
              </div>
              
              {/* Conditional Badges */}
              {item.showBadge && unreadAlertsCount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${
                  isActive 
                    ? 'bg-white text-brand' 
                    : 'bg-rose-500 text-white'
                }`}>
                  {unreadAlertsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Branding Info */}
      <div className="p-4 border-t border-slate-100 text-center">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
          CopyCampus v1.0.0
        </span>
        <span className="text-[10px] text-slate-400 block mt-0.5">
          Local Mock Sandbox Mode
        </span>
      </div>
    </aside>
  );
}
