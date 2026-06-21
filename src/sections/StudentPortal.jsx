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
  Bell,
  ArrowLeft,
  Smartphone,
  ShieldCheck,
  Sun,
  Moon,
  User
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
  addToast,
  darkMode,
  toggleDarkMode
}) {
  const [activeTab, setActiveTab] = useState('print'); // 'print', 'track', 'notifications', 'chat'
  const [avatarOpen, setAvatarOpen] = useState(false);
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
  const [razorpayView, setRazorpayView] = useState('menu'); // 'menu', 'card', 'upi', 'netbanking', 'processing'
  const [mockCardNo, setMockCardNo] = useState('');
  const [mockCardExpiry, setMockCardExpiry] = useState('');
  const [mockCardCvv, setMockCardCvv] = useState('');
  const [mockUpiId, setMockUpiId] = useState('');
  const [mockBank, setMockBank] = useState('');
  
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
      default: return operator?.price_bw ?? 2;
    }
  };

  const paperBasePrice = getPaperBasePrice(paperType);
  const colorSurchargeRate = Math.max(0, (operator?.price_color ?? 7) - (operator?.price_bw ?? 2));
  const colorSurcharge = printType === 'Color' ? colorSurchargeRate : 0;
  const pageBasePrice = paperBasePrice + colorSurcharge;

  const baseCost = pageBasePrice * pagesCount;
  const surchargeCost = (pageSize === 'A3' ? surchargeA3 : 0) * pagesCount;
  const finishingCost = finishing === 'Spiral Binding' ? surchargeSpiral : finishing === 'Stapling' ? surchargeStapling : 0;
  const estimatedCost = baseCost + surchargeCost + finishingCost;

  // Dynamic Shop Status based on College Timings:
  // Operating Hours: 10:30 AM - 5:00 PM
  // Lunch Break: 1:00 PM - 1:50 PM
  const getShopStatus = () => {
    if (operator?.closed_mode) {
      return {
        status: 'Closed',
        color: 'bg-rose-500',
        text: 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-450',
        message: 'Desk is CLOSED today for Holiday / Break. No orders can be placed at this moment.'
      };
    }
    return {
      status: 'Open',
      color: 'bg-emerald-500',
      text: 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800/40 dark:text-emerald-400',
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
    setRazorpayView('menu');
    setMockCardNo('');
    setMockCardExpiry('');
    setMockCardCvv('');
    setMockUpiId('');
    setMockBank('');
    setCheckoutModalOpen(true);
  };

  const handleSimulatedRazorpayPay = () => {
    setRazorpayView('processing');
    setTimeout(() => {
      handlePlaceOrder();
    }, 1800);
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col relative w-full select-none font-sans transition-colors duration-200">
      
      {/* Header bar */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl tracking-tight text-slate-800 dark:text-slate-100">
            Copy<span className="font-extrabold text-brand">Campus</span>
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-light hidden sm:inline-block">
            Student Terminal
          </span>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          {/* Shop Status Badge */}
          <div className={`flex items-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-xl text-xs font-extrabold border shadow-sm transition-colors duration-200 ${
            shopStatus.status === 'Open' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40' :
            shopStatus.status === 'Lunch Break' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40' :
            'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              shopStatus.status === 'Open' ? 'bg-emerald-500' :
              shopStatus.status === 'Lunch Break' ? 'bg-amber-500 animate-pulse' :
              'bg-rose-500'
            }`} />
            <span className="hidden sm:inline">Shop: {shopStatus.status}</span>
            <span className="sm:hidden">{shopStatus.status === 'Open' ? 'Open' : 'Closed'}</span>
          </div>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />

          {/* Direct Dark Mode Toggle */}
          <button
            type="button"
            onClick={() => toggleDarkMode()}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-brand dark:hover:text-brand-light hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-all focus:outline-none"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-amber-500" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Interactive Avatar Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setAvatarOpen(!avatarOpen)}
              className="flex items-center gap-2 md:gap-3 focus:outline-none hover:opacity-90 transition-opacity"
            >
              <div className="flex flex-col text-right">
                <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">{student.name}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden md:block">{student.roll_no} · {student.branch}</span>
              </div>
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-brand text-white flex items-center justify-center font-bold text-xs md:text-sm shadow-sm ring-2 ring-brand/10">
                {getStudentInitials(student.name)}
              </div>
            </button>

            {avatarOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAvatarOpen(false)} />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl shadow-xl border border-white/40 dark:border-slate-800/40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 space-y-3 z-50 animate-scale-up text-left">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block leading-tight">{student.name}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5">{student.roll_no} · {student.branch}</span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-1.5 text-slate-550 dark:text-slate-400">
                      <CreditCard className="w-4 h-4 text-slate-450" />
                      <span className="text-xs font-bold">Wallet Balance</span>
                    </div>
                    <span className="text-xs font-black text-brand dark:text-brand-light">₹{student.wallet_balance || 0}</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-b border-slate-100 dark:border-slate-800 py-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-350">Dark Theme</span>
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

                  <div className="flex flex-col gap-1 text-xs">
                    <button
                      onClick={() => {
                        setActiveTab('print');
                        setOrderReceipt(null);
                        setAvatarOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-slate-650 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold"
                    >
                      New Print Order
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('track');
                        setOrderReceipt(null);
                        setAvatarOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-slate-650 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold"
                    >
                      Track Active Jobs
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setAvatarOpen(false);
                      onLogout();
                    }}
                    className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/10 transition-all hover:scale-[1.01]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main split-pane content */}
      <div className="flex flex-col md:flex-row flex-1 min-h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] overflow-hidden">
        
        {/* Left Sidebar Navigation */}
        <aside className="hidden md:flex w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-col justify-between py-6 px-4 shrink-0">
          <div className="space-y-1.5">
            <button
              onClick={() => { setActiveTab('print'); setOrderReceipt(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 font-medium ${
                activeTab === 'print' ? 'bg-brand text-white shadow-sm shadow-brand/20' : 'text-slate-600 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Upload className="w-5 h-5" />
              <span className="text-sm">Order Print</span>
            </button>

            <button
              onClick={() => { setActiveTab('track'); setOrderReceipt(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 font-medium ${
                activeTab === 'track' ? 'bg-brand text-white shadow-sm shadow-brand/20' : 'text-slate-600 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="text-sm">Track Print Queue</span>
            </button>

            <button
              onClick={() => { setActiveTab('notifications'); setOrderReceipt(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 font-medium relative ${
                activeTab === 'notifications' ? 'bg-brand text-white shadow-sm shadow-brand/20' : 'text-slate-600 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-800'
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
                activeTab === 'chat' ? 'bg-brand text-white shadow-sm shadow-brand/20' : 'text-slate-600 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm">Help Desk Chat</span>
            </button>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Log Out Session</span>
          </button>
        </aside>

        {/* Right workspace panels */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto max-w-5xl mx-auto w-full bg-slate-50 dark:bg-slate-950">
          
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 mb-6 select-none">
            <span className="hover:text-brand dark:hover:text-brand-light transition-colors text-slate-400 dark:text-slate-550">Home</span>
            <span className="text-slate-300 dark:text-slate-850">/</span>
            <span className="hover:text-brand dark:hover:text-brand-light transition-colors text-slate-400 dark:text-slate-555">Student Portal</span>
            <span className="text-slate-300 dark:text-slate-850">/</span>
            <span className="text-slate-600 dark:text-slate-200 capitalize">
              {activeTab === 'print' ? 'Configure Order' : activeTab === 'track' ? 'Track Queue' : activeTab === 'notifications' ? 'Notifications' : 'Help Desk Chat'}
            </span>
          </nav>

          {/* Main workspace tabs */}
          <>
              {/* TAB 1: Order Print Form */}
              {activeTab === 'print' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Upload & Configure Print</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Select your PDF file, configure print options, and submit your order.</p>
                  </div>

                  {operator?.broadcast_message && (
                    <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-350 flex items-start gap-3 shadow-sm">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                      <div>
                        <h4 className="font-extrabold text-sm text-rose-900 dark:text-rose-200">Notice from Operator Mayank</h4>
                        <p className="text-xs mt-1 font-semibold leading-relaxed text-rose-700 dark:text-rose-300">{operator.broadcast_message}</p>
                      </div>
                    </div>
                  )}

                  <div className={`p-4 rounded-2xl border ${shopStatus.text} dark:bg-slate-900/40 dark:border-slate-800 flex items-start gap-3 shadow-sm`}>
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
                      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-brand dark:hover:border-brand rounded-2xl p-6 text-center cursor-pointer relative transition-all group shadow-sm">
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          required={!fileName}
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {isParsing ? (
                          <div className="py-6 flex flex-col items-center gap-3 animate-pulse">
                            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-850 rounded-xl shrink-0" />
                            <div className="w-full max-w-[200px] space-y-2">
                              <div className="h-3.5 bg-slate-200 dark:bg-slate-850 rounded mx-auto w-3/4" />
                              <div className="h-2.5 bg-slate-200 dark:bg-slate-850 rounded mx-auto w-1/2" />
                            </div>
                            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest mt-1">Analyzing PDF Pages...</span>
                          </div>
                        ) : fileName ? (
                          <div className="py-2 flex items-center justify-center gap-4 text-left">
                            <FileText className="w-12 h-12 text-rose-500 shrink-0" />
                            <div className="min-w-0">
                              <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200 block truncate max-w-sm">{fileName}</span>
                              <span className="text-xs text-slate-400 dark:text-slate-500 block mt-1">Size: {fileSize} · {pdfTotalPages} pages detected · Printing: {pagesCount} pages</span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-6 space-y-2">
                            <Upload className="w-10 h-10 text-slate-400 mx-auto transition-transform group-hover:scale-105" />
                            <span className="font-extrabold text-slate-700 dark:text-slate-200 block text-sm">Choose PDF file to print</span>
                            <span className="text-xs text-rose-450 dark:text-rose-400 font-semibold block">⚠ Only PDF format is accepted</span>
                          </div>
                        )}
                      </div>

                      {/* Print Configuration */}
                      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-150/50 dark:border-slate-800/60 rounded-2xl p-6 space-y-5 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide border-b border-slate-50 dark:border-slate-800/50 pb-2">Print Configuration</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-medium">

                          {/* Page Range */}
                          <div className="md:col-span-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-850 p-4 rounded-xl space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Page Range</span>
                            <div className="grid grid-cols-2 gap-2">
                              <button type="button" onClick={() => setPageRangeMode('All')}
                                className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${pageRangeMode === 'All' ? 'border-brand bg-brand/5 text-brand dark:text-brand-light' : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-900'}`}>
                                All Pages ({pdfTotalPages})
                              </button>
                              <button type="button" onClick={() => setPageRangeMode('Custom')} disabled={!fileName}
                                className={`py-2.5 rounded-xl border text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${pageRangeMode === 'Custom' ? 'border-brand bg-brand/5 text-brand dark:text-brand-light' : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-900'}`}>
                                Custom Range
                              </button>
                            </div>
                            {pageRangeMode === 'Custom' && (
                              <div className="grid grid-cols-3 gap-2 items-end pt-1">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 block">From Page</label>
                                  <input type="number" min={1} max={toPage} value={fromPage}
                                    onChange={e => setFromPage(Math.max(1, Math.min(parseInt(e.target.value)||1, toPage)))}
                                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:border-brand bg-white font-semibold text-center" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 block">To Page</label>
                                  <input type="number" min={fromPage} max={pdfTotalPages} value={toPage}
                                    onChange={e => setToPage(Math.max(fromPage, Math.min(parseInt(e.target.value)||fromPage, pdfTotalPages)))}
                                    className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:border-brand bg-white font-semibold text-center" />
                                </div>
                                <div className="bg-brand/5 border border-brand/10 rounded-xl p-1.5 text-center">
                                  <span className="text-[9px] text-slate-400 block leading-none">Printing</span>
                                  <span className="text-xs font-black text-brand mt-0.5 block leading-tight">{pagesCount} pgs</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Paper Type */}
                          <div className="md:col-span-2 space-y-2">
                            <label className="font-bold text-slate-500 dark:text-slate-400 block">Paper Type</label>
                            <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                              {[
                                { id: 'Normal', label: 'Normal', sub: `₹${operator?.price_bw ?? 2}/pg base` },
                                { id: 'Bond', label: 'Bond Paper', sub: '₹5/pg base' },
                                { id: 'Glossy', label: 'Glossy', sub: '₹50/pg base' }
                              ].map(pt => (
                                <button key={pt.id} type="button" onClick={() => setPaperType(pt.id)}
                                  className={`py-2 px-1 rounded-xl border text-[10px] sm:text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${paperType === pt.id ? 'border-brand bg-brand/5 text-brand dark:text-brand-light' : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-900'}`}>
                                  <span className="truncate w-full text-center">{pt.label}</span>
                                  <span className={`text-[8px] sm:text-[10px] font-medium leading-none ${paperType === pt.id ? 'text-brand/70' : 'text-slate-400 dark:text-slate-500'}`}>{pt.sub}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Color Mode */}
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500 dark:text-slate-400 block mb-1">Color Mode</label>
                            <div className="grid grid-cols-2 gap-3">
                              <button type="button" onClick={() => setPrintType('B&W')}
                                className={`py-3 rounded-xl border text-xs font-bold transition-all ${printType === 'B&W' ? 'border-brand bg-brand/5 text-brand font-extrabold dark:text-brand-light' : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-900'}`}>
                                B&W
                              </button>
                              <button type="button" onClick={() => setPrintType('Color')}
                                className={`py-3 rounded-xl border text-xs font-bold transition-all ${printType === 'Color' ? 'border-brand bg-brand/5 text-brand font-extrabold dark:text-brand-light' : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-900'}`}>
                                Color (+₹{colorSurchargeRate}/pg)
                              </button>
                            </div>
                          </div>
                                       {/* Paper Size */}
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500 dark:text-slate-400 block mb-1">Paper Size</label>
                            <select value={pageSize} onChange={e => setPageSize(e.target.value)}
                              className="w-full border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:border-brand bg-white dark:bg-slate-900 text-slate-705 dark:text-slate-300">
                              <option value="A4">A4 Standard Sheet</option>
                              <option value="A3">A3 Sheet (+₹{surchargeA3} surcharge/pg)</option>
                            </select>
                          </div>

                          {/* Print Sides */}
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500 dark:text-slate-400 block mb-1">Print Sides</label>
                            <div className="grid grid-cols-2 gap-3">
                              <button type="button" onClick={() => setSides('Single-Sided')}
                                className={`py-3 rounded-xl border text-xs font-bold transition-all ${sides === 'Single-Sided' ? 'border-brand bg-brand/5 text-brand dark:text-brand-light font-extrabold' : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-900'}`}>
                                Single-Sided
                              </button>
                              <button type="button" onClick={() => setSides('Double-Sided')}
                                className={`py-3 rounded-xl border text-xs font-bold transition-all ${sides === 'Double-Sided' ? 'border-brand bg-brand/5 text-brand dark:text-brand-light font-extrabold' : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-455 hover:bg-slate-50 dark:hover:bg-slate-900'}`}>
                                Double-Sided
                              </button>
                            </div>
                          </div>

                          {/* Finishing */}
                          <div className="space-y-1 md:col-span-2">
                            <label className="font-bold text-slate-500 dark:text-slate-400 block mb-1">Binding & Finishing</label>
                            <select value={finishing} onChange={e => setFinishing(e.target.value)}
                              className="w-full border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:border-brand bg-white dark:bg-slate-900 text-slate-705 dark:text-slate-300">
                              <option value="None">None (Loose sheets)</option>
                              <option value="Spiral Binding">Spiral Binding (+₹{surchargeSpiral})</option>
                              <option value="Stapling">Stapling (+₹{surchargeStapling})</option>
                            </select>
                          </div>

                          {/* Pickup Location */}
                          <div className="space-y-1 md:col-span-2">
                            <label className="font-bold text-slate-500 dark:text-slate-400 block mb-1">Pickup Location</label>
                            <select value={pickupLocation} onChange={e => setPickupLocation(e.target.value)}
                              className="w-full border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:border-brand bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-300">
                              {pickupLocations.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                              ))}
                            </select>
                          </div>

                          {/* Collection Time */}
                          <div className="space-y-1 md:col-span-2">
                            <label className="font-bold text-slate-500 dark:text-slate-400 block mb-1">Collection Time (Lunch Slot)</label>
                            <select value={collectionTime} onChange={e => setCollectionTime(e.target.value)}
                              className="w-full border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:border-brand bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-300">
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
                      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-150/50 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide border-b border-slate-50 dark:border-slate-800/50 pb-2">Checkout Summary</h3>

                        <div className="space-y-2.5 text-xs text-slate-550 dark:text-slate-400 font-medium">
                          <div className="flex justify-between">
                            <span>Paper ({paperType}):</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">₹{paperBasePrice}/pg</span>
                          </div>
                          {printType === 'Color' && (
                            <div className="flex justify-between">
                              <span>Color Surcharge:</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">+₹{colorSurchargeRate}/pg</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Pages × Rate:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{pagesCount} × ₹{pageBasePrice}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Base Cost:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">₹{baseCost}</span>
                          </div>
                          {pageSize === 'A3' && (
                            <div className="flex justify-between">
                              <span>A3 Surcharge:</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">+₹{surchargeCost}</span>
                            </div>
                          )}
                          {finishing !== 'None' && (
                            <div className="flex justify-between">
                              <span>Finishing ({finishing}):</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">+₹{finishingCost}</span>
                            </div>
                          )}
                          <div className="pt-3 border-t border-dashed border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm font-extrabold text-slate-850 dark:text-slate-200">
                            <span>Total Cost:</span>
                            <span className="text-xl font-black text-brand dark:text-brand-light">₹{estimatedCost}</span>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2">
                          <button
                            onClick={handleCheckoutClick}
                            disabled={!fileName || isParsing || shopStatus.status === 'Closed'}
                            className="w-full py-3 bg-gradient-to-r from-brand to-indigo-650 hover:from-brand-dark hover:to-indigo-750 text-white rounded-xl font-extrabold text-sm shadow-md shadow-brand/10 disabled:from-slate-100 disabled:to-slate-100 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed transition-all hover:scale-[1.01] duration-150"
                          >
                            {shopStatus.status === 'Closed' ? 'Ordering Closed' : 'Place Print Order'}
                          </button>

                          {shopStatus.status === 'Closed' && (
                            <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 dark:border-rose-950/20 text-rose-700 dark:text-rose-350 text-[10px] font-semibold flex items-start gap-1.5 leading-normal">
                              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                              <span>The shop is currently closed by the operator for a holiday or break. Ordering is temporarily disabled.</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Persistent Disclaimer */}
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-4 text-xs font-semibold text-amber-800 dark:text-amber-350 shadow-sm space-y-1.5">
                        <div className="flex items-center gap-1.5 font-extrabold text-amber-900 dark:text-amber-200">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                          <span>Important Disclaimer</span>
                        </div>
                        <p className="leading-relaxed text-amber-700 dark:text-amber-350">
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
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Print Jobs Tracker</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track dispatch status steps and release cycles for active orders.</p>
                  </div>

                  {studentOrders.length === 0 ? (
                    <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-805 rounded-2xl bg-white dark:bg-slate-900 max-w-xl">
                      <History className="w-12 h-12 text-slate-300 dark:text-slate-650 mx-auto mb-2" />
                      <span className="text-slate-405 dark:text-slate-500 font-medium block">No print jobs yet!</span>
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-3xl">
                      {studentOrders.map((order) => {
                        const step = getStatusStep(order.status);
                        const isDone = order.status === 'Done';

                        return (
                          <div key={order.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
                            <div className="flex justify-between items-start border-b border-slate-50 dark:border-slate-800 pb-3">
                              <div>
                                <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm block leading-tight">{order.pdf_url}</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-550 block mt-1">
                                  Order ID: #{order.id} · Cost: ₹{order.credits_used} · {order.pages} pages · {order.reprint_reason || 'Double-Sided'}
                                </span>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                isDone ? 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800' : 'bg-brand/15 text-brand dark:text-brand-light border-brand/20 dark:border-brand-light/20'
                              }`}>
                                {isDone ? 'Delivered ✓' : order.status}
                              </span>
                            </div>

                            <div className="pt-2">
                              {/* Horizontal progress bar with percentage indicator */}
                              <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-slate-450 dark:text-slate-550">
                                <span>Order Progress</span>
                                <span className="text-brand dark:text-brand-light">
                                  {step === 1 ? '20% (Ordered)' :
                                   step === 2 ? '40% (Accepted)' :
                                   step === 3 ? '60% (Sent to Printer)' :
                                   step === 4 ? '80% (Ready for Pickup)' :
                                   '100% (Delivered)'}
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full relative flex justify-between items-center overflow-hidden border border-slate-200/20">
                                <div className="bg-gradient-to-r from-brand to-indigo-500 h-2.5 rounded-full absolute left-0 transition-all duration-500" style={{ width: `${(step / 5) * 100}%` }} />
                              </div>
                              
                              {/* Stepper Timeline circles */}
                              <div className="flex justify-between items-center relative mt-3.5 px-1">
                                <div className="absolute top-1.5 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 -z-10" />
                                {[1, 2, 3, 4, 5].map((idx) => {
                                  const stepNames = ['New', 'Accepted', 'Printing', 'Ready', 'Done'];
                                  return (
                                    <div key={idx} className="flex flex-col items-center gap-1">
                                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black z-10 transition-all duration-300 ${
                                        step >= idx 
                                          ? 'bg-brand dark:bg-brand-light text-white ring-4 ring-brand/10 dark:ring-brand-light/10 scale-110' 
                                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                                      }`}>
                                        {step >= idx && '✓'}
                                      </div>
                                      <span className={`text-[8px] font-extrabold ${
                                        step >= idx ? 'text-slate-750 dark:text-slate-350' : 'text-slate-400 dark:text-slate-600'
                                      }`}>
                                        {stepNames[idx - 1]}
                                      </span>
                                    </div>
                                  );
                                })}
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
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Order Notifications</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Real-time alerts when your order status changes.</p>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 max-w-xl">
                      <Bell className="w-12 h-12 text-slate-300 dark:text-slate-650 mx-auto mb-2" />
                      <span className="text-slate-400 dark:text-slate-500 font-medium block">No notifications yet.</span>
                      <span className="text-slate-300 dark:text-slate-600 text-xs block mt-1">You'll get alerts here when the operator updates your order status.</span>
                    </div>
                  ) : (
                    <div className="space-y-3 max-w-3xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-550 dark:text-slate-400 font-semibold">{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</span>
                        <button
                          onClick={() => setNotifications([])}
                          className="text-xs text-rose-500 hover:text-rose-700 font-bold"
                        >
                          Clear all
                        </button>
                      </div>
                      {notifications.map(n => (
                        <div key={n.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-start gap-4">
                          <div className="w-9 h-9 rounded-full bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-light flex items-center justify-center shrink-0">
                            <Bell className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                              Order #{n.orderId} status updated
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              <span className="line-through opacity-60">{n.oldStatus}</span>
                              <span className="mx-1.5 text-slate-300">→</span>
                              <span className="font-bold text-brand dark:text-brand-light">{n.newStatus}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">{n.pdfName}</p>
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

              {/* DIRECT UPI / RAZORPAY ORDER CHECKOUT MODALS */}
              {checkoutModalOpen && (
                operator?.razorpay_enabled ? (
                  /* Razorpay Styled Modal */
                  <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none font-sans">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full border border-slate-105/50 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-scale-up">
                      {/* Header */}
                      <div className="bg-[#02092c] text-white p-5 flex flex-col justify-between relative">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Payment Gateway</span>
                            <h3 className="text-sm font-extrabold mt-1 text-slate-200">{operator?.shop_name || 'CopyCampus Library'}</h3>
                            <span className="text-[10px] text-slate-450 block mt-0.5">Order ID: #pay_{Math.random().toString(36).substr(2, 9)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Amount Due</span>
                            <span className="text-lg font-black text-emerald-400 block mt-0.5">₹{estimatedCost}</span>
                          </div>
                        </div>
                        
                        {/* Razorpay Brand Overlay Badge */}
                        <div className="absolute right-5 bottom-2 flex items-center gap-1 opacity-70">
                          <span className="text-[8px] font-bold text-slate-400 tracking-wider">Secured by</span>
                          <span className="text-[10px] font-extrabold text-blue-400 tracking-tight">Razorpay</span>
                        </div>
                      </div>

                      {/* Body Panels */}
                      <div className="p-5 flex-1 min-h-[220px] flex flex-col justify-between">
                        {razorpayView === 'menu' && (
                          <div className="space-y-4">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Preferred Payment Methods</span>
                            <div className="space-y-2.5">
                              <button
                                type="button"
                                onClick={() => setRazorpayView('card')}
                                className="w-full p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-brand/40 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-950/40 dark:hover:bg-slate-950 flex items-center justify-between text-left transition-all group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <CreditCard className="w-4.5 h-4.5" />
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Cards</span>
                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-0.5">Visa, Mastercard, RuPay supported</span>
                                  </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-brand transition-colors" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setRazorpayView('upi')}
                                className="w-full p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-brand/40 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-950/40 dark:hover:bg-slate-950 flex items-center justify-between text-left transition-all group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                    <Smartphone className="w-4.5 h-4.5" />
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">UPI / VPA Address</span>
                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-0.5">Google Pay, PhonePe, BHIM UPI</span>
                                  </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-brand transition-colors" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setRazorpayView('netbanking')}
                                className="w-full p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-brand/40 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-950/40 dark:hover:bg-slate-950 flex items-center justify-between text-left transition-all group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                    <History className="w-4.5 h-4.5" />
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Netbanking</span>
                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-0.5">All major Indian banks supported</span>
                                  </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-brand transition-colors" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => setCheckoutModalOpen(false)}
                              className="w-full py-2.5 mt-2 text-center text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-905 transition-colors"
                            >
                              Cancel Order Payment
                            </button>
                          </div>
                        )}

                        {razorpayView === 'card' && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => setRazorpayView('menu')} className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-bold">← Back</button>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Pay with Card</span>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block mb-1">CARD NUMBER</label>
                                <input
                                  type="text"
                                  maxLength={19}
                                  value={mockCardNo}
                                  onChange={(e) => setMockCardNo(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 font-semibold"
                                  placeholder="4111 1111 1111 1111"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block mb-1">EXPIRY (MM/YY)</label>
                                  <input
                                    type="text"
                                    maxLength={5}
                                    value={mockCardExpiry}
                                    onChange={(e) => setMockCardExpiry(e.target.value)}
                                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 font-semibold text-center"
                                    placeholder="12/29"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block mb-1">CVV CODE</label>
                                  <input
                                    type="password"
                                    maxLength={3}
                                    value={mockCardCvv}
                                    onChange={(e) => setMockCardCvv(e.target.value.replace(/\D/g, ''))}
                                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 font-semibold text-center"
                                    placeholder="•••"
                                  />
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={mockCardNo.length < 19 || mockCardExpiry.length < 5 || mockCardCvv.length < 3}
                              onClick={handleSimulatedRazorpayPay}
                              className="w-full py-3 bg-gradient-to-r from-brand to-indigo-600 hover:from-brand-dark hover:to-indigo-700 text-white rounded-xl font-extrabold text-xs shadow-md shadow-brand/10 transition-all disabled:from-slate-100 disabled:to-slate-100 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed mt-2 hover:scale-[1.01]"
                            >
                              Pay ₹{estimatedCost}
                            </button>
                          </div>
                        )}

                        {razorpayView === 'upi' && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => setRazorpayView('menu')} className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-bold">← Back</button>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Pay with UPI ID</span>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block mb-1">ENTER UPI ID / VPA</label>
                                <input
                                  type="text"
                                  value={mockUpiId}
                                  onChange={(e) => setMockUpiId(e.target.value)}
                                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 font-semibold"
                                  placeholder="username@bank"
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={!mockUpiId.includes('@')}
                              onClick={handleSimulatedRazorpayPay}
                              className="w-full py-3 bg-gradient-to-r from-brand to-indigo-600 hover:from-brand-dark hover:to-indigo-700 text-white rounded-xl font-extrabold text-xs shadow-md shadow-brand/10 transition-all disabled:from-slate-100 disabled:to-slate-100 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed mt-2 hover:scale-[1.01]"
                            >
                              Pay ₹{estimatedCost}
                            </button>
                          </div>
                        )}

                        {razorpayView === 'netbanking' && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => setRazorpayView('menu')} className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-bold">← Back</button>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Select Bank</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              {['SBI', 'HDFC', 'ICICI', 'AXIS'].map(bankName => (
                                <button
                                  key={bankName}
                                  type="button"
                                  onClick={() => setMockBank(bankName)}
                                  className={`py-3 border rounded-xl font-extrabold text-xs transition-all ${
                                    mockBank === bankName 
                                      ? 'border-brand bg-brand/5 dark:bg-brand/10 text-brand dark:text-brand-light shadow-xs' 
                                      : 'border-slate-150 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-850'
                                  }`}
                                >
                                  {bankName} Bank
                                </button>
                              ))}
                            </div>

                            <button
                              type="button"
                              disabled={!mockBank}
                              onClick={handleSimulatedRazorpayPay}
                              className="w-full py-3 bg-gradient-to-r from-brand to-indigo-600 hover:from-brand-dark hover:to-indigo-700 text-white rounded-xl font-extrabold text-xs shadow-md shadow-brand/10 transition-all disabled:from-slate-100 disabled:to-slate-100 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed mt-2 hover:scale-[1.01]"
                            >
                              Pay ₹{estimatedCost}
                            </button>
                          </div>
                        )}

                        {razorpayView === 'processing' && (
                          <div className="py-10 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
                            <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                            <div>
                              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block">Processing Secure Payment...</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">Contacting Razorpay gateway nodes. Please wait.</span>
                            </div>
                          </div>
                        )}

                        {/* Footer trust badge */}
                        {razorpayView !== 'processing' && (
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500">
                            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>100% Secure PCI-DSS Compliant Gateway</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Direct UPI Scan & Pay Modal */
                  <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-100 dark:border-slate-800 shadow-2xl text-center space-y-4 animate-scale-up">
                      <div className="w-12 h-12 rounded-full bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-light flex items-center justify-center mx-auto shadow-xs">
                        <CreditCard className="w-6 h-6" />
                      </div>

                      <div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Scan & Pay via UPI</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-1">Scan the QR code below to complete the payment for your print order directly to the operator.</p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 flex flex-col items-center gap-3">
                        {/* Mock QR Code */}
                        <div className="w-36 h-36 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl p-2.5 shadow-inner flex flex-col items-center justify-center relative overflow-hidden group">
                          <QrCode className="w-full h-full text-slate-700 dark:text-slate-200" />
                          <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-semibold">Operator Merchant UPI ID</span>
                          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block mt-0.5">{operator?.upi_id || 'mayank@upi'}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-855 rounded-2xl p-4 text-left text-xs space-y-2 font-medium text-slate-500 dark:text-slate-400">
                        <div className="flex justify-between">
                          <span>Print Bill Amount:</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-100">₹{estimatedCost}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500">BHIM UPI redirection. Direct operator settlement.</p>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setCheckoutModalOpen(false)}
                          className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 rounded-xl font-bold text-xs bg-white dark:bg-slate-900 transition-all hover:scale-[1.01]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handlePlaceOrder}
                          className="flex-1 py-2.5 bg-gradient-to-r from-brand to-indigo-600 hover:from-brand-dark hover:to-indigo-750 text-white rounded-xl font-bold text-xs shadow-md shadow-brand/10 transition-all animate-pulse-soft hover:scale-[1.01]"
                        >
                          Confirm Payment
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* TAB 4: Support Chat */}
              {activeTab === 'chat' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Support Desk Chat</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Open channel with operators and automated print assistants.</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden h-[480px] max-w-3xl flex flex-col justify-between">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-brand dark:text-brand-light animate-pulse" />
                        <div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">CopyCampus Print Assistant</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Online & monitoring</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/10">
                      {chatMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                          <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
                          <span>Send a message to start support query.</span>
                        </div>
                      ) : (
                        chatMessages.map(m => {
                          const isStudent = m.sender === 'student';
                          return (
                            <div key={m.id} className={`flex ${isStudent ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] rounded-2xl p-3 text-xs leading-normal relative ${
                                isStudent ? 'bg-brand text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none'
                              }`}>
                                <p>{m.message}</p>
                                <span className={`text-[8px] block mt-1.5 text-right ${isStudent ? 'text-white/70' : 'text-slate-450 dark:text-slate-500'}`}>
                                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Suggested templates:</span>
                        <button
                          onClick={() => handleSimulateStudentMessage('Is my print ready for pickup?')}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-brand dark:hover:border-brand bg-slate-50 dark:bg-slate-950 text-[10px] font-semibold text-slate-500 dark:text-slate-400 transition-colors"
                        >
                          "Is order ready?"
                        </button>
                        <button
                          onClick={() => handleSimulateStudentMessage('Why is there a delay in print release?')}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-brand dark:hover:border-brand bg-slate-50 dark:bg-slate-950 text-[10px] font-semibold text-slate-500 dark:text-slate-400 transition-colors"
                        >
                          "Check delay"
                        </button>
                        <button
                          onClick={() => handleSimulateStudentMessage('Bottom margins are getting cut off on double-side!')}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-850 hover:border-brand dark:hover:border-brand bg-slate-50 dark:bg-slate-950 text-[10px] font-semibold text-rose-500 dark:text-rose-455 border-rose-100 dark:border-rose-900/35 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
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
                          className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-brand bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2.5 bg-gradient-to-r from-brand to-indigo-650 hover:from-brand-dark hover:to-indigo-750 text-white rounded-xl font-bold flex items-center justify-center shrink-0 hover:scale-[1.01] transition-all"
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-105/50 dark:border-slate-800 shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center mx-auto shadow-sm animate-bounce-soft">
              <Check className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Your order has been placed</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Our operators are preparing your print files. You can track your print queue or return to the main dashboard.</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl p-4 text-left text-xs space-y-2.5 font-medium text-slate-505 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Order Reference ID:</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-100">#{orderReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Document Name:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[180px]" title={orderReceipt.pdf_url}>
                  {orderReceipt.pdf_url}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Layout Specs:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {orderReceipt.pages} pgs · {orderReceipt.type} · {orderReceipt.size} · {orderReceipt.sides}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pickup Location:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {orderReceipt.pickup_location || 'Library (Default)'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Expected Pickup:</span>
                <span className="font-bold text-brand bg-brand/5 border border-brand/10 dark:text-brand-light dark:bg-brand/15 dark:border-brand-light/20 px-2 py-0.5 rounded text-[10px]">
                  {getExpectedPickupDate()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Collection Time (Lunch):</span>
                <span className="font-bold text-slate-700 dark:text-slate-250">
                  {orderReceipt.collection_time || '01:00 PM - 01:10 PM'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm font-extrabold text-slate-800 dark:text-slate-100">
                <span>Amount Paid:</span>
                <span className="text-base text-brand dark:text-brand-light font-black">₹{orderReceipt.credits_used}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setOrderReceipt(null); setActiveTab('print'); }}
                className="flex-1 py-2.5 bg-gradient-to-r from-brand to-indigo-650 hover:from-brand-dark hover:to-indigo-750 text-white rounded-xl font-bold text-xs shadow-sm hover:scale-[1.01] transition-all"
              >
                Return to Dashboard
              </button>
              <button
                onClick={() => { setOrderReceipt(null); setActiveTab('track'); }}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-300 rounded-xl font-bold text-xs transition-all bg-white dark:bg-slate-900 hover:scale-[1.01]"
              >
                Track Print Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-850 flex items-center justify-around px-2 py-1 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => { setActiveTab('print'); setOrderReceipt(null); }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'print' ? 'text-brand dark:text-brand-light font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Upload className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-bold">Order Print</span>
        </button>

        <button
          onClick={() => { setActiveTab('track'); setOrderReceipt(null); }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'track' ? 'text-brand dark:text-brand-light font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-bold">Track Queue</span>
        </button>

        <button
          onClick={() => { setActiveTab('notifications'); setOrderReceipt(null); }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
            activeTab === 'notifications' ? 'text-brand dark:text-brand-light font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-brand text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                {notifications.length}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-bold">Alerts</span>
        </button>

        <button
          onClick={() => { setActiveTab('chat'); setOrderReceipt(null); }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'chat' ? 'text-brand dark:text-brand-light font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-bold">Help Desk</span>
        </button>
      </div>

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
