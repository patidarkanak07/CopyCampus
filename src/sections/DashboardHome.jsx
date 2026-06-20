import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ArrowRight,
  Flame,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function DashboardHome({ onNavigate, students, orders, alerts, transactions }) {
  const [operator, setOperator] = useState(null);
  const [greeting, setGreeting] = useState('');

  // Fetch operator profile
  useEffect(() => {
    const fetchOperator = async () => {
      const { data } = await supabase.operators.get();
      if (data) setOperator(data);
    };
    fetchOperator();
  }, []);

  // Determine greeting based on time of day
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting('Good morning');
    else if (hours < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Helpers to calculate metrics
  const todayStr = new Date().toDateString();

  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === todayStr);
  const activeOrders = orders.filter(o => o.status === 'New' || o.status === 'Accepted' || o.status === 'Printing' || o.status === 'Ready');
  
  const todayEarnings = transactions
    .filter(t => t.type === 'Credit' && new Date(t.created_at).toDateString() === todayStr)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const pagesPrintedToday = orders
    .filter(o => (o.status === 'Ready' || o.status === 'Done' || o.status === 'Delivered') && new Date(o.created_at).toDateString() === todayStr)
    .reduce((acc, o) => {
      if (o.type === 'B&W') acc.bw += o.pages;
      else acc.color += o.pages;
      return acc;
    }, { bw: 0, color: 0 });

  // Top 8 Active Queue
  const activeQueue = orders
    .filter(o => o.status !== 'Done' && o.status !== 'Delivered')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 8);

  // Latest 3 unread alerts
  const latestAlerts = alerts
    .filter(a => !a.is_read)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3);

  // Helper for Student names
  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'Unknown Student';
  };

  // Status badge style mapping
  const statusStyles = {
    New: 'bg-blue-50 text-blue-700 border-blue-200',
    Accepted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Printing: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse-soft',
    Ready: 'bg-green-50 text-green-700 border-green-200',
    Delivered: 'bg-slate-50 text-slate-700 border-slate-200',
    Done: 'bg-slate-50 text-slate-700 border-slate-200',
    Issue: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  // Weekly Earnings calculation (Mon - Sun)
  const getWeeklyEarnings = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const earningsByDay = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    
    transactions
      .filter(t => t.type === 'Credit')
      .forEach(t => {
        const d = new Date(t.created_at);
        const dayName = days[d.getDay()];
        if (earningsByDay[dayName] !== undefined) {
          earningsByDay[dayName] += Number(t.amount);
        }
      });
      
    return earningsByDay;
  };

  const weeklyEarnings = getWeeklyEarnings();
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxEarningVal = Math.max(...Object.values(weeklyEarnings), 100);
  const weekTotal = Object.values(weeklyEarnings).reduce((a, b) => a + b, 0);
  
  let bestDay = 'Mon';
  let maxDayVal = 0;
  Object.entries(weeklyEarnings).forEach(([day, val]) => {
    if (val > maxDayVal) {
      maxDayVal = val;
      bestDay = day;
    }
  });

  // Heatmap calculation (7 days x 24 hours)
  const getHeatmapData = () => {
    const grid = Array(7).fill(0).map(() => Array(24).fill(0));
    orders.forEach(order => {
      const date = new Date(order.created_at);
      const day = (date.getDay() + 6) % 7; // Convert to Mon-Sun (0-6)
      const hour = date.getHours();
      grid[day][hour] += 1;
    });
    return grid;
  };
  
  const heatmapGrid = getHeatmapData();
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getHeatmapColor = (count) => {
    if (count === 0) return 'bg-slate-100 hover:bg-slate-200';
    if (count <= 1) return 'bg-purple-100 text-purple-900 hover:bg-purple-200';
    if (count <= 3) return 'bg-purple-300 text-purple-950 hover:bg-purple-400';
    if (count <= 5) return 'bg-purple-500 text-white hover:bg-purple-600';
    return 'bg-purple-700 text-white hover:bg-purple-800'; 
  };

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {greeting}, {operator?.name || 'Operator'} 👋
          </h1>
          <p className="text-slate-500 mt-1">
            Welcome back to the dispatcher cockpit at <span className="font-semibold text-brand">{operator?.shop_name}</span>.
          </p>
        </div>
        
        {operator?.closed_mode && (
          <div className="px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-sm font-semibold self-start md:self-auto">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
            Holiday Mode Active
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Today's Orders */}
        <div className="glass-card p-5 rounded-2xl border border-slate-100 flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-sm font-medium text-slate-400">Today's Orders</span>
            <span className="text-3xl font-extrabold text-slate-800 block mt-1">{todayOrders.length}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg self-start">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>↑ 8% vs yesterday</span>
          </div>
        </div>

        {/* Card 2: Active Orders */}
        <div className="glass-card p-5 rounded-2xl border border-slate-100 flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-sm font-medium text-slate-400">Active Queue</span>
            <span className="text-3xl font-extrabold text-slate-800 block mt-1">{activeOrders.length}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg self-start">
            <Clock className="w-3.5 h-3.5" />
            <span>Processing Dispatch</span>
          </div>
        </div>

        {/* Card 3: Today's Earnings */}
        <div className="glass-card p-5 rounded-2xl border border-slate-100 flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-sm font-medium text-slate-400">Today's Revenue</span>
            <span className="text-3xl font-extrabold text-slate-800 block mt-1">₹{todayEarnings}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg self-start">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>↑ 14% vs yesterday</span>
          </div>
        </div>

        {/* Card 4: Pages Printed */}
        <div className="glass-card p-5 rounded-2xl border border-slate-100 flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-sm font-medium text-slate-400">Dispatched Pages Today</span>
            <span className="text-3xl font-extrabold text-slate-800 block mt-1">
              {pagesPrintedToday.bw + pagesPrintedToday.color}
            </span>
          </div>
          <span className="text-xs text-slate-500 font-semibold block mt-4 bg-slate-50 px-2 py-1 rounded-lg self-start">
            {pagesPrintedToday.bw} B&W · {pagesPrintedToday.color} Color
          </span>
        </div>
      </div>

      {/* Main Grid: Active queue & alerts sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Span 2: Active Dispatch Queue */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <h2 className="text-lg font-bold text-slate-800">Active Order Dispatch Queue</h2>
            </div>
            <button 
              onClick={() => onNavigate('orders')}
              className="text-xs font-bold text-brand hover:text-brand-dark flex items-center gap-1"
            >
              Go to Dispatch Terminal <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeQueue.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-xl">
              <span className="text-slate-400 text-sm block font-medium">Dispatch queue is empty!</span>
              <span className="text-xs text-slate-400">No active student orders waiting for delivery.</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activeQueue.map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-extrabold text-slate-400">#{order.id}</span>
                    <div>
                      <span className="text-sm font-bold text-slate-700 block">{getStudentName(order.student_id)}</span>
                      <span className="text-xs text-slate-400">
                        {order.pages} pages · {order.type} {order.size} {order.finishing !== 'None' ? `· ${order.finishing}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-medium">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusStyles[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Span 1: Alerts & Chart */}
        <div className="space-y-6">
          
          {/* Alerts Panel */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Latest Alerts</h2>
              <button 
                onClick={() => onNavigate('alerts')}
                className="text-xs font-bold text-brand hover:text-brand-dark flex items-center gap-1"
              >
                Open Inbox <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {latestAlerts.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-slate-100 rounded-xl">
                <span className="text-slate-400 text-xs">No active alerts! All clean.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {latestAlerts.map((alert) => {
                  let borderStyle = 'border-slate-100 bg-slate-50';
                  let iconColor = 'text-slate-500';

                  if (alert.type === 'Warning') {
                    borderStyle = 'border-amber-100 bg-amber-50/40';
                    iconColor = 'text-amber-500';
                  } else if (alert.type === 'Issue') {
                    borderStyle = 'border-rose-100 bg-rose-50/40';
                    iconColor = 'text-rose-500';
                  } else if (alert.type === 'New Order') {
                    borderStyle = 'border-blue-100 bg-blue-50/40';
                    iconColor = 'text-blue-500';
                  } else if (alert.type === 'Payment') {
                    borderStyle = 'border-emerald-100 bg-emerald-50/40';
                    iconColor = 'text-emerald-500';
                  }

                  return (
                    <div 
                      key={alert.id} 
                      onClick={() => {
                        if (alert.related_order_id) {
                          onNavigate('orders', { filterOrderId: alert.related_order_id });
                        } else {
                          onNavigate('alerts');
                        }
                      }}
                      className={`border p-3 rounded-xl flex gap-2.5 items-start cursor-pointer hover:shadow-sm transition-shadow ${borderStyle}`}
                    >
                      <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${iconColor}`} />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-700 block leading-tight truncate">
                          {alert.message}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Weekly Earnings Chart */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Weekly Revenue Flow</h2>
            <span className="text-xs font-semibold text-slate-400 block mb-6">Direct print order payments (₹)</span>
            
            <div className="h-32 flex items-end gap-3 px-2">
              {weekDays.map((day) => {
                const amount = weeklyEarnings[day] || 0;
                const percent = maxEarningVal > 0 ? (amount / maxEarningVal) * 100 : 0;
                const isToday = day === ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];

                return (
                  <div key={day} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                    <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      ₹{amount}
                    </div>

                    <div className="w-full bg-slate-100 rounded-t-md hover:bg-slate-200 transition-colors flex items-end overflow-hidden h-24">
                      <div 
                        className={`w-full rounded-t-md transition-all duration-500 ${isToday ? 'bg-brand' : 'bg-slate-400'}`} 
                        style={{ height: `${Math.max(percent, 4)}%` }} 
                      />
                    </div>

                    <span className={`text-[10px] mt-1.5 font-bold ${isToday ? 'text-brand' : 'text-slate-400'}`}>
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Total (Current Week)</span>
                <span className="text-sm font-bold text-slate-700">₹{weekTotal}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 font-medium block">Busiest Day</span>
                <span className="text-sm font-bold text-slate-700">{bestDay} (₹{weeklyEarnings[bestDay]})</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Heatmap Row */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-purple-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-800">Peak Hour Heatmap</h2>
              <p className="text-xs text-slate-400 mt-0.5">Order density distribution by hours and weekdays (IST)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
            <span>Low</span>
            <div className="w-2.5 h-2.5 rounded bg-purple-100" />
            <div className="w-2.5 h-2.5 rounded bg-purple-300" />
            <div className="w-2.5 h-2.5 rounded bg-purple-500" />
            <div className="w-2.5 h-2.5 rounded bg-purple-700" />
            <span>High</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="flex items-center mb-1 text-[10px] font-bold text-slate-400">
              <div className="w-10 shrink-0 text-right pr-2">Day</div>
              <div className="flex-1 flex justify-between pl-1">
                {Array(24).fill(0).map((_, h) => (
                  <span key={h} className="w-full text-center shrink-0">
                    {h === 0 ? '12a' : h === 12 ? '12p' : h % 12}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              {dayLabels.map((day, dIdx) => (
                <div key={day} className="flex items-center">
                  <div className="w-10 shrink-0 text-xs font-bold text-slate-500 text-right pr-2">
                    {day}
                  </div>
                  <div className="flex-1 flex gap-1 pl-1">
                    {heatmapGrid[dIdx].map((val, hour) => (
                      <div
                        key={hour}
                        className={`flex-1 h-6 rounded cursor-pointer transition-all flex items-center justify-center text-[8px] font-bold ${getHeatmapColor(val)}`}
                        title={`${day} ${hour}:00 - ${val} orders`}
                      >
                        {val > 0 && val}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
