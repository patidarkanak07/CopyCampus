// --- CopyCampus State Management & Simulated Backend Database ---

const DB_KEY = 'copycampus_db_v1';

let state = {
  activeUser: null,
  operatorSession: false,
  orders: [],
  ledger: [],
  studentCredits: {}, // email -> credit count
  systemStats: {
    upiRevenue: 0,
    creditsRedeemed: 0,
    dailyPages: 0,
    bwPages: 0,
    colorPages: 0
  }
};

// Seed default mock database data for demonstration
const DEFAULT_SEED_DATA = {
  activeUser: 'alex@campus.edu',
  operatorSession: false,
  orders: [
    {
      id: 'CC-101',
      studentEmail: 'alex@campus.edu',
      fileName: 'math_assignment_3.pdf',
      fileType: 'PDF',
      fileUrl: 'https://firebasestorage.googleapis.com/v0/b/copycampus-cf23.appspot.com/o/prints%2Fmath_assignment_3.pdf',
      pages: 6,
      options: {
        color: 'bw',
        sides: 'double',
        paperSize: 'a4',
        range: 'All',
        copies: 1,
        binding: 'stapled',
        location: 'library'
      },
      cost: 12, // (6 pages * 1.6 B&W double-sided * 1) + 2 stapled = ~11.6 rounded to 12
      paymentMethod: 'credits',
      status: 'collected', // Already collected
      timeline: {
        uploaded: '2026-06-16T10:15:00Z',
        queued: '2026-06-16T10:16:30Z',
        printing: '2026-06-16T10:30:00Z',
        ready: '2026-06-16T10:45:00Z',
        collected: '2026-06-16T11:30:00Z',
        deletedFromCloud: '2026-06-18T11:30:00Z' // Scheduled deletion simulation
      }
    },
    {
      id: 'CC-102',
      studentEmail: 'alex@campus.edu',
      fileName: 'chemistry_lab_report.pdf',
      fileType: 'PDF',
      fileUrl: 'https://firebasestorage.googleapis.com/v0/b/copycampus-cf23.appspot.com/o/prints%2Fchemistry_lab_report.pdf',
      pages: 8,
      options: {
        color: 'color',
        sides: 'single',
        paperSize: 'a4',
        range: 'All',
        copies: 1,
        binding: 'none',
        location: 'library'
      },
      cost: 64, // (8 pages * 8.0 Color * 1) = 64
      paymentMethod: 'upi',
      status: 'queued', // Active in queue
      timeline: {
        uploaded: '2026-06-17T15:20:00Z',
        queued: '2026-06-17T15:21:40Z'
      }
    },
    {
      id: 'CC-103',
      studentEmail: 'emma@campus.edu',
      fileName: 'engineering_drawing_c.jpg',
      fileType: 'JPG',
      fileUrl: 'https://firebasestorage.googleapis.com/v0/b/copycampus-cf23.appspot.com/o/prints%2Fengineering_drawing_c.jpg',
      pages: 1,
      options: {
        color: 'color',
        sides: 'single',
        paperSize: 'a3',
        range: 'All',
        copies: 2,
        binding: 'none',
        location: 'eng_block'
      },
      cost: 32, // (1 page * 8.0 Color * 2 copies * 2.0 A3 premium) = 32
      paymentMethod: 'upi',
      status: 'printing', // Active printing
      timeline: {
        uploaded: '2026-06-17T15:40:00Z',
        queued: '2026-06-17T15:41:20Z',
        printing: '2026-06-17T15:55:00Z'
      }
    }
  ],
  ledger: [
    {
      id: 'TXN-901',
      studentEmail: 'alex@campus.edu',
      type: 'purchase', // Purchase pack
      amount: 150, // ₹150 for 200 pages
      pages: 200,
      timestamp: '2026-06-15T09:00:00Z'
    },
    {
      id: 'TXN-90 math',
      studentEmail: 'alex@campus.edu',
      type: 'deduction',
      orderId: 'CC-101',
      pages: 6, // Deducted 6 pages
      timestamp: '2026-06-16T10:15:00Z'
    }
  ],
  studentCredits: {
    'alex@campus.edu': 194, // 200 purchased - 6 used
    'emma@campus.edu': 0
  },
  systemStats: {
    upiRevenue: 96, // Order CC-102 (64) + Order CC-103 (32)
    creditsRedeemed: 6,
    dailyPages: 15, // 6 (CC-101) + 8 (CC-102) + 1 (CC-103)
    bwPages: 6,
    colorPages: 9
  }
};

// Load state from localStorage or seed database
function loadDatabase() {
  const data = localStorage.getItem(DB_KEY);
  if (data) {
    state = JSON.parse(data);
  } else {
    state = DEFAULT_SEED_DATA;
    saveDatabase();
  }
}

function saveDatabase() {
  localStorage.setItem(DB_KEY, JSON.stringify(state));
}

// Current uploaded file configuration state
let currentUploadedFile = null;

// --- DOM Navigation & View Routing ---

