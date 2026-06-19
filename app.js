// --- CopyCampus State Management & Simulated Backend ---

const DB_KEY = 'campus_print_state';

const DEFAULT_STATE = {
  students: [],
  orders: [],
  inventory: { bw: 500, color: 150 },
  settings: { lowStockBW: 100, lowStockColor: 50 },
  operatorSession: {
    name: 'Operator Desk A',
    startTime: null,
    loggedIn: false
  },
  notifications: []
};

let state = { ...DEFAULT_STATE };
let currentStudent = null; // Currently logged in student object
let bannerDismissed = false; // local UI flag for low-stock warning banner
let focusedOrderIndex = -1; // Keyboard shortcut focused order index (within currently visible queue cards)

// Helper: Formats timestamp as DD MMM YYYY, HH:MM
function formatTimestamp(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

// State Persistence Hooks
function loadState() {
  const data = localStorage.getItem(DB_KEY);
  if (data) {
    state = JSON.parse(data);
  } else {
    seedDatabase();
  }
}

function saveState() {
  localStorage.setItem(DB_KEY, JSON.stringify(state));
}

function seedDatabase() {
  state = {
    students: [
      {
        id: 'STU-1',
        email: 'student@campus.edu',
        name: 'student',
        credits: 500,
        ledger: [
          { type: 'purchase', amount: 500, priceINR: 300, reason: 'Initial seed credits', note: '', operatorName: 'System', timestamp: Date.now() - 24 * 60 * 60 * 1000 }
        ]
      },
      {
        id: 'STU-2',
        email: 'test@iit.ac.in',
        name: 'test',
        credits: 200,
        ledger: [
          { type: 'purchase', amount: 200, priceINR: 150, reason: 'Initial seed credits', note: '', operatorName: 'System', timestamp: Date.now() - 12 * 60 * 60 * 1000 }
        ]
      }
    ],
    orders: [
      {
        id: 'ORD-1',
        studentId: 'STU-1',
        studentEmail: 'student@campus.edu',
        fileName: 'math_homework_v2.pdf',
        fileUrl: 'https://s3.ap-south-1.amazonaws.com/campus-print-bucket/seed/math_homework_v2.pdf',
        pages: 10,
        copies: 1,
        colorMode: 'bw',
        sides: 'single',
        binding: false,
        stapling: false,
        pageRange: 'All',
        pickupPoint: 'Library Counter',
        cost: 10,
        status: 'queued',
        cancelled: false,
        flagReason: null,
        stockDeducted: false,
        annotations: [],
        createdAt: Date.now() - 30 * 60 * 1000,
        updatedAt: Date.now() - 30 * 60 * 1000
      },
      {
        id: 'ORD-2',
        studentId: 'STU-1',
        studentEmail: 'student@campus.edu',
        fileName: 'chemistry_lab_slides.pptx',
        fileUrl: 'https://s3.ap-south-1.amazonaws.com/campus-print-bucket/seed/chemistry_lab_slides.pptx',
        pages: 6,
        copies: 1,
        colorMode: 'color',
        sides: 'double',
        binding: false,
        stapling: false,
        pageRange: 'All',
        pickupPoint: 'Block A Office',
        cost: 11, // Math.ceil(6 * 1 * 3 * 0.6) = 11
        status: 'printing',
        cancelled: false,
        flagReason: null,
        stockDeducted: true, // seed already printing (stock already deducted manually in real print shop)
        annotations: [],
        createdAt: Date.now() - 60 * 60 * 1000,
        updatedAt: Date.now() - 45 * 60 * 1000,
        printedAt: Date.now() - 45 * 60 * 1000
      },
      {
        id: 'ORD-3',
        studentId: 'STU-1',
        studentEmail: 'student@campus.edu',
        fileName: 'history_essay_draft.docx',
        fileUrl: 'https://s3.ap-south-1.amazonaws.com/campus-print-bucket/seed/history_essay_draft.docx',
        pages: 4,
        copies: 1,
        colorMode: 'bw',
        sides: 'single',
        binding: false,
        stapling: false,
        pageRange: 'All',
        pickupPoint: 'Main Gate Booth',
        cost: 4,
        status: 'ready',
        cancelled: false,
        flagReason: null,
        stockDeducted: true, // ready order has stock deducted
        annotations: [],
        createdAt: Date.now() - 90 * 60 * 1000,
        updatedAt: Date.now() - 75 * 60 * 1000,
        printedAt: Date.now() - 75 * 60 * 1000,
        readyAt: Date.now() - 75 * 60 * 1000
      }
    ],
    inventory: { bw: 90, color: 40 }, // triggers low stock immediately on first seed
    settings: { lowStockBW: 100, lowStockColor: 50 },
    operatorSession: {
      name: 'Operator Desk A',
      startTime: null,
      loggedIn: false
    },
    notifications: []
  };
  saveState();
}

// --- Dynamic Core Service Classes ---

class CloudStorageService {
  async upload(file, onProgress) {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (onProgress) onProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          const uuid = Math.floor(100000 + Math.random() * 900000);
          const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
          const mockUrl = `https://s3.ap-south-1.amazonaws.com/campus-print-bucket/${uuid}/${cleanName}`;
          const estimatedPages = this.estimatePages(file);
          resolve({ url: mockUrl, pages: estimatedPages });
        }
      }, 150);
    });
  }

  estimatePages(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 5;
    if (ext === 'docx') return Math.floor(2 + Math.random() * 19); // 2-20
    if (ext === 'pptx') return Math.floor(5 + Math.random() * 26); // 5-30
    if (['jpg', 'jpeg', 'png'].includes(ext)) return 1;
    return 3; // fallback
  }

  async delete(url) {
    const fileName = url.split('/').pop();
    notifications.log(`[CloudStorage] Permanent deletion for storage file: ${fileName}`);
    notifications.toast(`File ${fileName} deleted from cloud storage`, 'info');
  }
}

class PaymentModule {
  generateUPILink(amount) {
    return `upi://pay?pa=campus-print@upi&am=${amount}&cu=INR`;
  }

  generateQR(amount) {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    
    // Draw flat UI design pattern placeholder
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(0, 0, 160, 160);
    
    // Draw outer flat QR border
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 140, 140);
    
    // Draw small corner squares simulating QR markers
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(20, 20, 30, 30);
    ctx.fillRect(110, 20, 30, 30);
    ctx.fillRect(20, 110, 30, 30);
    
    // Draw amount text in center
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 13px "Plus Jakarta Sans"';
    ctx.textAlign = 'center';
    ctx.fillText(`Scan to Pay`, 80, 80);
    ctx.font = 'bold 15px "Plus Jakarta Sans"';
    ctx.fillText(`₹${amount}`, 80, 100);
    
    return canvas.toDataURL();
  }

  deductCredits(studentId, amount, reason) {
    const student = state.students.find(s => s.id === studentId);
    if (student) {
      student.credits = Math.max(0, student.credits - amount);
      student.ledger.push({
        type: 'deduction',
        amount: -amount,
        reason: reason,
        note: '',
        operatorName: 'System Checkout',
        timestamp: Date.now()
      });
      saveState();
      renderAll();
    }
  }

  addCredits(studentId, amount, reason, note = '', operatorName = 'System') {
    const student = state.students.find(s => s.id === studentId);
    if (student) {
      student.credits += amount;
      student.ledger.push({
        type: 'purchase',
        amount: amount,
        reason: reason,
        note: note,
        operatorName: operatorName,
        timestamp: Date.now()
      });
      saveState();
      renderAll();
    }
  }
}

class NotificationEngine {
  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(toast);
    
    // Trigger entry transition
    setTimeout(() => toast.classList.add('show'), 50);
    
    // Auto dismiss
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  log(message) {
    state.notifications.push({
      message: message,
      timestamp: Date.now()
    });
    saveState();
    
    // Append in simulator console if open
    const consoleLog = document.getElementById('sim-console-log');
    if (consoleLog) {
      const time = new Date().toLocaleTimeString();
      consoleLog.innerHTML += `\n[${time}] ${message}`;
      consoleLog.scrollTop = consoleLog.scrollHeight;
    }
  }

  simulateSMS(email, message) {
    this.log(`[SMS] ${email}: ${message}`);
  }
}

class CronDeletionJob {
  run() {
    const now = Date.now();
    const threshold = 10000; // 10s countdown for demo
    let deletedCount = 0;
    
    state.orders.forEach(order => {
      if (order.status === 'collected' && order.fileUrl) {
        const timeElapsed = now - (order.collectedAt || now);
        if (timeElapsed >= threshold) {
          const fileName = order.fileName;
          order.fileUrl = null; // deleted reference
          deletedCount++;
          notifications.log(`[Cron] Privacy deletion: file ${fileName} removed from bucket for Order ${order.id}.`);
        }
      }
    });
    
    if (deletedCount > 0) {
      saveState();
      renderAll();
    }
    return deletedCount;
  }

  getScheduled() {
    const now = Date.now();
    const threshold = 10000;
    return state.orders
      .filter(o => o.status === 'collected' && o.fileUrl)
      .map(o => {
        const remaining = Math.max(0, Math.ceil((threshold - (now - (o.collectedAt || now))) / 1000));
        return { orderId: o.id, fileName: o.fileName, timeRemaining: remaining };
      });
  }
}

class MockGoogleDrivePicker {
  async open() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          name: 'Assignment_Draft.docx',
          size: 245000,
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
      }, 800);
    });
  }
}

// Cost Calculator Function
function calculateCost(pages, copies, colorMode, sides, binding, stapling) {
  let rate = colorMode === 'color' ? 3 : 1;
  let total = pages * copies * rate;
  if (sides === 'double') total = Math.ceil(total * 0.6);
  if (binding) total += 10;
  if (stapling) total += 2;
  return total;
}

// Instantiate Service classes
const storageService = new CloudStorageService();
const payments = new PaymentModule();
const notifications = new NotificationEngine();
const cronJob = new CronDeletionJob();
const drivePicker = new MockGoogleDrivePicker();

// --- View Router & Layout Helpers ---

function switchView(view) {
  const studentPane = document.getElementById('student-pane');
  const operatorPane = document.getElementById('operator-pane');
  const btnShowStudent = document.getElementById('btnShowStudent');
  const btnShowOperator = document.getElementById('btnShowOperator');
  
  if (view === 'student') {
    studentPane.classList.remove('pane-hidden-mobile');
    operatorPane.classList.add('pane-hidden-mobile');
    btnShowStudent.classList.add('btn-student');
    btnShowOperator.classList.remove('btn-operator');
  } else {
    operatorPane.classList.remove('pane-hidden-mobile');
    studentPane.classList.add('pane-hidden-mobile');
    btnShowOperator.classList.add('btn-operator');
    btnShowStudent.classList.remove('btn-student');
  }
}

