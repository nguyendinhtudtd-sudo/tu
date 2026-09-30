import { TaskItem } from '../types/task';
import { INITIAL_TASKS } from '../data/initialTasks';

const STORAGE_KEY = 'vnpd_taskflow_data_v1';

export function getStoredTasks(): TaskItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TASKS));
      return INITIAL_TASKS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_TASKS;
  } catch (error) {
    console.error('Error reading tasks from localStorage:', error);
    return INITIAL_TASKS;
  }
}

export function saveStoredTasks(tasks: TaskItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving tasks to localStorage:', error);
  }
}

export function resetStoredTasks(): TaskItem[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TASKS));
  } catch (error) {
    console.error('Error resetting tasks:', error);
  }
  return INITIAL_TASKS;
}

export function downloadJSON(tasks: TaskItem[], filename = 'danh-sach-nhiem-vu-vnpd.json'): void {
  // Clean tasks to match the user's JSON structure exactly
  const exportData = tasks.map(t => ({
    code: t.code,
    month: t.month,
    title: t.title,
    department: t.department,
    itemNo: t.itemNo,
    task: t.task,
    collaborators: t.collaborators,
    directedBy: t.directedBy,
    implementationTime: t.implementationTime,
    deadline: t.deadline || '',
    milestone: t.milestone,
    status: t.status,
    progress: t.progress,
    pageReference: t.pageReference,
    taskType: t.taskType,
    parentCode: t.parentCode,
    taskLevel: t.taskLevel,
    ...(t.notes && t.notes.length > 0 ? { notes: t.notes } : {})
  }));

  const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", jsonString);
  downloadAnchor.setAttribute("download", filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function downloadCSV(tasks: TaskItem[], filename = 'nhiem-vu-vnpd.csv'): void {
  const headers = [
    'Mã NV',
    'Tháng',
    'Đơn vị chủ trì',
    'Số TT',
    'Nội dung nhiệm vụ',
    'Đơn vị phối hợp',
    'Lãnh đạo chỉ đạo',
    'Thời hạn/Thời gian TH',
    'Hạn chót',
    'Mốc hoàn thành',
    'Trạng thái',
    'Tiến độ (%)',
    'Tham chiếu văn bản'
  ];

  const rows = tasks.map(t => [
    `"${(t.code || '').replace(/"/g, '""')}"`,
    `"${(t.month || '').replace(/"/g, '""')}"`,
    `"${(t.department || '').replace(/"/g, '""')}"`,
    t.itemNo,
    `"${(t.task || '').replace(/"/g, '""')}"`,
    `"${(t.collaborators || '').replace(/"/g, '""')}"`,
    `"${(t.directedBy || '').replace(/"/g, '""')}"`,
    `"${(t.implementationTime || '').replace(/"/g, '""')}"`,
    `"${(t.deadline || '').replace(/"/g, '""')}"`,
    `"${(t.milestone || '').replace(/"/g, '""')}"`,
    `"${(t.status || '').replace(/"/g, '""')}"`,
    t.progress,
    `"${(t.pageReference || '').replace(/"/g, '""')}"`
  ]);

  // Add BOM for UTF-8 Excel support
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