function switchView(view) {
  const studentPane = document.getElementById('studentPane');
  const operatorPane = document.getElementById('operatorPane');
  const btnShowStudent = document.getElementById('btnShowStudent');
  const btnShowOperator = document.getElementById('btnShowOperator');
  
  if (view === 'student') {
    studentPane.classList.remove('pane-hidden');
    operatorPane.classList.add('pane-hidden');
    btnShowStudent.classList.add('active-student');
    btnShowOperator.classList.remove('active-operator');
  } else {
    operatorPane.classList.remove('pane-hidden');
    studentPane.classList.add('pane-hidden');
    btnShowOperator.classList.add('active-operator');
    btnShowStudent.classList.remove('active-student');
  }
}

// Check desktop or mobile viewports
function handleViewportChange() {
  const studentPane = document.getElementById('studentPane');
  const operatorPane = document.getElementById('operatorPane');
  
  if (window.innerWidth > 900) {
    // Show both side-by-side on desktop
    studentPane.classList.remove('pane-hidden');
    operatorPane.classList.remove('pane-hidden');
  } else {
    // On mobile, show Student panel by default
    switchView('student');
  }
}

// --- Notification Alert Routing Router ---
const AlertRouter = {
  log(message) {
    const logsContainer = document.getElementById('notificationAlertLogs');
    const time = new Date().toLocaleTimeString();
    logsContainer.innerHTML += `\n[${time}] ${message}`;
    logsContainer.scrollTop = logsContainer.scrollHeight;
  },
  
  notify(title, body) {
    // Check if system allows web notifications
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
    
    // Log to simulated console
    this.log(`FCM PUSH: ${title} - "${body}"`);
    
    // Also trigger mobile-app Toast alert on the phone screen
    const alertDiv = document.createElement('div');
    alertDiv.className = 'notification-toast';
    alertDiv.innerHTML = `<strong>🔔 ${title}</strong><br>${body}`;
    
    const phoneScreen = document.getElementById('studentScreen');
    phoneScreen.insertBefore(alertDiv, phoneScreen.firstChild);
    
    // Auto-remove notification from student app phone view after 6s
    setTimeout(() => {
      alertDiv.style.opacity = '0';
      setTimeout(() => alertDiv.remove(), 300);
    }, 6000);
  }
};

// --- Student App Feature Actions ---

function studentLogin() {
  const email = document.getElementById('studentEmail').value.trim();
  
  if (!email || !email.includes('@') || (!email.endsWith('.edu') && !email.endsWith('.in'))) {
    alert('Please enter a valid college email ending with .edu or .in');
    return;
  }
  
  state.activeUser = email;
  if (!state.studentCredits[email]) {
    state.studentCredits[email] = 0;
  }
  
  saveDatabase();
  AlertRouter.log(`Student signed in: ${email}`);
  
  goToHomeScreen();
}

function studentLogout() {
  state.activeUser = null;
  saveDatabase();
  
  document.getElementById('studentHomeScreen').style.display = 'none';
  document.getElementById('studentUploadScreen').style.display = 'none';
  document.getElementById('studentTrackerScreen').style.display = 'none';
  document.getElementById('studentAuthScreen').style.display = 'block';
  
  AlertRouter.log('Student logged out');
}

function goToHomeScreen() {
  document.getElementById('studentAuthScreen').style.display = 'none';
  document.getElementById('studentUploadScreen').style.display = 'none';
  document.getElementById('studentTrackerScreen').style.display = 'none';
  
  const homeScreen = document.getElementById('studentHomeScreen');
  homeScreen.style.display = 'block';
  
  // Update UI values
  document.getElementById('studentWelcomeText').innerText = `Hello, ${state.activeUser.split('@')[0]}`;
  document.getElementById('studentCreditBalance').innerText = state.studentCredits[state.activeUser] || 0;
  
  renderStudentActiveOrders();
  renderStudentHistory();
}

function goToUploadScreen() {
  document.getElementById('studentHomeScreen').style.display = 'none';
  document.getElementById('studentUploadScreen').style.display = 'block';
  removeUploadedFile(); // clear draft
}

function renderStudentActiveOrders() {
  const container = document.getElementById('studentActiveJobsList');
  const activeOrders = state.orders.filter(
    o => o.studentEmail === state.activeUser && o.status !== 'collected'
  );
  
  if (activeOrders.length === 0) {
    container.innerHTML = `<p style="text-align: center; padding: 16px; color: var(--text-muted);">No active jobs. Upload a file to start.</p>`;
    return;
  }
  
  container.innerHTML = activeOrders.map(order => {
    let badgeColorClass = 'badge-pending';
    if (order.status === 'printing') badgeColorClass = 'badge-pending';
    if (order.status === 'ready') badgeColorClass = 'badge-success';
    
    return `
      <div class="card flex-between" onclick="viewOrderTracker('${order.id}')" style="cursor: pointer;">
        <div>
          <h3 class="sentence-case" style="margin: 0; font-size: 13px;">${order.fileName}</h3>
          <p style="font-size: 11px;">Order #${order.id} • Cost: ₹${order.cost}</p>
        </div>
        <span class="badge ${badgeColorClass}">${order.status}</span>
      </div>
    `;
  }).join('');
}