function handleViewportChange() {
  const switcher = document.getElementById('modeSwitcher');
  const studentPane = document.getElementById('student-pane');
  const operatorPane = document.getElementById('operator-pane');
  
  if (window.innerWidth > 1024) {
    switcher.style.display = 'none';
    studentPane.classList.remove('pane-hidden-mobile');
    operatorPane.classList.remove('pane-hidden-mobile');
  } else {
    switcher.style.display = 'flex';
    switchView('student');
  }
}

// --- Student App Screens Render Engine ---

let studentCurrentScreen = 'auth';
let draftUploadedFile = null; // Temporary hold for upload screen parameters

function showStudentScreen(screenName) {
  studentCurrentScreen = screenName;
  renderStudentApp();
}

function renderStudentApp() {
  const container = document.getElementById('student-app');
  if (!container) return;
  
  if (!currentStudent && studentCurrentScreen !== 'auth') {
    studentCurrentScreen = 'auth';
  }
  
  switch (studentCurrentScreen) {
    case 'auth':
      container.innerHTML = renderStudentAuthScreen();
      break;
    case 'home':
      container.innerHTML = renderStudentHomeScreen();
      break;
    case 'upload':
      container.innerHTML = renderStudentUploadScreen();
      // Attach Drag & Drop Listeners
      attachUploadDragListeners();
      break;
    case 'payment':
      container.innerHTML = renderStudentPaymentScreen();
      // Render canvas QR code
      const payCost = getStudentDraftCost();
      const qrData = payments.generateQR(payCost);
      const canvasImg = document.getElementById('checkout-qr-img');
      if (canvasImg) canvasImg.src = qrData;
      break;
    case 'tracking':
      container.innerHTML = renderStudentTrackingScreen();
      break;
    case 'orders':
      container.innerHTML = renderStudentOrdersScreen();
      break;
    case 'credits':
      container.innerHTML = renderStudentCreditsScreen();
      break;
  }
}

// 1. Student Auth HTML
function renderStudentAuthScreen() {
  return `
    <div style="text-align: center; margin-top: 40px; margin-bottom: 30px;">
      <div style="font-size: 32px; font-weight: 800; color: var(--blue); letter-spacing: -0.03em;">CopyCampus</div>
      <p>Instant campus printing in your pocket</p>
    </div>
    <div class="card">
      <h2 style="font-size: 15px; margin-bottom: 12px;" class="sentence-case">Sign in with college email</h2>
      <div class="form-group">
        <label class="form-label" for="student-login-email">College Email Address</label>
        <input type="email" id="student-login-email" class="input-text" placeholder="student@campus.edu" value="student@campus.edu">
        <p style="font-size: 11px; margin-top: 4px; color: var(--text-secondary);">Supports college domains (.edu or .ac.in / .edu.in)</p>
      </div>
      <button class="btn btn-student" style="width: 100%; margin-top: 8px;" onclick="handleStudentLogin()">Continue</button>
    </div>
  `;
}

function handleStudentLogin() {
  const emailInput = document.getElementById('student-login-email').value.trim();
  const validRegex = /^[\w.+-]+@([\w-]+\.)+(edu|ac\.in|edu\.in)$/i;
  
  if (!validRegex.test(emailInput)) {
    notifications.toast('Please enter a valid college email address', 'error');
    return;
  }
  
  let student = state.students.find(s => s.email.toLowerCase() === emailInput.toLowerCase());
  if (!student) {
    student = {
      id: 'STU-' + Date.now(),
      email: emailInput,
      name: emailInput.split('@')[0],
      credits: 500,
      ledger: [
        { type: 'purchase', amount: 500, priceINR: 300, reason: 'Initial signup credits', note: '', operatorName: 'System', timestamp: Date.now() }
      ]
    };
    state.students.push(student);
    saveState();
  }
  
  currentStudent = student;
  notifications.toast(`Welcome back, ${student.name}!`, 'success');
  showStudentScreen('home');
}

// 2. Student Home HTML
function renderStudentHomeScreen() {
  return `
    <div class="flex-between" style="margin-bottom: 16px;">
      <div>
        <p style="font-size: 12px; font-weight: 500;">Hello, ${currentStudent.name}</p>
        <h1 style="margin: 0; font-size: 18px;">Print documents</h1>
      </div>
      <button class="btn btn-student-outline" style="padding: 4px 10px; font-size: 11px; border-radius: 9999px;" onclick="handleStudentLogout()">Log out</button>
    </div>

    <!-- Prepaid Semester Balance Card -->
    <div class="card" style="background-color: #EFF6FF; border-color: var(--blue); position: relative; overflow: hidden;">
      <p style="color: var(--blue); font-weight: 600; font-size: 12px;">Prepaid Semester Balance</p>
      <div style="display: flex; align-items: baseline; gap: 4px; margin: 4px 0 12px 0;">
        <span id="home-credit-balance" style="font-size: 32px; font-weight: 800; color: var(--blue); line-height: 1;">${currentStudent.credits}</span>
        <span style="font-size: 13px; font-weight: 600; color: var(--blue);">pages left</span>
      </div>
      <button class="btn btn-student" style="padding: 6px 12px; font-size: 11px; border-radius: 4px;" onclick="showStudentScreen('credits')">Buy Credit Pack</button>
    </div>

    <!-- Quick action tiles grid -->
    <div class="student-tiles-grid">
      <div class="tile-btn" onclick="showStudentScreen('upload')">
        <span class="tile-icon">📤</span>
        <span class="tile-label">Upload & Print</span>
      </div>
      <div class="tile-btn" onclick="showStudentScreen('orders')">
        <span class="tile-icon">📁</span>
        <span class="tile-label">My Orders</span>
      </div>
      <div class="tile-btn" onclick="showStudentScreen('credits')">
        <span class="tile-icon">💳</span>
        <span class="tile-label">Buy Credits</span>
      </div>
      <div class="tile-btn" onclick="notifications.toast('Settings is a mock view.', 'info')">
        <span class="tile-icon">⚙️</span>
        <span class="tile-label">Settings</span>
      </div>
    </div>
  `;
}

function handleStudentLogout() {
  currentStudent = null;
  draftUploadedFile = null;
  notifications.toast('Logged out successfully', 'info');
  showStudentScreen('auth');
}

// 3. Student Upload HTML
function renderStudentUploadScreen() {
  const uploadArea = draftUploadedFile ? `
    <div class="file-item">
      <div class="file-icon">DOC</div>
      <div class="file-info">
        <div class="file-name">${draftUploadedFile.fileName}</div>
        <div class="file-meta">${draftUploadedFile.pages} pages • Securely uploaded</div>
      </div>
      <button class="file-remove" onclick="removeDraftUploadedFile()">✕</button>
    </div>
    <div class="preview-box">
      📄 Document pages preview: ${draftUploadedFile.fileName} loaded.<br>Scan successful.
      <div class="preview-box-pages">Page 1 of ${draftUploadedFile.pages}</div>
    </div>
  ` : `
    <div class="upload-dropzone" id="student-upload-zone" onclick="triggerFileBrowse()">
      <span style="font-size: 32px; display: block; margin-bottom: 8px;">📤</span>
      <h3 style="font-size: 14px; font-weight: 600;" class="sentence-case">Select print documents</h3>
      <p>PDF, PNG, JPG, DOCX, PPTX supported</p>
      <input type="file" id="student-file-input" style="display: none;" onchange="handleStudentFileSelect(event)" accept=".pdf,.png,.jpg,.jpeg,.docx,.pptx">
      <button class="btn btn-student-outline" style="margin-top: 12px; padding: 4px 10px; font-size: 11px;" onclick="triggerGoogleDriveImport(event)">☁️ Pick from Google Drive</button>
    </div>
    <div id="student-upload-progress" style="display: none; margin-top: 10px; text-align: center;">
      <p style="font-size: 11px; font-weight: 600;">Uploading file to Cloud storage...</p>
      <div class="progress-bar-container">
        <div id="student-upload-progress-fill" class="progress-bar-fill"></div>
      </div>
    </div>
  `;

  const copies = parseInt(document.getElementById('draft-copies')?.value || 1);
  const colorMode = document.querySelector('input[name="draft-color"]:checked')?.value || 'bw';
  const sides = document.querySelector('input[name="draft-sides"]:checked')?.value || 'single';
  const pageRange = document.getElementById('draft-range')?.value || 'All';
  const binding = document.getElementById('draft-binding')?.checked || false;
  const stapling = document.getElementById('draft-stapling')?.checked || false;
  const pickupPoint = document.getElementById('draft-pickup')?.value || 'Library Counter';

  const estCost = draftUploadedFile ? calculateCost(draftUploadedFile.pages, copies, colorMode, sides, binding, stapling) : 0;
  const creditDiff = currentStudent.credits - estCost;
  const insufficient = creditDiff < 0;

  return `
    <div class="flex-row" style="margin-bottom: 12px; cursor: pointer;" onclick="showStudentScreen('home')">
      <span style="font-size: 16px;">←</span>
      <span style="font-weight: 600;">Back to home</span>
    </div>
    <h1>Configure your print</h1>
    
    ${uploadArea}

    <div class="card" style="margin-top: 16px; margin-bottom: 80px;">
      <h2 style="font-size: 14px; margin-bottom: 12px;" class="sentence-case">Print parameters</h2>
      
      <div class="form-group">
        <label class="form-label">Color mode</label>
        <div style="display: flex; gap: 8px;">
          <label style="flex: 1; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-md); display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px;">
            <input type="radio" name="draft-color" value="bw" ${colorMode === 'bw' ? 'checked' : ''} onchange="updateDraftCostEstimate()"> Black & White
          </label>
          <label style="flex: 1; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-md); display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px;">
            <input type="radio" name="draft-color" value="color" ${colorMode === 'color' ? 'checked' : ''} onchange="updateDraftCostEstimate()"> Color
          </label>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Sides</label>
        <div style="display: flex; gap: 8px;">
          <label style="flex: 1; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-md); display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px;">
            <input type="radio" name="draft-sides" value="single" ${sides === 'single' ? 'checked' : ''} onchange="updateDraftCostEstimate()"> Single-sided
          </label>
          <label style="flex: 1; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-md); display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px;">
            <input type="radio" name="draft-sides" value="double" ${sides === 'double' ? 'checked' : ''} onchange="updateDraftCostEstimate()"> Double-sided
          </label>
        </div>
      </div>

      <div class="form-group" style="display: flex; align-items: center; justify-content: space-between;">
        <label class="form-label" for="draft-copies" style="margin-bottom: 0;">Number of copies</label>
        <input type="number" id="draft-copies" class="input-text" min="1" max="20" value="${copies}" style="width: 70px; text-align: center;" oninput="updateDraftCostEstimate()">
      </div>

      <div class="form-group">
        <label class="form-label" for="draft-range">Page range</label>
        <input type="text" id="draft-range" class="input-text" placeholder="e.g. All, 1-5, 8" value="${pageRange}">
      </div>

      <div class="form-group" style="display: flex; gap: 12px; margin-top: 14px;">
        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
          <input type="checkbox" id="draft-binding" ${binding ? 'checked' : ''} onchange="updateDraftCostEstimate()"> Spiral Binding (+10 pgs)
        </label>
        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
          <input type="checkbox" id="draft-stapling" ${stapling ? 'checked' : ''} onchange="updateDraftCostEstimate()"> Stapling Corner (+2 pgs)
        </label>
      </div>

      <div class="form-group" style="margin-top: 12px;">
        <label class="form-label" for="draft-pickup">Pickup point</label>
        <select id="draft-pickup" class="select-input">
          <option value="Library Counter" ${pickupPoint === 'Library Counter' ? 'selected' : ''}>Library Counter</option>
          <option value="Block A Office" ${pickupPoint === 'Block A Office' ? 'selected' : ''}>Block A Office</option>
          <option value="Main Gate Booth" ${pickupPoint === 'Main Gate Booth' ? 'selected' : ''}>Main Gate Booth</option>
        </select>
      </div>
    </div>

    <!-- Live estimate footer bar -->
    <div class="cost-summary-bar">
      <div>
        <p style="font-size: 11px;">Estimated Cost</p>
        <h2 id="live-checkout-cost-label" style="font-size: 18px; color: ${insufficient ? '#EF4444' : 'var(--blue)'}; margin: 0;">
          ${estCost} pages
        </h2>
      </div>
      <button id="btn-proceed-checkout" class="btn btn-student ${(!draftUploadedFile || insufficient) ? 'btn-disabled' : ''}" onclick="showStudentScreen('payment')">Proceed to Payment</button>
    </div>
  `;
}

