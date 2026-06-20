import React from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Info, 
  Trash2, 
  CheckCheck,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Alerts({ alerts, onUpdateAlerts, onNavigate, addToast }) {
  // Mark individual alert as read
  const handleMarkAsRead = async (id) => {
    const { data, error } = await supabase.alerts.update(id, { is_read: true });
    if (!error) {
      onUpdateAlerts(alerts.map(a => a.id === id ? { ...a, is_read: true } : a));
    }
  };

  // Mark all read
  const handleMarkAllRead = async () => {
    const { error } = await supabase.alerts.markAllRead();
    if (!error) {
      onUpdateAlerts(alerts.map(a => ({ ...a, is_read: true })));
      addToast('All notifications marked as read.', 'success');
    }
  };

  // Alert category formatting mapper
  const getAlertConfig = (type) => {
    switch (type) {
      case 'Low Supply':
      case 'Warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-amber-500',
          bgColor: 'bg-amber-50/50 border-amber-100',
          dotColor: 'bg-amber-500'
        };
      case 'Issue':
        return {
          icon: AlertTriangle,
          iconColor: 'text-rose-500',
          bgColor: 'bg-rose-50/50 border-rose-100',
          dotColor: 'bg-rose-500'
        };
      case 'New Order':
        return {
          icon: Info,
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-50/50 border-blue-100',
          dotColor: 'bg-blue-500'
        };
      case 'Payment':
        return {
          icon: CheckCircle,
          iconColor: 'text-emerald-500',
          bgColor: 'bg-emerald-50/50 border-emerald-100',
          dotColor: 'bg-emerald-500'
        };
      default:
        return {
          icon: Bell,
          iconColor: 'text-slate-500',
          bgColor: 'bg-slate-50/50 border-slate-100',
          dotColor: 'bg-slate-500'
        };
    }
  };

  // Click handler
  const handleAlertClick = (alert) => {
    // 1. Mark as read
    if (!alert.is_read) {
      handleMarkAsRead(alert.id);
    }
    
    // 2. Navigate based on alert type
    if (alert.related_order_id) {
      onNavigate('orders', { filterOrderId: alert.related_order_id });
    } else if (alert.type === 'Low Supply') {
      onNavigate('printers');
    }
  };

  // Segregate unread and read
  const unreadAlerts = alerts.filter(a => !a.is_read);
  const readAlerts = alerts.filter(a => a.is_read);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Alerts Hub</h1>
          <p className="text-slate-500 text-sm mt-1">Inbox console for real-time printer logs, student print disputes, and payment notifications.</p>
        </div>

        {/* Mark All Read Button */}
        {unreadAlerts.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 border border-slate-200 hover:border-brand hover:text-brand rounded-xl text-xs font-bold text-slate-600 flex items-center gap-1.5 self-start md:self-auto bg-white transition-all shadow-sm"
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {/* Main Panel layout */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden p-6 max-w-4xl">
        {alerts.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-12 h-12 text-slate-200 mx-auto mb-2" />
            <span className="text-slate-400 font-medium block">Notification inbox is empty!</span>
            <span className="text-xs text-slate-400">System alerts and alerts logs will arrive here.</span>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Unread Alerts Section */}
            {unreadAlerts.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <span>New Notifications</span>
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                </h3>

                <div className="space-y-2.5">
                  {unreadAlerts.map((alert) => {
                    const cfg = getAlertConfig(alert.type);
                    const AlertIcon = cfg.icon;

                    return (
                      <div
                        key={alert.id}
                        onClick={() => handleAlertClick(alert)}
                        className={`border p-4 rounded-xl flex items-start justify-between gap-4 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all ${cfg.bgColor}`}
                      >
                        <div className="flex gap-3">
                          <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 shrink-0 mt-0.5">
                            <AlertIcon className={`w-4 h-4 ${cfg.iconColor}`} />
                          </div>
                          
                          <div>
                            <span className="text-sm font-bold text-slate-800 leading-tight block">
                              {alert.message}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(alert.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleMarkAsRead(alert.id); }}
                            className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded hover:bg-slate-200/50"
                          >
                            Mark Read
                          </button>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Read Alerts Section */}
            {readAlerts.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Earlier Alerts
                </h3>

                <div className="space-y-2.5 opacity-70">
                  {readAlerts.slice(0, 10).map((alert) => {
                    const cfg = getAlertConfig(alert.type);
                    const AlertIcon = cfg.icon;

                    return (
                      <div
                        key={alert.id}
                        onClick={() => handleAlertClick(alert)}
                        className="border border-slate-100 bg-slate-50/50 p-3.5 rounded-xl flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-100/50 transition-colors"
                      >
                        <div className="flex gap-3">
                          <div className="p-1.5 rounded-lg bg-white border border-slate-100 shrink-0 mt-0.5">
                            <AlertIcon className={`w-3.5 h-3.5 text-slate-400`} />
                          </div>
                          
                          <div>
                            <span className="text-xs font-semibold text-slate-600 leading-tight block">
                              {alert.message}
                            </span>
                            <span className="text-[9px] text-slate-400 mt-1 block">
                              {new Date(alert.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-300 self-center" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
}