function renderStudentHistory() {
  const container = document.getElementById('studentHistoryList');
  const pastOrders = state.orders.filter(
    o => o.studentEmail === state.activeUser && o.status === 'collected'
  );
  
  if (pastOrders.length === 0) {
    container.innerHTML = `<p style="text-align: center; padding: 16px; color: var(--text-muted);">No past orders found.</p>`;
    return;
  }
  
  container.innerHTML = pastOrders.map(order => `
    <div class="card" style="margin-bottom: 8px; padding: 12px;">
      <div class="flex-between">
        <h3 class="sentence-case" style="font-size: 13px; margin:0; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 180px;">${order.fileName}</h3>
        <span class="badge badge-success">collected</span>
      </div>
      <p style="font-size: 11px; margin-top: 2px;">${order.pages} pages • ₹${order.cost} • via ${order.paymentMethod}</p>
      <button class="btn btn-student-outline" style="width: 100%; padding: 4px; font-size: 10px; border-radius: 4px; margin-top: 8px;" onclick="reprintOrder('${order.id}')">🔄 Reprint this</button>
    </div>
  `).join('');
}

// --- Upload dropzone & Google Drive simulation handlers ---

function triggerFileInput() {
  document.getElementById('fileSelectorInput').click();
}

function handleFileSelected(event) {
  const file = event.target.files[0];
  if (file) {
    simulateCloudUpload(file.name, file.size, file.name.split('.').pop().toUpperCase());
  }
}

function simulateGoogleDriveImport(event) {
  event.stopPropagation(); // prevent triggering native input click
  document.getElementById('googlePickerModal').style.display = 'flex';
}

function closeGooglePicker() {
  document.getElementById('googlePickerModal').style.display = 'none';
}

function selectDriveFile(name, pages, type) {
  closeGooglePicker();
  AlertRouter.log(`Selected Google Drive file: ${name}`);
  simulateCloudUpload(name, pages * 1024 * 180, type, pages);
}

// In-Memory Cloud Storage Uploader Simulator (returns virtual Firebase Storage URLs)
function simulateCloudUpload(name, size, type, preCalculatedPages = null) {
  const dropzone = document.getElementById('studentDropzone');
  dropzone.innerHTML = `
    <div style="font-size: 32px; margin-bottom: 8px; animation: spin 1.5s linear infinite;">⏳</div>
    <h3 class="sentence-case">Uploading file to Firebase Cloud...</h3>
    <p id="uploadProgressLabel">Progress: 0%</p>
  `;
  dropzone.style.pointerEvents = 'none';
  
  let progress = 0;
  const interval = setInterval(() => {
    progress += 20;
    document.getElementById('uploadProgressLabel').innerText = `Progress: ${progress}%`;
    
    if (progress >= 100) {
      clearInterval(interval);
      
      // Calculate mock parameters
      const pageCount = preCalculatedPages || Math.max(1, Math.floor(size / (1024 * 150))) || 3;
      const cloudUrl = `https://firebasestorage.googleapis.com/v0/b/copycampus-cf23.appspot.com/o/prints%2F${encodeURIComponent(name)}`;
      
      currentUploadedFile = {
        name: name,
        size: (size / (1024 * 1024)).toFixed(2) + ' MB',
        type: type,
        pages: pageCount,
        url: cloudUrl
      };
      
      // Update UI elements
      dropzone.style.display = 'none';
      document.getElementById('uploadedFilesContainer').style.display = 'block';
      document.getElementById('uploadedFileName').innerText = currentUploadedFile.name;
      document.getElementById('uploadedFileMeta').innerText = `${currentUploadedFile.pages} pages • ${currentUploadedFile.size} • cloud stored`;
      document.getElementById('uploadedFileIcon').innerText = type;
      
      // Display PDF preview simulation
      document.getElementById('previewText').innerText = `Preview: ${name}\n\nContents scanned.\nCloud secure.\nSize: ${currentUploadedFile.size}`;
      document.getElementById('previewPageNum').innerText = `Page 1 of ${currentUploadedFile.pages}`;
      
      // Enable Submit Actions
      const submitBtn = document.getElementById('btnContinueCheckout');
      submitBtn.classList.remove('btn-disabled');
      submitBtn.disabled = false;
      
      calculateCost();
      
      // Reset dropzone look
      dropzone.style.pointerEvents = 'auto';
      
      AlertRouter.log(`File uploaded to cloud storage: ${name}`);
      
      // Increment Simulator Cloud files counter
      updateSimulatorCloudCounters();
    }
  }, 150);
}

function removeUploadedFile() {
  currentUploadedFile = null;
  
  const dropzone = document.getElementById('studentDropzone');
  dropzone.style.display = 'block';
  dropzone.innerHTML = `
    <input type="file" id="fileSelectorInput" style="display: none;" onchange="handleFileSelected(event)" accept=".pdf,.png,.jpg,.jpeg,.docx,.pptx">
    <div style="font-size: 32px; margin-bottom: 8px;">📤</div>
    <h3 class="sentence-case">Select print documents</h3>
    <p>PDF, PNG, JPG, DOCX, PPTX supported</p>
    <button class="btn btn-student-outline" style="margin-top: 12px; padding: 6px 12px; font-size: 11px;" onclick="simulateGoogleDriveImport(event)">☁️ Import from Google Drive</button>
  `;
  
  document.getElementById('uploadedFilesContainer').style.display = 'none';
  
  // Disable checkout
  const submitBtn = document.getElementById('btnContinueCheckout');
  submitBtn.classList.add('btn-disabled');
  submitBtn.disabled = true;
  
  calculateCost();
  updateSimulatorCloudCounters();
}