function triggerFileBrowse() {
  document.getElementById('student-file-input').click();
}

function attachUploadDragListeners() {
  const zone = document.getElementById('student-upload-zone');
  if (!zone) return;
  
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('active');
  });
  
  zone.addEventListener('dragleave', () => {
    zone.classList.remove('active');
  });
  
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('active');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      simulateFileUploadProcess(files[0]);
    }
  });
}

function handleStudentFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    simulateFileUploadProcess(file);
  }
}

async function triggerGoogleDriveImport(event) {
  event.stopPropagation();
  notifications.toast('Accessing student Google Drive...', 'info');
  const file = await drivePicker.open();
  notifications.toast(`Imported drive file: ${file.name}`, 'success');
  simulateFileUploadProcess(file);
}

function simulateFileUploadProcess(file) {
  const progContainer = document.getElementById('student-upload-progress');
  const progFill = document.getElementById('student-upload-progress-fill');
  const dropzone = document.getElementById('student-upload-zone');
  
  if (dropzone) dropzone.style.display = 'none';
  if (progContainer) progContainer.style.display = 'block';
  
  storageService.upload(file, (percent) => {
    if (progFill) progFill.style.width = `${percent}%`;
  }).then((res) => {
    draftUploadedFile = {
      fileName: file.name,
      fileUrl: res.url,
      pages: res.pages
    };
    showStudentScreen('upload');
  });
}

function removeDraftUploadedFile() {
  draftUploadedFile = null;
  showStudentScreen('upload');
}

function getStudentDraftCost() {
  if (!draftUploadedFile) return 0;
  const copies = parseInt(document.getElementById('draft-copies')?.value || 1);
  const colorMode = document.querySelector('input[name="draft-color"]:checked')?.value || 'bw';
  const sides = document.querySelector('input[name="draft-sides"]:checked')?.value || 'single';
  const binding = document.getElementById('draft-binding')?.checked || false;
  const stapling = document.getElementById('draft-stapling')?.checked || false;
  return calculateCost(draftUploadedFile.pages, copies, colorMode, sides, binding, stapling);
}

function updateDraftCostEstimate() {
  const estCost = getStudentDraftCost();
  const label = document.getElementById('live-checkout-cost-label');
  const btn = document.getElementById('btn-proceed-checkout');
  
  if (label) {
    const insufficient = currentStudent.credits < estCost;
    label.innerText = `${estCost} pages`;
    label.style.color = insufficient ? '#EF4444' : 'var(--blue)';
    
    if (btn) {
      if (insufficient || !draftUploadedFile) {
        btn.classList.add('btn-disabled');
      } else {
        btn.classList.remove('btn-disabled');
      }
    }
  }
}

// 4. Student Payment HTML
let studentPaymentTab = 'upi'; // 'upi' or 'credits'

function switchStudentPaymentTab(tabName) {
  studentPaymentTab = tabName;
  showStudentScreen('payment');
}

function renderStudentPaymentScreen() {
  const payCost = getStudentDraftCost();
  const upiRate = studentPaymentTab === 'upi' ? payCost : 0;
  
  const upiTabStyle = studentPaymentTab === 'upi' ? 'background-color: var(--blue); color: #FFFFFF;' : '';
  const creditsTabStyle = studentPaymentTab === 'credits' ? 'background-color: var(--blue); color: #FFFFFF;' : '';

  const tabContent = studentPaymentTab === 'upi' ? `
    <div style="text-align: center; padding: 12px 0;">
      <p style="font-size: 11px; margin-bottom: 8px;">Scan QR code with GPay/PhonePe to add credit balance</p>
      <img id="checkout-qr-img" style="width: 140px; height: 140px; border: 1px solid var(--border); border-radius: 8px; padding: 4px; background: white;" alt="UPI QR Code">
      <div style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;">copycampus@upi</div>
      <button class="btn btn-student" style="width: 100%; margin-top: 14px;" onclick="simulateUPIAppPayment()">📱 Open UPI App Link</button>
    </div>
  ` : `
    <div class="flex-column" style="gap: 12px; margin-top: 6px;">
      <div class="flex-between" style="font-size: 13px;">
        <span>Semester balance:</span>
        <strong>${currentStudent.credits} pages</strong>
      </div>
      <div class="flex-between" style="font-size: 13px;">
        <span>Order cost:</span>
        <strong style="color: var(--blue);">${payCost} pages</strong>
      </div>
      <div style="height: 1px; background-color: var(--border); margin: 6px 0;"></div>
      <div class="flex-between" style="font-size: 13px; font-weight: 700;">
        <span>Remaining:</span>
        <span>${currentStudent.credits - payCost} pages</span>
      </div>
      <button class="btn btn-student" style="width: 100%; margin-top: 14px;" onclick="confirmCreditCheckoutPayment()">Confirm & Deduct</button>
    </div>
  `;

  return `
    <div class="flex-row" style="margin-bottom: 12px; cursor: pointer;" onclick="showStudentScreen('upload')">
      <span style="font-size: 16px;">←</span>
      <span style="font-weight: 600;">Back to options</span>
    </div>
    <h1>Checkout Payment</h1>

    <div class="card" style="background-color: var(--surface); padding: 14px;">
      <div class="flex-between">
        <strong>${draftUploadedFile ? draftUploadedFile.fileName : 'Document'}</strong>
        <span style="font-size: 13px; font-weight: 700;">${payCost} pages cost</span>
      </div>
    </div>

    <!-- Tabs headers -->
    <div style="display: flex; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin-bottom: 16px;">
      <button class="btn" style="flex: 1; border: none; border-radius: 0; font-size: 12px; padding: 10px; ${upiTabStyle}" onclick="switchStudentPaymentTab('upi')">Pay via UPI</button>
      <button class="btn" style="flex: 1; border: none; border-radius: 0; font-size: 12px; padding: 10px; ${creditsTabStyle}" onclick="switchStudentPaymentTab('credits')">Use Page Credits</button>
    </div>

    <div class="card">
      ${tabContent}
    </div>
    <button class="btn btn-student-outline" style="width: 100%; margin-top: 12px;" onclick="showStudentScreen('upload')">Cancel Payment</button>
  `;
}

function simulateUPIAppPayment() {
  const cost = getStudentDraftCost();
  notifications.toast('Launching UPI payment intent...', 'info');
  
  // Show spinner simulation
  const modal = document.createElement('div');
  modal.className = 'custom-modal active';
  modal.innerHTML = `
    <div class="modal-card" style="text-align: center; align-items: center; justify-content: center; padding: 32px 16px;">
      <div style="font-size: 32px; animation: spin 1.5s linear infinite; margin-bottom: 12px;">⏳</div>
      <h3 class="sentence-case">Verifying UPI checkout...</h3>
      <p style="font-size: 11px;">Authorizing ₹${Math.ceil(cost * 0.6)} via Deep Link App</p>
    </div>
  `;
  document.body.appendChild(modal);
  
  setTimeout(() => {
    modal.remove();
    payments.addCredits(currentStudent.id, 500, 'UPI checkout top-up', 'Checkout Top-up credits simulation', 'UPI deep link checkout');
    notifications.toast('Added 500 pages. Please verify balance to confirm checkout deduction.', 'success');
    switchStudentPaymentTab('credits');
  }, 2000);
}

let activeStudentTrackingOrderId = null;
let trackingPoller = null;

