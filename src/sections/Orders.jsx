import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  XCircle, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Layers,
  FileCheck,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Orders({ 
  students, 
  orders, 
  onUpdateOrder, 
  onAddTransaction, 
  onAddAlert, 
  addToast,
  onNavigate,
  initialFilterOrderId 
}) {
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [expandedOrders, setExpandedOrders] = useState({});
  const [reprintReason, setReprintReason] = useState('');
  const [reprintOrderId, setReprintOrderId] = useState(null);

  const getExpectedPickupDate = (createdAtStr) => {
    const orderDate = createdAtStr ? new Date(createdAtStr) : new Date();
    const pickupDate = new Date(orderDate);
    pickupDate.setDate(orderDate.getDate() + 1);
    if (pickupDate.getDay() === 0) {
      pickupDate.setDate(pickupDate.getDate() + 1);
    }
    return pickupDate.toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Handle navigated alert order highlighting
  useEffect(() => {
    if (initialFilterOrderId) {
      const ord = orders.find(o => o.id === initialFilterOrderId);
      if (ord) {
        setActiveTab('All');
        setSearchTerm(initialFilterOrderId);
        setExpandedOrders(prev => ({ ...prev, [initialFilterOrderId]: true }));
      }
    }
  }, [initialFilterOrderId, orders]);

  // Tab configurations matching new flow
  const tabs = ['All', 'New', 'Accepted', 'Printing', 'Ready', 'Done', 'Issue'];

  // Helper for counts
  const getTabCount = (tab) => {
    if (tab === 'All') return orders.length;
    return orders.filter(o => o.status === tab).length;
  };

  // Get student info
  const getStudentInfo = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student || { id: studentId, name: 'Unknown Student', branch: 'N/A', section: 'N/A', roll_no: 'N/A' };
  };

  // Status style mapping
  const statusStyles = {
    New: 'bg-blue-50 text-blue-700 border-blue-200',
    Accepted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Printing: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse-soft',
    Ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Done: 'bg-slate-50 text-slate-700 border-slate-200',
    Issue: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  // Expand toggle
  const toggleExpand = (id) => {
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Flow Transition Triggers
  const handleAccept = async (orderId) => {
    const { error } = await supabase.orders.update(orderId, { 
      status: 'Accepted', 
      accepted_at: new Date().toISOString()
    });
    if (!error) {
      onUpdateOrder(orderId, { 
        status: 'Accepted', 
        accepted_at: new Date().toISOString() 
      });
      addToast(`Order #${orderId} Accepted! Student notified. 👍`, 'success');
    }
  };

  const handleMarkPrinting = async (orderId) => {
    const { error } = await supabase.orders.update(orderId, { status: 'Printing' });
    if (!error) {
      onUpdateOrder(orderId, { status: 'Printing' });
      addToast(`Order #${orderId} sent to Printing partner! 🖨️`, 'success');
    }
  };

  const handleMarkReady = async (orderId) => {
    const { error } = await supabase.orders.update(orderId, { 
      status: 'Ready',
      ready_at: new Date().toISOString()
    });
    if (!error) {
      onUpdateOrder(orderId, { 
        status: 'Ready', 
        ready_at: new Date().toISOString() 
      });
      addToast(`Order #${orderId} is Ready for pickup/delivery! 📦`, 'success');
    }
  };

  const handleMarkDelivered = async (orderId) => {
    const { error } = await supabase.orders.update(orderId, { 
      status: 'Done',
      collected_at: new Date().toISOString()
    });
    if (!error) {
      onUpdateOrder(orderId, { 
        status: 'Done', 
        collected_at: new Date().toISOString() 
      });
      addToast(`Order #${orderId} marked as Delivered! 🎉`, 'success');
    }
  };

  const handleReject = async (orderId) => {
    const confirm = window.confirm('Are you sure you want to reject this order?');
    if (!confirm) return;
    
    const { error } = await supabase.orders.update(orderId, { status: 'Issue', reprint_reason: 'Rejected by operator' });
    if (!error) {
      onUpdateOrder(orderId, { status: 'Issue', reprint_reason: 'Rejected by operator' });
      
      const order = orders.find(o => o.id === orderId);
      if (order) {
        await supabase.orders.update(orderId, { credits_used: 0 });
        onUpdateOrder(orderId, { credits_used: 0 });
        
        onAddTransaction({
          order_id: orderId,
          type: 'Debit',
          amount: order.credits_used,
          note: `Refund: Order #${orderId} rejected. ₹${order.credits_used} refunded via UPI.`
        });
      }
      
      addToast(`Order #${orderId} rejected. Payment refunded to student.`, 'warning');
    }
  };

  const handleResolve = async (orderId) => {
    const { error } = await supabase.orders.update(orderId, { status: 'New' });
    if (!error) {
      onUpdateOrder(orderId, { status: 'New', reprint_reason: null });
      addToast(`Issue resolved. Order #${orderId} moved back to New Queue.`, 'success');
    }
  };

  const handleRefund = async (orderId) => {
    const confirm = window.confirm('Refund this order? Payment will be returned.');
    if (!confirm) return;

    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    await supabase.orders.update(orderId, { status: 'Done', credits_used: 0 });
    onUpdateOrder(orderId, { status: 'Done', credits_used: 0 });
    
    onAddTransaction({
      order_id: orderId,
      type: 'Debit',
      amount: order.credits_used,
      note: `Refund: Order #${orderId} failed quality check. ₹${order.credits_used} refunded via UPI.`
    });

    addToast(`Order #${orderId} refunded successfully.`, 'warning');
  };

  // Reprint creates job copy without charging credits again
  const handleReprintSubmit = async (e) => {
    e.preventDefault();
    if (!reprintReason.trim()) return;

    const order = orders.find(o => o.id === reprintOrderId);
    if (!order) return;

    const newOrderObj = {
      id: String(Math.floor(1000 + Math.random() * 9000)),
      student_id: order.student_id,
      operator_id: 'op-1',
      status: 'Printing',
      pages: order.pages,
      type: order.type,
      size: order.size,
      finishing: order.finishing,
      pdf_url: `[Reprint] ${order.pdf_url}`,
      credits_used: 0, 
      reprint_reason: `Reprinted: ${reprintReason}`,
      created_at: new Date().toISOString(),
      accepted_at: new Date().toISOString(),
      ready_at: null,
      collected_at: null
    };
    
    onUpdateOrder(null, newOrderObj); 

    onAddAlert({
      type: 'Warning',
      message: `Reprint job created for #${order.id} (Quality: ${reprintReason})`,
      related_order_id: newOrderObj.id
    });

    addToast(`Reprint job created for Order #${order.id}!`, 'success');
    setReprintOrderId(null);
    setReprintReason('');
  };

  // Trigger real or mock download of the student uploaded file
  const handleDownloadFile = (order) => {
    const cachedFile = window.copycampus_uploaded_file;
    if (cachedFile && cachedFile.name === order.pdf_url) {
      const url = URL.createObjectURL(cachedFile);
      const link = document.createElement('a');
      link.href = url;
      link.download = cachedFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast(`Downloading student's uploaded file: ${cachedFile.name}`, 'success');
    } else {
      const content = `CopyCampus Mock PDF Document\n============================\nOrder ID: #${order.id}\nDocument Name: ${order.pdf_url}\nPages: ${order.pages}\nType: ${order.type}\nFinishing: ${order.finishing}\nCreated At: ${new Date(order.created_at).toLocaleString()}\n\n[This is a mock print document fallback since the original uploaded file is not in this browser session's memory.]`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = order.pdf_url.endsWith('.pdf') ? order.pdf_url : `${order.pdf_url}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast(`Downloading mock file: ${order.pdf_url}`, 'info');
    }
  };

  // Filter computation
  const filteredOrders = orders.filter(order => {
    if (activeTab !== 'All' && order.status !== activeTab) return false;

    const student = getStudentInfo(order.student_id);
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (typeFilter !== 'All' && order.type !== typeFilter) return false;

    const orderDate = new Date(order.created_at);
    const today = new Date();
    if (dateFilter === 'Today') {
      if (orderDate.toDateString() !== today.toDateString()) return false;
    } else if (dateFilter === 'Week') {
      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (orderDate < oneWeekAgo) return false;
    } else if (dateFilter === 'Month') {
      const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (orderDate < oneMonthAgo) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dispatch Terminal</h1>
        <p className="text-slate-500 text-sm mt-1">Monitor print orders progress, coordinate with printing partners, and dispatch completed items.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        {tabs.map((tab) => {
          const count = getTabCount(tab);
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSearchTerm('');
              }}
              className={`px-4 py-3 font-bold text-sm shrink-0 border-b-2 transition-all flex items-center gap-1.5 ${
                isActive 
                  ? 'border-brand text-brand bg-brand/5 rounded-t-lg' 
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
              }`}
            >
              <span>{tab === 'Done' ? 'Delivered' : tab}</span>
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                isActive ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative md:col-span-2">
          <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name or Order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand bg-white text-sm"
          />
        </div>

        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand bg-white text-sm appearance-none cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="B&W">B&W</option>
            <option value="Color">Color</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand bg-white text-sm appearance-none cursor-pointer"
          >
            <option value="All">All Dates</option>
            <option value="Today">Today</option>
            <option value="Week">This Week</option>
            <option value="Month">This Month</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Orders Grid */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <span className="text-slate-400 font-medium block">No matching orders found!</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredOrders.map((order) => {
              const student = getStudentInfo(order.student_id);
              const isExpanded = !!expandedOrders[order.id];

              return (
                <div key={order.id} className="transition-colors hover:bg-slate-50/20">
                  
                  {/* Row Header */}
                  <div 
                    onClick={() => toggleExpand(order.id)}
                    className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-4">
                      <button className="mt-1 text-slate-400 hover:text-slate-600 focus:outline-none hidden md:block">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-slate-500">#{order.id}</span>
                          {order.is_bulk && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              Large Order
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-slate-700 block mt-1">{student.name}</span>
                        <span className="text-xs text-slate-400">{student.branch} · Sec {student.section}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium block">Specs</span>
                        <span className="font-semibold text-slate-700">
                          {order.pages} pages · {order.type} · {order.size}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Finishing</span>
                        <span className="font-semibold text-slate-700">{order.finishing}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Price</span>
                        <span className="font-extrabold text-brand text-sm">₹{order.credits_used}</span>
                      </div>
                    </div>

                    {/* Status Actions Mapping */}
                    <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end border-t border-slate-100 md:border-t-0 pt-3 md:pt-0">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${statusStyles[order.status]}`}>
                        {order.status === 'Done' ? 'Delivered' : order.status}
                      </span>
                      
                      <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                        {order.status === 'New' && (
                          <>
                            <button 
                              onClick={() => handleAccept(order.id)}
                              className="px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-dark text-white font-bold text-xs shadow-sm transition-colors"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => handleReject(order.id)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {order.status === 'Accepted' && (
                          <button 
                            onClick={() => handleMarkPrinting(order.id)}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-colors"
                          >
                            Mark Printing
                          </button>
                        )}
                        {order.status === 'Printing' && (
                          <button 
                            onClick={() => handleMarkReady(order.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-1"
                          >
                            <FileCheck className="w-3.5 h-3.5" /> Out for Delivery
                          </button>
                        )}
                        {order.status === 'Ready' && (
                          <button 
                            onClick={() => handleMarkDelivered(order.id)}
                            className="px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-dark text-white font-bold text-xs shadow-sm transition-colors"
                          >
                            Mark Delivered
                          </button>
                        )}
                        {order.status === 'Issue' && (
                          <>
                            <button 
                              onClick={() => handleResolve(order.id)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition-colors"
                            >
                              Resolve
                            </button>
                            <button 
                              onClick={() => handleRefund(order.id)}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors"
                            >
                              Refund
                            </button>
                          </>
                        )}
                        {order.status === 'Done' && (
                          <span className="text-xs text-slate-400 font-bold px-2">Delivered ✓</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expand Panel */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-50 bg-slate-50/20 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                      
                      {/* PDF Preview */}
                      <div className="lg:col-span-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Uploaded Document</span>
                        <div className="border border-slate-200 rounded-xl bg-white p-4 flex flex-col justify-between min-h-[170px] shadow-sm relative overflow-hidden group">
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <FileText className="w-8 h-8 text-rose-500 shrink-0" />
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-700 block truncate" title={order.pdf_url}>
                                  {order.pdf_url || 'document_upload.pdf'}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  Size: {(order.pages * 0.12).toFixed(1)} MB · {order.pages} Pages
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Download Action */}
                          <div className="my-2">
                            <button
                              onClick={() => handleDownloadFile(order)}
                              className="w-full py-2 bg-brand/10 hover:bg-brand text-brand hover:text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-155 border border-brand/20 hover:shadow-xs"
                            >
                              <FileText className="w-3.5 h-3.5" /> Download File
                            </button>
                          </div>

                          <div className="grid grid-cols-5 gap-1.5 opacity-40">
                            {Array(Math.min(order.pages, 5)).fill(0).map((_, i) => (
                              <div key={i} className="aspect-[3/4] border border-slate-200 rounded bg-slate-50 flex items-center justify-center text-[8px] font-bold text-slate-400">
                                {i+1}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Details & Notes */}
                      <div className="lg:col-span-1 space-y-3.5 text-xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Student Details</span>
                          <span className="font-semibold text-slate-700 block">Roll: {student.roll_no}</span>
                          <span className="text-slate-500 mt-0.5 block">Payment: <span className="font-bold text-emerald-600">Paid (UPI Direct QR Checkout)</span></span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Pickup & Schedule</span>
                          <span className="font-bold text-brand block bg-brand/5 border border-brand/10 px-2.5 py-1.5 rounded-lg space-y-1">
                            <span className="block">📍 {order.pickup_location || 'Library (Default)'}</span>
                            <span className="block text-[10px] text-slate-500">📅 Expected: {getExpectedPickupDate(order.created_at)}</span>
                            <span className="block text-[10px] text-slate-600 font-extrabold">🕒 Lunch Slot: {order.collection_time || '01:00 PM - 01:10 PM'}</span>
                          </span>
                        </div>

                        {order.reprint_reason && (
                          <div className="p-2.5 rounded-lg bg-purple-50/50 border border-purple-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 block mb-1">Reprint Logs</span>
                            <p className="text-purple-900 italic font-medium">"{order.reprint_reason}"</p>
                          </div>
                        )}

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Instructions</span>
                          <div className="p-2.5 rounded-lg border border-slate-100 bg-white text-slate-600">
                            {order.id === '1044' ? 'Print margins double-sided and stapled.' : 'No special instructions.'}
                          </div>
                        </div>
                      </div>

                      {/* Timestamps & Messaging shortcut */}
                      <div className="lg:col-span-1 flex flex-col justify-between">
                        <div className="text-xs text-slate-600 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Order Timestamps</span>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Ordered:</span>
                            <span className="font-medium">{new Date(order.created_at).toLocaleString()}</span>
                          </div>
                          {order.accepted_at && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Accepted:</span>
                              <span className="font-medium">{new Date(order.accepted_at).toLocaleString()}</span>
                            </div>
                          )}
                          {order.ready_at && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Ready/Out for Delivery:</span>
                              <span className="font-medium">{new Date(order.ready_at).toLocaleString()}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex gap-2">
                          {/* Chat shortcut */}
                          <button
                            onClick={() => onNavigate('messages', { studentId: order.student_id })}
                            className="flex-1 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-indigo-100"
                          >
                            <MessageSquare className="w-4 h-4" /> Message Student
                          </button>

                          {/* Reprint shortcut */}
                          {(order.status === 'Issue' || order.status === 'Done') && (
                            <button
                              onClick={() => setReprintOrderId(order.id)}
                              className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors bg-white"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Reprint Copy
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reprint Modal */}
      {reprintOrderId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-100 shadow-xl animate-scale-up">
            <h3 className="text-lg font-bold text-slate-800">Trigger Reprint Job</h3>
            <p className="text-xs text-slate-500 mt-1">This duplicates the order. No extra credits will be charged to the student.</p>

            <form onSubmit={handleReprintSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Reason for reprint</label>
                <textarea
                  required
                  placeholder="e.g. Page margins cut off by printing partner, re-requesting binding"
                  value={reprintReason}
                  onChange={(e) => setReprintReason(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-brand h-24"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setReprintOrderId(null); setReprintReason(''); }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand text-white hover:bg-brand-dark rounded-xl text-xs font-bold shadow-sm"
                >
                  Confirm Reprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
