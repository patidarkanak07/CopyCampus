# CopyCampus 🖨️ — Campus Print-on-Demand Web App

**CopyCampus** is a mobile-first, dual-sided web application designed to streamline campus printing. It provides students with a seamless interface to upload documents, configure print settings, pay via UPI/prepaid credits, and track orders in real-time, while offering campus print shop operators a unified dashboard to manage the printing queue, monitor earnings, and manage paper stock.

---

## 🌟 Key Features

### 👨‍🎓 Student App (Blue Theme)
- **Document Upload & Configure**: Drag-and-drop file uploader (supporting PDF, PNG, JPG, DOCX, and PPTX with simulated PDF auto-conversion) plus direct import from **Google Drive**.
- **Page Preview**: Live visual document previews and page count checks.
- **Print Parameters**: Custom settings for color mode (B&W or Color), layout (single/double-sided), paper size, page ranges, binding options (stapled, spiral, softcover), and campus pickup points.
- **Cost Estimator**: Real-time pricing calculator that updates dynamically as options are configured.
- **Flexible Payments**: Choice of payment via **prepaid Semester Credits packs** (e.g., 500 pages for ₹300) or pay-per-print via **instant UPI QR code scanning and deep-links**.
- **Real-Time Order Tracking**: 5-stage status progress tracking (Uploaded → Queued → Printing → Ready → Collected) with integrated reprint controls.
- **Privacy First**: Explicit upload privacy banner and a comprehensive privacy page detailing document encryption and automatic 48-hour deletion.

### 👩‍🔧 Operator Dashboard (Teal Theme)
- **Live Print Queue**: Incoming print orders sorted by submission timestamp with print specifications, payment status, and page counts.
- **One-Tap Status Updates**: Direct progression buttons (Start Print, Mark Ready, Handed Over) that update student timelines.
- **System Notification Console**: Simulated Twilio SMS alerts and FCM push notifications.
- **Prepaid Ledger**: Real-time log of student page credits purchases and deductions.
- **Earning Summaries**: Real-time accounting split by UPI cash revenue and page credits redeemed.
- **Inventory Stock Planner**: Track processed page counts and B&W vs. Color stock requirements.

---

## 🎨 Visual Style & Design System
- **Modern Flat UI**: A clean, spacious interface utilizing Google's *Plus Jakarta Sans* font, flat card blocks, and solid border lines without heavy shadows or gradients.
- **Two-Color System**: A distinct color separation scheme where **Blue (`#2563EB`)** is used for student actions and **Teal (`#0D9488`)** is used for operator dashboard features.
- **Responsive Presentation**: On desktop, the page renders a side-by-side view (a simulated mobile phone frame for the Student App and a full-size workspace for the Operator Terminal). On mobile viewports, the app shifts into tabs for clean viewing.

---

## 🛠️ Stack & Cloud Configuration
- **Frontend**: Vanilla HTML5, CSS3 (CSS Variables layout), and ES6 JavaScript.
- **Cloud Storage (Boilerplate)**: Production configuration template for uploading directly to **Firebase Storage** (via standard resumable upload tasks) and initializing the **Google Drive Picker API**.
- **Auto-Deletion Cron Job**: Serverless **Firebase Cloud Function** template that runs hourly to delete document binaries from Firebase Storage 48 hours after they are collected, ensuring absolute student privacy.