function confirmCreditCheckoutPayment() {
  const cost = getStudentDraftCost();
  if (currentStudent.credits < cost) {
    notifications.toast('Insufficient page balance. Buy credit packages first.', 'error');
    return;
  }
  
  // Deduct credits
  payments.deductCredits(currentStudent.id, cost, `Print Order for: ${draftUploadedFile.fileName}`);
  
  // Create Order
  const orderId = 'ORD-' + Date.now();
  const copies = parseInt(document.getElementById('draft-copies')?.value || 1);
  const colorMode = document.querySelector('input[name="draft-color"]:checked')?.value || 'bw';
  const sides = document.querySelector('input[name="draft-sides"]:checked')?.value || 'single';
  const binding = document.getElementById('draft-binding')?.checked || false;
  const stapling = document.getElementById('draft-stapling')?.checked || false;
  const pageRange = document.getElementById('draft-range')?.value || 'All';
  const pickupPoint = document.getElementById('draft-pickup')?.value || 'Library Counter';

  const newOrder = {
    id: orderId,
    studentId: currentStudent.id,
    studentEmail: currentStudent.email,
    fileName: draftUploadedFile.fileName,
    fileUrl: draftUploadedFile.fileUrl,
    pages: draftUploadedFile.pages,
    copies: copies,
    colorMode: colorMode,
    sides: sides,
    binding: binding,
    stapling: stapling,
    pageRange: pageRange,
    pickupPoint: pickupPoint,
    cost: cost,
    status: 'queued',
    cancelled: false,
    flagReason: null,
    stockDeducted: false,
    annotations: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  state.orders.push(newOrder);
  saveState();
  
  notifications.simulateSMS(currentStudent.email, `Order ${orderId} uploaded successfully. Cost: ${cost} pages.`);
  
  draftUploadedFile = null;
  activeStudentTrackingOrderId = orderId;
  
  showStudentScreen('tracking');
}

// 5. Student Tracking HTML
function renderStudentTrackingScreen() {
  const order = state.orders.find(o => o.id === activeStudentTrackingOrderId);
  if (!order) {
    return `
      <div style="text-align: center; padding: 24px;">
        <p>No active order found in tracker.</p>
        <button class="btn btn-student" onclick="showStudentScreen('home')">Back to Home</button>
      </div>
    `;
  }
  
  // Stages lists
  const stages = ['queued', 'printing', 'ready', 'collected'];
  const activeIdx = stages.indexOf(order.status);
  
  const stepHtml = stages.map((stage, idx) => {
    let statusClass = '';
    if (idx < activeIdx || order.status === 'collected') {
      statusClass = 'completed';
    } else if (idx === activeIdx) {
      statusClass = 'active';
    }
    
    let timeStr = '-';
    if (stage === 'queued' && order.createdAt) timeStr = formatTimestamp(order.createdAt);
    if (stage === 'printing' && order.printedAt) timeStr = formatTimestamp(order.printedAt);
    if (stage === 'ready' && order.readyAt) timeStr = formatTimestamp(order.readyAt);
    if (stage === 'collected' && order.collectedAt) timeStr = formatTimestamp(order.collectedAt);
    
    let title = stage === 'queued' ? 'Order Queued' :
                stage === 'printing' ? 'Document Printing' :
                stage === 'ready' ? 'Ready for Pickup' : 'Collected';
                
    return `
      <div class="tracker-node-row ${statusClass}">
        <div class="tracker-dot">✓</div>
        <div class="tracker-title">${title}</div>
        <div class="tracker-time">${timeStr}</div>
      </div>
    `;
  }).join('');

  // Start status polling
  if (!trackingPoller) {
    trackingPoller = setInterval(() => {
      const refreshed = state.orders.find(o => o.id === activeStudentTrackingOrderId);
      if (refreshed && refreshed.status === 'collected') {
        clearInterval(trackingPoller);
        trackingPoller = null;
      }
      renderStudentApp();
    }, 3000);
  }

  return `
    <div class="flex-row" style="margin-bottom: 12px; cursor: pointer;" onclick="clearTrackingIntervalAndGoHome()">
      <span style="font-size: 16px;">←</span>
      <span style="font-weight: 600;">Back to home</span>
    </div>
    
    <h1>Order Tracking</h1>
    <p style="font-size: 11px;">ID: ${order.id} • Point: ${order.pickupPoint}</p>

    <div class="card" style="margin-top: 14px;">
      <h3 style="font-size: 13px; margin-bottom: 4px;">${order.fileName}</h3>
      <p style="font-size: 11px;">${order.pages} pages × ${order.copies} copies • ${order.colorMode.toUpperCase()}</p>
    </div>

    <div class="student-tracker">
      ${stepHtml}
    </div>

    ${order.status === 'collected' ? `
      <div class="card" style="background-color: #DCFCE7; border-color: #BBF7D0; text-align: center; padding: 12px; color: #166534;">
        <strong>🎉 Collected successfully!</strong>
        <p style="font-size: 11px; margin-top: 4px; color: #166534;">Your print file reference will be deleted from the cloud storage in 10s.</p>
      </div>
    ` : ''}
  `;
}

function clearTrackingIntervalAndGoHome() {
  if (trackingPoller) {
    clearInterval(trackingPoller);
    trackingPoller = null;
  }
  showStudentScreen('home');
}

// 6. Student Orders History HTML
function renderStudentOrdersScreen() {
  const studentOrders = state.orders
    .filter(o => o.studentEmail === currentStudent.email)
    .sort((a, b) => b.createdAt - a.createdAt);

  let ordersContent = `<p style="text-align: center; padding: 24px; color: var(--text-secondary);">No orders recorded.</p>`;
  if (studentOrders.length > 0) {
    ordersContent = studentOrders.map(o => {
      let badgeType = o.status;
      if (o.cancelled) badgeType = 'cancelled';
      
      const reprintBtn = o.status === 'collected' ? `
        <button class="btn btn-student-outline" style="width: 100%; padding: 4px; font-size: 11px; margin-top: 8px; border-radius: 4px;" onclick="triggerReprintOrder('${o.id}')">🔄 Reprint this file</button>
      ` : '';

      return `
        <div class="card" style="margin-bottom: 8px; padding: 12px;">
          <div class="flex-between">
            <h3 style="font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">${o.fileName}</h3>
            <span class="badge badge-${badgeType}">${badgeType}</span>
          </div>
          <p style="font-size: 11px; margin-top: 2px;">
            ${formatTimestamp(o.createdAt)} • Cost: ${o.cost} pages
          </p>
          ${reprintBtn}
        </div>
      `;
    }).join('');
  }

  return `
    <div class="flex-row" style="margin-bottom: 12px; cursor: pointer;" onclick="showStudentScreen('home')">
      <span style="font-size: 16px;">←</span>
      <span style="font-weight: 600;">Back to home</span>
    </div>
    <h1>My Print Orders</h1>
    <div class="flex-column" style="margin-top: 10px;">
      ${ordersContent}
    </div>
  `;
}

function triggerReprintOrder(orderId) {
  const original = state.orders.find(o => o.id === orderId);
  if (original) {
    draftUploadedFile = {
      fileName: original.fileName,
      fileUrl: original.fileUrl,
      pages: original.pages
    };
    showStudentScreen('upload');
    // Pre-fill parameters in UI after DOM rendered
    setTimeout(() => {
      const copiesInput = document.getElementById('draft-copies');
      if (copiesInput) copiesInput.value = original.copies;
      
      const colorRadio = document.querySelector(`input[name="draft-color"][value="${original.colorMode}"]`);
      if (colorRadio) colorRadio.checked = true;
      
      const sidesRadio = document.querySelector(`input[name="draft-sides"][value="${original.sides}"]`);
      if (sidesRadio) sidesRadio.checked = true;
      
      const bindingInput = document.getElementById('draft-binding');
      if (bindingInput) bindingInput.checked = original.binding;
      
      const staplingInput = document.getElementById('draft-stapling');
      if (staplingInput) staplingInput.checked = original.stapling;
      
      const rangeInput = document.getElementById('draft-range');
      if (rangeInput) rangeInput.value = original.pageRange;
      
      const pickupInput = document.getElementById('draft-pickup');
      if (pickupInput) pickupInput.value = original.pickupPoint;
      
      updateDraftCostEstimate();
    }, 50);
  }
}

// 7. Student Packages Buy Credits HTML
function renderStudentCreditsScreen() {
  return `
    <div class="flex-row" style="margin-bottom: 12px; cursor: pointer;" onclick="showStudentScreen('home')">
      <span style="font-size: 16px;">←</span>
      <span style="font-weight: 600;">Back to home</span>
    </div>
    <h1>Buy Page Credits</h1>
    <p style="font-size: 11px; margin-bottom: 14px;">Select package bundle to credit your account immediately</p>

    <div class="flex-column" style="gap: 10px;">
      <!-- Bundle 1 -->
      <div class="card flex-between" style="margin: 0; padding: 12px; border-color: var(--blue);" onclick="buyPrepaidPackage(100, 70)">
        <div>
          <div style="font-weight: 700; font-size: 13px;">100 pages starter</div>
          <p style="font-size: 11px;">₹0.70 per page</p>
        </div>
        <button class="btn btn-student" style="font-size: 11px; padding: 6px 12px;">₹70</button>
      </div>

      <!-- Bundle 2 -->
      <div class="card flex-between" style="margin: 0; padding: 12px; border-color: var(--blue); position: relative; border-width: 2px;" onclick="buyPrepaidPackage(500, 300)">
        <span class="badge badge-ready" style="position: absolute; top: -10px; right: 12px; font-size: 9px;">BEST VALUE</span>
        <div>
          <div style="font-weight: 700; font-size: 13px;">500 pages standard</div>
          <p style="font-size: 11px;">₹0.60 per page</p>
        </div>
        <button class="btn btn-student" style="font-size: 11px; padding: 6px 12px;">₹300</button>
      </div>

      <!-- Bundle 3 -->
      <div class="card flex-between" style="margin: 0; padding: 12px; border-color: var(--blue);" onclick="buyPrepaidPackage(1000, 550)">
        <div>
          <div style="font-weight: 700; font-size: 13px;">1000 pages pro</div>
          <p style="font-size: 11px;">₹0.55 per page</p>
        </div>
        <button class="btn btn-student" style="font-size: 11px; padding: 6px 12px;">₹550</button>
      </div>
    </div>
  `;
}

function buyPrepaidPackage(pagesCount, amountINR) {
  notifications.toast(`Initializing UPI checkout package: ₹${amountINR}`, 'info');
  
  const modal = document.createElement('div');
  modal.className = 'custom-modal active';
  modal.innerHTML = `
    <div class="modal-card" style="align-items: center; text-align: center;">
      <div class="modal-header" style="width: 100%;">
        <h2 class="sentence-case" style="margin: 0;">UPI Bundle Checkout</h2>
        <button class="modal-close" onclick="this.closest('.custom-modal').remove()">✕</button>
      </div>
      <p style="font-size: 11px; color: var(--text-secondary);">Scan QR to buy ${pagesCount} pages</p>
      <img id="bundle-qr-img" style="width: 130px; height: 130px; margin: 8px 0; border: 1px solid var(--border); border-radius: 8px; padding: 4px;" alt="QR">
      <div style="font-size: 15px; font-weight: 700;">₹${amountINR}</div>
      <button class="btn btn-student" style="width: 100%; margin-top: 12px;" onclick="completeBundleBuy(${pagesCount}, ${amountINR}, this)">Verify Payment (Mock)</button>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Render canvas QR image
  const qrData = payments.generateQR(amountINR);
  document.getElementById('bundle-qr-img').src = qrData;
}

function completeBundleBuy(pagesCount, amountINR, btnEl) {
  btnEl.disabled = true;
  btnEl.innerText = 'Verifying...';
  
  setTimeout(() => {
    btnEl.closest('.custom-modal').remove();
    payments.addCredits(currentStudent.id, pagesCount, `Purchased credit bundle: ${pagesCount} pages`, `Paid ₹${amountINR} via UPI QR Code`, 'System Checkout');
    notifications.toast(`Successfully added ${pagesCount} credits!`, 'success');
  }, 1000);
}

// --- Operator Dashboard View Render Engine ---

let activeOpTab = 'queue';
let selectedIds = []; // Bulk selections array

function switchOpTab(tabName) {
  activeOpTab = tabName;
  renderOperatorDashboard();
}

function operatorLogin() {
  const email = document.getElementById('operatorEmail').value.trim();
  const pass = document.getElementById('operatorPass').value.trim();
  const name = document.getElementById('operatorName').value.trim() || 'Operator Desk A';
  
  if (email === 'operator@campus' && pass === 'print123') {
    state.operatorSession = {
      name: name,
      startTime: Date.now(),
      loggedIn: true
    };
    saveState();
    notifications.toast(`Terminal unlocked: ${name}`, 'success');
    renderAll();
  } else {
    notifications.toast('Invalid credentials!', 'error');
  }
}

function operatorLogout() {
  state.operatorSession.loggedIn = false;
  saveState();
  selectedIds = [];
  notifications.toast('Console locked', 'info');
  renderAll();
}

function dismissLowStockBanner() {
  bannerDismissed = true;
  const banner = document.getElementById('low-stock-banner');
  if (banner) banner.style.display = 'none';
}

// Check and trigger stock deduction logic when changing status to printing
function checkStockDeduction(order) {
  if (order.status === 'printing' && !order.stockDeducted) {
    const isColor = order.colorMode === 'color';
    let totalSheets = Math.ceil(order.pages * order.copies);
    if (order.sides === 'double') {
      totalSheets = Math.ceil(totalSheets / 2);
    }
    
    if (isColor) {
      state.inventory.color = Math.max(0, state.inventory.color - totalSheets);
    } else {
      state.inventory.bw = Math.max(0, state.inventory.bw - totalSheets);
    }
    
    order.stockDeducted = true;
    notifications.log(`[Inventory] Deducted ${totalSheets} sheets (${isColor ? 'Color' : 'B&W'}) for Order ${order.id}`);
  }
}

function advanceOrderStatus(orderId, nextStatus) {
  const order = state.orders.find(o => o.id === orderId);
  if (order) {
    order.status = nextStatus;
    order.updatedAt = Date.now();
    
    if (nextStatus === 'printing' && !order.printedAt) {
      order.printedAt = Date.now();
      checkStockDeduction(order);
    }
    if (nextStatus === 'ready' && !order.readyAt) {
      order.readyAt = Date.now();
      checkStockDeduction(order); // fallback safety
      notifications.simulateSMS(order.studentEmail, `Order ${order.id} is printed and ready at Library Counter.`);
    }
    if (nextStatus === 'collected' && !order.collectedAt) {
      order.collectedAt = Date.now();
      checkStockDeduction(order); // safety
      notifications.log(`[Order] Handed over Order ${order.id} to student.`);
    }
    
    saveState();
    renderAll();
  }
}

// Inline flagging
function toggleFlagDropdown(event, orderId) {
  event.stopPropagation();
  const dropdown = document.getElementById(`flag-dropdown-${orderId}`);
  if (dropdown) {
    const active = dropdown.classList.contains('active');
    // close others
    document.querySelectorAll('.inline-dropdown').forEach(el => el.classList.remove('active'));
    if (!active) dropdown.classList.add('active');
  }
}

function flagOrder(orderId, reason) {
  const order = state.orders.find(o => o.id === orderId);
  if (order) {
    order.status = 'flagged';
    order.flagReason = reason;
    order.updatedAt = Date.now();
    notifications.log(`[Order] Flagged Order ${orderId} as problem: ${reason}`);
    notifications.toast(`Order ${orderId} moved to Problems tab`, 'warning');
    saveState();
    renderAll();
  }
}

// Inline Notes
function toggleAddNoteInput(orderId) {
  const inputGroup = document.getElementById(`note-input-group-${orderId}`);
  if (inputGroup) {
    const isHidden = inputGroup.style.display === 'none';
    inputGroup.style.display = isHidden ? 'flex' : 'none';
  }
}

function saveOrderAnnotation(orderId) {
  const textarea = document.getElementById(`note-text-${orderId}`);
  if (!textarea) return;
  
  const text = textarea.value.trim();
  if (!text) {
    notifications.toast('Note cannot be empty', 'error');
    return;
  }
  
  if (text.length > 200) {
    notifications.toast('Note must be under 200 chars', 'error');
    return;
  }
  
  const order = state.orders.find(o => o.id === orderId);
  if (order) {
    if (!order.annotations) order.annotations = [];
    order.annotations.push({
      text: text,
      timestamp: Date.now(),
      operatorName: state.operatorSession.name
    });
    saveState();
    textarea.value = '';
    toggleAddNoteInput(orderId);
    renderAll();
    notifications.toast('Annotation added successfully', 'success');
  }
}

// Multi-filters & Batch rendering
function renderAllOperatorQueue() {
  const container = document.getElementById('order-batch-container');
  if (!container) return;

  const textSearch = document.getElementById('op-search-input').value.toLowerCase();
  const filterStatus = document.getElementById('op-status-filter').value;
  const filterType = document.getElementById('op-type-filter').value;
  const filterSide = document.getElementById('op-side-filter').value;

  // Filter orders
  let filtered = state.orders.filter(o => {
    // Search query matches studentEmail, ID, or filename
    const matchSearch = o.studentEmail.toLowerCase().includes(textSearch) ||
                        o.id.toLowerCase().includes(textSearch) ||
                        o.fileName.toLowerCase().includes(textSearch);
    
    // Status filters (Problems tab handles flagged/stale, but Order Queue shows active statuses)
    // If status filter is "All", only show non-cancelled and non-flagged? Wait!
    // Queue tab: "filters non-flagged, non-cancelled orders".
    // So if Status filter is "All": status is not flagged/cancelled and not collected?
    // Let's filter out cancelled/collected/flagged from the main Queue unless explicitly filtered?
    // Wait, the prompt says: "Status dropdown: All / Queued / Printing / Ready / Collected / Flagged".
    // "After filtering, group non-flagged, non-cancelled orders into four sections".
    // So collected and active orders are grouped in the Queue tab. Let's exclude cancelled orders.
    // If filterStatus !== 'All', filter exactly. If 'All', show all non-cancelled, non-flagged orders.
    // Let's do that!
    let matchStatus = true;
    if (filterStatus === 'All') {
      matchStatus = o.status !== 'flagged' && !o.cancelled && o.status !== 'collected';
    } else {
      matchStatus = o.status === filterStatus;
    }
    
    // Type filter
    let matchType = true;
    if (filterType !== 'All') {
      matchType = o.colorMode === filterType;
    }
    
    // Side filter
    let matchSide = true;
    if (filterSide !== 'All') {
      matchSide = o.sides === filterSide;
    }
    
    return matchSearch && matchStatus && matchType && matchSide;
  });

  // Sort by createdAt ascending inside queue
  filtered.sort((a, b) => a.createdAt - b.createdAt);

  // Update results counter
  document.getElementById('op-results-count').innerText = `${filtered.length} results`;

  if (filtered.length === 0) {
    container.innerHTML = `<p style="text-align: center; padding: 48px; color: var(--text-secondary); background: #FFFFFF; border: 1px solid var(--border); border-radius: var(--radius-md);">No orders matching current filter criteria.</p>`;
    return;
  }

  // Auto batching categories
  const batchTypes = [
    { key: 'bw_single', title: 'B&W Single-Sided', colorMode: 'bw', sides: 'single' },
    { key: 'bw_double', title: 'B&W Double-Sided', colorMode: 'bw', sides: 'double' },
    { key: 'color_single', title: 'Color Single-Sided', colorMode: 'color', sides: 'single' },
    { key: 'color_double', title: 'Color Double-Sided', colorMode: 'color', sides: 'double' }
  ];

  let batchHtml = '';
  let uiQueueIndex = 0; // global order index in currently visible UI

  batchTypes.forEach(batch => {
    const batchOrders = filtered.filter(o => o.colorMode === batch.colorMode && o.sides === batch.sides);
    if (batchOrders.length > 0) {
      const totalJobs = batchOrders.length;
      const totalPages = batchOrders.reduce((sum, o) => sum + (o.pages * o.copies), 0);
      
      const cardsHtml = batchOrders.map((order) => {
        const isChecked = selectedIds.includes(order.id) ? 'checked' : '';
        const isFocused = uiQueueIndex === focusedOrderIndex ? 'focused-card' : '';
        const isFlagged = order.status === 'flagged' ? 'flagged-card' : '';
        
        let actionBtn = '';
        if (order.status === 'queued') {
          actionBtn = `<button class="btn btn-operator" style="font-size: 11px; padding: 4px 8px;" onclick="advanceOrderStatus('${order.id}', 'printing')">Mark Printing</button>`;
        } else if (order.status === 'printing') {
          actionBtn = `<button class="btn btn-operator" style="font-size: 11px; padding: 4px 8px; background-color: var(--blue); border-color: var(--blue);" onclick="advanceOrderStatus('${order.id}', 'ready')">Mark Ready</button>`;
        } else if (order.status === 'ready') {
          actionBtn = `<button class="btn btn-operator" style="font-size: 11px; padding: 4px 8px; background-color: #10B981; border-color: #10B981;" onclick="advanceOrderStatus('${order.id}', 'collected')">Mark Collected</button>`;
        }

        const notesHtml = (order.annotations || []).map(note => `
          <div class="annotation-item">
            <span>🖊️</span>
            <span><strong>${note.operatorName} (${formatTimestamp(note.timestamp)}):</strong> ${note.text}</span>
          </div>
        `).join('');

        // Store active elements mapping index
        order.uiIndex = uiQueueIndex;
        uiQueueIndex++;

        return `
          <div class="queue-card ${isFocused} ${isFlagged}" id="card-${order.id}">
            <!-- Top row checkbox and details -->
            <div class="queue-card-top">
              <div class="flex-row">
                <input type="checkbox" class="order-select-checkbox" data-id="${order.id}" ${isChecked} onchange="toggleOrderSelection('${order.id}')" style="cursor: pointer; width: 15px; height: 15px;">
                <div>
                  <strong>Order #${order.id}</strong>
                  <div style="font-size: 11px; color: var(--text-secondary); margin-top: 1px;">${order.studentEmail} • ${formatTimestamp(order.createdAt)}</div>
                </div>
              </div>
              <span class="badge badge-${order.status}">${order.status}</span>
            </div>

            <!-- Filename details -->
            <div style="font-size: 13px; font-weight: 700; margin-top: 4px;">${order.fileName}</div>
            
            <!-- Details metadata -->
            <div style="font-size: 12px; color: var(--text-secondary); display: flex; gap: 8px; flex-wrap: wrap;">
              <span>📄 Pages: ${order.pages} × ${order.copies}</span>
              <span>•</span>
              <span>🎨 ${order.colorMode === 'color' ? 'Color' : 'B&W'}</span>
              <span>•</span>
              <span>📖 ${order.sides === 'double' ? 'Double' : 'Single'}</span>
              <span>•</span>
              <span>📍 Pickup: ${order.pickupPoint}</span>
              <span>•</span>
              <span style="font-weight: 600; color: var(--teal);">🎫 Cost: ${order.cost} pgs</span>
            </div>

            <!-- Notes list -->
            ${order.annotations && order.annotations.length > 0 ? `
              <div class="annotation-list">
                ${notesHtml}
              </div>
            ` : ''}

            <!-- Bottom Controls -->
            <div class="queue-card-actions">
              <a href="#" onclick="toggleAddNoteInput('${order.id}'); event.preventDefault();" style="font-size: 11px; color: var(--teal); text-decoration: underline; margin-right: auto;">Add note</a>
              
              <!-- Flag Inline drop container -->
              <div class="inline-dropdown-container">
                <button class="btn btn-operator-outline" onclick="toggleFlagDropdown(event, '${order.id}')" style="font-size: 11px; padding: 4px 8px; color: #EF4444; border-color: #EF4444;">🚩 Flag</button>
                <div id="flag-dropdown-${order.id}" class="inline-dropdown">
                  <button class="inline-dropdown-item" onclick="flagOrder('${order.id}', 'File corrupted')">File corrupted</button>
                  <button class="inline-dropdown-item" onclick="flagOrder('${order.id}', 'Insufficient credits')">Insufficient credits</button>
                  <button class="inline-dropdown-item" onclick="flagOrder('${order.id}', 'Student unreachable')">Student unreachable</button>
                  <button class="inline-dropdown-item" onclick="flagOrder('${order.id}', 'Other')">Other</button>
                </div>
              </div>
              
              ${actionBtn}
            </div>

            <!-- Note expanding input -->
            <div id="note-input-group-${order.id}" style="display: none; gap: 6px; margin-top: 8px;">
              <textarea id="note-text-${order.id}" class="input-text" placeholder="Add custom operator note (max 200 chars)..." style="height: 50px; font-size: 12px; resize: none;"></textarea>
              <button class="btn btn-operator" style="font-size: 11px; padding: 4px 10px;" onclick="saveOrderAnnotation('${order.id}')">Save</button>
            </div>
          </div>
        `;
      }).join('');

      batchHtml += `
        <div class="batch-group">
          <div class="batch-header">
            <span class="batch-title">${batch.title}</span>
            <span class="batch-pill">${totalJobs} jobs · ${totalPages} pages</span>
          </div>
          ${cardsHtml}
        </div>
      `;
    }
  });

  container.innerHTML = batchHtml;
  
  // Update sidebar active counters
  const activeOrders = state.orders.filter(o => o.status !== 'collected' && !o.cancelled && o.status !== 'flagged');
  const bwPages = activeOrders.filter(o => o.colorMode === 'bw').reduce((sum, o) => sum + (o.pages * o.copies), 0);
  const colorPages = activeOrders.filter(o => o.colorMode === 'color').reduce((sum, o) => sum + (o.pages * o.copies), 0);
  
  const elActiveJobs = document.getElementById('sidebar-active-jobs');
  const elBwPages = document.getElementById('sidebar-bw-pages');
  const elColorPages = document.getElementById('sidebar-color-pages');
  
  if (elActiveJobs) elActiveJobs.innerText = activeOrders.length;
  if (elBwPages) elBwPages.innerText = bwPages;
  if (elColorPages) elColorPages.innerText = colorPages;
}

function clearOperatorFilters(event) {
  if (event) event.preventDefault();
  document.getElementById('op-search-input').value = '';
  document.getElementById('op-status-filter').value = 'All';
  document.getElementById('op-type-filter').value = 'All';
  document.getElementById('op-side-filter').value = 'All';
  renderAllOperatorQueue();
}

// Bulk selections handler
function toggleOrderSelection(orderId) {
  if (selectedIds.includes(orderId)) {
    selectedIds = selectedIds.filter(id => id !== orderId);
  } else {
    selectedIds.push(orderId);
  }
  updateBulkActionBar();
}

function updateBulkActionBar() {
  const bar = document.getElementById('bulk-action-bar');
  const countEl = document.getElementById('bulk-selected-count');
  
  if (selectedIds.length > 0) {
    if (bar) bar.style.display = 'flex';
    if (countEl) countEl.innerText = selectedIds.length;
  } else {
    if (bar) bar.style.display = 'none';
  }
}

function toggleBulkFlagDropdown(event) {
  event.stopPropagation();
  const dropdown = document.getElementById('bulk-flag-reason-dropdown');
  if (dropdown) dropdown.classList.toggle('active');
}

function applyBulkAction(status) {
  selectedIds.forEach(orderId => {
    advanceOrderStatus(orderId, status);
  });
  selectedIds = [];
  updateBulkActionBar();
  notifications.toast('Bulk status update applied successfully', 'success');
}

function applyBulkFlagAction(reason) {
  selectedIds.forEach(orderId => {
    flagOrder(orderId, reason);
  });
  selectedIds = [];
  updateBulkActionBar();
  // Close the bulk flag dropdown
  const dropdown = document.getElementById('bulk-flag-reason-dropdown');
  if (dropdown) dropdown.classList.remove('active');
}

// 8. Problems tab HTML
function renderProblemsTab() {
  const container = document.getElementById('problems-orders-list');
  if (!container) return;

  const now = Date.now();
  const staleThreshold = 2 * 60 * 60 * 1000; // 2 hours
  
  const problemOrders = state.orders.filter(o => {
    const isFlagged = o.status === 'flagged';
    const isStale = o.status === 'queued' && (now - o.createdAt > staleThreshold);
    return !o.cancelled && (isFlagged || isStale);
  });

  // Update problems count badge
  const badge = document.getElementById('problems-count-badge');
  if (badge) {
    if (problemOrders.length > 0) {
      badge.style.display = 'inline-flex';
      badge.innerText = problemOrders.length;
    } else {
      badge.style.display = 'none';
    }
  }

  if (problemOrders.length === 0) {
    container.innerHTML = `<p style="text-align: center; padding: 48px; color: var(--text-secondary); background: #FFFFFF; border: 1px solid var(--border); border-radius: var(--radius-md);">No problem or delayed orders detected.</p>`;
    return;
  }

  container.innerHTML = problemOrders.map(o => {
    const isFlagged = o.status === 'flagged';
    const reasonText = isFlagged ? `Flag Reason: ${o.flagReason}` : `Stale — queued ${Math.floor((now - o.createdAt) / (60 * 60 * 1000))}h ago`;
    const actionTime = isFlagged ? o.updatedAt : o.createdAt;
    const timeSince = Math.floor((now - actionTime) / 60000); // in minutes
    
    let timeLabel = `${timeSince} mins ago`;
    if (timeSince > 60) {
      timeLabel = `${Math.floor(timeSince / 60)}h ${timeSince % 60}m ago`;
    }

    return `
      <div class="card queue-card flagged-card">
        <div class="flex-between">
          <div>
            <strong style="color: #EF4444; font-size: 14px;">${reasonText}</strong>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 1px;">Triggered: ${timeLabel}</div>
          </div>
          <span class="badge badge-flagged">${o.status}</span>
        </div>
        
        <div style="font-size: 13px; font-weight: 700; margin-top: 6px;">${o.fileName}</div>
        <div style="font-size: 12px; color: var(--text-secondary); display: flex; gap: 8px; flex-wrap: wrap;">
          <span>Student: ${o.studentEmail}</span>
          <span>•</span>
          <span>Order ID: ${o.id}</span>
          <span>•</span>
          <span>Pages: ${o.pages} × ${o.copies}</span>
          <span>•</span>
          <span>Cost: ${o.cost} credits</span>
        </div>

        <div class="flex-row" style="margin-top: 12px; justify-content: flex-end;">
          <button class="btn btn-operator-outline" style="font-size: 11px; padding: 4px 10px;" onclick="resolveProblemOrder('${o.id}')">Resolve & Re-queue</button>
          <button class="btn" style="font-size: 11px; padding: 4px 10px; color: #EF4444; border-color: #EF4444;" onclick="cancelProblemOrder('${o.id}')">Cancel Order</button>
        </div>
      </div>
    `;
  }).join('');
}

function resolveProblemOrder(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (order) {
    order.status = 'queued';
    order.flagReason = null;
    order.createdAt = Date.now(); // reset queue timer
    order.updatedAt = Date.now();
    notifications.log(`[Order] Resolved Problem Order ${orderId}. Re-queued at desk.`);
    notifications.toast(`Order ${orderId} returned to queue`, 'success');
    saveState();
    renderAll();
  }
}

function cancelProblemOrder(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (order) {
    order.status = 'collected';
    order.cancelled = true;
    order.collectedAt = Date.now();
    order.updatedAt = Date.now();
    if (!order.annotations) order.annotations = [];
    order.annotations.push({
      text: 'Order cancelled by operator in Problems tab.',
      timestamp: Date.now(),
      operatorName: state.operatorSession.name
    });
    notifications.log(`[Order] Cancelled problem order: ${orderId}`);
    notifications.toast('Order cancelled successfully', 'warning');
    saveState();
    renderAll();
  }
}

// 9. Inventory tab HTML & Calculations
function renderInventoryTab() {
  const bwInput = document.getElementById('inv-bw-stock');
  const colInput = document.getElementById('inv-color-stock');
  const bwThresh = document.getElementById('threshold-bw');
  const colThresh = document.getElementById('threshold-color');

  if (bwInput) bwInput.value = state.inventory.bw;
  if (colInput) colInput.value = state.inventory.color;
  if (bwThresh) bwThresh.value = state.settings.lowStockBW;
  if (colThresh) colThresh.value = state.settings.lowStockColor;

  // Demand calculations
  const queuedOrders = state.orders.filter(o => o.status === 'queued' && !o.cancelled);
  
  let bwDemand = 0;
  let colDemand = 0;

  queuedOrders.forEach(o => {
    let orderPages = o.pages * o.copies;
    if (o.sides === 'double') {
      orderPages = Math.ceil(orderPages / 2);
    }
    
    if (o.colorMode === 'color') {
      colDemand += orderPages;
    } else {
      bwDemand += orderPages;
    }
  });

  // Calculate and fill B&W demand bar
  const bwFill = Math.min(100, Math.ceil((state.inventory.bw / (bwDemand || 1)) * 100));
  const bwBar = document.getElementById('demand-bw-progress-fill');
  const bwLabel = document.getElementById('demand-bw-label');

  if (bwBar) {
    bwBar.style.width = `${bwFill}%`;
    bwBar.className = 'demand-progress-fill';
    
    if (bwDemand === 0) {
      bwLabel.innerText = 'Sufficient stock';
      bwBar.classList.add('green');
      bwBar.style.width = '100%';
    } else {
      bwLabel.innerText = `Stock covers ${state.inventory.bw} of ${bwDemand} queued pages`;
      if (state.inventory.bw >= bwDemand * 1.5) {
        bwBar.classList.add('green');
      } else if (state.inventory.bw >= bwDemand) {
        bwBar.classList.add('amber');
      } else {
        bwBar.classList.add('red');
      }
    }
  }

  // Calculate and fill Color demand bar
  const colFill = Math.min(100, Math.ceil((state.inventory.color / (colDemand || 1)) * 100));
  const colBar = document.getElementById('demand-color-progress-fill');
  const colLabel = document.getElementById('demand-color-label');

  if (colBar) {
    colBar.style.width = `${colFill}%`;
    colBar.className = 'demand-progress-fill';
    
    if (colDemand === 0) {
      colLabel.innerText = 'Sufficient stock';
      colBar.classList.add('green');
      colBar.style.width = '100%';
    } else {
      colLabel.innerText = `Stock covers ${state.inventory.color} of ${colDemand} queued pages`;
      if (state.inventory.color >= colDemand * 1.5) {
        colBar.classList.add('green');
      } else if (state.inventory.color >= colDemand) {
        colBar.classList.add('amber');
      } else {
        colBar.classList.add('red');
      }
    }
  }
}

function updateInventoryStock() {
  const bwVal = parseInt(document.getElementById('inv-bw-stock').value) || 0;
  const colVal = parseInt(document.getElementById('inv-color-stock').value) || 0;

  state.inventory.bw = bwVal;
  state.inventory.color = colVal;
  bannerDismissed = false; // Reset dismiss trigger for low stock checks
  saveState();
  renderAll();
  notifications.toast('Inventory stock updated', 'success');
}

function saveStockThresholds() {
  const bwTh = parseInt(document.getElementById('threshold-bw').value) || 0;
  const colTh = parseInt(document.getElementById('threshold-color').value) || 0;

  state.settings.lowStockBW = bwTh;
  state.settings.lowStockColor = colTh;
  saveState();
  renderAll();
  notifications.toast('Warning thresholds updated', 'success');
}

// 10. Ledger tab HTML
let selectedStudentForAdjustmentId = null;

function renderLedgerTab() {
  const body = document.getElementById('student-credits-table-body');
  if (!body) return;

  body.innerHTML = state.students.map(s => {
    // Find last transaction
    const studentLedger = s.ledger || [];
    let lastTxLabel = 'No records';
    if (studentLedger.length > 0) {
      const last = studentLedger[studentLedger.length - 1];
      const sign = last.amount >= 0 ? '+' : '';
      lastTxLabel = `${sign}${last.amount} pgs (${last.reason})`;
    }

    return `
      <tr>
        <td><strong>${s.name}</strong></td>
        <td>${s.email}</td>
        <td><strong>${s.credits} pages</strong></td>
        <td style="color: var(--text-secondary); font-size: 11px;">${lastTxLabel}</td>
        <td>
          <button class="btn btn-operator-outline" style="font-size: 11px; padding: 4px 10px;" onclick="openCreditAdjustmentModal('${s.id}')">Adjust Credits</button>
        </td>
      </tr>
    `;
  }).join('');

  // Render logs transactions list
  const logsContainer = document.getElementById('ledger-history-list');
  if (logsContainer) {
    const allLedgerEntries = [];
    state.students.forEach(s => {
      (s.ledger || []).forEach(e => {
        allLedgerEntries.push({ ...e, studentEmail: s.email, studentName: s.name });
      });
    });

    // Sort newest first
    allLedgerEntries.sort((a, b) => b.timestamp - a.timestamp);

    if (allLedgerEntries.length === 0) {
      logsContainer.innerHTML = `<p style="text-align: center; font-size: 11px; color: var(--text-secondary); padding: 8px;">No ledger entries logged.</p>`;
    } else {
      logsContainer.innerHTML = allLedgerEntries.map(e => {
        let typeBadge = `<span class="badge" style="background-color: #E2E8F0; color: #475569; font-size: 9px; padding: 1px 6px;">Deduction</span>`;
        if (e.type === 'purchase') {
          typeBadge = `<span class="badge" style="background-color: #EFF6FF; color: var(--blue); font-size: 9px; padding: 1px 6px;">Purchase</span>`;
        } else if (e.type === 'operator_adjustment') {
          typeBadge = `<span class="badge" style="background-color: #F0FDFA; color: var(--teal); font-size: 9px; padding: 1px 6px;">Adjustment</span>`;
        }

        const operatorText = e.operatorName ? `<span style="font-size: 10px; color: var(--text-secondary);">by ${e.operatorName}</span>` : '';
        const noteText = e.note ? `<div style="font-size: 10px; color: var(--text-secondary); font-style: italic; margin-top: 2px;">Note: "${e.note}"</div>` : '';
        
        return `
          <div style="border-bottom: 1px solid var(--border); padding: 8px 0; font-size: 12px;">
            <div class="flex-between">
              <div>
                <strong>${e.studentName} (${e.studentEmail})</strong>
                ${typeBadge}
              </div>
              <strong style="color: ${e.amount >= 0 ? 'var(--teal)' : '#EF4444'};">
                ${e.amount >= 0 ? '+' : ''}${e.amount} pages
              </strong>
            </div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 1px;">
              Reason: ${e.reason} • ${formatTimestamp(e.timestamp)} ${operatorText}
            </div>
            ${noteText}
          </div>
        `;
      }).join('');
    }
  }
}

// Adjust credits Modal Actions
function openCreditAdjustmentModal(studentId) {
  const student = state.students.find(s => s.id === studentId);
  if (student) {
    selectedStudentForAdjustmentId = studentId;
    document.getElementById('credit-adjust-student-name').value = `${student.name} (${student.email})`;
    document.getElementById('credit-adjust-amount').value = 10;
    document.getElementById('credit-adjust-reason').value = 'Print quality issue';
    document.getElementById('credit-adjust-notes').value = '';
    
    openModal('modal-credit-adjust');
  }
}

function confirmCreditAdjustment() {
  const amount = parseInt(document.getElementById('credit-adjust-amount').value) || 0;
  const reason = document.getElementById('credit-adjust-reason').value;
  const note = document.getElementById('credit-adjust-notes').value.trim();
  const type = document.querySelector('input[name="credit-adjust-type"]:checked').value;

  if (amount <= 0) {
    notifications.toast('Please enter a valid page count adjustment', 'error');
    return;
  }

  const student = state.students.find(s => s.id === selectedStudentForAdjustmentId);
  if (student) {
    if (type === 'add') {
      student.credits += amount;
      student.ledger.push({
        type: 'operator_adjustment',
        amount: amount,
        reason: reason,
        note: note,
        operatorName: state.operatorSession.name,
        timestamp: Date.now()
      });
    } else {
      student.credits = Math.max(0, student.credits - amount);
      student.ledger.push({
        type: 'operator_adjustment',
        amount: -amount,
        reason: reason,
        note: note,
        operatorName: state.operatorSession.name,
        timestamp: Date.now()
      });
    }
    
    saveState();
    closeModal('modal-credit-adjust');
    renderAll();
    notifications.toast('Credit adjustment applied successfully', 'success');
  }
}

// --- End of Shift Summary Modal logic ---

function openEndShiftModal() {
  const modal = document.getElementById('modal-end-shift');
  if (!modal) return;

  const start = state.operatorSession.startTime || Date.now();
  document.getElementById('shift-started-time').innerText = formatTimestamp(start);

  // Calculate session stats dynamically since start time
  const shiftOrders = state.orders.filter(o => o.updatedAt >= start || (o.collectedAt && o.collectedAt >= start) || (o.printedAt && o.printedAt >= start));
  
  const completedOrders = shiftOrders.filter(o => o.status === 'collected' && !o.cancelled);
  
  let bwPrintedPages = 0;
  let colPrintedPages = 0;
  let paperSheetsConsumed = 0;

  // Pages printed and paper sheets consumed (where ready/collected timestamps are within shift)
  state.orders.forEach(o => {
    const readyInShift = o.readyAt && o.readyAt >= start;
    const collectedInShift = o.collectedAt && o.collectedAt >= start;
    const printedInShift = o.printedAt && o.printedAt >= start;
    
    if (readyInShift || collectedInShift || printedInShift) {
      const isColor = o.colorMode === 'color';
      const count = o.pages * o.copies;
      let sheets = count;
      if (o.sides === 'double') {
        sheets = Math.ceil(sheets / 2);
      }
      
      // Since stockDeducted is set on printing, verify paper sheets count
      paperSheetsConsumed += sheets;
      
      if (isColor) {
        colPrintedPages += count;
      } else {
        bwPrintedPages += count;
      }
    }
  });

  // Revenue from UPI purchases
  let upiRevenue = 0;
  state.students.forEach(s => {
    (s.ledger || []).forEach(e => {
      if (e.type === 'purchase' && e.timestamp >= start && e.priceINR) {
        upiRevenue += e.priceINR;
      }
    });
  });

  // Credits redeemed (costs of all orders uploaded during shift)
  let creditsRedeemed = 0;
  state.orders.forEach(o => {
    if (o.createdAt >= start) {
      creditsRedeemed += o.cost;
    }
  });

  // Unresolved problem orders currently
  const unresolvedProblems = state.orders.filter(o => o.status === 'flagged').length;

  // Inject into DOM
  document.getElementById('shift-completed-orders').innerText = completedOrders.length;
  document.getElementById('shift-total-pages').innerText = bwPrintedPages + colPrintedPages;
  document.getElementById('shift-bw-pages').innerText = bwPrintedPages;
  document.getElementById('shift-color-pages').innerText = colPrintedPages;
  document.getElementById('shift-revenue-upi').innerText = `₹${upiRevenue.toFixed(2)}`;
  document.getElementById('shift-credits-redeemed').innerText = `${creditsRedeemed} pages`;
  document.getElementById('shift-paper-consumed').innerText = `${paperSheetsConsumed} sheets`;
  
  const probBadge = document.getElementById('shift-unresolved-problems');
  probBadge.innerText = unresolvedProblems;

  openModal('modal-end-shift');
}

function exportShiftCSV() {
  const start = state.operatorSession.startTime || Date.now();
  const completedOrders = state.orders.filter(o => o.status === 'collected' && !o.cancelled && o.collectedAt >= start);
  
  // Shift Header Details
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Shift Summary Details\n";
  csvContent += `Operator Name,${state.operatorSession.name}\n`;
  csvContent += `Shift Started Time,${formatTimestamp(start)}\n`;
  csvContent += `Export Timestamp,${formatTimestamp(Date.now())}\n\n`;
  
  csvContent += "Summary Metrics\n";
  csvContent += `Orders Completed,${completedOrders.length}\n`;
  
  // Calculate printed pages and sheets
  let bwPrintedPages = 0;
  let colPrintedPages = 0;
  let sheetsConsumed = 0;
  
  state.orders.forEach(o => {
    const inShift = (o.readyAt && o.readyAt >= start) || (o.collectedAt && o.collectedAt >= start) || (o.printedAt && o.printedAt >= start);
    if (inShift) {
      const isColor = o.colorMode === 'color';
      const count = o.pages * o.copies;
      let sheets = count;
      if (o.sides === 'double') sheets = Math.ceil(sheets / 2);
      
      sheetsConsumed += sheets;
      if (isColor) colPrintedPages += count;
      else bwPrintedPages += count;
    }
  });
  
  csvContent += `B&W Pages Printed,${bwPrintedPages}\n`;
  csvContent += `Color Pages Printed,${colPrintedPages}\n`;
  csvContent += `Paper Sheets Consumed,${sheetsConsumed}\n\n`;
  
  // Detailed completed order rows
  csvContent += "Completed Orders List\n";
  csvContent += "Order ID,Student Email,Filename,Pages,Copies,Color Mode,Sides,Cost,Collected At\n";
  
  completedOrders.forEach(o => {
    csvContent += `"${o.id}","${o.studentEmail}","${o.fileName.replace(/"/g, '""')}",${o.pages},${o.copies},"${o.colorMode}","${o.sides}",${o.cost},"${formatTimestamp(o.collectedAt)}"\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `shift-summary-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  notifications.toast('Shift details exported as CSV', 'success');
}

