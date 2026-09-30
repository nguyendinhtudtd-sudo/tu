import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TaskItem, TaskComment } from '../types/task';
import { getTaskComments, postTaskComment } from '../services/n8nApi';
import {
  Send,
  CornerDownRight,
  X,
  AtSign,
  Loader2,
  RefreshCw,
  MessageSquare,
  Building2,
  UserCheck,
} from 'lucide-react';

interface TaskCommentSectionProps {
  task: TaskItem;
  currentUser?: {
    name: string;
    email: string;
  };
  onCommentCountChange?: (count: number) => void;
}

const DEFAULT_USER = {
  name: 'Cao Tuấn Dung',
  email: 'tund@vnpd.vn',
};

// Hàm tạo màu nền avatar phong cách Jira theo tên người gửi
function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-600 text-white',
    'bg-indigo-600 text-white',
    'bg-emerald-600 text-white',
    'bg-violet-600 text-white',
    'bg-amber-600 text-white',
    'bg-rose-600 text-white',
    'bg-cyan-600 text-white',
    'bg-teal-600 text-white',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Lấy chữ cái viết tắt của tên
function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Định dạng thời gian thân thiện cho bình luận
function formatCommentTime(dateStr: string): string {
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

// Hiển thị nội dung bình luận với highlight cho @mention
function renderCommentContent(content: string) {
  const parts = content.split(/(@[^\s@]+(?:\s+[^\s@]+)*)/g);
  return (
    <span className="whitespace-pre-wrap break-words leading-relaxed text-slate-800">
      {parts.map((part, index) => {
        if (part.startsWith('@')) {
          return (
            <span
              key={index}
              className="inline-block px-1 py-0.2 mx-0.5 rounded text-blue-700 bg-blue-50 font-semibold"
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </span>
  );
}

export const TaskCommentSection: React.FC<TaskCommentSectionProps> = ({
  task,
  currentUser = DEFAULT_USER,
  onCommentCountChange,
}) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    authorName: string;
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);

  // Tải danh sách comment từ n8n webhook
  const loadComments = useCallback(
    async (silent = false) => {
      if (!task.code) return;
      if (!silent) setLoading(true);
      else setIsRefreshing(true);

      try {
        const data = await getTaskComments(task.code);
        // Sắp xếp theo thời gian tăng dần (cũ trước, mới sau)
        const sorted = [...data].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setComments(sorted);
        onCommentCountChange?.(sorted.length);
      } catch (err) {
        console.error('Lỗi khi tải bình luận:', err);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [task.code, onCommentCountChange]
  );

  useEffect(() => {
    loadComments(false);
  }, [loadComments]);

  // Gửi bình luận mới hoặc phản hồi
  const handleSend = async () => {
    if (!content.trim() || submitting || !task.code) return;

    const trimmedContent = content.trim();
    const commentId = `cmt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newComment: TaskComment = {
      commentId,
      taskCode: task.code,
      authorName: currentUser.name,
      authorEmail: currentUser.email,
      content: trimmedContent,
      parentId: replyingTo ? replyingTo.commentId : '',
      mentions: [],
      createdAt: new Date().toISOString(),
    };

    setSubmitting(true);

    // Cập nhật lạc quan (optimistic) trên UI
    setComments((prev) => {
      const updated = [...prev, newComment];
      onCommentCountChange?.(updated.length);
      return updated;
    });
    setContent('');
    const prevReplyingTo = replyingTo;
    setReplyingTo(null);

    // Cuộn xuống bình luận mới
    setTimeout(() => {
      if (commentsContainerRef.current) {
        commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
      }
    }, 100);

    try {
      await postTaskComment(newComment);
      // Tải lại danh sách từ server để đảm bảo dữ liệu đồng bộ
      const reloaded = await getTaskComments(task.code);
      if (reloaded && reloaded.length > 0) {
        const sorted = [...reloaded].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setComments(sorted);
        onCommentCountChange?.(sorted.length);
      }
    } catch (err) {
      console.error('Lỗi khi gửi bình luận lên n8n:', err);
      // Khôi phục nội dung nếu lỗi
      if (!comments.some((c) => c.commentId === commentId)) {
        setContent(trimmedContent);
        setReplyingTo(prevReplyingTo);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Bắt phím: Enter gửi, Shift+Enter xuống dòng
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Kích hoạt phản hồi cho một bình luận
  const handleReplyClick = (rootCommentId: string, authorName: string) => {
    setReplyingTo({
      commentId: rootCommentId,
      authorName,
    });
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Nếu chưa có @mention người được trả lời, có thể chèn gợi ý
      setContent((prev) => (prev.includes(`@${authorName}`) ? prev : `@${authorName} `));
    }
  };

  // Nút chèn @mention
  const handleInsertMention = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      setContent((prev) => (prev.endsWith(' ') || prev.length === 0 ? `${prev}@` : `${prev} @`));
    }
  };

  // Cấu trúc phân cấp: Bình luận gốc (root) và câu trả lời lồng vào 1 cấp
  const rootComments = comments.filter((c) => !c.parentId || c.parentId === '');
  const childRepliesMap = new Map<string, TaskComment[]>();

  // Gom các reply theo comment gốc
  comments.forEach((c) => {
    if (c.parentId && c.parentId !== '') {
      // Tìm xem parentId là root comment hay một reply khác
      let targetRootId = c.parentId;
      const isDirectRoot = rootComments.some((r) => r.commentId === c.parentId);
      if (!isDirectRoot) {
        // Nếu c.parentId là một reply, tìm root cha của reply đó
        const directParent = comments.find((item) => item.commentId === c.parentId);
        if (directParent && directParent.parentId) {
          targetRootId = directParent.parentId;
        }
      }
      const existing = childRepliesMap.get(targetRootId) || [];
      existing.push(c);
      childRepliesMap.set(targetRootId, existing);
    }
  });

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Task Summary Context Banner (Không hiển thị mã task) */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
        <div className="text-xs font-semibold text-slate-800 line-clamp-1">
          {task.task}
        </div>
        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Building2 className="w-3 h-3 text-slate-400" />
            <span>{task.department}</span>
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-slate-400" />
            <span>{task.directedBy || 'Chưa phân công'}</span>
          </span>
          <button
            type="button"
            onClick={() => loadComments(true)}
            disabled={isRefreshing}
            className="ml-auto text-slate-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-slate-200/50 cursor-pointer"
            title="Làm mới trao đổi"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Danh sách bình luận / trao đổi cuộn độc lập */}
      <div
        ref={commentsContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 text-xs"
      >
        {loading && comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
            <span className="text-xs">Đang tải trao đổi...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Chưa có trao đổi nào</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
              Hãy bắt đầu thảo luận, cập nhật hoặc hỏi ý kiến lãnh đạo về nhiệm vụ này.
            </p>
          </div>
        ) : (
          rootComments.map((root) => {
            const replies = childRepliesMap.get(root.commentId) || [];
            return (
              <div key={root.commentId} className="space-y-3">
                {/* Bình luận cấp 1 (Root Comment) */}
                <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="flex items-start gap-2.5">
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${getAvatarColor(
                        root.authorName
                      )}`}
                    >
                      {getInitials(root.authorName)}
                    </div>

                    {/* Header info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 text-xs truncate">
                          {root.authorName}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                          {formatCommentTime(root.createdAt)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="mt-1 text-xs">
                        {renderCommentContent(root.content)}
                      </div>

                      {/* Actions */}
                      <div className="mt-2.5 flex items-center gap-3 pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleReplyClick(root.commentId, root.authorName)}
                          className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          <CornerDownRight className="w-3 h-3" />
                          <span>Trả lời</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danh sách Reply thụt vào 1 cấp */}
                {replies.length > 0 && (
                  <div className="pl-6 ml-3 border-l-2 border-slate-200 space-y-2.5">
                    {replies.map((reply) => (
                      <div
                        key={reply.commentId}
                        className="bg-white border border-slate-200/80 rounded-lg p-3 shadow-2xs hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          {/* Mini Avatar */}
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 ${getAvatarColor(
                              reply.authorName
                            )}`}
                          >
                            {getInitials(reply.authorName)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-slate-900 text-[11px] truncate">
                                {reply.authorName}
                              </span>
                              <span className="text-[9px] text-slate-400 shrink-0 tabular-nums">
                                {formatCommentTime(reply.createdAt)}
                              </span>
                            </div>

                            <div className="mt-0.5 text-xs">
                              {renderCommentContent(reply.content)}
                            </div>

                            <div className="mt-2 flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleReplyClick(root.commentId, reply.authorName)}
                                className="flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                              >
                                <CornerDownRight className="w-2.5 h-2.5" />
                                <span>Trả lời</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Ô nhập bình luận cố định phía dưới */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0 shadow-xs">
        {/* Banner hiển thị đang trả lời ai */}
        {replyingTo && (
          <div className="mb-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 text-blue-800">
              <CornerDownRight className="w-3.5 h-3.5 text-blue-600" />
              <span>
                Đang trả lời: <span className="font-semibold">{replyingTo.authorName}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
              title="Hủy trả lời"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Textarea nhập nội dung */}
        <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all bg-white">
          <textarea
            ref={textareaRef}
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              replyingTo
                ? `Nhập câu trả lời cho @${replyingTo.authorName}... (Enter để gửi, Shift+Enter xuống dòng)`
                : 'Viết trao đổi / ý kiến... (Enter để gửi, Shift+Enter xuống dòng)'
            }
            className="w-full px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none resize-none leading-relaxed"
          />

          {/* Thanh công cụ dưới ô nhập */}
          <div className="px-3 py-1.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleInsertMention}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-blue-600 hover:bg-slate-200/50 rounded transition-colors cursor-pointer"
                title="Nhắc đến người dùng (@mention)"
              >
                <AtSign className="w-3 h-3 text-slate-400" />
                <span>Nhắc đến</span>
              </button>
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                Enter để gửi · Shift+Enter xuống dòng
              </span>
            </div>

            <button
              type="button"
              onClick={handleSend}
              disabled={!content.trim() || submitting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Gửi</span>
            </button>
          </div>
        </div>

        {/* Thông tin tài khoản gửi */}
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span>Gửi dưới tên: <span className="font-medium text-slate-600">{currentUser.name}</span> ({currentUser.email})</span>
          <span>{comments.length} trao đổi</span>
        </div>
      </div>
    </div>
  );
};
