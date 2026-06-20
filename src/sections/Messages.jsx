import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Messages({ students, messages, onAddMessage, addToast, initialStudentId }) {
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId || 'stud-4');
  const [inputText, setInputText] = useState('');
  const [aiAgentActive, setAiAgentActive] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef(null);

  // Sync initial student parameter
  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
    }
  }, [initialStudentId]);

  // Scroll chat timeline to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedStudentId, isTyping]);

  const activeStudent = students.find(s => s.id === selectedStudentId) || students[0];

  // Filter messages for active student
  const activeMessages = messages.filter(m => m.student_id === selectedStudentId);

  // Send message manually as Operator
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText;
    setInputText('');

    const newMsg = {
      sender: 'operator',
      student_id: selectedStudentId,
      message: textToSend
    };

    // Insert to DB
    const { data, error } = await supabase.messages.insert(newMsg);
    if (!error) {
      onAddMessage(data); // Locally append in App state
    }
  };

  // Simulate a student asking a question (testing purposes)
  const handleSimulateStudentMessage = async (queryText) => {
    const studentMsg = {
      sender: 'student',
      student_id: selectedStudentId,
      message: queryText
    };

    const { data, error } = await supabase.messages.insert(studentMsg);
    if (!error) {
      onAddMessage(data);

      // Trigger AI Agent auto-reply if enabled
      if (aiAgentActive) {
        setIsTyping(true);
        setTimeout(async () => {
          setIsTyping(false);
          
          let responseText = `Hi ${activeStudent.name}! CopyCampus Print Assistant here. I've logged your request. Let me check with our printing desk for updates.`;
          
          const textLower = queryText.toLowerCase();
          if (textLower.includes('margin') || textLower.includes('cut off') || textLower.includes('quality')) {
            responseText = `I see. Bottom margins can get cut off if the PDF canvas size doesn't match the printer's printable area. I have flagged this to Operator Mayank, and he can adjust the settings and trigger a free reprint copy for you!`;
          } else if (textLower.includes('ready') || textLower.includes('delay') || textLower.includes('status')) {
            responseText = `Checking order timeline... Your print order is currently in processing. It will be marked as "Out for Delivery/Ready" once verified by the dispatcher. You will receive a mobile push notification immediately!`;
          } else if (textLower.includes('price') || textLower.includes('credit')) {
            responseText = `A4 Black & White prints are ₹2/page, Color prints are ₹7/page. Payment is done directly via UPI QR code when placing the print order!`;
          }

          const aiMsg = {
            sender: 'operator', // sends as operator terminal
            student_id: selectedStudentId,
            message: `🤖 [AI Assistant]: ${responseText}`
          };

          const { data: aiData, error: aiErr } = await supabase.messages.insert(aiMsg);
          if (!aiErr) {
            onAddMessage(aiData);
          }
        }, 1200); // 1.2s delay for typing feel
      }
    }
  };

  // Student list sidebar helpers
  const getStudentInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Get last message snippet
  const getLastMessage = (studentId) => {
    const studMsgs = messages.filter(m => m.student_id === studentId);
    if (studMsgs.length === 0) return 'No messages yet';
    const last = studMsgs[studMsgs.length - 1];
    return last.message;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Support Desk Messaging</h1>
        <p className="text-slate-500 text-sm mt-1">Chat directly with college students regarding page specifications, quality flags, or delivery coordinate details.</p>
      </div>

      {/* Main chat window split pane */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden h-[540px] flex">
        
        {/* Left Pane: Student lists */}
        <div className="w-80 border-r border-slate-100 flex flex-col shrink-0 bg-slate-50/20">
          <div className="p-4 border-b border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Open Channels</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {students.map((student) => {
              const isSelected = selectedStudentId === student.id;
              const lastMsg = getLastMessage(student.id);
              const initials = getStudentInitials(student.name);

              return (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className={`p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-brand/5 border-l-4 border-brand' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-slate-800 truncate">{student.name}</span>
                      {student.id === 'stud-4' && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Active Issue" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block">{student.roll_no}</span>
                    <p className="text-[10px] text-slate-400 truncate mt-1 leading-normal font-medium">
                      {lastMsg}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Chat workspace */}
        <div className="flex-1 flex flex-col justify-between bg-white relative">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800">{activeStudent?.name || 'Select Student'}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Roll: {activeStudent?.roll_no} · {activeStudent?.branch}</span>
            </div>

            {/* AI Toggle Switch */}
            <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-100 text-xs">
              <Bot className={`w-4 h-4 ${aiAgentActive ? 'text-brand animate-bounce' : 'text-slate-400'}`} />
              <div>
                <span className="font-bold text-slate-700 block">AI Chat Copilot</span>
              </div>
              <button
                type="button"
                onClick={() => setAiAgentActive(!aiAgentActive)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 ${
                  aiAgentActive ? 'bg-brand' : 'bg-slate-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  aiAgentActive ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          {/* AI Active Info Banner */}
          {aiAgentActive && (
            <div className="bg-brand/5 border-b border-brand/10 p-2 text-center text-[10px] text-brand font-semibold flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-600 animate-pulse" />
              <span>AI Support Agent is active. It will auto-respond to student queries immediately.</span>
            </div>
          )}

          {/* Message List area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/20">
            {activeMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
                <span className="text-xs">No conversation history. Send a message to start!</span>
              </div>
            ) : (
              activeMessages.map((msg) => {
                const isOp = msg.sender === 'operator';
                const isAI = msg.message.startsWith('🤖');

                return (
                  <div key={msg.id} className={`flex ${isOp ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl p-3 text-xs leading-normal relative ${
                      isOp 
                        ? isAI
                          ? 'bg-purple-100 text-purple-900 rounded-tr-none border border-purple-200'
                          : 'bg-brand text-white rounded-tr-none' 
                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                    }`}>
                      {/* Message Content */}
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                      
                      {/* Timestamp watermark */}
                      <span className={`text-[8px] block mt-1.5 text-right ${isOp && !isAI ? 'text-white/70' : 'text-slate-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {/* AI Typing Loader Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl p-3 text-xs rounded-tl-none flex items-center gap-1.5 font-semibold">
                  <Bot className="w-3.5 h-3.5 text-brand animate-spin" />
                  <span>AI Agent is drafting a response...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Bottom message form controls & simulation actions */}
          <div className="p-4 border-t border-slate-100 space-y-3 bg-white">
            
            {/* Simulation Query Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Simulate student query:</span>
              <button
                onClick={() => handleSimulateStudentMessage('Is my print ready for delivery?')}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-brand hover:text-brand bg-slate-50 text-[10px] font-semibold text-slate-600 transition-all"
              >
                "Is order ready?"
              </button>
              <button
                onClick={() => handleSimulateStudentMessage('Why is my document print taking so long?')}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-brand hover:text-brand bg-slate-50 text-[10px] font-semibold text-slate-600 transition-all"
              >
                "Why the delay?"
              </button>
              <button
                onClick={() => handleSimulateStudentMessage('Can you tell me about the A4 color pricing?')}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-brand hover:text-brand bg-slate-50 text-[10px] font-semibold text-slate-600 transition-all"
              >
                "Check print pricing"
              </button>
              <button
                onClick={() => handleSimulateStudentMessage('Quality is bad, bottom margin is cut off!')}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-brand hover:text-brand bg-slate-50 text-[10px] font-semibold text-slate-600 transition-all text-rose-600 border-rose-100 hover:bg-rose-50"
              >
                "Report Margin cut off"
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Type a message to ${activeStudent?.name}...`}
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-brand"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl font-bold shadow-sm flex items-center justify-center shrink-0 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>

        </div>

      </div>

    </div>
  );
}