function adjustCopies(amt) {
  const copiesVal = document.getElementById('optCopies');
  let currentVal = parseInt(copiesVal.value);
  currentVal = Math.max(1, currentVal + amt);
  copiesVal.value = currentVal;
  calculateCost();
}

// --- Live Costing Calculations ---

function calculateCost() {
  if (!currentUploadedFile) {
    document.getElementById('liveCostVal').innerText = '₹0.00';
    return;
  }
  
  const pages = currentUploadedFile.pages;
  const isColor = document.querySelector('input[name="optColor"]:checked').value === 'color';
  const isDouble = document.querySelector('input[name="optSides"]:checked').value === 'double';
  const paperSize = document.getElementById('optPaperSize').value;
  const copies = parseInt(document.getElementById('optCopies').value) || 1;
  const binding = document.getElementById('optBinding').value;
  
  // Base rates
  let pageRate = isColor ? 8.0 : 2.0;
  
  // Double-sided 20% discount on print rate per page face
  if (isDouble) {
    pageRate = pageRate * 0.8;
  }
  
  // Size multipliers
  if (paperSize === 'a3') {
    pageRate = pageRate * 2.0;
  }
  
  // Binding add-ons
  let bindingPrice = 0;
  if (binding === 'stapled') bindingPrice = 2;
  if (binding === 'spiral') bindingPrice = 20;
  if (binding === 'softcover') bindingPrice = 50;
  
  const totalCost = Math.round((pages * pageRate * copies) + bindingPrice);
  document.getElementById('liveCostVal').innerText = `₹${totalCost.toFixed(2)}`;
}

function getCalculatedCost() {
  const liveCostText = document.getElementById('liveCostVal').innerText;
  return parseFloat(liveCostText.replace('₹', '')) || 0;
}

// --- Payment & Checkout Simulation Flows ---

function initiateCheckout() {
  if (!currentUploadedFile) return;
  
  const cost = getCalculatedCost();
  document.getElementById('checkoutCostLabel').innerText = `₹${cost.toFixed(2)}`;
  document.getElementById('checkoutPagesLabel').innerText = `${currentUploadedFile.pages} pages • ${document.getElementById('optPaperSize').value.toUpperCase()}`;
  
  const balance = state.studentCredits[state.activeUser] || 0;
  document.getElementById('checkoutCreditsBalanceLabel').innerText = `Current balance: ${balance} pages`;
  
  // Disable credit button if they don't have enough page credits
  const creditsButton = document.getElementById('btnPayWithCredits');
  const pagesRequired = currentUploadedFile.pages * parseInt(document.getElementById('optCopies').value);
  
  if (balance < pagesRequired) {
    creditsButton.classList.add('btn-disabled');
    creditsButton.disabled = true;
    creditsButton.title = "Insufficient semester credits for this print configuration";
  } else {
    creditsButton.classList.remove('btn-disabled');
    creditsButton.disabled = false;
    creditsButton.title = "";
  }
  
  document.getElementById('checkoutModal').classList.add('active');
}

function closeCheckoutModal() {
  document.getElementById('checkoutModal').classList.remove('active');
}

function payWithSemesterCredits() {
  const cost = getCalculatedCost();
  const pagesRequired = currentUploadedFile.pages * parseInt(document.getElementById('optCopies').value);
  const userBalance = state.studentCredits[state.activeUser] || 0;
  
  if (userBalance < pagesRequired) {
    alert("Insufficient page credits!");
    return;
  }
  
  // Deduct
  state.studentCredits[state.activeUser] = userBalance - pagesRequired;
  
  // Add transactions ledger
  const orderId = 'CC-' + Math.floor(100 + Math.random() * 900);
  const timestamp = new Date().toISOString();
  
  state.ledger.push({
    id: 'TXN-' + Math.floor(500 + Math.random() * 500),
    studentEmail: state.activeUser,
    type: 'deduction',
    orderId: orderId,
    pages: pagesRequired,
    timestamp: timestamp
  });
  
  // Create Order
  const order = createOrderObject(orderId, 'credits', cost);
  state.orders.push(order);
  
  // Update overall counters
  state.systemStats.creditsRedeemed += pagesRequired;
  state.systemStats.dailyPages += pagesRequired;
  if (order.options.color === 'color') {
    state.systemStats.colorPages += pagesRequired;
  } else {
    state.systemStats.bwPages += pagesRequired;
  }
  
  saveDatabase();
  closeCheckoutModal();
  
  AlertRouter.log(`Paid ${pagesRequired} credits for Order ${orderId}`);
  
  // Refresh operator dashboards
  renderOperatorQueue();
  renderOperatorStats();
  
  viewOrderTracker(orderId);
}

// UPI QR Code generator block simulator
function renderUpiQrCode(amount) {
  const block = document.getElementById('qrBlock');
  block.innerHTML = '';
  // generate a flat pattern representation of QR code
  for (let i = 0; i < 25; i++) {
    const bit = (Math.random() > 0.45) ? '#000' : '#fff';
    const cell = document.createElement('div');
    cell.style.backgroundColor = bit;
    cell.style.borderRadius = '2px';
    block.appendChild(cell);
  }
  document.getElementById('upiPayAmountLabel').innerText = `₹${amount.toFixed(2)}`;
}

