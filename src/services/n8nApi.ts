import { isGeneralDirective } from '../types/task';
import type { TaskItem, TaskNote, TaskStatus, TaskType, AppNotification, TaskComment } from '../types/task';

const N8N_WEBHOOK_URL = 'https://aihub.evngenco1.vn/n8n-app/webhook/308d5b2a-44dc-4936-926b-2f1b06d80611';
const N8N_GET_TASKS_URL = 'https://aihub.evngenco1.vn/n8n-app/webhook/task';
const N8N_UPDATE_TASK_URL = 'https://aihub.evngenco1.vn/n8n-app/webhook/task-update';
const N8N_TELEGRAM_URL = 'https://aihub.evngenco1.vn/n8n-app/webhook/telegram-report';
const N8N_CHATBOT_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_N8N_CHATBOT_URL) ||
  'https://aihub.evngenco1.vn/n8n-app/webhook/chatbox';
const N8N_NOTIFICATIONS_URL = 'https://aihub.evngenco1.vn/n8n-app/webhook/notifications';
const N8N_NOTIFICATION_READ_URL = 'https://aihub.evngenco1.vn/n8n-app/webhook/notification-read';
const N8N_TASK_COMMENT_URL = 'https://aihub.evngenco1.vn/n8n-app/webhook/task-comment';
const N8N_TASK_COMMENTS_URL = 'https://aihub.evngenco1.vn/n8n-app/webhook/task-comments';

/**
 * Chuẩn hóa một dòng dữ liệu từ Sheet/n8n thành TaskItem an toàn và đầy đủ
 */
export function normalizeTask(raw: any): TaskItem {
  // 1. Parse tiến độ (xử lý định dạng từ Excel/Sheet như "50%", 0.5,...)
  let progress = 0;
  if (typeof raw.progress === 'number') {
    progress = raw.progress <= 1 && raw.progress > 0 ? Math.round(raw.progress * 100) : Math.round(raw.progress);
  } else if (typeof raw.progress === 'string') {
    const cleanStr = raw.progress.replace('%', '').trim();
    const parsed = parseFloat(cleanStr);
    if (!isNaN(parsed)) {
      progress = parsed <= 1 && parsed > 0 && raw.progress.includes('%') ? Math.round(parsed * 100) : Math.round(parsed);
    }
  }
  progress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));

  // 2. Parse ghi chú/lịch sử an toàn
  let notes: TaskNote[] = [];
  if (Array.isArray(raw.notes)) {
    notes = raw.notes;
  } else if (typeof raw.notes === 'string' && raw.notes.trim()) {
    try {
      const parsed = JSON.parse(raw.notes);
      if (Array.isArray(parsed)) {
        notes = parsed;
      }
    } catch {
      notes = [
        {
          id: `note-${Date.now()}`,
          timestamp: new Date().toISOString(),
          content: raw.notes,
        },
      ];
    }
  }

  // 3. Chuẩn hóa trạng thái
  const validStatuses: TaskStatus[] = [
    'Chưa cập nhật',
    'Chưa thực hiện',
    'Đang thực hiện',
    'Hoàn thành',
    'Chậm tiến độ',
    'Tạm hoãn',
  ];
  let status: TaskStatus = raw.status;
  if (!validStatuses.includes(status)) {
    status = 'Chưa cập nhật';
  }

  const department = String(raw.department || '').trim();
  let taskType: TaskType;
  if (raw.taskType === 'general_directive' || raw.taskType === 'tracked_task') {
    taskType = raw.taskType;
  } else if (raw.taskType === 'GENERAL_DIRECTIVE' || isGeneralDirective(department)) {
    taskType = 'general_directive';
  } else {
    taskType = 'tracked_task';
  }

  return {
    code: String(raw.code || '').trim(),
    month: String(raw.month || '').trim(),
    title: String(raw.title || '').trim(),
    department,
    itemNo: Number(raw.itemNo) || 1,
    task: String(raw.task || '').trim(),
    collaborators: String(raw.collaborators || '').trim(),
    directedBy: String(raw.directedBy || '').trim(),
    implementationTime: String(raw.implementationTime || '').trim(),
    deadline: String(raw.deadline || '').trim(),
    milestone: String(raw.milestone || '').trim(),
    status,
    progress,
    pageReference: String(raw.pageReference || '').trim(),
    priority: raw.priority || 'Bình thường',
    taskType,
    parentCode: raw.parentCode ? String(raw.parentCode).trim() : undefined,
    taskLevel:
      raw.taskLevel === 'parent' || raw.taskLevel === 'child' || raw.taskLevel === 'standalone'
        ? raw.taskLevel
        : raw.parentCode
        ? 'child'
        : 'standalone',
    notes,
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

/**
 * Tải danh sách nhiệm vụ từ n8n / Sheet
 */
export async function getTasks(): Promise<TaskItem[]> {
  const response = await fetch(N8N_GET_TASKS_URL, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Không thể tải nhiệm vụ: HTTP ${response.status}`);
  }

  const data = await response.json();

  // n8n có thể trả về mảng trực tiếp hoặc bọc trong object { data: [...] } / { tasks: [...] }
  const rawList = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.tasks)
    ? data.tasks
    : [];

  return rawList
    .filter((item: any) => item && (item.code || item.task)) // Lọc bỏ dòng trống của Excel
    .map(normalizeTask);
}

/**
 * Đồng bộ toàn diện một nhiệm vụ lên n8n / Sheet (Áp dụng cho cả Tạo mới, Cập nhật tiến độ & Sửa chi tiết)
 */
export async function syncTaskToSheet(task: TaskItem): Promise<void> {
  const payload = {
    code: task.code || '',
    month: task.month || '',
    title: task.title || '',
    department: task.department || '',
    itemNo: Number(task.itemNo) || 1,
    task: task.task || '',
    collaborators: task.collaborators || '',
    directedBy: task.directedBy || '',
    implementationTime: task.implementationTime || '',
    deadline: task.deadline || '',
    milestone: task.milestone || '',
    status: task.status || 'Chưa thực hiện',
    progress: typeof task.progress === 'number' ? task.progress : 0,
    pageReference: task.pageReference || '',
    priority: task.priority || 'Bình thường',
    parentCode: task.parentCode || '',
    taskLevel: task.taskLevel || (task.parentCode ? 'child' : 'standalone'),
    taskType:
      task.taskType === 'general_directive' || task.taskType === 'tracked_task'
        ? task.taskType
        : isGeneralDirective(task.department)
        ? 'general_directive'
        : 'tracked_task',
    notes: JSON.stringify(task.notes || []),
    updatedAt: task.updatedAt || new Date().toISOString(),
  };

  const response = await fetch(N8N_UPDATE_TASK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Không thể đồng bộ nhiệm vụ lên Sheet: HTTP ${response.status}`);
  }
}

