import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TaskItem, TaskComment, AppUser } from '../types/task';
import { getTaskComments, postTaskComment, getUsers } from '../services/n8nApi';
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

// Bỏ dấu tiếng Việt để tìm kiếm linh hoạt
function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
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

  // Danh sách users & trạng thái @mention
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const usersLoadedRef = useRef(false);

  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [highlightedUserIndex, setHighlightedUserIndex] = useState(0);

  // Bản đồ lưu trữ người dùng đã được mention: fullName -> email
  const mentionUsersMap = useRef<Map<string, string>>(new Map());

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tải danh sách người dùng từ API n8n
  const fetchUsers = useCallback(async (force = false) => {
    console.log('[TaskCommentSection] fetchUsers() được gọi, force =', force, 'users.length =', users.length);
    if (usersLoadedRef.current && users.length > 0 && !force) {
      console.log('[TaskCommentSection] Đã có users trong cache, bỏ qua gọi lại API.');
      return;
    }
    setLoadingUsers(true);
    try {
      const data = await getUsers();
      // Chỉ hiển thị user có isActive = true (đã chuẩn hóa cả boolean true lẫn string "TRUE")
      const activeUsers = data.filter((u) => u.isActive);
      console.log('[TaskCommentSection] activeUsers sau khi lọc isActive:', activeUsers);
      setUsers(activeUsers);
      if (activeUsers.length > 0) {
        usersLoadedRef.current = true;
      }
    } catch (err) {
      console.error('[TaskCommentSection] Lỗi khi tải danh sách người dùng:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, [users.length]);

  // Tự động tải danh sách người dùng ngay khi mount để sẵn sàng khi gõ @
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowMentionDropdown(false);
      }
    }

    if (showMentionDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMentionDropdown]);

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

  // Lọc danh sách người dùng theo truy vấn sau ký tự @
  const filteredUsers = useMemo(() => {
    const trimmedQuery = mentionQuery.trim();
    // Khi người dùng chỉ gõ @ (truy vấn rỗng), hiển thị toàn bộ user đang active
    if (!trimmedQuery) {
      return users;
    }

    // Khi gõ tiếp tên mới lọc theo fullName (hỗ trợ cả có dấu và không dấu)
    const q = trimmedQuery.toLowerCase();
    const qNoTone = removeVietnameseTones(q);

    return users.filter((u) => {
      const name = u.fullName.toLowerCase();
      const nameNoTone = removeVietnameseTones(name);
      return name.includes(q) || nameNoTone.includes(qNoTone);
    });
  }, [users, mentionQuery]);

  // Xử lý thay đổi văn bản trong textarea & kiểm tra trigger @
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const cursor = e.target.selectionStart;
    setContent(newText);

    const textBeforeCursor = newText.slice(0, cursor);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      const isValidPrefix = /\s/.test(charBeforeAt) || lastAtIndex === 0;
      const query = textBeforeCursor.slice(lastAtIndex + 1);
      const hasNewline = /\n/.test(query);

      if (isValidPrefix && !hasNewline && query.length < 30) {
        setMentionQuery(query);
        setMentionStartIndex(lastAtIndex);
        setShowMentionDropdown(true);
        setHighlightedUserIndex(0);
        fetchUsers();
        return;
      }
    }

    setShowMentionDropdown(false);
    setMentionQuery('');
    setMentionStartIndex(-1);
  };

  // Chọn người dùng từ danh sách gợi ý
  const handleSelectUser = (user: AppUser) => {
    if (mentionStartIndex === -1 || !textareaRef.current) return;

    const cursor = textareaRef.current.selectionStart;
    const before = content.slice(0, mentionStartIndex);
    const after = content.slice(cursor);
    const mentionText = `@${user.fullName} `;
    const nextContent = `${before}${mentionText}${after}`;

    setContent(nextContent);

    // Lưu email người dùng được nhắc đến vào mảng (không hiển thị email lên UI)
    mentionUsersMap.current.set(user.fullName, user.email);

    setShowMentionDropdown(false);
    setMentionQuery('');
    setMentionStartIndex(-1);

    // Đặt lại con trỏ chuột ngay sau chuỗi @fullName vừa chèn
    const nextCursor = before.length + mentionText.length;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextCursor, nextCursor);
      }
    }, 0);
  };

  // Gửi bình luận mới hoặc phản hồi
  const handleSend = async () => {
    if (!content.trim() || submitting || !task.code) return;

    const trimmedContent = content.trim();

    // Thu thập danh sách email của tất cả user thực tế còn xuất hiện trong nội dung comment
    const finalMentions: string[] = [];
    mentionUsersMap.current.forEach((email, fullName) => {
      if (trimmedContent.includes(`@${fullName}`)) {
        if (!finalMentions.includes(email)) {
          finalMentions.push(email);
        }
      }
    });

    const commentId = `cmt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newComment: TaskComment = {
      commentId,
      taskCode: task.code,
      authorName: currentUser.name,
      authorEmail: currentUser.email,
      content: trimmedContent,
      parentId: replyingTo ? replyingTo.commentId : '',
      mentions: finalMentions,
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
    setShowMentionDropdown(false);

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

  // Bắt phím: điều hướng dropdown @mention, Enter gửi, Shift+Enter xuống dòng
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionDropdown && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedUserIndex((prev) => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedUserIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSelectUser(filteredUsers[highlightedUserIndex]);
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        handleSelectUser(filteredUsers[highlightedUserIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionDropdown(false);
        return;
      }
    }

    // Khi không mở dropdown mention: Enter gửi, Shift+Enter xuống dòng
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
      setContent((prev) => (prev.includes(`@${authorName}`) ? prev : `@${authorName} `));
    }
  };

  // Nút chèn @mention thủ công
  const handleInsertMention = () => {
    if (!textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart;
    const before = content.slice(0, cursor);
    const after = content.slice(cursor);
    const prefix = before.length === 0 || /\s$/.test(before) ? '@' : ' @';
    const nextContent = `${before}${prefix}${after}`;
    const newCursor = before.length + prefix.length;

    setContent(nextContent);
    setMentionStartIndex(newCursor - 1);
    setMentionQuery('');
    setShowMentionDropdown(true);
    setHighlightedUserIndex(0);
    fetchUsers();

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 0);
  };

  // Cấu trúc phân cấp: Bình luận gốc (root) và câu trả lời lồng vào 1 cấp
  const rootComments = comments.filter((c) => !c.parentId || c.parentId === '');
  const childRepliesMap = new Map<string, TaskComment[]>();

  // Gom các reply theo comment gốc
  comments.forEach((c) => {
    if (c.parentId && c.parentId !== '') {
      let targetRootId = c.parentId;
      const isDirectRoot = rootComments.some((r) => r.commentId === c.parentId);
      if (!isDirectRoot) {
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
      <div className="p-4 bg-white border-t border-slate-200 shrink-0 shadow-xs relative">
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

        {/* Khối textarea & Dropdown @Mention */}
        <div className="relative border border-slate-200 rounded-xl focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all bg-white">
          {/* Dropdown gợi ý @mention nổi phía trên ô nhập */}
          {showMentionDropdown && (
            <div
              ref={dropdownRef}
              className="absolute bottom-full mb-2 left-0 right-0 max-h-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-150"
            >
              {/* Header của dropdown mention */}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-600">
                <div className="flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-blue-600" />
                  <span>Gợi ý nhắc đến (@mention)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMentionDropdown(false)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  title="Đóng gợi ý"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Danh sách người dùng (chỉ hiển thị isActive = true, không hiển thị email) */}
              <div className="overflow-y-auto max-h-44 divide-y divide-slate-100">
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-4 text-slate-400 text-xs gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Đang tải danh sách người dùng...</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    {users.length === 0 ? (
                      <div className="flex flex-col items-center gap-1.5 py-1">
                        <span>Chưa có dữ liệu thành viên đang hoạt động</span>
                        <button
                          type="button"
                          onClick={() => fetchUsers(true)}
                          className="text-blue-600 hover:underline text-[11px] font-medium cursor-pointer"
                        >
                          Thử tải lại
                        </button>
                      </div>
                    ) : (
                      'Không tìm thấy thành viên phù hợp'
                    )}
                  </div>
                ) : (
                  filteredUsers.map((user, idx) => (
                    <div
                      key={user.userId || user.email || idx}
                      onClick={() => handleSelectUser(user)}
                      onMouseEnter={() => setHighlightedUserIndex(idx)}
                      className={`px-3 py-2 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        idx === highlightedUserIndex ? 'bg-blue-50/90 text-blue-900' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 ${getAvatarColor(
                            user.fullName
                          )}`}
                        >
                          {getInitials(user.fullName)}
                        </div>
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {user.fullName}
                        </span>
                      </div>

                      {/* Hiển thị department (Không hiển thị email) */}
                      <span className="text-[11px] text-slate-500 truncate max-w-[160px] shrink-0 text-right">
                        {user.department || 'Thành viên'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Textarea nhập nội dung */}
          <textarea
            ref={textareaRef}
            rows={2}
            value={content}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={
              replyingTo
                ? `Nhập câu trả lời cho @${replyingTo.authorName}... (Enter để gửi, Shift+Enter xuống dòng)`
                : 'Viết trao đổi / ý kiến... Gõ @ để nhắc đến đồng nghiệp (Enter để gửi)'
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
          <span>Gửi dưới tên: <span className="font-medium text-slate-600">{currentUser.name}</span></span>
          <span>{comments.length} trao đổi</span>
        </div>
      </div>
    </div>
  );
};
