export type TaskStatus =
  | 'Chưa cập nhật'
  | 'Chưa thực hiện'
  | 'Đang thực hiện'
  | 'Hoàn thành'
  | 'Chậm tiến độ'
  | 'Tạm hoãn';

export interface TaskNote {
  id: string;
  timestamp: string;
  author?: string;
  content: string;
}

export type TaskType = 'tracked_task' | 'general_directive';

/**
 * Kiểm tra xem một giá trị đơn vị chủ trì có phải là chỉ đạo chung không
 */
export function isGeneralDirective(dept?: string): boolean {
  if (!dept || !dept.trim()) return true;
  const d = dept.trim().toLowerCase();

  return (
    d === 'chỉ đạo chung' ||
    d === 'general_directive' ||
    d.startsWith('các ') ||
    d.includes('các phòng') ||
    d.includes('các nhà máy') ||
    d.includes('các đơn vị') ||
    d.includes('phòng, đơn vị') ||
    d.includes('phòng và đơn vị') ||
    d.includes('phòng và nhà máy') ||
    d.includes('toàn công ty') ||
    d.includes('toàn thể') ||
    d.includes('và các')
  );
}

export type TaskLevel = 'parent' | 'child' | 'standalone';

export interface TaskItem {
  code: string;
  parentCode?: string;
  taskLevel?: TaskLevel;
  month: string;
  title: string;
  department: string;
  itemNo: number;
  task: string;
  collaborators: string;
  directedBy: string;
  implementationTime: string;
  deadline: string;
  milestone: string;
  status: TaskStatus;
  progress: number; // 0 to 100
  pageReference: string;
  priority?: 'Bình thường' | 'Quan trọng' | 'Khẩn cấp';
  taskType?: TaskType;
  notes?: TaskNote[];
  updatedAt?: string;
}

export type ViewMode = 'table' | 'kanban' | 'department' | 'executive' | 'analytics';

export interface FilterState {
  search: string;
  department: string;
  directedBy: string;
  status: string;
  month: string;
  sortBy: 'code' | 'department' | 'progress' | 'status' | 'itemNo';
  sortOrder: 'asc' | 'desc';
}

export interface AppNotification {
  notificationId: string;
  recipientEmail: string;
  actorName: string;
  taskCode?: string;
  taskTitle?: string;
  type?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface TaskComment {
  commentId: string;
  taskCode: string;
  authorName: string;
  authorEmail: string;
  content: string;
  parentId?: string;
  mentions?: string[];
  createdAt: string;
}

export interface AppUser {
  userId: string;
  fullName: string;
  email: string;
  department: string;
  role?: string;
  isActive: boolean;
}
