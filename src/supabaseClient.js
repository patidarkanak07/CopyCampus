import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

export const realSupabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// ==========================================
// LOCAL STORAGE MOCK ENGINE (REFINED FALLBACK)
// ==========================================

const MOCK_STORAGE_KEY = 'copycampus_mock_db_v2';

const getInitialMockData = () => {
  const opId = 'op-1';
  return {
    operators: [
      {
        id: opId,
        name: 'Mayank Kalbhor',
        shop_name: 'CopyCampus Central Library',
        upi_id: 'mayank@upi',
        razorpay_enabled: false,
        razorpay_key_id: 'rzp_test_1234567890',
        razorpay_key_secret: '••••••••••••••••',
        open_hours_from: '07:00',
        open_hours_to: '21:00',
        open_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        max_queue: 20,
        auto_accept: false,
        closed_mode: false,
        price_bw: 2,
        price_color: 7,
        price_a3_surcharge: 3,
        price_binding: 20,
        price_stapling: 5,
        price_urgent: 10,
        notify_sms: true,
        notify_whatsapp: true,
        notify_email: false,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    students: [
      {
        id: 'stud-1',
        name: 'Rahul Sharma',
        branch: 'Computer Science',
        section: 'A',
        roll_no: 'CS23B1024',
        email: 'rahul@gmail.com',
        password: 'print123',
        wallet_balance: 350,
        total_orders: 15
      },
      {
        id: 'stud-2',
        name: 'Priya Patel',
        branch: 'Electrical Engineering',
        section: 'B',
        roll_no: 'EE23B1045',
        email: 'student@campus',
        password: 'print123',
        wallet_balance: 500,
        total_orders: 8
      },
      {
        id: 'stud-3',
        name: 'Amit Verma',
        branch: 'Mechanical Engineering',
        section: 'C',
        roll_no: 'ME23B1012',
        email: 'amit@gmail.com',
        password: 'print123',
        wallet_balance: 200,
        total_orders: 32
      },
      {
        id: 'stud-4',
        name: 'Sneha Reddy',
        branch: 'Information Technology',
        section: 'A',
        roll_no: 'IT23B1090',
        email: 'sneha@gmail.com',
        password: 'print123',
        wallet_balance: 150,
        total_orders: 5
      }
    ],
    orders: [
      {
        id: '1041',
        student_id: 'stud-1',
        operator_id: opId,
        status: 'New',
        pages: 12,
        type: 'B&W',
        size: 'A4',
        finishing: 'Stapled',
        pdf_url: 'CS_Theory_Assignment.pdf',
        credits_used: 29, 
        created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        accepted_at: null,
        ready_at: null,
        collected_at: null,
        is_bulk: false,
        reprint_reason: null
      },
      {
        id: '1042',
        student_id: 'stud-2',
        operator_id: opId,
        status: 'Printing',
        pages: 8,
        type: 'Color',
        size: 'A4',
        finishing: 'None',
        pdf_url: 'Resume_Design_Priya.pdf',
        credits_used: 56,
        created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        accepted_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        ready_at: null,
        collected_at: null,
        is_bulk: false,
        reprint_reason: null
      },
      {
        id: '1043',
        student_id: 'stud-3',
        operator_id: opId,
        status: 'Ready',
        pages: 45,
        type: 'B&W',
        size: 'A4',
        finishing: 'Spiral Binding',
        pdf_url: 'Mech_Project_Report.pdf',
        credits_used: 110,
        created_at: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
        accepted_at: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
        ready_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        collected_at: null,
        is_bulk: false,
        reprint_reason: null
      },
      {
        id: '1044',
        student_id: 'stud-4',
        operator_id: opId,
        status: 'Issue',
        pages: 55,
        type: 'Color',
        size: 'A4',
        finishing: 'Spiral Binding',
        pdf_url: 'UX_Portfolio_Final.pdf',
        credits_used: 405,
        created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        accepted_at: new Date(Date.now() - 3.8 * 3600 * 1000).toISOString(),
        ready_at: null,
        collected_at: null,
        is_bulk: true,
        reprint_reason: 'Margins cut off. Chat conversation active.'
      },
      {
        id: '1039',
        student_id: 'stud-2',
        operator_id: opId,
        status: 'Done',
        pages: 5,
        type: 'B&W',
        size: 'A4',
        finishing: 'None',
        pdf_url: 'Math_Homework.pdf',
        credits_used: 10,
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        accepted_at: new Date(Date.now() - 23.9 * 3600 * 1000).toISOString(),
        ready_at: new Date(Date.now() - 23.5 * 3600 * 1000).toISOString(),
        collected_at: new Date(Date.now() - 23 * 3600 * 1000).toISOString()
      }
    ],
    recharges: [],
    transactions: [
      {
        id: 'txn-1',
        operator_id: opId,
        order_id: '1039',
        type: 'Credit',
        amount: 10,
        note: 'Order #1039 Payment: Collected ₹10 via UPI QR Checkout',
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'txn-2',
        operator_id: opId,
        order_id: null,
        type: 'Debit',
        amount: 450,
        note: 'UPI Withdrawal to mayank@upi',
        created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
      },
      {
        id: 'txn-3',
        operator_id: opId,
        order_id: '1043',
        type: 'Credit',
        amount: 110,
        note: 'Order #1043 Payment: Collected ₹110 via UPI QR Checkout',
        created_at: new Date(Date.now() - 75 * 60 * 1000).toISOString()
      },
      {
        id: 'txn-4',
        operator_id: opId,
        order_id: '1044',
        type: 'Credit',
        amount: 405,
        note: 'Order #1044 Payment: Collected ₹405 via UPI QR Checkout',
        created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
      },
      {
        id: 'txn-5',
        operator_id: opId,
        order_id: '1042',
        type: 'Credit',
        amount: 56,
        note: 'Order #1042 Payment: Collected ₹56 via UPI QR Checkout',
        created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString()
      },
      {
        id: 'txn-6',
        operator_id: opId,
        order_id: '1041',
        type: 'Credit',
        amount: 29,
        note: 'Order #1041 Payment: Collected ₹29 via UPI QR Checkout',
        created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString()
      }
    ],
    alerts: [
      {
        id: 'alert-1',
        operator_id: opId,
        type: 'Warning',
        message: 'Order waiting too long — Order #1041 has been waiting > 15 minutes!',
        is_read: false,
        related_order_id: '1041',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: 'alert-2',
        operator_id: opId,
        type: 'Issue',
        message: 'Student Sneha Reddy reported quality issue on #1044',
        is_read: false,
        related_order_id: '1044',
        created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
      }
    ],
    messages: [
      {
        id: 'm-1',
        sender: 'student',
        student_id: 'stud-4',
        message: 'Hello, bottom margins are getting cut off on UX_Portfolio_Final.pdf. Can you help?',
        created_at: new Date(Date.now() - 3600 * 1000).toISOString()
      },
      {
        id: 'm-2',
        sender: 'operator',
        student_id: 'stud-4',
        message: 'Hi Sneha, let me review the document settings. I see the pages require a double-sided layout.',
        created_at: new Date(Date.now() - 3300 * 1000).toISOString()
      },
      {
        id: 'm-3',
        sender: 'student',
        student_id: 'stud-4',
        message: 'Ah, okay! Can you please adjust and reprint? I won\'t be charged extra right?',
        created_at: new Date(Date.now() - 3000 * 1000).toISOString()
      }
    ]
  };
};

const getDB = () => {
  const dbStr = localStorage.getItem(MOCK_STORAGE_KEY);
  const template = getInitialMockData();
  if (!dbStr) {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(template));
    return template;
  }
  const parsed = JSON.parse(dbStr);
  const merged = {
    operators: parsed.operators || template.operators,
    students: parsed.students || template.students,
    orders: parsed.orders || template.orders,
    recharges: parsed.recharges || template.recharges,
    transactions: parsed.transactions || template.transactions,
    alerts: parsed.alerts || template.alerts,
    messages: parsed.messages || template.messages
  };
  return merged;
};

const saveDB = (data) => {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event('copycampus_db_update'));
};

