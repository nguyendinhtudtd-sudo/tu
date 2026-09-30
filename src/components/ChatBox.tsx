import React, { useState, useRef, useEffect } from 'react';
import { askChatbot } from '../services/n8nApi';
import {
  Send,
  X,
  RotateCcw,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
}

// 3 câu hỏi nhanh dạng compact chips theo yêu cầu lãnh đạo
const QUICK_SUGGESTIONS = [
  'Đơn vị nào còn nhiều nhiệm vụ chưa hoàn thành nhất?',
  'Những nhiệm vụ nào đang chậm tiến độ hoặc cần lãnh đạo chú ý?',
  'Tiến độ thực hiện các nhiệm vụ trong kỳ giao ban hiện tại thế nào?',
];

// Lời chào mở đầu dành cho Tổng Giám đốc
const INITIAL_GREETING =
  'Xin chào Tổng giám đốc Nguyễn Anh Tuấn. Anh có thể hỏi về tiến độ, phòng ban, lãnh đạo chỉ đạo, nhiệm vụ chưa hoàn thành hoặc lịch sử cập nhật.';

/**
 * Render text có hỗ trợ markdown đơn giản (**in đậm**, bullet points) an toàn không cần thư viện ngoài
 */
function FormattedMessageContent({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-1">
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ');
        const displayLine = isBullet ? trimmed.replace(/^[-*•]\s+/, '') : line;

        // Parse cú pháp **in đậm**
        const parts = displayLine.split(/(\*\*[^*]+\*\*)/g);
        const formattedParts = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-semibold text-slate-900">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={lIdx} className="flex items-start gap-1.5 ml-1 my-0.5">
              <span className="text-blue-500 font-bold select-none leading-relaxed">•</span>
              <span className="flex-1 leading-relaxed">{formattedParts}</span>
            </div>
          );
        }

        return (
          <div key={lIdx} className="min-h-[1.2rem] leading-relaxed">
            {formattedParts.length > 0 ? formattedParts : '\u00A0'}
          </div>
        );
      })}
    </div>
  );
}