function closeShiftSession() {
  state.operatorSession.startTime = Date.now();
  saveState();
  closeModal('modal-end-shift');
  renderAll();
  notifications.toast('Shift closed. New session started.', 'success');
}

// --- Dynamic Core Layout Renders ---

function renderOperatorDashboard() {
  const loginCard = document.getElementById('operator-auth-container');
  const dashboard = document.getElementById('operator-dashboard-container');
  
  if (!state.operatorSession.loggedIn) {
    if (loginCard) loginCard.style.display = 'flex';
    if (dashboard) dashboard.style.display = 'none';
    return;
  }
  
  if (loginCard) loginCard.style.display = 'none';
  if (dashboard) dashboard.style.display = 'flex';

  // Session header values
  document.getElementById('op-session-name-display').innerText = state.operatorSession.name;

  // Manage Active Tab switches styling
  document.querySelectorAll('.op-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.op-tab-content-panel').forEach(panel => panel.classList.remove('active'));
  
  const currentTabBtn = document.getElementById(`opTabBtn_${activeOpTab}`);
  const currentTabPanel = document.getElementById(`opTab_${activeOpTab}`);
  
  if (currentTabBtn) currentTabBtn.classList.add('active');
  if (currentTabPanel) currentTabPanel.classList.add('active');

  // Trigger Tab-specific content renders
  switch (activeOpTab) {
    case 'queue':
      renderAllOperatorQueue();
      break;
    case 'problems':
      renderProblemsTab();
      break;
    case 'inventory':
      renderInventoryTab();
      break;
    case 'ledger':
      renderLedgerTab();
      break;
  }

  // Inventory Stock Threshold Banner Check
  const banner = document.getElementById('low-stock-banner');
  const msg = document.getElementById('low-stock-msg');
  const underBw = state.inventory.bw < state.settings.lowStockBW;
  const underColor = state.inventory.color < state.settings.lowStockColor;

  if ((underBw || underColor) && !bannerDismissed) {
    if (banner) {
      banner.style.display = 'flex';
      if (msg) {
        msg.innerText = `Low stock: B&W at ${state.inventory.bw} sheets · Color at ${state.inventory.color} sheets. Restock now.`;
      }
    }
  } else {
    if (banner) banner.style.display = 'none';
  }

  // Force update problems badge count even when on other tabs
  const now = Date.now();
  const staleThreshold = 2 * 60 * 60 * 1000;
  const probCount = state.orders.filter(o => o.status === 'flagged' || (o.status === 'queued' && (now - o.createdAt > staleThreshold))).length;
  const badge = document.getElementById('problems-count-badge');
  if (badge) {
    if (probCount > 0) {
      badge.style.display = 'inline-flex';
      badge.innerText = probCount;
    } else {
      badge.style.display = 'none';
    }
  }
}

