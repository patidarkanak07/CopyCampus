import React, { useState } from 'react';
import { 
  Settings, 
  Coins, 
  Store, 
  CreditCard, 
  BellRing, 
  Lock, 
  LogOut, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function SettingsView({ operator, onUpdateOperator, onLogout, addToast }) {
  const [shopName, setShopName] = useState(operator?.shop_name || '');
  const [broadcastMessage, setBroadcastMessage] = useState(operator?.broadcast_message || '');

  const handleSaveBroadcast = async () => {
    const updates = { broadcast_message: broadcastMessage };
    const { data, error } = await supabase.operators.update(updates);
    if (!error) {
      onUpdateOperator(updates);
      addToast('Broadcast announcement posted to all students! 📢', 'success');
    }
  };

  const handleClearBroadcast = async () => {
    const updates = { broadcast_message: '' };
    const { data, error } = await supabase.operators.update(updates);
    if (!error) {
      setBroadcastMessage('');
      onUpdateOperator(updates);
      addToast('Broadcast announcement cleared.', 'warning');
    }
  };
  const [upiId, setUpiId] = useState(operator?.upi_id || '');
  const [razorpayEnabled, setRazorpayEnabled] = useState(operator?.razorpay_enabled || false);
  const [razorpayKeyId, setRazorpayKeyId] = useState(operator?.razorpay_key_id || '');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState(operator?.razorpay_key_secret || '');
  const [openFrom, setOpenFrom] = useState(operator?.open_hours_from || '09:00');
  const [openTo, setOpenTo] = useState(operator?.open_hours_to || '18:00');
  const [openDays, setOpenDays] = useState(operator?.open_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [maxQueue, setMaxQueue] = useState(operator?.max_queue || 20);
  const [autoAccept, setAutoAccept] = useState(operator?.auto_accept || false);
  const [closedMode, setClosedMode] = useState(operator?.closed_mode || false);

  // Pricing
  const [priceBw, setPriceBw] = useState(operator?.price_bw || 2);
  const [priceColor, setPriceColor] = useState(operator?.price_color || 7);
  const [priceA3, setPriceA3] = useState(operator?.price_a3_surcharge || 3);
  const [priceBinding, setPriceBinding] = useState(operator?.price_binding || 20);
  const [priceStapling, setPriceStapling] = useState(operator?.price_stapling || 5);
  const [priceUrgent, setPriceUrgent] = useState(operator?.price_urgent || 10);

  // Notifications
  const [notifySms, setNotifySms] = useState(operator?.notify_sms || true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(operator?.notify_whatsapp || true);
  const [notifyEmail, setNotifyEmail] = useState(operator?.notify_email || false);

  // Password mockup state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const daysList = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Handle saving pricing
  const handleSavePricing = async () => {
    const updates = {
      price_bw: Number(priceBw),
      price_color: Number(priceColor),
      price_a3_surcharge: Number(priceA3),
      price_binding: Number(priceBinding),
      price_stapling: Number(priceStapling),
      price_urgent: Number(priceUrgent)
    };

    const { data, error } = await supabase.operators.update(updates);
    if (!error) {
      onUpdateOperator(updates);
      addToast('Pricing variables updated successfully! 🪙', 'success');
    }
  };

  // Handle saving shop configurations
  const handleSaveShop = async () => {
    const updates = {
      shop_name: shopName,
      open_hours_from: openFrom,
      open_hours_to: openTo,
      open_days: openDays,
      max_queue: Number(maxQueue),
      auto_accept: autoAccept,
      closed_mode: closedMode
    };

    const { data, error } = await supabase.operators.update(updates);
    if (!error) {
      onUpdateOperator(updates);
      addToast('Shop configuration saved! 🏠', 'success');
    }
  };

  // Handle toggling open day
  const handleToggleDay = (day) => {
    if (openDays.includes(day)) {
      setOpenDays(openDays.filter(d => d !== day));
    } else {
      setOpenDays([...openDays, day]);
    }
  };

  // Handle saving Payment Gateway & UPI settings
  const handleSavePaymentSettings = async () => {
    if (!upiId.trim()) return;
    const updates = { 
      upi_id: upiId,
      razorpay_enabled: razorpayEnabled,
      razorpay_key_id: razorpayKeyId,
      razorpay_key_secret: razorpayKeySecret
    };
    const { data, error } = await supabase.operators.update(updates);
    if (!error) {
      onUpdateOperator(updates);
      addToast('Payment gateway and payout configurations updated successfully! 💳', 'success');
    }
  };

  // Handle saving notifications preferences
  const handleSaveNotifications = async () => {
    const updates = {
      notify_sms: notifySms,
      notify_whatsapp: notifyWhatsapp,
      notify_email: notifyEmail
    };
    const { data, error } = await supabase.operators.update(updates);
    if (!error) {
      onUpdateOperator(updates);
      addToast('Communication preferences updated.', 'success');
    }
  };

  // Change password submit
  const handleChangePasswordSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    addToast('Operator console password updated.', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Terminal Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configure print pricing catalogs, holiday closed modes, UPI details, and communication alert channels.</p>
      </div>

      {/* Main Form sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Pricing Settings */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-4">
              <Coins className="w-4.5 h-4.5 text-brand" /> Pricing Settings (INR)
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">B&W per page (A4)</label>
                <input
                  type="number"
                  value={priceBw}
                  onChange={(e) => setPriceBw(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand"
                />
              </div>
              
              <div>
                <label className="text-slate-400 font-bold block mb-1">Color per page (A4)</label>
                <input
                  type="number"
                  value={priceColor}
                  onChange={(e) => setPriceColor(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">A3 Surcharge</label>
                <input
                  type="number"
                  value={priceA3}
                  onChange={(e) => setPriceA3(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Spiral Binding Rate</label>
                <input
                  type="number"
                  value={priceBinding}
                  onChange={(e) => setPriceBinding(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Stapling Rate</label>
                <input
                  type="number"
                  value={priceStapling}
                  onChange={(e) => setPriceStapling(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Urgent Surcharge</label>
                <input
                  type="number"
                  value={priceUrgent}
                  onChange={(e) => setPriceUrgent(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSavePricing}
            className="mt-6 w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            Save Pricing Catalog
          </button>
        </div>

        {/* Card 2: Shop Operating Config */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-4">
              <Store className="w-4.5 h-4.5 text-brand" /> Shop Operating config
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Shop Name / Display title</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Opening Hours (Start)</label>
                  <input
                    type="time"
                    value={openFrom}
                    onChange={(e) => setOpenFrom(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Closing Hours (End)</label>
                  <input
                    type="time"
                    value={openTo}
                    onChange={(e) => setOpenTo(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand bg-white"
                  />
                </div>
              </div>

              {/* Max queue limit */}
              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="text-slate-400 font-bold block mb-0.5">Max Print Queue Limit</label>
                  <span className="text-[10px] text-slate-400">Restricts student uploads if exceeded</span>
                </div>
                <input
                  type="number"
                  value={maxQueue}
                  onChange={(e) => setMaxQueue(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand"
                />
              </div>

              {/* Weekdays open checkboxes */}
              <div>
                <label className="text-slate-400 font-bold block mb-1.5">Open Days</label>
                <div className="flex flex-wrap gap-2">
                  {daysList.map(d => {
                    const isChecked = openDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleToggleDay(d)}
                        className={`px-2.5 py-1 rounded border text-[10px] font-bold transition-all ${
                          isChecked 
                            ? 'bg-brand/10 border-brand text-brand' 
                            : 'border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoAccept}
                    onChange={(e) => setAutoAccept(e.target.checked)}
                    className="rounded border-slate-200 accent-brand w-4.5 h-4.5"
                  />
                  <div>
                    <span className="font-bold text-slate-700 block">Auto-Accept Print Jobs</span>
                    <span className="text-[10px] text-slate-400 block">Skips manual review, forwards directly to printers</span>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg bg-rose-50/20 border border-rose-100/50">
                  <input
                    type="checkbox"
                    checked={closedMode}
                    onChange={(e) => setClosedMode(e.target.checked)}
                    className="rounded border-slate-200 accent-rose-600 w-4.5 h-4.5 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-rose-700 block">Holiday / Closed Mode Toggle</span>
                    <span className="text-[10px] text-rose-500 block leading-normal">
                      Students will see a "Shop Closed Today" banner and cannot place orders. Operators can still view log.
                    </span>
                  </div>
                </label>
              </div>

            </div>
          </div>

          <button
            onClick={handleSaveShop}
            className="mt-6 w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            Save Shop Settings
          </button>
        </div>

        {/* Card 3: Payment Gateway & Payout Settings */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-4">
              <CreditCard className="w-4.5 h-4.5 text-brand" /> Payment Configurations
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Operator Merchant UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand font-semibold text-slate-700"
                  placeholder="e.g. name@upi"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Used for manual withdrawal routing and UPI backup.</span>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={razorpayEnabled}
                    onChange={(e) => setRazorpayEnabled(e.target.checked)}
                    className="rounded border-slate-200 accent-brand w-4.5 h-4.5"
                  />
                  <div>
                    <span className="font-bold text-slate-700 block">Enable Razorpay Checkout</span>
                    <span className="text-[10px] text-slate-400 block">Route student payments via Razorpay Gateway</span>
                  </div>
                </label>

                {razorpayEnabled && (
                  <div className="space-y-3 pl-7 animate-fade-in">
                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Razorpay Key ID</label>
                      <input
                        type="text"
                        value={razorpayKeyId}
                        onChange={(e) => setRazorpayKeyId(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand font-semibold text-slate-700"
                        placeholder="rzp_test_xxxxxxxx"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Razorpay Key Secret</label>
                      <input
                        type="password"
                        value={razorpayKeySecret}
                        onChange={(e) => setRazorpayKeySecret(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand font-semibold text-slate-700"
                        placeholder="••••••••••••••••"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleSavePaymentSettings}
            className="mt-6 w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            Save Payment Details
          </button>
        </div>

        {/* Card 4: Notification Alerts Preferences */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-4">
              <BellRing className="w-4.5 h-4.5 text-brand" /> Communication Preferences
            </h3>

            <div className="space-y-4 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifySms}
                  onChange={(e) => setNotifySms(e.target.checked)}
                  className="rounded border-slate-200 accent-brand w-4.5 h-4.5"
                />
                <div>
                  <span className="font-bold text-slate-700 block">SMS Alerts</span>
                  <span className="text-[10px] text-slate-400 block">Send Twilio text message on incoming print queues</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyWhatsapp}
                  onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                  className="rounded border-slate-200 accent-brand w-4.5 h-4.5"
                />
                <div>
                  <span className="font-bold text-slate-700 block">Daily WhatsApp Summary</span>
                  <span className="text-[10px] text-slate-400 block">Automated summary notification template at 8:00 PM</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="rounded border-slate-200 accent-brand w-4.5 h-4.5"
                />
                <div>
                  <span className="font-bold text-slate-700 block">Weekly Email Digest</span>
                  <span className="text-[10px] text-slate-400 block">Detailed CSV earnings spreadsheet digest sent weekly</span>
                </div>
              </label>
            </div>
          </div>

          <button
            onClick={handleSaveNotifications}
            className="mt-6 w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            Update Notification Toggles
          </button>
        </div>

        {/* Operator Broadcast Announcement Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between md:col-span-2">
          <div>
            <h3 className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-4">
              <Store className="w-4.5 h-4.5 text-brand" /> Operator Broadcast Announcement
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Status / Announcement Message to Students</label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g. Sorry, I am not available tomorrow. I cannot print printouts tomorrow. Apologies for the inconvenience!"
                  rows="3"
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand text-xs font-semibold text-slate-700"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Leave empty to clear announcement. This message will be shown prominently to all students on their home terminals.</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSaveBroadcast}
              className="flex-1 py-2 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              Post Announcement
            </button>
            {operator?.broadcast_message && (
              <button
                onClick={handleClearBroadcast}
                className="py-2 px-4 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Account Settings Row: Password Change & Logout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
        
        {/* Change password form */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-4">
            <Lock className="w-4.5 h-4.5 text-brand" /> Change Operator Password
          </h3>

          <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Lock Console Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between border-rose-100/55 bg-rose-50/5">
          <div>
            <h3 className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-4">
              <LogOut className="w-4.5 h-4.5 text-rose-500" /> Operator Console Session
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed mt-2">
              Logging out ends your active shift terminal session. All live queue subscriptions will be disconnected until your next login.
            </p>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all mt-8"
          >
            <LogOut className="w-4 h-4" /> End Shift & Logout
          </button>
        </div>

      </div>

    </div>
  );
}
