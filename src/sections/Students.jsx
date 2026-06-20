import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  IndianRupee, 
  History, 
  AlertOctagon, 
  UserMinus, 
  UserPlus, 
  Check,
  ClipboardList
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Students({ students, orders, onUpdateStudent, onAddTransaction, addToast }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  // Stats calculators
  const totalRegistered = students.length;
  const uniquePaying = new Set(orders.map(o => o.student_id)).size;
  const totalCashCollected = orders.reduce((sum, o) => sum + (o.credits_used || 0), 0);

  // Filter students
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.roll_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (id) => {
    if (expandedStudentId === id) {
      setExpandedStudentId(null);
    } else {
      setExpandedStudentId(id);
    }
  };

  // Get student specific orders
  const getStudentOrders = (studentId) => {
    return orders
      .filter(o => o.student_id === studentId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };



  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Student Directory</h1>
        <p className="text-slate-500 text-sm mt-1">Lookup student printing statistics and check order account history.</p>
      </div>

      {/* Directory Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Registered Users</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">{totalRegistered}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Paying Customers</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">{uniquePaying}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Cash Collected</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">₹{totalCashCollected}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and search */}
      <div className="relative max-w-md">
        <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search by student name or Roll Number (e.g. CS23)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand bg-white text-sm"
        />
      </div>

      {/* Directory Grid */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <span className="text-slate-400 font-medium block">No students found!</span>
            <span className="text-xs text-slate-400">Search matching query not found.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredStudents.map((student) => {
              const isExpanded = expandedStudentId === student.id;
              const studentOrders = getStudentOrders(student.id);
              const initials = student.name.split(' ').map(n => n[0]).join('').toUpperCase();

              return (
                <div key={student.id} className="transition-all">
                  
                  {/* Row Header */}
                  <div 
                    onClick={() => toggleExpand(student.id)}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/30 select-none"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-xs shrink-0">
                        {initials}
                      </div>
                      
                      <div>
                        <span className="text-sm font-bold text-slate-700 block">{student.name}</span>
                        <span className="text-xs text-slate-400">Roll: {student.roll_no} · {student.branch}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 text-xs">
                      {/* Orders Count */}
                      <div className="text-center md:text-left">
                        <span className="text-slate-400 block font-medium">Orders Placed</span>
                        <span className="font-extrabold text-slate-700">{studentOrders.length} orders</span>
                      </div>

                      {/* Toggle Expand Icon */}
                      <button className="text-slate-400 hover:text-slate-600">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-3 border-t border-slate-100 bg-slate-50/20 grid grid-cols-1 gap-6 animate-fade-in text-xs">
                      
                      {/* Column 1: Order History */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-2">
                          <History className="w-3.5 h-3.5" /> Order History
                        </span>

                        {studentOrders.length === 0 ? (
                          <div className="p-4 bg-white border border-slate-100 rounded-xl text-center text-slate-400 text-[10px] max-w-md">
                            No orders placed yet.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 max-w-2xl">
                            {studentOrders.map(o => (
                              <div key={o.id} className="p-2.5 bg-white border border-slate-100 rounded-xl flex justify-between items-center">
                                <div>
                                  <span className="font-bold text-slate-700 block">Order #{o.id}</span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    {o.pages} pages · {o.type} {o.size}
                                  </span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  o.status === 'Done' ? 'bg-slate-100 text-slate-600' : 'bg-brand/10 text-brand'
                                }`}>
                                  {o.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