// Global renderer wrapper
function renderAll() {
  renderStudentApp();
  renderOperatorDashboard();
}

// --- Keyboard Shortcuts & Focus Mode Handling ---

function toggleFocusMode() {
  const container = document.getElementById('appContainer');
  const btn = document.getElementById('focus-mode-btn');
  
  if (container) {
    const isFocus = container.classList.toggle('focus-mode');
    if (btn) {
      btn.innerText = isFocus ? '⊠ Exit Focus' : '⛶ Focus';
    }
  }
}

// Window Escape handler to exit Focus Mode
window.addEventListener('keydown', (e) => {
  // Ignore when in active inputs
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    return;
  }

  const container = document.getElementById('appContainer');
  if (e.key === 'Escape') {
    // Exits Focus mode
    if (container && container.classList.contains('focus-mode')) {
      container.classList.remove('focus-mode');
      const btn = document.getElementById('focus-mode-btn');
      if (btn) btn.innerText = '⛶ Focus';
    }
    
    // Close active modals
    document.querySelectorAll('.custom-modal').forEach(modal => {
      modal.classList.remove('active');
    });
  }

  // Operator keyboard bindings (Active only when operator pane is visible & logged in)
  const opPane = document.getElementById('operator-pane');
  if (opPane && !opPane.classList.contains('pane-hidden-mobile') && state.operatorSession.loggedIn) {
    
    // N - cycle focus next queued order card
    if (e.key.toLowerCase() === 'n') {
      e.preventDefault();
      // Find all visible cards inside active batch container
      const cards = document.querySelectorAll('#order-batch-container .queue-card');
      if (cards.length > 0) {
        focusedOrderIndex = (focusedOrderIndex + 1) % cards.length;
        cards.forEach((card, idx) => {
          if (idx === focusedOrderIndex) {
            card.classList.add('focused-card');
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          } else {
            card.classList.remove('focused-card');
          }
        });
      }
    }

    // P, R, C, F bindings - applies to currently focused card
    const cards = document.querySelectorAll('#order-batch-container .queue-card');
    if (focusedOrderIndex >= 0 && focusedOrderIndex < cards.length) {
      const activeCard = cards[focusedOrderIndex];
      const orderId = activeCard.id.replace('card-', '');
      const order = state.orders.find(o => o.id === orderId);

      if (order) {
        if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          advanceOrderStatus(orderId, 'printing');
          notifications.toast(`Shortcuts: printing applied to #${orderId}`, 'info');
        }
        if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          advanceOrderStatus(orderId, 'ready');
          notifications.toast(`Shortcuts: ready applied to #${orderId}`, 'info');
        }
        if (e.key.toLowerCase() === 'c') {
          e.preventDefault();
          advanceOrderStatus(orderId, 'collected');
          notifications.toast(`Shortcuts: collected applied to #${orderId}`, 'info');
        }
        if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          // Open dropdown for reason
          toggleFlagDropdown(e, orderId);
        }
      }
    }

    // ? - open shortcuts help modal
    if (e.key === '?') {
      e.preventDefault();
      openModal('modal-shortcuts');
    }
  }
});