function openUpiPaymentModal() {
  closeCheckoutModal();
  const cost = getCalculatedCost();
  renderUpiQrCode(cost);
  document.getElementById('upiPaymentModal').classList.add('active');
}

function closeUpiPaymentModal() {
  document.getElementById('upiPaymentModal').classList.remove('active');
}

// UPI Deep Link intent handler simulation
function simulateUpiAppIntent() {
  const cost = getCalculatedCost();
  const upiUrl = `upi://pay?pa=copycampus@ybl&pn=CopyCampusPrint&am=${cost.toFixed(2)}&cu=INR&tn=PrintOrder`;
  
  AlertRouter.log(`Triggering UPI Intent: ${upiUrl}`);
  
  // Show pop-up simulating student phone opening GPay / Paytm
  alert(`UPI App Deep Link triggered!\nOpened payment app pre-filled with ₹${cost.toFixed(2)} to copycampus@ybl.\n\nPlease authorize in the simulated app window then click 'Verify'.`);
}

function confirmPaymentAndSubmitOrder() {
  const cost = getCalculatedCost();
  const orderId = 'CC-' + Math.floor(100 + Math.random() * 900);
  
  // Create Order
  const order = createOrderObject(orderId, 'upi', cost);
  order.status = 'queued'; // Automatically marks payment completed in QR simulation step
  
  state.orders.push(order);
  
  // Update stats
  state.systemStats.upiRevenue += cost;
  const pageCreditsCount = order.pages * order.options.copies;
  state.systemStats.dailyPages += pageCreditsCount;
  if (order.options.color === 'color') {
    state.systemStats.colorPages += pageCreditsCount;
  } else {
    state.systemStats.bwPages += pageCreditsCount;
  }
  
  saveDatabase();
  closeUpiPaymentModal();
  
  AlertRouter.log(`UPI Payment confirmed for Order ${orderId}: ₹${cost}`);
  
  renderOperatorQueue();
  renderOperatorStats();
  
  viewOrderTracker(orderId);
}

function createOrderObject(orderId, paymentMethod, cost) {
  const isColor = document.querySelector('input[name="optColor"]:checked').value === 'color';
  const isDouble = document.querySelector('input[name="optSides"]:checked').value === 'double';
  
  return {
    id: orderId,
    studentEmail: state.activeUser,
    fileName: currentUploadedFile.name,
    fileType: currentUploadedFile.type,
    fileUrl: currentUploadedFile.url,
    pages: currentUploadedFile.pages,
    options: {
      color: isColor ? 'color' : 'bw',
      sides: isDouble ? 'double' : 'single',
      paperSize: document.getElementById('optPaperSize').value,
      range: document.getElementById('optRange').value || 'All',
      copies: parseInt(document.getElementById('optCopies').value) || 1,
      binding: document.getElementById('optBinding').value,
      location: document.getElementById('optLocation').value
    },
    cost: cost,
    paymentMethod: paymentMethod,
    status: 'uploaded',
    timeline: {
      uploaded: new Date().toISOString(),
      queued: new Date().toISOString() // queued as payment clears
    }
  };
}

// --- Semester Credit packs store checkout ---

function openBuyCreditsModal() {
  document.getElementById('buyCreditsModal').classList.add('active');
}

function closeBuyCreditsModal() {
  document.getElementById('buyCreditsModal').classList.remove('active');
}

function buyCredits(pages, price) {
  const upiUrl = `upi://pay?pa=copycampus@ybl&pn=CopyCampusPrint&am=${price}&cu=INR&tn=CreditPack${pages}`;
  AlertRouter.log(`Triggering UPI pack purchase intent: ${upiUrl}`);
  
  if (confirm(`Authorize UPI payment of ₹${price} to buy the ${pages} page pack?`)) {
    const currentBal = state.studentCredits[state.activeUser] || 0;
    state.studentCredits[state.activeUser] = currentBal + pages;
    
    // Add ledger
    state.ledger.push({
      id: 'TXN-' + Math.floor(500 + Math.random() * 500),
      studentEmail: state.activeUser,
      type: 'purchase',
      amount: price,
      pages: pages,
      timestamp: new Date().toISOString()
    });
    
    saveDatabase();
    closeBuyCreditsModal();
    
    // Refresh Student views
    document.getElementById('studentCreditBalance').innerText = state.studentCredits[state.activeUser];
    renderStudentHistory();
    
    // Refresh Operator dashboards
    renderOperatorStats();
    
    AlertRouter.log(`Purchased Credit Pack: +${pages} pages`);
    alert(`Success! Added ${pages} page credits to your semester account.`);
  }
}

// --- Order Status Timelines & Reprint Action Handlers ---

let trackingInterval = null;

