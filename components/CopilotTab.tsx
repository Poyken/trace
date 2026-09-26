'use client';

import React, { useState } from 'react';
import { Send, Bot, User, Copy, Check, Sparkles, AlertCircle, Wrench, ShieldCheck, ArrowRight } from 'lucide-react';
import { ChatMessage } from '@/lib/types';

interface CopilotTabProps {
  onNavigateToDiagnostics?: (type: string, target: string) => void;
}

export default function CopilotTab({ onNavigateToDiagnostics }: CopilotTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: `Xin chào anh **Đức (Kỹ sư IT - EA Team)**!

Tôi là **Vinatech MES Operations Copilot**. Tôi đã được trang bị đầy đủ tri thức về 95 màn hình WinForm, Stored Procedures, và 5 CSDL nghiệp vụ.

Mọi phân tích lỗi tại đây đều tuân thủ nghiêm ngặt **Quy chuẩn 4 Dòng Vàng** và **Rule 20 (EA Playbook)**. Anh có thể nhập mã Lot, tên màn hình, lỗi Kiosk hoặc chọn nhanh các tình huống mẫu bên dưới:`,
      timestamp: new Date().toLocaleTimeString('vi-VN')
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const samplePrompts = [
    { label: 'Lỗi B530 Already completed', text: 'Lot VVQR232R710618 bị lỗi Already completed in MES trên B530' },
    { label: 'Kẹt máy Kiosk VVMHY130', text: 'Thiết bị VVMHY130 bị treo khóa ACTIVE trên Kiosk POP' },
    { label: 'Kiểm tra quyền 92603003', text: 'Kiểm tra tài khoản và phân quyền nhân viên 92603003 trên 5 CSDL' },
    { label: 'Lỗi in tem PackingID', text: 'Thùng carton PKQR2501480 bị khóa in tem IsPrintAllow = 0' }
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('vi-VN')
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString('vi-VN'),
          structuredResponse: data.structuredResponse,
          quickActions: data.quickActions
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        const errorData = await res.json();
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `⚠️ Lỗi xử lý: ${errorData.error || 'Không thể kết nối API'}`,
            timestamp: new Date().toLocaleTimeString('vi-VN')
          }
        ]);
      }
    } catch (e) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ Lỗi kết nối: ${(e as Error).message}`,
          timestamp: new Date().toLocaleTimeString('vi-VN')
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[750px] bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-colors duration-300">
      {/* Top Banner */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Vinatech MES Operations Copilot
              <span className="text-[10px] bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800 px-2 py-0.5 rounded-full font-mono">
                Standard 4 Dòng Vàng
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Trợ lý AI chuyên trách chẩn đoán sự cố, xuất hướng dẫn OP & Hotfix an toàn</p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40 dark:bg-transparent">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-800 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <Bot className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-sm ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-md'
                  : 'bg-white dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800/90 text-slate-800 dark:text-slate-200 rounded-tl-none space-y-3 shadow-sm'
              }`}
            >
              {msg.role === 'user' ? (
                <div>{msg.content}</div>
              ) : (
                <>
                  {msg.structuredResponse ? (
                    <div className="space-y-3">
                      {/* 4 Dòng Vàng Cards */}
                      <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">
                          <AlertCircle className="w-4 h-4" /> 1. Nguyên Nhân Gốc Rễ (Root Cause)
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">{msg.structuredResponse.rootCause}</p>
                      </div>

                      <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900/60 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wide">
                          <ShieldCheck className="w-4 h-4" /> 2. Hiện Trạng Thực Tế
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">{msg.structuredResponse.currentStatus}</p>
                      </div>

                      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                          <Wrench className="w-4 h-4" /> 3. Hướng Dẫn OP Tự Xử Lý (Workaround)
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">{msg.structuredResponse.workaround}</p>
                      </div>

                      {msg.structuredResponse.hotfixSql && (
                        <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2">
                          <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400 font-semibold">
                            <span>4. SQL Hotfix Chuẩn (BEGIN TRAN...ROLLBACK)</span>
                            <button
                              onClick={() => copyToClipboard(msg.structuredResponse?.hotfixSql || '', msg.id)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-400 rounded-lg transition font-mono text-[11px] border border-slate-200 dark:border-slate-700 shadow-sm"
                            >
                              {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiedId === msg.id ? 'Đã copy' : 'Copy SQL'}
                            </button>
                          </div>
                          <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
                            <code>{msg.structuredResponse.hotfixSql}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  )}

                  {/* Quick Action Buttons */}
                  {msg.quickActions && msg.quickActions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/60">
                      {msg.quickActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (action.actionType === 'copy_sql') {
                              copyToClipboard(action.payload, `action-${idx}`);
                            } else if (onNavigateToDiagnostics) {
                              onNavigateToDiagnostics(action.actionType, action.payload);
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 border border-cyan-200 dark:border-cyan-800/70 text-cyan-800 dark:text-cyan-300 text-xs font-medium transition shadow-sm"
                        >
                          {action.label}
                          <ArrowRight className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
              <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-cyan-100' : 'text-slate-400 dark:text-slate-500'}`}>
                {msg.timestamp}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <User className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-slate-500 dark:text-slate-400 text-xs">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-800 flex items-center justify-center">
              <Bot className="w-4 h-4 text-cyan-700 dark:text-cyan-400 animate-spin" />
            </div>
            <span>Copilot đang chẩn đoán & tra cứu dữ liệu...</span>
          </div>
        )}
      </div>

      {/* Suggested Prompt Pills */}
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto text-xs">
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p.text)}
            className="px-3 py-1 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-800 whitespace-nowrap transition shadow-sm font-medium"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập mã Lot, sự cố B530/B540, máy kẹt, hoặc mã nhân viên..."
            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-cyan-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-xl text-sm transition shadow-lg shadow-cyan-600/20 disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Gửi</span>
          </button>
        </form>
      </div>
    </div>
  );
}