// Modal helpers
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

function handleOutsideModalClick(event, id) {
  if (event.target.id === id) {
    closeModal(id);
  }
}

// --- Simulators Drawer Operations ---

let simDrawerOpen = false;

function toggleSimulatorsDrawer() {
  simDrawerOpen = !simDrawerOpen;
  const body = document.getElementById('simulators-drawer-body');
  const arrow = document.getElementById('sim-drawer-arrow');
  
  if (body) {
    if (simDrawerOpen) {
      body.classList.add('active');
      if (arrow) arrow.innerText = '▼';
    } else {
      body.classList.remove('active');
      if (arrow) arrow.innerText = '▲';
    }
  }
}

function triggerTestSMS() {
  notifications.simulateSMS('test@campus.edu', 'Your print order is ready for pickup!');
  notifications.toast('SMS test log sent', 'success');
}

function triggerDeletionCron() {
  const deleted = cronJob.run();
  notifications.log(`[Cron] Executed hourly deletions scan. Removed files count: ${deleted}`);
  notifications.toast(`Deletion Cron: ${deleted} files purged`, 'success');
}

function viewScheduledDeletions() {
  const list = cronJob.getScheduled();
  const consoleLog = document.getElementById('sim-console-log');
  if (consoleLog) {
    if (list.length === 0) {
      consoleLog.innerHTML += `\n[Scheduler] No collected orders scheduled for file deletion.`;
    } else {
      consoleLog.innerHTML += `\n[Scheduler] Collected files pending deletion:\n` +
        list.map(item => `  • ${item.fileName} (Order: ${item.orderId}) - deletes in ${item.timeRemaining}s`).join('\n');
    }
    consoleLog.scrollTop = consoleLog.scrollHeight;
  }
}

