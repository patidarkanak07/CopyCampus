import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import DashboardHome from './sections/DashboardHome';
import Orders from './sections/Orders';
import Earnings from './sections/Earnings';
import Messages from './sections/Messages';
import Students from './sections/Students';
import Alerts from './sections/Alerts';
import SettingsView from './sections/Settings';
import StudentPortal from './sections/StudentPortal';
import { 
  Lock, 
  Mail, 
  AlertCircle, 
  X,
  FileCheck,
  User,
  Users,
  LayoutGrid,
  FileText,
  IndianRupee,
  MessageSquare,
  Settings
} from 'lucide-react';

export default function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [email, setEmail] = useState('student@campus'); // Default helper preset
  const [password, setPassword] = useState('print123');
  const [loginError, setLoginError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Student Signup States
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentBranch, setStudentBranch] = useState('Computer Science');
  const [studentRollNo, setStudentRollNo] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [authTab, setAuthTab] = useState('student'); // 'student' or 'operator'
  const [studentAuthMode, setStudentAuthMode] = useState('login'); // 'login' or 'register'
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Central Application States
  const [operator, setOperator] = useState(null);
  const [students, setStudents] = useState([]);
  const [orders, setOrders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recharges, setRecharges] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [messages, setMessages] = useState([]);

  // Sidebar navigation active state (Operator panel only)
  const [currentSection, setCurrentSection] = useState('dashboard');
  
  // Highlighting parameters passed from other views
  const [filterOrderId, setFilterOrderId] = useState(null);
  const [chatStudentId, setChatStudentId] = useState(null);

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('copycampus_theme') === 'dark');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('copycampus_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('copycampus_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // Toast states
  const [toasts, setToasts] = useState([]);

  // Toast triggers
  const addToast = (message, type = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Check auth session on boot
  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setSessionUser(data.user);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // Fetch initial database entities and listen to updates (with polling fallback)
  useEffect(() => {
    if (!sessionUser) return;

    const fetchDatabase = async () => {
      const { data: opData } = await supabase.operators.get();
      if (opData) setOperator(opData);

      const { data: stData } = await supabase.students.list();
      if (stData) setStudents(stData);

      const { data: txData } = await supabase.transactions.list();
      if (txData) setTransactions(txData);

      const { data: recData } = await supabase.recharges.list();
      if (recData) setRecharges(recData);

      const { data: ordData } = await supabase.orders.list();
      if (ordData) setOrders(ordData);

      const { data: alData } = await supabase.alerts.list();
      if (alData) setAlerts(alData);

      const { data: msgData } = await supabase.messages.list();
      if (msgData) setMessages(msgData);
    };

    fetchDatabase();

    window.addEventListener('copycampus_db_update', fetchDatabase);

    // Polling fallback to keep multiple tabs/windows fully synchronized
    const intervalId = setInterval(() => {
      fetchDatabase();
    }, 1500);

    return () => {
      window.removeEventListener('copycampus_db_update', fetchDatabase);
      clearInterval(intervalId);
    };
  }, [sessionUser]);

  // Real-time Supabase subscriptions (syncs changes across windows/localStorage)
  useEffect(() => {
    if (!sessionUser) return;

    const unsubOrders = supabase.orders.subscribe((dbOrders) => {
      setOrders(dbOrders);
    });

    const unsubAlerts = supabase.alerts.subscribe((dbAlerts) => {
      setAlerts(dbAlerts);
    });

    const unsubMessages = supabase.messages.subscribe((dbMsgs) => {
      setMessages(dbMsgs);
    });

    return () => {
      unsubOrders();
      unsubAlerts();
      unsubMessages();
    };
  }, [sessionUser]);

  // Listen to storage events to support cross-tab real-time updates!
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'copycampus_mock_db_v2') {
        window.dispatchEvent(new Event('copycampus_db_update'));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Auth: User Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setLoginError(error.message);
    } else if (data?.user) {
      setSessionUser(data.user);
      addToast(`Logged in successfully as ${data.user.role}! 🔓`, 'success');
    }
  };

  // Auth: Student Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoginError(null);
    if (!studentEmail.trim()) {
      setLoginError('Email Address is required.');
      return;
    }
    if (!studentRollNo.trim()) {
      setLoginError('College Enrollment Number is required.');
      return;
    }
    if (!termsAccepted) {
      setLoginError('You must confirm the Terms & Conditions to make an account.');
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email: studentEmail,
      password: password,
      options: {
        data: {
          name: studentName,
          branch: studentBranch,
          roll_no: studentRollNo,
          phone: studentPhone
        }
      }
    });

    if (error) {
      setLoginError(error.message);
    } else if (data?.user) {
      setSessionUser(data.user);
      addToast(`Account created successfully! Welcome to CopyCampus. 🔓`, 'success');
      
      const { data: stData } = await supabase.students.list();
      if (stData) setStudents(stData);
    }
  };

  // Auth: User Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
    setOperator(null);
    setCurrentSection('dashboard');
    addToast('Logged out. Session locked.', 'warning');
  };

  // State Updates propagation
  const handleUpdateOrder = (orderId, updates) => {
    if (orderId === null) {
      setOrders(prev => [updates, ...prev]);
      return;
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
  };

  const handleUpdateStudent = (studentId, updates) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ...updates } : s));
  };

  const handleAddTransaction = async (txn) => {
    await supabase.transactions.insert(txn);
  };

  const handleAddAlert = async (alert) => {
    await supabase.alerts.insert(alert);
  };

  const handleAddRecharge = async (rechargeObj) => {
    const { data: stData } = await supabase.students.list();
    if (stData) setStudents(stData);

    const { data: recData } = await supabase.recharges.list();
    if (recData) setRecharges(recData);

    const { data: txData } = await supabase.transactions.list();
    if (txData) setTransactions(txData);
  };

  const handleAddMessage = (msgObj) => {
    setMessages(prev => [...prev, msgObj]);
  };

  // Custom Navigation function from dashboards clicking
  const handleNavigateToSection = (sectionId, params = null) => {
    setCurrentSection(sectionId);
    if (sectionId === 'orders' && params?.filterOrderId) {
      setFilterOrderId(params.filterOrderId);
    } else {
      setFilterOrderId(null);
    }

    if (sectionId === 'messages' && params?.studentId) {
      setChatStudentId(params.studentId);
    } else {
      setChatStudentId(null);
    }
  };

  const unreadAlertsCount = alerts.filter(a => !a.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Initializing CopyCampus...</span>
        </div>
      </div>
    );
  }

  // Lockscreen Auth wrapper if not logged in
  if (!sessionUser) {
    const isOperator = authTab === 'operator';
    const isRegister = studentAuthMode === 'register' && !isOperator;

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
        <div className="bg-white border border-slate-200/80 max-w-md w-full rounded-3xl p-8 shadow-xl flex flex-col justify-between relative overflow-hidden">
          
          <div className="text-center mb-6">
            <span className="text-3xl font-light text-slate-800 tracking-tight block">
              Copy<span className="font-extrabold text-brand">Campus</span>
            </span>
            <p className="text-xs text-slate-400 font-medium mt-1">Multi-Role Landing Console Gateway</p>
          </div>

          {/* Role selector tabs */}
          <div className="flex border-b border-slate-100 mb-5 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setAuthTab('student'); setLoginError(null); }}
              className={`flex-1 pb-3 text-center border-b-2 transition-all ${
                authTab === 'student' ? 'border-brand text-brand' : 'border-transparent text-slate-400'
              }`}
            >
              Student Portal
            </button>
            <button
              type="button"
              onClick={() => { setAuthTab('operator'); setLoginError(null); }}
              className={`flex-1 pb-3 text-center border-b-2 transition-all ${
                authTab === 'operator' ? 'border-brand text-brand' : 'border-transparent text-slate-400'
              }`}
            >
              Operator Console
            </button>
          </div>

          <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-3.5">
            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs flex items-center gap-2 font-semibold animate-shake">
                <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* STUDENT SIGNUP ONLY FIELDS */}
            {isRegister && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Priya Patel"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-brand text-xs text-slate-700 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    required
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="e.g. priya@student.in"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-brand text-xs text-slate-700 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Branch</label>
                    <select
                      value={studentBranch}
                      onChange={(e) => setStudentBranch(e.target.value)}
                      className="w-full px-2 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-brand text-xs text-slate-700 bg-white"
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Electrical Eng">Electrical Eng</option>
                      <option value="Mechanical Eng">Mechanical Eng</option>
                      <option value="Civil Eng">Civil Eng</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-brand text-xs text-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">College Enrollment Number</label>
                  <input
                    type="text"
                    required
                    value={studentRollNo}
                    onChange={(e) => setStudentRollNo(e.target.value)}
                    placeholder="e.g. EE23B1045"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-brand text-xs text-slate-700 font-semibold"
                  />
                </div>

                <div className="flex items-start gap-2.5 pt-2 select-none">
                  <input
                    type="checkbox"
                    id="termsAccepted"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded text-brand focus:ring-brand"
                  />
                  <label htmlFor="termsAccepted" className="text-[10px] text-slate-500 font-semibold leading-normal cursor-pointer">
                    I accept the <span className="font-bold text-slate-700">Terms & Conditions</span>: we are not responsible for any misstating or misprint, and all orders are strictly non-refundable.
                  </label>
                </div>
              </>
            )}

            {/* COMMON FIELDS (EMAIL / ENROLLMENT & PASSWORD) */}
            {!isRegister && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {isOperator ? 'Operator Email' : 'Email or Enrollment Number'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isOperator ? 'operator@campus' : 'student@campus or EE23B1045'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand text-xs text-slate-700 font-semibold"
                  />
                </div>
              </div>
            )}

            {/* Always ask for password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {isRegister ? 'Create Password' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand text-xs text-slate-700 font-semibold"
                />
              </div>
            </div>

            {/* Toggle Student Login vs Register */}
            {!isOperator && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setStudentAuthMode(isRegister ? 'login' : 'register');
                    setLoginError(null);
                    // Preset default helper rolls/emails
                    if (isRegister) {
                      setEmail('student@campus');
                    }
                  }}
                  className="text-[10px] text-brand hover:underline font-bold"
                >
                  {isRegister ? 'Already have an account? Sign In' : 'New student? Register account'}
                </button>
              </div>
            )}

            {/* Presets shortcut boxes for quick testing */}
            {!isRegister && (
              <div className="grid grid-cols-2 gap-3 text-[10px] pt-1">
                <button
                  type="button"
                  onClick={() => { setAuthTab('student'); setStudentAuthMode('login'); setEmail('student@campus'); setPassword('print123'); }}
                  className={`py-2 border rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                    authTab === 'student' && studentAuthMode === 'login' ? 'border-brand bg-brand/5 text-brand' : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                >
                  <User className="w-3.5 h-3.5" /> Preset Student
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab('operator'); setEmail('operator@campus'); setPassword('print123'); }}
                  className={`py-2 border rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                    authTab === 'operator' ? 'border-brand bg-brand/5 text-brand' : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> Preset Operator
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-brand hover:bg-brand-dark text-white rounded-xl font-bold text-xs shadow-md shadow-brand/10 transition-all mt-4"
            >
              {isRegister ? 'Create Student Account & Login' : 'Sign In Session'}
            </button>
          </form>

        </div>
      </div>
    );
  }

  // ==========================================
  // STUDENT PORTAL SCREEN
  // ==========================================
  if (sessionUser.role === 'student') {
    return (
      <StudentPortal 
        studentId={sessionUser.id}
        students={students}
        orders={orders}
        messages={messages}
        operator={operator}
        onUpdateStudent={handleUpdateStudent}
        onAddOrder={(ord) => handleUpdateOrder(null, ord)}
        onAddRecharge={handleAddRecharge}
        onAddMessage={handleAddMessage}
        onLogout={handleLogout}
        addToast={addToast}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
    );
  }

  // ==========================================
  // OPERATOR TERMINAL SCREEN
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col relative select-none transition-colors duration-200">
      
      {/* Toast Alert stack */}
      <div className="fixed bottom-5 right-5 space-y-2.5 z-50 pointer-events-none max-w-sm w-full">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-center justify-between gap-3 text-xs font-extrabold transition-all duration-300 ${
              t.type === 'success' 
                ? 'bg-emerald-50/75 dark:bg-emerald-950/70 border-emerald-200/50 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300' 
                : 'bg-rose-50/75 dark:bg-rose-950/70 border-rose-200/50 dark:border-rose-800/40 text-rose-800 dark:text-rose-300'
            } backdrop-blur-md`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-1.5 rounded-full shrink-0 ${
                t.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
              }`}>
                <FileCheck className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">{t.message}</span>
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <TopBar 
        operator={operator} 
        unreadAlertsCount={unreadAlertsCount} 
        onNavigateToAlerts={() => handleNavigateToSection('alerts')} 
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <div className="flex flex-col md:flex-row flex-1 min-h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] overflow-hidden">
        <Sidebar 
          currentSection={currentSection} 
          onSelectSection={handleNavigateToSection} 
          unreadAlertsCount={unreadAlertsCount} 
        />

        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {currentSection === 'dashboard' && (
            <DashboardHome 
              onNavigate={handleNavigateToSection} 
              students={students}
              orders={orders}
              alerts={alerts}
              transactions={transactions}
            />
          )}

          {currentSection === 'orders' && (
            <Orders 
              students={students}
              orders={orders}
              onUpdateOrder={handleUpdateOrder}
              onAddTransaction={handleAddTransaction}
              onAddAlert={handleAddAlert}
              addToast={addToast}
              onNavigate={handleNavigateToSection}
              initialFilterOrderId={filterOrderId}
            />
          )}

          {currentSection === 'earnings' && (
            <Earnings 
              transactions={transactions}
              students={students}
              operator={operator}
              onAddTransaction={handleAddTransaction}
              onUpdateOperator={(updates) => setOperator(prev => ({ ...prev, ...updates }))}
              addToast={addToast}
            />
          )}

          {currentSection === 'messages' && (
            <Messages 
              students={students}
              messages={messages}
              onAddMessage={handleAddMessage}
              addToast={addToast}
              initialStudentId={chatStudentId}
            />
          )}

          {currentSection === 'students' && (
            <Students 
              students={students}
              orders={orders}
              onUpdateStudent={handleUpdateStudent}
              onAddTransaction={handleAddTransaction}
              addToast={addToast}
            />
          )}

          {currentSection === 'alerts' && (
            <Alerts 
              alerts={alerts}
              onUpdateAlerts={setAlerts}
              onNavigate={handleNavigateToSection}
              addToast={addToast}
            />
          )}

          {currentSection === 'settings' && (
            <SettingsView 
              operator={operator}
              onUpdateOperator={(updates) => setOperator(prev => ({ ...prev, ...updates }))}
              onLogout={handleLogout}
              addToast={addToast}
            />
          )}
        </main>

      </div>

      {/* Operator Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex items-center justify-around px-2 py-1 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => handleNavigateToSection('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            currentSection === 'dashboard' ? 'text-brand font-bold' : 'text-slate-500'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] mt-1">Dashboard</span>
        </button>

        <button
          onClick={() => handleNavigateToSection('orders')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            currentSection === 'orders' ? 'text-brand font-bold' : 'text-slate-500'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] mt-1">Orders</span>
        </button>

        <button
          onClick={() => handleNavigateToSection('earnings')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            currentSection === 'earnings' ? 'text-brand font-bold' : 'text-slate-500'
          }`}
        >
          <IndianRupee className="w-5 h-5" />
          <span className="text-[10px] mt-1">Earnings</span>
        </button>

        <button
          onClick={() => handleNavigateToSection('messages')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            currentSection === 'messages' ? 'text-brand font-bold' : 'text-slate-500'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] mt-1">Messages</span>
        </button>

        <button
          onClick={() => handleNavigateToSection('settings')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            currentSection === 'settings' ? 'text-brand font-bold' : 'text-slate-500'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-1">Settings</span>
        </button>
      </div>

    </div>
  );
}