export const ChatBox: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'init-msg',
        sender: 'assistant',
        content: INITIAL_GREETING,
        timestamp: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Tự động focus vào ô nhập khi mở chat trên desktop
      if (window.innerWidth >= 640) {
        setTimeout(() => textareaRef.current?.focus(), 150);
      }
    }
  }, [isOpen, messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend !== undefined ? textToSend : input).trim();
    if (!messageText || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: messageText,
      timestamp: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLastFailedMessage(null);
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // Gửi theo đúng format n8n Webhook: { message, sessionId: "tgd-web" }
      const answer = await askChatbot(messageText, 'tgd-web');

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        content: answer,
        timestamp: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setLastFailedMessage(messageText);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content: 'Không thể kết nối trợ lý. Vui lòng thử lại.',
        timestamp: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 76)}px`;
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'assistant',
        content: INITIAL_GREETING,
        timestamp: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);
    setLastFailedMessage(null);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 print:hidden font-sans select-text">
      {/* 1. Nút mở Chatbox khi đang đóng */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 rounded-full shadow-lg hover:shadow-xl border border-slate-200/90 transition-all duration-200 cursor-pointer group active:scale-95"
          title="Mở Trợ lý điều hành VNPD"
          aria-label="Mở Chatbox Trợ lý điều hành VNPD"
        >
          {/* Logo EVNDevelopment gọn gàng */}
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center p-1 border border-slate-200 overflow-hidden shadow-2xs shrink-0">
            <img src="/logo.png" alt="EVNDevelopment" className="w-full h-full object-contain" />
          </div>

          <div className="flex flex-col text-left pr-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-blue-700 leading-tight whitespace-nowrap">
                Trợ lý VNPD
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium leading-tight">
              Trợ lý điều hành
            </span>
          </div>
        </button>
      )}

      {/* 2. Cửa sổ Chatbox khi đang mở: Width ~350px, Height ~520px, max-height calc(100vh - 120px) */}
      {isOpen && (
        <div className="w-[350px] max-w-[calc(100vw-32px)] h-[520px] max-h-[calc(100vh-120px)] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden transition-all duration-200 animate-in fade-in zoom-in-95">
          {/* HEADER CỦA HỘP CHAT: Logo EVNDevelopment + Tiêu đề "Trợ lý điều hành VNPD" (không truncate) + Nút đóng */}
          <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {/* Logo EVNDevelopment giữ nguyên độ rõ nét */}
              <img
                src="/logo.png"
                alt="EVNDevelopment"
                className="h-[36px] w-auto max-w-[115px] object-contain shrink-0"
              />

              <h3 className="text-xs sm:text-[13px] font-bold text-slate-800 whitespace-nowrap leading-tight">
                Trợ lý điều hành VNPD
              </h3>
            </div>

            {/* Các nút thao tác Header: Làm mới & Đóng */}
            <div className="flex items-center gap-0.5 shrink-0 ml-1">
              <button
                onClick={handleResetChat}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Làm mới cuộc trò chuyện"
                aria-label="Làm mới"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Đóng chatbox"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* VÙNG NỘI DUNG HỘI THOẠI: Tăng tối đa diện tích, scroll độc lập */}
          <div className="flex-1 overflow-y-auto min-h-0 px-3 py-2.5 space-y-2.5 bg-slate-50/50">
            {messages.map((msg, index) => {
              const isUser = msg.sender === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-1.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar AI biểu tượng EVN nhỏ */}
                  {!isUser && (
                    <div className="w-6 h-6 rounded-full bg-white border border-slate-200/90 p-0.5 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs mb-0.5">
                      <img
                        src="/logo.png"
                        alt="EVN"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <div className={`max-w-[84%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-2xl rounded-br-xs shadow-xs'
                          : msg.isError
                          ? 'bg-rose-50 text-rose-800 border border-rose-200 rounded-2xl rounded-bl-xs shadow-2xs'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-2xl rounded-bl-xs shadow-2xs'
                      }`}
                    >
                      {msg.isError ? (
                        <div className="flex items-center gap-1.5 text-rose-700 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{msg.content}</span>
                        </div>
                      ) : (
                        <FormattedMessageContent content={msg.content} />
                      )}
                    </div>

                    <span className="text-[9px] text-slate-400 mt-0.5 px-1 font-mono">
                      {msg.timestamp}
                    </span>

                    {/* 3 câu hỏi nhanh dạng compact chips: giảm padding dọc 20-25% (py-1), tiết kiệm diện tích tối đa */}
                    {!isUser && index === 0 && (
                      <div className="mt-2 space-y-1 w-full">
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Gợi ý câu hỏi:</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          {QUICK_SUGGESTIONS.map((q, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendMessage(q)}
                              disabled={isLoading}
                              className="text-left text-[11px] leading-tight text-blue-700 bg-white hover:bg-blue-50/80 border border-slate-200/80 hover:border-blue-300 rounded-lg px-2.5 py-1 transition-all shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Trạng thái Loading: Đang phân tích dữ liệu... */}
            {isLoading && (
              <div className="flex items-end gap-1.5 justify-start">
                <div className="w-6 h-6 rounded-full bg-white border border-slate-200/90 p-0.5 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs mb-0.5">
                  <img src="/logo.png" alt="EVN" className="w-full h-full object-contain" />
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl rounded-bl-xs px-3 py-2 shadow-2xs flex items-center gap-2 text-xs text-slate-600">
                  <div className="flex space-x-1">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">
                    Đang phân tích dữ liệu...
                  </span>
                </div>
              </div>
            )}

            {/* Nút Thử lại khi có lỗi */}
            {lastFailedMessage && !isLoading && (
              <div className="flex justify-start pl-7">
                <button
                  onClick={() => handleSendMessage(lastFailedMessage)}
                  className="flex items-center gap-1.5 text-[11px] text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/70 border border-blue-200 rounded-lg px-2 py-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Thử lại câu hỏi</span>
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* KHU VỰC NHẬP CÂU HỎI: Gọn gàng, tối ưu diện tích cho vùng hội thoại */}
          <div className="p-2 bg-white border-t border-slate-200 shrink-0">
            <div className="relative flex items-end gap-1.5 bg-slate-50 rounded-xl border border-slate-200/90 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all p-1">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi... (Enter gửi)"
                disabled={isLoading}
                className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none resize-none px-2 py-1 max-h-[72px] min-h-[28px] disabled:opacity-50"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                className="shrink-0 p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs active:scale-95"
                title="Gửi câu hỏi (Enter)"
                aria-label="Gửi"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