const subscribers = {
  orders: [],
  alerts: [],
  messages: []
};

window.addEventListener('copycampus_db_update', () => {
  const db = getDB();
  subscribers.orders.forEach(cb => cb(db.orders));
  subscribers.alerts.forEach(cb => cb(db.alerts));
  subscribers.messages.forEach(cb => cb(db.messages));
});

export const mockSupabase = {
  auth: {
    getUser: () => {
      const storedUser = localStorage.getItem('copycampus_operator_session');
      if (storedUser) {
        return { data: { user: JSON.parse(storedUser) }, error: null };
      }
      return { data: { user: null }, error: null };
    },
    signInWithPassword: async ({ email, password }) => {
      if (email === 'operator@campus' && password === 'print123') {
        const user = { id: 'op-1', email, name: 'Mayank Kalbhor', role: 'operator' };
        localStorage.setItem('copycampus_operator_session', JSON.stringify(user));
        return { data: { user }, error: null };
      }

      // Check if student exists in local DB registered list
      const db = getDB();
      const matchedStudent = db.students.find(s => 
        s.roll_no === email || 
        s.email === email
      );
      if (matchedStudent) {
        if (matchedStudent.password && matchedStudent.password !== password) {
          return { data: null, error: new Error('Invalid credentials. Password incorrect for this student.') };
        }
        const user = { id: matchedStudent.id, email: matchedStudent.email || (matchedStudent.roll_no + '@campus'), name: matchedStudent.name, role: 'student' };
        localStorage.setItem('copycampus_operator_session', JSON.stringify(user));
        return { data: { user }, error: null };
      }

      return { data: null, error: new Error('Invalid credentials. Use operator@campus, student@campus, or register a new Student.') };
    },
    signUp: async ({ email, password, options }) => {
      const db = getDB();
      const rollNo = options.data.roll_no;

      const exists = db.students.some(s => s.roll_no === rollNo || s.email === email);
      if (exists) {
        return { data: null, error: new Error('A student with this Enrollment Number or Email already exists.') };
      }

      const newStudentId = 'stud-' + Math.random().toString(36).substr(2, 9);
      const newStudent = {
        id: newStudentId,
        name: options.data.name || email.split('@')[0],
        email: email,
        password: password,
        branch: options.data.branch || 'N/A',
        section: 'A',
        roll_no: rollNo || 'N/A',
        phone: options.data.phone || 'N/A',
        total_orders: 0,
        wallet_balance: 500
      };

      db.students.push(newStudent);
      saveDB(db);

      const user = { id: newStudentId, email, name: newStudent.name, role: 'student' };
      localStorage.setItem('copycampus_operator_session', JSON.stringify(user));
      return { data: { user }, error: null };
    },
    signOut: async () => {
      localStorage.removeItem('copycampus_operator_session');
      return { error: null };
    }
  },

  operators: {
    get: async () => {
      const db = getDB();
      return { data: db.operators[0] || null, error: null };
    },
    update: async (updates) => {
      const db = getDB();
      db.operators[0] = { ...db.operators[0], ...updates };
      saveDB(db);
      return { data: db.operators[0], error: null };
    }
  },

  students: {
    list: async () => {
      const db = getDB();
      return { data: db.students, error: null };
    },
    get: async (id) => {
      const db = getDB();
      const student = db.students.find(s => s.id === id);
      return { data: student || null, error: student ? null : new Error('Student not found') };
    },
    update: async (id, updates) => {
      const db = getDB();
      const index = db.students.findIndex(s => s.id === id);
      if (index !== -1) {
        db.students[index] = { ...db.students[index], ...updates };
        saveDB(db);
        return { data: db.students[index], error: null };
      }
      return { data: null, error: new Error('Student not found') };
    }
  },

  recharges: {
    list: async () => {
      const db = getDB();
      return { data: db.recharges || [], error: null };
    },
    insert: async (recharge) => {
      const db = getDB();
      const newRec = {
        id: 'rec-' + Math.floor(100 + Math.random() * 900),
        created_at: new Date().toISOString(),
        ...recharge
      };
      db.recharges.unshift(newRec);
      
      let studIndex = db.students.findIndex(s => s.id === recharge.student_id);
      if (studIndex === -1) {
        const newStudent = {
          id: recharge.student_id,
          name: 'Priya Patel',
          branch: 'Electrical Eng',
          section: 'A',
          roll_no: 'EE23B1045',
          total_orders: 0
        };
        db.students.push(newStudent);
      }

      // Record transaction on operator side (adding cash amount_paid as Credit!)
      db.transactions.unshift({
        id: 'txn-' + Math.random().toString(36).substr(2, 9),
        operator_id: 'op-1',
        order_id: null,
        type: 'Credit',
        amount: recharge.amount_paid,
        note: `Prepaid Recharge: Collected cash ₹${recharge.amount_paid}`,
        created_at: new Date().toISOString()
      });

      // Create operator notification/alert
      db.alerts.unshift({
        id: 'alert-' + Math.random().toString(36).substr(2, 9),
        operator_id: 'op-1',
        type: 'Payment',
        message: `Prepaid Recharge: Collected cash ₹${recharge.amount_paid} from student`,
        is_read: false,
        related_order_id: null,
        created_at: new Date().toISOString()
      });

      saveDB(db);
      return { data: newRec, error: null };
    }
  },

  orders: {
    list: async () => {
      const db = getDB();
      return { data: db.orders, error: null };
    },
    insert: async (order) => {
      const db = getDB();
      const newOrder = {
        id: String(Math.floor(1000 + Math.random() * 9000)),
        operator_id: 'op-1',
        status: 'New',
        created_at: new Date().toISOString(),
        accepted_at: null,
        ready_at: null,
        collected_at: null,
        is_bulk: order.pages > 50,
        reprint_reason: null,
        ...order
      };
      
      db.alerts.unshift({
        id: 'alert-' + Math.random().toString(36).substr(2, 9),
        operator_id: 'op-1',
        type: 'New Order',
        message: `New order #${newOrder.id} placed by student (Paid ₹${order.credits_used})`,
        is_read: false,
        related_order_id: newOrder.id,
        created_at: new Date().toISOString()
      });

      // Record direct cash receipt in operator ledger
      db.transactions.unshift({
        id: 'txn-' + Math.random().toString(36).substr(2, 9),
        operator_id: 'op-1',
        order_id: newOrder.id,
        type: 'Credit',
        amount: order.credits_used,
        note: `Order #${newOrder.id} Payment: Collected ₹${order.credits_used} via UPI QR Checkout`,
        created_at: new Date().toISOString()
      });

      const studIndex = db.students.findIndex(s => s.id === newOrder.student_id);
      if (studIndex !== -1) {
        db.students[studIndex].total_orders += 1;
      }

      if (newOrder.is_bulk) {
        db.alerts.unshift({
          id: 'alert-' + Math.random().toString(36).substr(2, 9),
          operator_id: 'op-1',
          type: 'Warning',
          message: `Large order waiting — #${newOrder.id} (${newOrder.pages} pages). Review before accepting.`,
          is_read: false,
          related_order_id: newOrder.id,
          created_at: new Date().toISOString()
        });
      }

      db.orders.unshift(newOrder);
      saveDB(db);
      return { data: newOrder, error: null };
    },
    update: async (id, updates) => {
      const db = getDB();
      const index = db.orders.findIndex(o => o.id === id);
      if (index !== -1) {
        const oldOrder = db.orders[index];
        db.orders[index] = { ...oldOrder, ...updates };
        saveDB(db);
        return { data: db.orders[index], error: null };
      }
      return { data: null, error: new Error('Order not found') };
    },
    subscribe: (callback) => {
      subscribers.orders.push(callback);
      callback(getDB().orders);
      return () => {
        subscribers.orders = subscribers.orders.filter(cb => cb !== callback);
      };
    }
  },

  transactions: {
    list: async () => {
      const db = getDB();
      return { data: db.transactions, error: null };
    },
    insert: async (transaction) => {
      const db = getDB();
      const newTxn = {
        id: 'txn-' + Math.random().toString(36).substr(2, 9),
        operator_id: 'op-1',
        created_at: new Date().toISOString(),
        ...transaction
      };
      db.transactions.unshift(newTxn);
      saveDB(db);
      return { data: newTxn, error: null };
    }
  },

  alerts: {
    list: async () => {
      const db = getDB();
      return { data: db.alerts, error: null };
    },
    insert: async (alert) => {
      const db = getDB();
      const newAlert = {
        id: 'alert-' + Math.random().toString(36).substr(2, 9),
        operator_id: 'op-1',
        is_read: false,
        created_at: new Date().toISOString(),
        ...alert
      };
      db.alerts.unshift(newAlert);
      saveDB(db);
      return { data: newAlert, error: null };
    },
    update: async (id, updates) => {
      const db = getDB();
      const index = db.alerts.findIndex(a => a.id === id);
      if (index !== -1) {
        db.alerts[index] = { ...db.alerts[index], ...updates };
        saveDB(db);
        return { data: db.alerts[index], error: null };
      }
      return { data: null, error: new Error('Alert not found') };
    },
    markAllRead: async () => {
      const db = getDB();
      db.alerts = db.alerts.map(a => ({ ...a, is_read: true }));
      saveDB(db);
      return { error: null };
    },
    subscribe: (callback) => {
      subscribers.alerts.push(callback);
      callback(getDB().alerts);
      return () => {
        subscribers.alerts = subscribers.alerts.filter(cb => cb !== callback);
      };
    }
  },

  messages: {
    list: async () => {
      const db = getDB();
      return { data: db.messages || [], error: null };
    },
    insert: async (message) => {
      const db = getDB();
      const newMsg = {
        id: 'm-' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        ...message
      };
      db.messages.push(newMsg);
      saveDB(db);
      return { data: newMsg, error: null };
    },
    subscribe: (callback) => {
      subscribers.messages.push(callback);
      callback(getDB().messages || []);
      return () => {
        subscribers.messages = subscribers.messages.filter(cb => cb !== callback);
      };
    }
  }
};

export const supabase = realSupabase || mockSupabase;