function viewOrderTracker(orderId) {
  // Clear any existing tracker updates
  clearInterval(trackingInterval);
  
  document.getElementById('studentHomeScreen').style.display = 'none';
  document.getElementById('studentUploadScreen').style.display = 'none';
  
  const trackerScreen = document.getElementById('studentTrackerScreen');
  trackerScreen.style.display = 'block';
  
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;
  
  document.getElementById('trackOrderTitle').innerText = `Order #${order.id}`;
  document.getElementById('trackOrderFile').innerText = `${order.fileName} (${order.pages} pgs)`;
  document.getElementById('trackAmountPaid').innerText = `₹${order.cost.toFixed(2)} (${order.paymentMethod.toUpperCase()})`;
  
  const mapLocations = {
    library: 'Central Library Desk A',
    eng_block: 'Engineering Block B Copy Counter',
    canteen: 'Student Center Printer Hub'
  };
  document.getElementById('trackPickupPoint').innerText = mapLocations[order.options.location] || order.options.location;
  
  // Render timeline stages status check
  updateTrackerTimelineUI(order);
  
  // Periodically check state updates in case operator changes status on dashboard
  trackingInterval = setInterval(() => {
    const updatedOrder = state.orders.find(o => o.id === orderId);
    if (updatedOrder) {
      updateTrackerTimelineUI(updatedOrder);
      if (updatedOrder.status === 'collected') {
        clearInterval(trackingInterval);
      }
    }
  }, 2000);
}

