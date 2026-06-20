import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  CreditCard, 
  Clock, 
  MessageSquare, 
  Send, 
  LogOut, 
  Coins, 
  FileText, 
  Sparkles,
  CheckCircle,
  QrCode,
  AlertTriangle,
  Bot,
  History,
  FileCheck,
  Check,
  ArrowRight,
  Bell
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function StudentPortal({ 
  studentId, 
  students, 
  orders, 
  messages, 
  operator,
  onUpdateStudent, 
  onAddOrder, 
  onAddRecharge, 
  onAddMessage, 
  onLogout, 
  addToast 
}) {
  const [activeTab, setActiveTab] = useState('print'); // 'print', 'track', 'notifications', 'chat'
  const student = students.find(s => s.id === studentId) || { id: studentId, name: 'Priya Patel', roll_no: 'EE23B1045' };

  // File Upload State
  const [fileObject, setFileObject] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [printType, setPrintType] = useState('B&W'); 
  const [pageSize, setPageSize] = useState('A4'); 
  const [sides, setSides] = useState('Double-Sided'); 
  const [finishing, setFinishing] = useState('None'); 
  const [pickupLocation, setPickupLocation] = useState('Library');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  
  // Custom Page Range & Paper Type States
  const [pdfTotalPages, setPdfTotalPages] = useState(1);
  const [pageRangeMode, setPageRangeMode] = useState('All'); // 'All' or 'Custom'
  const [fromPage, setFromPage] = useState(1);
  const [toPage, setToPage] = useState(1);
  const [paperType, setPaperType] = useState('Normal'); // 'Normal', 'Glossy', 'Bond'

  const pickupLocations = [
    'Front Gate Canteen',
    'Back Gate Canteen',
    'Block One',
    'Block Two',
    'Block Three',
    'Basketball Court',
    'Near Sports Complex',
    'Library',
    'Reception'
  ];

  const [collectionTime, setCollectionTime] = useState('01:00 PM - 01:10 PM');

  const lunchSlots = [
    '01:00 PM - 01:10 PM',
    '01:10 PM - 01:20 PM',
    '01:20 PM - 01:30 PM',
    '01:30 PM - 01:40 PM',
    '01:40 PM - 01:50 PM'
  ];
  
  // File Parsing Loader
  const [isParsing, setIsParsing] = useState(false);

  // Order Placed Success View State
  const [orderReceipt, setOrderReceipt] = useState(null); // Order success view state

  // Chat State
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  // Scroll chat
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Notifications State & LocalStorage Persistence
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem(`copycampus_notifications_${studentId}`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(`copycampus_notifications_${studentId}`, JSON.stringify(notifications));
  }, [notifications, studentId]);

  // Status Change Notification Tracker
  const prevOrdersRef = useRef({});

  useEffect(() => {
    if (!orders || orders.length === 0) return;
    
    const currentStudentOrders = orders.filter(o => o.student_id === studentId);
    
    currentStudentOrders.forEach(order => {
      const prevStatus = prevOrdersRef.current[order.id];
      
      if (prevStatus && prevStatus !== order.status) {
        const message = `Order #${order.id} ("${order.pdf_url}") status updated to: ${order.status}`;
        addToast(message, 'success');
        
        setNotifications(prev => [
          {
            id: Math.random().toString(36).substr(2, 9),
            orderId: order.id,
            pdfName: order.pdf_url,
            oldStatus: prevStatus,
            newStatus: order.status,
            timestamp: new Date().toISOString()
          },
          ...prev
        ]);
      }
      prevOrdersRef.current[order.id] = order.status;
    });

    orders.forEach(order => {
      if (order.student_id === studentId && !prevOrdersRef.current[order.id]) {
        prevOrdersRef.current[order.id] = order.status;
      }
    });
  }, [orders, studentId, addToast]);

  // Computed page print count
  const pagesCount = pageRangeMode === 'Custom' ? Math.max(1, toPage - fromPage + 1) : pdfTotalPages;

  // Dynamic Pricing constants from operator setting
  const priceBw = operator?.price_bw ?? 2;
  const priceColor = operator?.price_color ?? 7;
  const surchargeA3 = operator?.price_a3_surcharge ?? 3;
  const surchargeSpiral = operator?.price_binding ?? 20;
  const surchargeStapling = operator?.price_stapling ?? 5;

  const getPaperBasePrice = (type) => {
    switch (type) {
      case 'Glossy': return 50;
      case 'Bond': return 5;
      case 'Normal':
      default: return 2;
    }
  };

  const paperBasePrice = getPaperBasePrice(paperType);
  const colorSurcharge = printType === 'Color' ? 5 : 0;
  const pageBasePrice = paperBasePrice + colorSurcharge;

  const baseCost = pageBasePrice * pagesCount;
  const surchargeCost = (pageSize === 'A3' ? surchargeA3 : 0) * pagesCount;
  const finishingCost = finishing === 'Spiral Binding' ? surchargeSpiral : finishing === 'Stapling' ? surchargeStapling : 0;
  const estimatedCost = baseCost + surchargeCost + finishingCost;

  // Dynamic Shop Status based on College Timings:
  // Operating Hours: 10:30 AM - 5:00 PM
  // Lunch Break: 1:00 PM - 1:50 PM
  const getShopStatus = () => {
    return {
      status: 'Open',
      color: 'bg-emerald-500',
      text: 'bg-emerald-50 border-emerald-100 text-emerald-700',
      message: 'Desk is OPEN! Orders can be placed 24/7 and will be ready for pickup tomorrow in college.'
    };
  };

  const shopStatus = getShopStatus();

  const getExpectedPickupDate = (orderDateStr) => {
    const orderDate = orderDateStr ? new Date(orderDateStr) : new Date();
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

  const countPdfPages = (file) => {
    return new Promise((resolve) => {
      if (file.type !== 'application/pdf') {
        resolve(1);
        return;
      }
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const arr = new Uint8Array(e.target.result);
          let str = '';
          const len = arr.length;
          const chunk = 65536;
          for (let i = 0; i < len; i += chunk) {
            str += String.fromCharCode.apply(null, arr.subarray(i, Math.min(i + chunk, len)));
          }
          
          const countMatch = str.match(/\/Count\s+(\d+)/);
          if (countMatch && countMatch[1]) {
            const countVal = parseInt(countMatch[1], 10);
            if (countVal > 0 && countVal < 10000) {
              resolve(countVal);
              return;
            }
          }
          
          const pageMatches = str.match(/\/Type\s*\/Page\b/g);
          if (pageMatches) {
            resolve(pageMatches.length);
            return;
          }
          
          resolve(1);
        } catch (err) {
          console.error('Error counting PDF pages:', err);
          resolve(1);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // Handle Real File Selection
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Enforce PDF only file selection
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (file.type !== 'application/pdf' && fileExtension !== 'pdf') {
      addToast('Error: Only PDF format files are accepted!', 'warning');
      e.target.value = ''; // Reset input
      return;
    }

    setFileObject(file);
    setFileName(file.name);
    
    // Save file object in window context for the Operator to access/download!
    window.copycampus_uploaded_file = file;

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setFileSize(`${sizeInMB} MB`);

    setIsParsing(true);
    const pages = await countPdfPages(file);
    setIsParsing(false);
    
    setPdfTotalPages(pages);
    setFromPage(1);
    setToPage(pages);

    addToast(`Document parsed: ${pages} pages detected automatically.`, 'success');
  };

  const handleCheckoutClick = (e) => {
    e.preventDefault();
    if (!fileName) {
      alert('Please upload a file to proceed.');
      return;
    }
    setCheckoutModalOpen(true);
  };

  // Submit print order
  const handlePlaceOrder = async () => {
    setCheckoutModalOpen(false);

    const pageRangeStr = pageRangeMode === 'Custom' ? `Pages ${fromPage}–${toPage}` : 'All Pages';
    const specsNote = `Sides: ${sides} | Paper: ${paperType} | Range: ${pageRangeStr}`;

    const { data: orderData, error: orderErr } = await supabase.orders.insert({
      student_id: student.id,
      pdf_url: fileName,
      pages: pagesCount,
      type: printType,
      size: pageSize,
      finishing: finishing,
      pickup_location: pickupLocation,
      collection_time: collectionTime,
      credits_used: estimatedCost,
      paper_type: paperType,
      page_range: pageRangeStr,
      reprint_reason: specsNote
    });

    if (!orderErr) {
      onAddOrder(orderData);

      setOrderReceipt({
        id: orderData.id,
        pdf_url: fileName,
        pages: pagesCount,
        type: printType,
        size: pageSize,
        sides: sides,
        finishing: finishing,
        pickup_location: pickupLocation,
        collection_time: collectionTime,
        credits_used: estimatedCost,
        paper_type: paperType,
        page_range: pageRangeStr
      });

      addToast(`Print order #${orderData.id} placed!`, 'success');
    }
  };



  // Chat Support Flow
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText;
    setInputText('');

    const { data, error } = await supabase.messages.insert({
      sender: 'student',
      student_id: student.id,
      message: text
    });

    if (!error) {
      onAddMessage(data);

      setTimeout(async () => {
        let reply = `Hello ${student.name}! I have logged your message. If it is about document layouts or delays, our desk operator is checking now.`;
        if (text.toLowerCase().includes('margin') || text.toLowerCase().includes('cut off')) {
          reply = `I see. Bottom margins can get cut off if double-sided canvas layout is too tight. I have flagged a reprint request for you, operator Mayank will release it shortly.`;
        } else if (text.toLowerCase().includes('ready') || text.toLowerCase().includes('status')) {
          reply = `Checking queue... Your print order is currently processing. You will receive an alert as soon as it is marked Ready/Out for Delivery!`;
        }

        const { data: aiData, error: aiErr } = await supabase.messages.insert({
          sender: 'operator',
          student_id: student.id,
          message: `🤖 [AI Assistant]: ${reply}`
        });
        if (!aiErr) onAddMessage(aiData);
      }, 1200);
    }
  };

  const studentOrders = orders
    .filter(o => o.student_id === student.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const chatMessages = messages.filter(m => m.student_id === student.id);

  const getStatusStep = (status) => {
    switch (status) {
      case 'New': return 1;
      case 'Accepted': return 2;
      case 'Printing': return 3;
      case 'Ready': return 4;
      case 'Done': return 5;
      default: return 1;
    }
  };

  const getStudentInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative w-full select-none font-sans">
      
      {/* Header bar */}
      <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl tracking-tight text-slate-800">
            Copy<span className="font-extrabold text-brand">Campus</span>
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
            Student Terminal
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Shop Status Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border shadow-sm transition-colors duration-200 ${
            shopStatus.status === 'Open' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
            shopStatus.status === 'Lunch Break' ? 'bg-amber-50 text-amber-700 border-amber-200/60' :
            'bg-rose-50 text-rose-700 border-rose-200/60'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              shopStatus.status === 'Open' ? 'bg-emerald-500' :
              shopStatus.status === 'Lunch Break' ? 'bg-amber-500 animate-pulse' :
              'bg-rose-500'
            }`} />
            <span>Shop: {shopStatus.status}</span>
          </div>

          <div className="w-px h-6 bg-slate-200" />

          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-700">{student.name}</span>
              <span className="text-xs text-slate-500">{student.roll_no} · {student.branch}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm">
              {getStudentInitials(student.name)}
            </div>
          </div>
        </div>
      </header>

      {/* Main split-pane content */}
      <div className="flex flex-1 h-[calc(100vh-64px)]">
        
        {/* Left Sidebar Navigation */}
        <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between py-6 px-4 shrink-0">
          <div className="space-y-1.5">
            <button
              onClick={() => { setActiveTab('print'); setOrderReceipt(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 font-medium ${
                activeTab === 'print' ? 'bg-brand text-white shadow-sm shadow-brand/20' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Upload className="w-5 h-5" />
              <span className="text-sm">Order Print</span>
            </button>

            <button
              onClick={() => { setActiveTab('track'); setOrderReceipt(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 font-medium ${
                activeTab === 'track' ? 'bg-brand text-white shadow-sm shadow-brand/20' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="text-sm">Track Print Queue</span>
            </button>

            <button
              onClick={() => { setActiveTab('notifications'); setOrderReceipt(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 font-medium relative ${
                activeTab === 'notifications' ? 'bg-brand text-white shadow-sm shadow-brand/20' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span className="text-sm">Notifications</span>
              {notifications.length > 0 && (
                <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'notifications' ? 'bg-white/20 text-white' : 'bg-brand text-white'
                }`}>{notifications.length}</span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('chat'); setOrderReceipt(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 font-medium ${
                activeTab === 'chat' ? 'bg-brand text-white shadow-sm shadow-brand/20' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm">Help Desk Chat</span>
            </button>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Log Out Session</span>
          </button>
        </aside>

        {/* Right workspace panels */}
        <main className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto w-full">
          
          {/* Main workspace tabs */}
          <>
              {/* TAB 1: Order Print Form */}
              {activeTab === 'print' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800">Upload & Configure Print</h1>
                    <p className="text-slate-500 text-sm mt-1">Select your PDF file, configure print options, and submit your order.</p>
                  </div>

                  {operator?.broadcast_message && (
                    <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 flex items-start gap-3 shadow-sm">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                      <div>
                        <h4 className="font-extrabold text-sm text-rose-900">Notice from Operator Mayank</h4>
                        <p className="text-xs mt-1 font-semibold leading-relaxed text-rose-700">{operator.broadcast_message}</p>
                      </div>
                    </div>
                  )}

                  <div className={`p-4 rounded-2xl border ${shopStatus.text} flex items-start gap-3 shadow-sm`}>
                    <Clock className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                        {shopStatus.status === 'Open' ? 'Shop is Open' : 'Shop is Closed'}
                        <span className={`w-1.5 h-1.5 rounded-full ${shopStatus.color} animate-pulse`} />
                      </h4>
                      <p className="text-xs mt-1 opacity-90 leading-relaxed font-medium">{shopStatus.message}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT: Form */}
                    <form onSubmit={handleCheckoutClick} className="lg:col-span-2 space-y-6">

                      {/* File Upload */}
                      <div className="bg-white border-2 border-dashed border-slate-200 hover:border-brand rounded-2xl p-6 text-center cursor-pointer relative transition-all group shadow-sm">
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          required={!fileName}
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {isParsing ? (
                          <div className="py-6 flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-bold text-slate-500">Analyzing PDF — counting pages...</span>
                          </div>
                        ) : fileName ? (
                          <div className="py-2 flex items-center justify-center gap-4 text-left">
                            <FileText className="w-12 h-12 text-rose-500 shrink-0" />
                            <div className="min-w-0">
                              <span className="text-sm font-extrabold text-slate-700 block truncate max-w-sm">{fileName}</span>
                              <span className="text-xs text-slate-400 block mt-1">Size: {fileSize} · {pdfTotalPages} pages detected · Printing: {pagesCount} pages</span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-6 space-y-2">
                            <Upload className="w-10 h-10 text-slate-400 mx-auto transition-transform group-hover:scale-105" />
                            <span className="font-extrabold text-slate-700 block text-sm">Choose PDF file to print</span>
                            <span className="text-xs text-rose-400 font-semibold block">⚠ Only PDF format is accepted</span>
                          </div>
                        )}
                      </div>

                      {/* Print Configuration */}
                      <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-5 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-50 pb-2">Print Configuration</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-medium">

                          {/* Page Range */}
                          <div className="md:col-span-2 bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Page Range</span>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setPageRangeMode('All')}
                                className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${pageRangeMode === 'All' ? 'border-brand bg-brand/5 text-brand' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                                All Pages ({pdfTotalPages})
                              </button>
                              <button type="button" onClick={() => setPageRangeMode('Custom')} disabled={!fileName}
                                className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${pageRangeMode === 'Custom' ? 'border-brand bg-brand/5 text-brand' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                                Custom Range
                              </button>
                            </div>
                            {pageRangeMode === 'Custom' && (
                              <div className="flex items-center gap-3 pt-1">
                                <div className="flex-1 space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 block">From Page</label>
                                  <input type="number" min={1} max={toPage} value={fromPage}
                                    onChange={e => setFromPage(Math.max(1, Math.min(parseInt(e.target.value)||1, toPage)))}
                                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-brand bg-white font-semibold text-center" />
                                </div>
                                <span className="text-slate-300 font-bold mt-5">→</span>
                                <div className="flex-1 space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 block">To Page</label>
                                  <input type="number" min={fromPage} max={pdfTotalPages} value={toPage}
                                    onChange={e => setToPage(Math.max(fromPage, Math.min(parseInt(e.target.value)||fromPage, pdfTotalPages)))}
                                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-brand bg-white font-semibold text-center" />
                                </div>
                                <div className="flex-1 bg-brand/5 border border-brand/10 rounded-xl p-2.5 text-center mt-5">
                                  <span className="text-[10px] text-slate-400 block">Printing</span>
                                  <span className="text-sm font-black text-brand">{pagesCount} pgs</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Paper Type */}
                          <div className="md:col-span-2 space-y-2">
                            <label className="font-bold text-slate-500 block">Paper Type</label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: 'Normal', label: 'Normal', sub: '₹2/pg base' },
                                { id: 'Bond', label: 'Bond Paper', sub: '₹5/pg base' },
                                { id: 'Glossy', label: 'Glossy', sub: '₹50/pg base' }
                              ].map(pt => (
                                <button key={pt.id} type="button" onClick={() => setPaperType(pt.id)}
                                  className={`py-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${paperType === pt.id ? 'border-brand bg-brand/5 text-brand' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                  <span>{pt.label}</span>
                                  <span className={`text-[10px] font-medium ${paperType === pt.id ? 'text-brand/70' : 'text-slate-400'}`}>{pt.sub}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Color Mode */}
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500 block mb-1">Color Mode</label>
                            <div className="grid grid-cols-2 gap-3">
                              <button type="button" onClick={() => setPrintType('B&W')}
                                className={`py-3 rounded-xl border text-xs font-bold transition-all ${printType === 'B&W' ? 'border-brand bg-brand/5 text-brand font-extrabold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                B&W
                              </button>
                              <button type="button" onClick={() => setPrintType('Color')}
                                className={`py-3 rounded-xl border text-xs font-bold transition-all ${printType === 'Color' ? 'border-brand bg-brand/5 text-brand font-extrabold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                Color (+₹5/pg)
                              </button>
                            </div>
                          </div>

                          {/* Paper Size */}
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500 block mb-1">Paper Size</label>
                            <select value={pageSize} onChange={e => setPageSize(e.target.value)}
                              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-brand bg-white">
                              <option value="A4">A4 Standard Sheet</option>
                              <option value="A3">A3 Sheet (+₹{surchargeA3} surcharge/pg)</option>
                            </select>
                          </div>

                          {/* Print Sides */}
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500 block mb-1">Print Sides</label>
                            <div className="grid grid-cols-2 gap-3">
                              <button type="button" onClick={() => setSides('Single-Sided')}
                                className={`py-3 rounded-xl border text-xs font-bold transition-all ${sides === 'Single-Sided' ? 'border-brand bg-brand/5 text-brand font-extrabold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                Single-Sided
                              </button>
                              <button type="button" onClick={() => setSides('Double-Sided')}
                                className={`py-3 rounded-xl border text-xs font-bold transition-all ${sides === 'Double-Sided' ? 'border-brand bg-brand/5 text-brand font-extrabold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                Double-Sided
                              </button>
                            </div>
                          </div>

                          {/* Finishing */}
                          <div className="space-y-1 md:col-span-2">
                            <label className="font-bold text-slate-500 block mb-1">Binding & Finishing</label>
                            <select value={finishing} onChange={e => setFinishing(e.target.value)}
                              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-brand bg-white">
                              <option value="None">None (Loose sheets)</option>
                              <option value="Spiral Binding">Spiral Binding (+₹{surchargeSpiral})</option>
                              <option value="Stapling">Stapling (+₹{surchargeStapling})</option>
                            </select>
                          </div>

                          {/* Pickup Location */}
                          <div className="space-y-1 md:col-span-2">
                            <label className="font-bold text-slate-500 block mb-1">Pickup Location</label>
                            <select value={pickupLocation} onChange={e => setPickupLocation(e.target.value)}
                              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-brand bg-white font-semibold text-slate-700">
                              {pickupLocations.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                              ))}
                            </select>
                          </div>

                          {/* Collection Time */}
                          <div className="space-y-1 md:col-span-2">
                            <label className="font-bold text-slate-500 block mb-1">Collection Time (Lunch Slot)</label>
                            <select value={collectionTime} onChange={e => setCollectionTime(e.target.value)}
                              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-brand bg-white font-semibold text-slate-700">
                              {lunchSlots.map(slot => (
                                <option key={slot} value={slot}>{slot}</option>
                              ))}
                            </select>
                          </div>

                        </div>
                      </div>
                    </form>

                    {/* RIGHT: Checkout Summary */}
                    <div className="space-y-4">
                      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-50 pb-2">Checkout Summary</h3>

                        <div className="space-y-2.5 text-xs text-slate-500 font-medium">
                          <div className="flex justify-between">
                            <span>Paper ({paperType}):</span>
                            <span className="font-semibold text-slate-700">₹{paperBasePrice}/pg</span>
                          </div>
                          {printType === 'Color' && (
                            <div className="flex justify-between">
                              <span>Color Surcharge:</span>
                              <span className="font-semibold text-slate-700">+₹5/pg</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Pages × Rate:</span>
                            <span className="font-semibold text-slate-700">{pagesCount} × ₹{pageBasePrice}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Base Cost:</span>
                            <span className="font-semibold text-slate-700">₹{baseCost}</span>
                          </div>
                          {pageSize === 'A3' && (
                            <div className="flex justify-between">
                              <span>A3 Surcharge:</span>
                              <span className="font-semibold text-slate-700">+₹{surchargeCost}</span>
                            </div>
                          )}
                          {finishing !== 'None' && (
                            <div className="flex justify-between">
                              <span>Finishing ({finishing}):</span>
                              <span className="font-semibold text-slate-700">+₹{finishingCost}</span>
                            </div>
                          )}
                          <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-sm font-extrabold text-slate-800">
                            <span>Total Cost:</span>
                            <span className="text-xl font-black text-brand">₹{estimatedCost}</span>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2">
                          <button
                            onClick={handleCheckoutClick}
                            disabled={!fileName || isParsing || shopStatus.status === 'Closed'}
                            className="w-full py-3 bg-brand hover:bg-brand-dark text-white rounded-xl font-extrabold text-sm shadow-md shadow-brand/10 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
                          >
                            {shopStatus.status === 'Closed' ? 'Ordering Closed' : 'Place Print Order'}
                          </button>

                          {shopStatus.status === 'Closed' && (
                            <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 text-rose-700 text-[10px] font-semibold flex items-start gap-1.5 leading-normal">
                              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                              <span>Orders accepted only from 7:00 AM to 9:00 PM.</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Persistent Disclaimer */}
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs font-semibold text-amber-800 shadow-sm space-y-1.5">
                        <div className="flex items-center gap-1.5 font-extrabold text-amber-900">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Important Disclaimer</span>
                        </div>
                        <p className="leading-relaxed text-amber-700">
                          If the print is wrong or if you selected wrong pages, that is <strong>not our problem</strong>. The amount paid will <strong>not be refunded</strong> under any circumstances. Please verify your selection carefully.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Order Tracker */}
              {activeTab === 'track' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800">My Print Jobs Tracker</h1>
                    <p className="text-slate-500 text-sm mt-1">Track dispatch status steps and release cycles for active orders.</p>
                  </div>

                  {studentOrders.length === 0 ? (
                    <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white max-w-xl">
                      <History className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <span className="text-slate-400 font-medium block">No print jobs yet!</span>
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-3xl">
                      {studentOrders.map((order) => {
                        const step = getStatusStep(order.status);
                        const isDone = order.status === 'Done';

                        return (
                          <div key={order.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
                            <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                              <div>
                                <span className="font-extrabold text-slate-800 text-sm block leading-tight">{order.pdf_url}</span>
                                <span className="text-[10px] text-slate-400 block mt-1">
                                  Order ID: #{order.id} · Cost: ₹{order.credits_used} · {order.pages} pages · {order.reprint_reason || 'Double-Sided'}
                                </span>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                isDone ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-brand/15 text-brand border-brand/20'
                              }`}>
                                {isDone ? 'Delivered ✓' : order.status}
                              </span>
                            </div>

                            <div className="pt-2">
                              <div className="w-full bg-slate-100 h-1.5 rounded-full relative flex justify-between items-center">
                                <div className="bg-brand h-1.5 rounded-full absolute left-0 transition-all duration-500" style={{ width: `${(step - 1) * 25}%` }} />
                                {[1, 2, 3, 4, 5].map(idx => (
                                  <div key={idx} className={`w-3.5 h-3.5 rounded-full z-10 transition-all duration-300 ${
                                    step >= idx ? 'bg-brand ring-4 ring-brand/10 scale-110' : 'bg-slate-200'
                                  }`} />
                                ))}
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-2">
                                <span>Ordered</span>
                                <span>Accepted</span>
                                <span>Sent to Printer</span>
                                <span>Ready/Out</span>
                                <span>Delivered</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Notifications */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800">Order Notifications</h1>
                    <p className="text-slate-500 text-sm mt-1">Real-time alerts when your order status changes.</p>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white max-w-xl">
                      <Bell className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <span className="text-slate-400 font-medium block">No notifications yet.</span>
                      <span className="text-slate-300 text-xs block mt-1">You'll get alerts here when the operator updates your order status.</span>
                    </div>
                  ) : (
                    <div className="space-y-3 max-w-3xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-semibold">{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</span>
                        <button
                          onClick={() => setNotifications([])}
                          className="text-xs text-rose-500 hover:text-rose-700 font-bold"
                        >
                          Clear all
                        </button>
                      </div>
                      {notifications.map(n => (
                        <div key={n.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-start gap-4">
                          <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
                            <Bell className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 leading-snug">
                              Order #{n.orderId} status updated
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              <span className="line-through opacity-60">{n.oldStatus}</span>
                              <span className="mx-1.5 text-slate-300">→</span>
                              <span className="font-bold text-brand">{n.newStatus}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 truncate">{n.pdfName}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* DIRECT UPI ORDER CHECKOUT MODAL */}
              {checkoutModalOpen && (
                <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-100 shadow-2xl text-center space-y-4 animate-scale-up">
                    <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto shadow-xs">
                      <CreditCard className="w-6 h-6" />
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-800">Scan & Pay via UPI</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Scan the QR code below to complete the payment for your print order directly to the operator.</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-3">
                      {/* Mock QR Code */}
                      <div className="w-36 h-36 bg-white border border-slate-200/80 rounded-xl p-2.5 shadow-inner flex flex-col items-center justify-center relative overflow-hidden group">
                        <QrCode className="w-full h-full text-slate-700" />
                        <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 block font-semibold">Operator Merchant UPI ID</span>
                        <span className="text-xs font-extrabold text-slate-700 block mt-0.5">{operator?.upi_id || 'mayank@upi'}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left text-xs space-y-2 font-medium text-slate-500">
                      <div className="flex justify-between">
                        <span>Print Bill Amount:</span>
                        <span className="font-extrabold text-slate-800">₹{estimatedCost}</span>
                      </div>
                      <p className="text-[9px] text-slate-400">BHIM UPI redirection. Direct operator settlement.</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setCheckoutModalOpen(false)}
                        className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl font-bold text-xs bg-white transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handlePlaceOrder}
                        className="flex-1 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl font-bold text-xs shadow-md shadow-brand/10 transition-all animate-pulse-soft"
                      >
                        Confirm Payment
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Support Chat */}
              {activeTab === 'chat' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800">Support Desk Chat</h1>
                    <p className="text-slate-500 text-sm mt-1">Open channel with operators and automated print assistants.</p>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden h-[480px] max-w-3xl flex flex-col justify-between">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-brand animate-pulse" />
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">CopyCampus Print Assistant</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Online & monitoring</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/10">
                      {chatMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                          <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
                          <span>Send a message to start support query.</span>
                        </div>
                      ) : (
                        chatMessages.map(m => {
                          const isStudent = m.sender === 'student';
                          return (
                            <div key={m.id} className={`flex ${isStudent ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] rounded-2xl p-3 text-xs leading-normal relative ${
                                isStudent ? 'bg-brand text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                              }`}>
                                <p>{m.message}</p>
                                <span className={`text-[8px] block mt-1.5 text-right ${isStudent ? 'text-white/70' : 'text-slate-400'}`}>
                                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 border-t border-slate-100 space-y-3 bg-white">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Suggested templates:</span>
                        <button
                          onClick={() => handleSimulateStudentMessage('Is my print ready for pickup?')}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-brand bg-slate-50 text-[10px] font-semibold text-slate-500 transition-colors"
                        >
                          "Is order ready?"
                        </button>
                        <button
                          onClick={() => handleSimulateStudentMessage('Why is there a delay in print release?')}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-brand bg-slate-50 text-[10px] font-semibold text-slate-500 transition-colors"
                        >
                          "Check delay"
                        </button>
                        <button
                          onClick={() => handleSimulateStudentMessage('Bottom margins are getting cut off on double-side!')}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-brand bg-slate-50 text-[10px] font-semibold text-rose-500 border-rose-100 hover:bg-rose-50 transition-colors"
                        >
                          "Report margin cut"
                        </button>
                      </div>

                      <form onSubmit={handleSendChat} className="flex gap-2">
                        <input
                          type="text"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder="Ask the operator desk or the AI Copilot..."
                          className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-brand"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl font-bold flex items-center justify-center shrink-0"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </>

        </main>
      </div>



      {/* ORDER PLACED SUCCESS SCREEN OVERLAY */}
      {orderReceipt && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-100 shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto shadow-sm animate-bounce-soft">
              <Check className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-800">Your order has been placed</h3>
              <p className="text-[10px] text-slate-400 mt-1">Our operators are preparing your print files. You can track your print queue or return to the main dashboard.</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left text-xs space-y-2.5 font-medium text-slate-500">
              <div className="flex justify-between">
                <span>Order Reference ID:</span>
                <span className="font-extrabold text-slate-800">#{orderReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Document Name:</span>
                <span className="font-bold text-slate-700 truncate max-w-[180px]" title={orderReceipt.pdf_url}>
                  {orderReceipt.pdf_url}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Layout Specs:</span>
                <span className="font-bold text-slate-700">
                  {orderReceipt.pages} pgs · {orderReceipt.type} · {orderReceipt.size} · {orderReceipt.sides}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pickup Location:</span>
                <span className="font-bold text-slate-700">
                  {orderReceipt.pickup_location || 'Library (Default)'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Expected Pickup:</span>
                <span className="font-bold text-brand bg-brand/5 border border-brand/10 px-2 py-0.5 rounded text-[10px]">
                  {getExpectedPickupDate()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Collection Time (Lunch):</span>
                <span className="font-bold text-slate-700">
                  {orderReceipt.collection_time || '01:00 PM - 01:10 PM'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold text-slate-800">
                <span>Amount Paid:</span>
                <span className="text-base text-brand font-black">₹{orderReceipt.credits_used}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setOrderReceipt(null); setActiveTab('print'); }}
                className="flex-1 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl font-bold text-xs shadow-sm transition-all"
              >
                Return to Dashboard
              </button>
              <button
                onClick={() => { setOrderReceipt(null); setActiveTab('track'); }}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-xs transition-all bg-white"
              >
                Track Print Queue
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  // Helper shortcut for templates chat
  function handleSimulateStudentMessage(queryText) {
    handleSimulateStudentMessageAsync(queryText);
  }

  async function handleSimulateStudentMessageAsync(queryText) {
    const studentMsg = {
      sender: 'student',
      student_id: student.id,
      message: queryText
    };

    const { data, error } = await supabase.messages.insert(studentMsg);
    if (!error) {
      onAddMessage(data);
      
      // Auto AI reply
      setTimeout(async () => {
        let reply = `Hello ${student.name}! I have logged your message. If it is about document layouts or delays, our desk operator is checking now!`;
        if (queryText.toLowerCase().includes('margin') || queryText.toLowerCase().includes('cut off')) {
          reply = `Oops, bottom margins usually get cut off on double-sided color layouts. Let me trigger a free reprint copy with corrected parameters for you!`;
        } else if (queryText.toLowerCase().includes('ready') || queryText.toLowerCase().includes('status')) {
          reply = `Order status: I see your active print order is being processed by the dispatch team. I'll send you an alert as soon as it's ready.`;
        }

        const { data: aiData, error: aiErr } = await supabase.messages.insert({
          sender: 'operator',
          student_id: student.id,
          message: `🤖 [AI Assistant]: ${reply}`
        });
        if (!aiErr) onAddMessage(aiData);
      }, 1200);
    }
  }
}