function simulateStaleOrder() {
  // Find a queued order or seed a new queued order backdated by 3 hours
  const queuedOrder = state.orders.find(o => o.status === 'queued');
  if (queuedOrder) {
    queuedOrder.createdAt = Date.now() - 3 * 60 * 60 * 1000;
    saveState();
    renderAll();
    notifications.log(`[Simulator] Backdated Order ${queuedOrder.id} creation to 3 hours ago.`);
    notifications.toast(`Order ${queuedOrder.id} is now stale (>2h)`, 'warning');
  } else {
    // create a new stale order
    const orderId = 'ORD-' + Date.now();
    const newStale = {
      id: orderId,
      studentId: 'STU-1',
      studentEmail: 'student@campus.edu',
      fileName: 'stale_assignment_doc.pdf',
      fileUrl: 'https://s3.ap-south-1.amazonaws.com/campus-print-bucket/seed/stale_assignment_doc.pdf',
      pages: 12,
      copies: 1,
      colorMode: 'bw',
      sides: 'single',
      binding: false,
      stapling: false,
      pageRange: 'All',
      pickupPoint: 'Library Counter',
      cost: 12,
      status: 'queued',
      cancelled: false,
      flagReason: null,
      stockDeducted: false,
      annotations: [],
      createdAt: Date.now() - 3.5 * 60 * 60 * 1000,
      updatedAt: Date.now() - 3.5 * 60 * 60 * 1000
    };
    state.orders.push(newStale);
    saveState();
    renderAll();
    notifications.log(`[Simulator] Created backdated stale Order ${orderId}.`);
    notifications.toast(`Created stale order ${orderId}`, 'warning');
  }
}

// --- Window Load Initialization ---

window.addEventListener('DOMContentLoaded', () => {
  loadState();
  handleViewportChange();
  window.addEventListener('resize', handleViewportChange);
  
  // Set initial screen states
  if (currentStudent) {
    showStudentScreen('home');
  } else {
    showStudentScreen('auth');
  }
  
  renderOperatorDashboard();

  // Close dropdowns on document click
  document.addEventListener('click', () => {
    document.querySelectorAll('.inline-dropdown').forEach(el => el.classList.remove('active'));
  });
});
