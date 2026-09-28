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

export interface TaskItem {
  code: string;
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
  notes?: TaskNote[];
  updatedAt?: string;
}

export type ViewMode = 'table' | 'kanban' | 'department' | 'executive' | 'analytics' | 'report';

export interface FilterState {
  search: string;
  department: string;
  directedBy: string;
  status: string;
  month: string;
  sortBy: 'code' | 'department' | 'progress' | 'status' | 'itemNo';
  sortOrder: 'asc' | 'desc';
}
