import React, { useState } from 'react';
import { 
  IndianRupee, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download, 
  Wallet,
  Sparkles,
  QrCode,
  Users,
  Plus,
  Receipt
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Earnings({ 
  transactions, 
  students, 
  operator, 
  onAddTransaction, 
  onUpdateOperator,
  addToast 
}) {
  const [dateFilter, setDateFilter] = useState('Month');
  
  // Withdrawal States
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawUpi, setWithdrawUpi] = useState(operator?.upi_id || '');

  const handleOpenWithdrawal = () => {
    setWithdrawUpi(operator?.upi_id || '');
    setWithdrawModalOpen(true);
  };

  // 1. Calculate stats
  const totalEarnedAllTime = transactions
    .filter(t => t.type === 'Credit')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalWithdrawn = transactions
    .filter(t => t.type === 'Debit')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Operator wallet available balance
  const pendingPayoutBalance = totalEarnedAllTime - totalWithdrawn;

  // This month's operator earnings
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);
  const thisMonthEarnings = transactions
    .filter(t => t.type === 'Credit' && new Date(t.created_at) >= thisMonthStart)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // 2. Transaction Filter Logic
  const filteredTransactions = transactions.filter(t => {
    const tDate = new Date(t.created_at);
    const today = new Date();

    if (dateFilter === 'Today') {
      return tDate.toDateString() === today.toDateString();
    } else if (dateFilter === 'Week') {
      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return tDate >= oneWeekAgo;
    } else if (dateFilter === 'Month') {
      const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      return tDate >= oneMonthAgo;
    }
    return true;
  });

  // Helper for Student names
  const getStudentInfo = (studentId) => {
    const s = students.find(item => item.id === studentId);
    return s || { id: studentId, name: 'Walk-in Student', roll_no: 'N/A' };
  };

  // Withdraw request submission
  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);

    if (isNaN(amount) || amount <= 0 || amount > pendingPayoutBalance) return;
    if (!withdrawUpi.trim()) {
      alert('Please enter a valid UPI ID.');
      return;
    }

    // Save updated UPI ID if it has changed
    if (withdrawUpi !== operator?.upi_id) {
      const { error: opErr } = await supabase.operators.update({ upi_id: withdrawUpi });
      if (!opErr && onUpdateOperator) {
        onUpdateOperator({ upi_id: withdrawUpi });
      }
    }

    const { error } = await supabase.transactions.insert({
      operator_id: 'op-1',
      order_id: null,
      type: 'Debit',
      amount: amount,
      note: `Payout: Withdrawn to UPI (${withdrawUpi})`
    });

    if (!error) {
      onAddTransaction({
        order_id: null,
        type: 'Debit',
        amount: amount,
        note: `Payout: Withdrawn to UPI (${withdrawUpi})`
      });
      addToast(`Payout of ₹${amount} initiated to ${withdrawUpi}! 💰`, 'success');
      setWithdrawAmount('');
      setWithdrawModalOpen(false);
    }
  };

  // Handle export CSV
  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Transaction ID', 'Type', 'Amount (INR)', 'Description'];
    const rows = filteredTransactions.map(t => [
      new Date(t.created_at).toLocaleString(),
      t.id,
      t.type,
      t.amount,
      t.note
    ]);
    const filename = `CopyCampus_Ledger_${new Date().toISOString().split('T')[0]}.csv`;

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Ledger downloaded.', 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Earnings & Accounts</h1>
          <p className="text-slate-500 text-sm mt-1">Track processed student payments and request payouts.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 bg-white transition-all shadow-sm"
          >
            <Download className="w-4 h-4" /> Export (.CSV)
          </button>
        </div>
      </div>

      {/* Grid: Left metrics panel, Right ledger table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Wallet statistics */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Operator Balance Box */}
          <div className="bg-brand text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 opacity-10">
              <IndianRupee className="w-40 h-40" />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <span className="text-white/80 text-xs font-semibold uppercase tracking-wider block">Available Payout balance</span>
                <span className="text-4xl font-extrabold block mt-2">₹{pendingPayoutBalance}</span>
              </div>

              <div className="mt-8 space-y-3">
                <button
                  onClick={handleOpenWithdrawal}
                  disabled={pendingPayoutBalance <= 0}
                  className="w-full py-3 bg-white text-brand hover:bg-slate-50 disabled:bg-white/50 disabled:text-brand/50 disabled:cursor-not-allowed rounded-xl font-bold text-sm shadow-sm transition-all"
                >
                  Withdraw to UPI
                </button>
                <div className="flex items-center justify-center gap-1.5 text-xs text-white/85">
                  <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                  <span>Linked UPI ID: <span className="font-bold underline">{operator?.upi_id}</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">This Month</span>
                <span className="text-xl font-extrabold text-slate-800 block mt-1">₹{thisMonthEarnings}</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded self-start mt-2">Active Cycle</span>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">All Time</span>
                <span className="text-xl font-extrabold text-slate-800 block mt-1">₹{totalEarnedAllTime}</span>
              </div>
              <span className="text-[10px] text-brand font-bold bg-brand/5 px-2 py-0.5 rounded self-start mt-2">Processed</span>
            </div>
          </div>

        </div>

        {/* Right Side: Tabbed Ledger logs */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            {/* Header / Filter bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-700">Transaction Ledger</span>

              {/* Time Filters */}
              <div className="flex items-center gap-1.5">
                {['Today', 'Week', 'Month'].map(f => (
                  <button
                    key={f}
                    onClick={() => setDateFilter(f)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all border ${
                      dateFilter === f
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Transaction Ledger List */}
            <div className="space-y-1">
              {filteredTransactions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No records.</div>
              ) : (
                filteredTransactions.map(tx => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-xl transition-colors text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg border ${
                        tx.type === 'Credit' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'
                      }`}>
                        {tx.type === 'Credit' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 block">{tx.note}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{new Date(tx.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <span className={`font-extrabold ${tx.type === 'Credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'Credit' ? '+' : '-'}₹{tx.amount}
                    </span>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Payout Modal */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-100 shadow-xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                <Wallet className="w-5 h-5 text-brand" /> Withdraw Payout
              </h3>
              <button onClick={() => setWithdrawModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleWithdrawalSubmit} className="mt-4 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-purple-50 text-brand flex items-center gap-3 border border-purple-100">
                <QrCode className="w-10 h-10 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">Available Balance</span>
                  <span className="text-xl font-black">₹{pendingPayoutBalance}</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-500 uppercase tracking-wide block mb-1">UPI ID</label>
                <input
                  type="text"
                  required
                  value={withdrawUpi}
                  onChange={(e) => setWithdrawUpi(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-brand font-semibold text-slate-700 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-500 uppercase tracking-wide block mb-1">Amount (INR)</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  max={pendingPayoutBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 font-bold hover:bg-slate-50 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand text-white hover:bg-brand-dark rounded-xl font-bold shadow-sm text-xs"
                >
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