function updateTrackerTimelineUI(order) {
  const stages = ['uploaded', 'queued', 'printing', 'ready', 'collected'];
  const activeIndex = stages.indexOf(order.status);
  
  stages.forEach((stage, idx) => {
    const el = document.getElementById(`step_${stage}`);
    
    // Clear styles
    el.classList.remove('completed', 'active');
    
    if (idx < activeIndex) {
      el.classList.add('completed');
    } else if (idx === activeIndex) {
      el.classList.add('active');
    }
    
    // Timestamps
    const timeEl = document.getElementById(`time_${stage}`);
    if (order.timeline[stage]) {
      const timeStr = new Date(order.timeline[stage]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      timeEl.innerText = timeStr;
    } else {
      timeEl.innerText = '-';
    }
  });
  
  // Show / Hide Auto deletion notice
  const deletionNotice = document.getElementById('trackerCollectedNotice');
  if (order.status === 'collected') {
    deletionNotice.style.display = 'block';
  } else {
    deletionNotice.style.display = 'none';
  }
}

function reprintOrder(orderId) {
  const originalOrder = state.orders.find(o => o.id === orderId);
  if (!originalOrder) return;
  
  if (confirm(`Do you want to reprint this document (${originalOrder.fileName}) using the same configurations?`)) {
    // Navigate to upload configuration screen, set files, pre-fill form parameters
    document.getElementById('studentHomeScreen').style.display = 'none';
    document.getElementById('studentUploadScreen').style.display = 'block';
    
    currentUploadedFile = {
      name: originalOrder.fileName,
      size: 'Re-cached',
      type: originalOrder.fileType,
      pages: originalOrder.pages,
      url: originalOrder.fileUrl
    };
    
    // Pre-fill parameters
    document.getElementById('uploadedFilesContainer').style.display = 'block';
    document.getElementById('uploadedFileName').innerText = currentUploadedFile.name;
    document.getElementById('uploadedFileMeta').innerText = `${currentUploadedFile.pages} pages • Cloud active`;
    document.getElementById('uploadedFileIcon').innerText = originalOrder.fileType;
    document.getElementById('studentDropzone').style.display = 'none';
    
    // Match colors
    if (originalOrder.options.color === 'color') {
      document.querySelector('input[name="optColor"][value="color"]').checked = true;
    } else {
      document.querySelector('input[name="optColor"][value="bw"]').checked = true;
    }
    
    // Match sides
    if (originalOrder.options.sides === 'double') {
      document.querySelector('input[name="optSides"][value="double"]').checked = true;
    } else {
      document.querySelector('input[name="optSides"][value="single"]').checked = true;
    }
    
    document.getElementById('optPaperSize').value = originalOrder.options.paperSize;
    document.getElementById('optRange').value = originalOrder.options.range;
    document.getElementById('optCopies').value = originalOrder.options.copies;
    document.getElementById('optBinding').value = originalOrder.options.binding;
    document.getElementById('optLocation').value = originalOrder.options.location;
    
    // Enable Order Pay
    const submitBtn = document.getElementById('btnContinueCheckout');
    submitBtn.classList.remove('btn-disabled');
    submitBtn.disabled = false;
    
    calculateCost();
    AlertRouter.log(`Reprint request loaded: ${originalOrder.id}`);
  }
}

function reprintCurrentTrackerOrder() {
  const titleText = document.getElementById('trackOrderTitle').innerText;
  const orderId = titleText.replace('Order #', '');
  reprintOrder(orderId);
}

// --- Operator Dashboard Feature Actions ---

function operatorLogin() {
  const pin = document.getElementById('operatorPass').value;
  if (pin === '1234') {
    state.operatorSession = true;
    saveDatabase();
    
    document.getElementById('operatorAuthScreen').style.display = 'none';
    document.getElementById('operatorDashboardScreen').style.display = 'block';
    
    AlertRouter.log('Operator terminal unlocked');
    renderOperatorQueue();
    renderOperatorStats();
  } else {
    alert('Invalid operator access pin!');
  }
}

function operatorLogout() {
  state.operatorSession = false;
  saveDatabase();
  
  document.getElementById('operatorDashboardScreen').style.display = 'none';
  document.getElementById('operatorAuthScreen').style.display = 'flex';
  
  AlertRouter.log('Operator terminal locked');
}

function renderOperatorQueue() {
  const container = document.getElementById('operatorQueueContainer');
  const activeOrders = state.orders.filter(o => o.status !== 'collected');
  
  document.getElementById('queueCountLabel').innerText = activeOrders.length;
  
  if (activeOrders.length === 0) {
    container.innerHTML = `<p style="text-align: center; padding: 48px; color: var(--text-muted); background: white; border: 1px solid var(--border-color); border-radius: var(--radius-md);">No orders in print queue</p>`;
    return;
  }
  
  // Sort queue by order upload timestamp (submission time)
  activeOrders.sort((a,b) => new Date(a.timeline.uploaded) - new Date(b.timeline.uploaded));
  
  container.innerHTML = activeOrders.map(order => {
    // Generate color schemes configuration label
    const colorLabel = order.options.color === 'color' ? '🎨 Color' : '📄 B&W';
    const sideLabel = order.options.sides === 'double' ? 'Double-sided' : 'Single-sided';
    const bindLabel = order.options.binding !== 'none' ? `| ${order.options.binding}` : '';
    const paymentLabel = order.paymentMethod === 'credits' 
      ? `🎫 Paid via Semester Credits` 
      : `📲 Paid via UPI (₹${order.cost})`;
      
    // Action trigger buttons based on status
    let actionButtonsHTML = '';
    if (order.status === 'queued') {
      actionButtonsHTML = `
        <button class="btn btn-operator" style="padding: 6px 12px; font-size: 11px;" onclick="advanceOrderStatus('${order.id}', 'printing')">🖨️ Start Print</button>
      `;
    } else if (order.status === 'printing') {
      actionButtonsHTML = `
        <button class="btn btn-operator" style="padding: 6px 12px; font-size: 11px; background-color: var(--color-pending);" onclick="advanceOrderStatus('${order.id}', 'ready')">🎁 Mark Ready</button>
      `;
    } else if (order.status === 'ready') {
      actionButtonsHTML = `
        <button class="btn btn-operator" style="padding: 6px 12px; font-size: 11px; background-color: var(--color-success);" onclick="advanceOrderStatus('${order.id}', 'collected')">🤝 Handed Over</button>
      `;
    }
    
    // Draw visual thumbnail representation
    let docThumbText = order.fileType;
    if (order.fileType === 'JPG' || order.fileType === 'PNG') docThumbText = '🖼️';
    
    return `
      <div class="queue-card">
        <div class="queue-preview">
          <div style="text-align: center;">
            <div style="font-size: 18px; margin-bottom: 2px;">${docThumbText}</div>
            <div style="font-size: 9px; opacity: 0.7;">${order.pages} pgs</div>
          </div>
        </div>
        <div class="queue-details">
          <div class="flex-row">
            <span style="font-weight: 700; font-size: 14px;">Order #${order.id}</span>
            <span class="badge ${order.status === 'ready' ? 'badge-success' : 'badge-pending'}">${order.status}</span>
          </div>
          <p style="font-weight: 600; color: var(--text-main); font-size: 13px; margin: 2px 0;">${order.fileName}</p>
          <p style="font-size: 11px; color: var(--text-muted);">
            ${colorLabel} | ${sideLabel} | ${order.options.paperSize.toUpperCase()} | Copies: ${order.options.copies} ${bindLabel}
          </p>
          <p style="font-size: 11px; font-weight: 500; color: var(--color-operator); margin-top: 4px;">
            ${paymentLabel}
          </p>
          <p style="font-size: 10px; color: var(--text-muted); font-style: italic;">
            Submitted by ${order.studentEmail} at ${new Date(order.timeline.uploaded).toLocaleTimeString()}
          </p>
        </div>
        <div class="queue-actions">
          ${actionButtonsHTML}
        </div>
      </div>
    `;
  }).join('');
}

function advanceOrderStatus(orderId, nextStatus) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;
  
  order.status = nextStatus;
  order.timeline[nextStatus] = new Date().toISOString();
  
  // Custom alerts triggers
  if (nextStatus === 'ready') {
    AlertRouter.notify(
      "Print order ready!",
      `Your print file "${order.fileName}" is processed and ready at library desk A!`
    );
  }
  
  if (nextStatus === 'collected') {
    // Scheduled deletion timestamp trigger (in 48h)
    const deletionTime = new Date();
    deletionTime.setHours(deletionTime.getHours() + 48);
    order.timeline.deletedFromCloud = deletionTime.toISOString();
    
    AlertRouter.log(`Order ${orderId} collected. Cloud file scheduled for purge.`);
  }
  
  saveDatabase();
  renderOperatorQueue();
  renderOperatorStats();
  updateSimulatorCloudCounters();
}

