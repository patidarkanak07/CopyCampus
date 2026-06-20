# 📄 CopyCampus — Campus Print Portal

> A smart, modern print-ordering web app built for college students and operators.

🌐 **Live Site:** [https://patidarkanak07.github.io/CopyCampus/](https://patidarkanak07.github.io/CopyCampus/)

---

## ✨ Features

### For Students
- 📤 **Upload PDFs only** — strict PDF-only enforcement with auto page count detection
- 📑 **Custom Page Range** — print all pages or select a specific range (e.g., pages 20–30)
- 🎨 **Paper Type Selection** — Normal (₹2/pg), Bond (₹5/pg), Glossy (₹50/pg)
- 🖨️ **Color & Side Options** — B&W or Color, Single or Double-Sided
- 📍 **Pick-up Locations** — Front Gate, Back Gate, Block 1/2/3, Basketball Court, Sports Complex, Library, Reception
- ⏰ **Lunch Slot Collection** — choose your pickup time during the lunch break (1:00 PM – 1:50 PM)
- 💳 **UPI Payment** — direct payment via UPI QR code, no credits or wallets
- 🔔 **Notifications Tab** — real-time alerts when your order status changes
- 💬 **Help Desk Chat** — message the operator directly
- 📋 **Order Tracker** — live progress bar from Ordered → Accepted → Printing → Ready → Delivered
- ⚠️ **Disclaimer** — persistent non-refundable disclaimer on every order

### For Operators
- 📊 **Dashboard** — see all incoming orders with full print specs (sides, paper, range, location, slot, finishing)
- 🔄 **Status Updates** — accept, print, dispatch, and complete orders
- 📢 **Broadcast Message** — send announcements to all students (e.g., "I'm absent today")
- 💰 **Revenue Tracking** — total earnings, UPI withdrawals, pending amounts
- 👥 **User Management** — view registered users, credit purchases, and usage stats
- 🎛️ **Pricing Control** — adjust per-page prices, color surcharges, finishing costs
- 💬 **Individual Messaging** — chat with each student separately

---

## ⏰ Order Hours
- Orders accepted: **7:00 AM – 9:00 PM**
- Collection: **Lunch break (1:00 PM – 1:50 PM)**
- Printouts delivered: **next day in college**

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Storage | LocalStorage (mock DB) |
| Deployment | GitHub Pages |

---

## 🚀 Run Locally

```bash
git clone https://github.com/patidarkanak07/CopyCampus.git
cd CopyCampus
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📦 Build & Deploy

```bash
npm run build
npm run deploy
```

---

Made with ❤️ for campus life.