/**
 * Alias giữ tương thích ngược với code hiện tại
 */
export const updateTask = syncTaskToSheet;

/**
 * Gửi file PDF lên n8n để trích xuất nhiệm vụ
 */
export async function processMeetingPdf(file: File): Promise<TaskItem[]> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`n8n trả về lỗi HTTP ${response.status}`);
  }

  const data = await response.json();
  const rawList = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.tasks)
    ? data.tasks
    : [];

  return rawList.map(normalizeTask);
}

export interface TelegramReportPayload {
  month: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  delayedTasks: number;
  averageProgress: number;
  departmentsCount: number;
  sentAt: string;
}

/**
 * Gửi lệnh kích hoạt báo cáo tổng hợp sang n8n để bắn tin nhắn Telegram
 */
export async function sendTelegramReport(payload: TelegramReportPayload): Promise<void> {
  const response = await fetch(N8N_TELEGRAM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Không thể gửi tin nhắn Telegram: HTTP ${response.status}`);
  }
}

export interface ChatbotRequest {
  message: string;
  sessionId?: string;
}

export interface ChatbotResponse {
  answer: string;
}

/**
 * Gửi tin nhắn đến Webhook Chatbot AI trên n8n và nhận câu trả lời dạng JSON { answer: string }
 */
export async function askChatbot(
  message: string,
  sessionId: string = 'tgd-web'
): Promise<string> {
  const response = await fetch(N8N_CHATBOT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      sessionId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chatbot API trả về lỗi HTTP ${response.status}`);
  }

  const data = await response.json();

  if (Array.isArray(data) && data[0]?.answer) {
    return String(data[0].answer);
  }
  if (data?.answer) {
    return String(data.answer);
  }
  if (data?.output) {
    return String(data.output);
  }
  if (data?.text) {
    return String(data.text);
  }
  if (typeof data === 'string') {
    return data;
  }

  return 'Đã nhận phản hồi nhưng không tìm thấy trường answer.';
}

