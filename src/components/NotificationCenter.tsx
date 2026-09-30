import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, CheckCheck, Loader2, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import { AppNotification, TaskItem } from '../types/task';
import { getNotifications, markNotificationAsRead } from '../services/n8nApi';

interface NotificationCenterProps {
  email?: string;
  tasks?: TaskItem[];
  onOpenTaskDetail?: (task: TaskItem) => void;
}

function formatNotificationTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    if (diffDay < 7) return `${diffDay} ngày trước`;

    return date.toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  email = 'tund@vnpd.vn',
  tasks = [],
  onOpenTaskDetail,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const data = await getNotifications(email);
      setNotifications(data);
    } catch (err) {
      console.error('Không thể tải thông báo:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [email]);

  useEffect(() => {
    fetchNotifs(false);

    // Chu kỳ cập nhật tự động mỗi 60 giây
    const interval = setInterval(() => {
      fetchNotifs(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchNotifs]);

  // Đóng khi click ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Đóng bằng phím Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchNotifs(true);
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    // 1. Cập nhật lạc quan (optimistic) trên UI
    if (!notif.isRead) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notif.notificationId ? { ...n, isRead: true } : n
        )
      );

      // 2. Gọi backend n8n webhook
      markNotificationAsRead(notif.notificationId).catch((error) => {
        console.error('Lỗi khi đánh dấu thông báo đã đọc:', error);
      });
    }

    // 3. Nếu taskCode khớp với một task trong danh sách, mở chi tiết nhiệm vụ
    if (notif.taskCode && tasks.length > 0 && onOpenTaskDetail) {
      const cleanTargetCode = notif.taskCode.trim().toLowerCase();
      const matched = tasks.find((t) => t.code.trim().toLowerCase() === cleanTargetCode);
      if (matched) {
        onOpenTaskDetail(matched);
        setIsOpen(false);
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Icon chuông thông báo */}
      <button
        type="button"
        onClick={handleToggle}
        className={`relative p-2 rounded-lg transition-colors cursor-pointer border ${
          isOpen
            ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs'
            : 'text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border-slate-200/90 shadow-2xs'
        }`}
        aria-label="Thông báo"
        title="Trung tâm thông báo"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full border-2 border-white leading-none shadow-xs animate-in zoom-in-50 duration-150">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Notification Center */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
          style={{ maxWidth: 'calc(100vw - 24px)' }}
        >
          {/* Header Popover */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">Thông báo</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[11px] font-semibold bg-rose-100 text-rose-700 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fetchNotifs(true)}
                disabled={isRefreshing}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors disabled:opacity-50 cursor-pointer"
                title="Làm mới thông báo"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Vùng danh sách thông báo */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                <span className="text-xs text-slate-500">Đang tải thông báo...</span>
              </div>
            ) : notifications.length === 0 ? (
              /* Trạng thái trống */
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
                  <CheckCheck className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Không có thông báo mới</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                  Bạn sẽ nhận được thông báo khi có nhiệm vụ mới được giao ban hoặc cập nhật.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isMatched =
                  notif.taskCode &&
                  tasks.some(
                    (t) => t.code.trim().toLowerCase() === notif.taskCode?.trim().toLowerCase()
                  );

                return (
                  <div
                    key={notif.notificationId}
                    onClick={() => handleNotificationClick(notif)}
                    className={`relative p-3.5 transition-colors cursor-pointer text-left ${
                      !notif.isRead
                        ? 'bg-blue-50/60 hover:bg-blue-100/60 border-l-3 border-blue-600'
                        : 'bg-white hover:bg-slate-50 border-l-3 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`text-xs font-semibold truncate ${
                            !notif.isRead ? 'text-slate-900 font-bold' : 'text-slate-700'
                          }`}
                        >
                          {notif.actorName || 'Hệ thống'}
                        </span>
                        {!notif.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">
                        {formatNotificationTime(notif.createdAt)}
                      </span>
                    </div>

                    <p
                      className={`text-xs leading-relaxed ${
                        !notif.isRead ? 'text-slate-800' : 'text-slate-600'
                      }`}
                    >
                      {notif.message}
                    </p>

                    {/* Hiển thị nhiệm vụ liên quan nếu có */}
                    {(notif.taskTitle || notif.taskCode) && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 bg-white/80 px-2 py-1 rounded border border-slate-200/80">
                        <FileText className="w-3 h-3 text-blue-600 shrink-0" />
                        <span className="truncate">
                          {notif.taskTitle ? notif.taskTitle : `Nhiệm vụ liên quan`}
                        </span>
                        {isMatched && (
                          <span className="text-[10px] text-blue-600 font-medium ml-auto shrink-0">
                            Xem chi tiết →
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Popover */}
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Tài khoản: {email}</span>
            {unreadCount > 0 && (
              <span className="text-slate-500 font-medium">
                {unreadCount} thông báo chưa đọc
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