function renderOperatorStats() {
  document.getElementById('statsUpiRevenue').innerText = `₹${state.systemStats.upiRevenue.toFixed(2)}`;
  document.getElementById('statsCreditRedeemed').innerText = `${state.systemStats.creditsRedeemed} pgs`;
  document.getElementById('statsDailyPages').innerText = state.systemStats.dailyPages;
  document.getElementById('statsBwPages').innerText = state.systemStats.bwPages;
  document.getElementById('statsColorPages').innerText = state.systemStats.colorPages;
  
  // Ledger Container
  const container = document.getElementById('operatorLedgerContainer');
  if (state.ledger.length === 0) {
    container.innerHTML = `<p style="text-align: center; font-size: 12px; color: var(--text-muted); padding: 12px;">No credit transactions</p>`;
    return;
  }
  
  // Sort ledger transactions (newest first)
  const sortedLedger = [...state.ledger].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  container.innerHTML = sortedLedger.map(txn => {
    if (txn.type === 'purchase') {
      return `
        <div class="ledger-item" style="border-left: 3px solid var(--color-student);">
          <div>
            <strong>${txn.studentEmail.split('@')[0]}</strong> purchased pack
            <div style="font-size: 10px; color: var(--text-muted);">${new Date(txn.timestamp).toLocaleString()}</div>
          </div>
          <span style="color: var(--color-student); font-weight: 700;">+${txn.pages} pgs (₹${txn.amount})</span>
        </div>
      `;
    } else {
      return `
        <div class="ledger-item" style="border-left: 3px solid var(--color-operator);">
          <div>
            <strong>${txn.studentEmail.split('@')[0]}</strong> printed #${txn.orderId}
            <div style="font-size: 10px; color: var(--text-muted);">${new Date(txn.timestamp).toLocaleString()}</div>
          </div>
          <span style="color: var(--text-muted); font-weight: 700;">-${txn.pages} pgs</span>
        </div>
      `;
    }
  }).join('');
}

// --- Deletion Cron Job & Simulators panel dashboard ---

function toggleSimulator() {
  const panel = document.getElementById('simulatorPanel');
  const btn = document.getElementById('btnOpenSim');
  if (panel.style.display === 'none' || panel.style.display === '') {
    panel.style.display = 'flex';
    btn.innerText = 'Hide Simulator';
  } else {
    panel.style.display = 'none';
    btn.innerText = 'Simulate Systems';
  }
}

function updateSimulatorCloudCounters() {
  // Count how many files are active in our mock cloud storage (orders that haven't been deleted yet)
  const activeCloudCount = state.orders.filter(
    o => o.fileUrl && (!o.timeline.deletedFromCloud || new Date(o.timeline.deletedFromCloud) > new Date())
  ).length + (currentUploadedFile ? 1 : 0);
  
  document.getElementById('simulatorActiveFilesCount').innerText = activeCloudCount;
}

// 48-Hour Cloud File Deletion Job simulation
function simulateCloudCronJob() {
  const statusBadge = document.getElementById('cronJobStatusBadge');
  const resultText = document.getElementById('cronJobResultText');
  
  statusBadge.innerText = 'Scanning...';
  statusBadge.className = 'badge badge-pending';
  
  setTimeout(() => {
    const now = new Date();
    let deletedCount = 0;
    
    state.orders.forEach(order => {
      // If collected and deletion timestamp is reached/exceeded (or we force-delete completed ones)
      if (order.status === 'collected' && order.fileUrl) {
        // For demonstration purposes: we simulate immediate deletion of files of collected orders
        // to show the job works. In real scenario, it checks 48 hours.
        order.fileUrl = null; // delete file payload reference
        deletedCount++;
        AlertRouter.log(`CRON CLOUD PURGE: Deleted file for collected Order ${order.id} (privacy window expired).`);
      }
    });
    
    saveDatabase();
    
    statusBadge.innerText = 'Active';
    statusBadge.className = 'badge badge-success';
    
    if (deletedCount > 0) {
      resultText.innerHTML = `Purged <strong>${deletedCount} file(s)</strong> of collected prints from Firebase bucket.`;
    } else {
      resultText.innerText = "Scan finished: No collected files exceeded 48-hour privacy limit.";
    }
    
    updateSimulatorCloudCounters();
    
    // Refresh student timelines if they are active
    const activeTracker = document.getElementById('studentTrackerScreen');
    if (activeTracker.style.display === 'block') {
      const titleText = document.getElementById('trackOrderTitle').innerText;
      const orderId = titleText.replace('Order #', '');
      const currentTrackerOrder = state.orders.find(o => o.id === orderId);
      if (currentTrackerOrder) {
        updateTrackerTimelineUI(currentTrackerOrder);
      }
    }
  }, 1000);
}

// --- Initialize App components on page load ---

window.addEventListener('DOMContentLoaded', () => {
  loadDatabase();
  handleViewportChange();
  window.addEventListener('resize', handleViewportChange);
  
  // Set initial login fields state
  if (state.activeUser) {
    document.getElementById('studentAuthScreen').style.display = 'none';
    goToHomeScreen();
  }
  
  if (state.operatorSession) {
    document.getElementById('operatorAuthScreen').style.display = 'none';
    document.getElementById('operatorDashboardScreen').style.display = 'block';
    renderOperatorQueue();
    renderOperatorStats();
  }
  
  updateSimulatorCloudCounters();
  
  // Request notifications permission (gracefully falls back)
  if ('Notification' in window) {
    Notification.requestPermission();
  }
});