/**
  * Chuẩn hóa dữ liệu thông báo từ API webhook n8n
  */
export function normalizeNotification(raw: any): AppNotification {
  const isRead =
    raw.isRead === true ||
    raw.isRead === 'true' ||
    raw.isRead === 'TRUE' ||
    raw.isRead === 1 ||
    raw.isRead === '1';

  return {
    notificationId: String(raw.notificationId || raw.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
    recipientEmail: String(raw.recipientEmail || ''),
    actorName: String(raw.actorName || 'Hệ thống'),
    taskCode: raw.taskCode ? String(raw.taskCode).trim() : undefined,
    taskTitle: raw.taskTitle ? String(raw.taskTitle).trim() : undefined,
    type: raw.type ? String(raw.type) : undefined,
    message: String(raw.message || ''),
    isRead,
    createdAt: String(raw.createdAt || new Date().toISOString()),
  };
}

/**
  * Lấy danh sách thông báo của người dùng từ n8n webhook
  */
export async function getNotifications(email: string): Promise<AppNotification[]> {
  try {
    const url = `${N8N_NOTIFICATIONS_URL}?email=${encodeURIComponent(email)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Webhook notifications returned HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map(normalizeNotification);
    }
    if (data && Array.isArray((data as any).notifications)) {
      return (data as any).notifications.map(normalizeNotification);
    }
    if (data && Array.isArray((data as any).data)) {
      return (data as any).data.map(normalizeNotification);
    }
    return [];
  } catch (error) {
    console.error('Lỗi khi tải thông báo từ n8n webhook:', error);
    return [];
  }
}

/**
  * Đánh dấu thông báo đã đọc qua n8n webhook
  */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const response = await fetch(N8N_NOTIFICATION_READ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notificationId,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Lỗi khi gọi API đánh dấu đã đọc:', error);
    return false;
  }
}

/**
  * Chuẩn hóa dữ liệu bình luận từ API webhook n8n
  */
export function normalizeComment(raw: any): TaskComment {
  let mentions: string[] = [];
  if (Array.isArray(raw.mentions)) {
    mentions = raw.mentions;
  } else if (typeof raw.mentions === 'string' && raw.mentions.trim()) {
    try {
      const parsed = JSON.parse(raw.mentions);
      if (Array.isArray(parsed)) mentions = parsed;
    } catch {
      mentions = raw.mentions.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }

  return {
    commentId: String(raw.commentId || raw.id || `cmt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
    taskCode: String(raw.taskCode || '').trim(),
    authorName: String(raw.authorName || 'Người dùng'),
    authorEmail: String(raw.authorEmail || ''),
    content: String(raw.content || ''),
    parentId: raw.parentId ? String(raw.parentId).trim() : '',
    mentions,
    createdAt: String(raw.createdAt || new Date().toISOString()),
  };
}

/**
  * Lấy danh sách bình luận theo nhiệm vụ (taskCode) từ n8n webhook
  */
export async function getTaskComments(taskCode: string): Promise<TaskComment[]> {
  try {
    const url = `${N8N_TASK_COMMENTS_URL}?taskCode=${encodeURIComponent(taskCode)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Webhook task-comments trả về HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map(normalizeComment);
    }
    if (data && Array.isArray((data as any).comments)) {
      return (data as any).comments.map(normalizeComment);
    }
    if (data && Array.isArray((data as any).data)) {
      return (data as any).data.map(normalizeComment);
    }
    return [];
  } catch (error) {
    console.error('Lỗi khi tải bình luận từ n8n webhook:', error);
    return [];
  }
}

/**
  * Gửi bình luận hoặc câu trả lời mới lên n8n webhook
  */
export async function postTaskComment(comment: TaskComment): Promise<boolean> {
  try {
    const response = await fetch(N8N_TASK_COMMENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        commentId: comment.commentId,
        taskCode: comment.taskCode,
        authorName: comment.authorName,
        authorEmail: comment.authorEmail,
        content: comment.content,
        parentId: comment.parentId || '',
        mentions: comment.mentions || [],
        createdAt: comment.createdAt,
      }),
    });

    if (!response.ok) {
      console.warn(`Webhook task-comment trả về HTTP ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Lỗi khi gửi bình luận lên n8n webhook:', error);
    return false;
  }
}
