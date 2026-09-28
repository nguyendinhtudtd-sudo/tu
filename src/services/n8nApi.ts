import type { TaskItem } from '../types/task';

const N8N_WEBHOOK_URL = 'https://aihub.evngenco1.vn/n8n-app/webhook/308d5b2a-44dc-4936-926b-2f1b06d80611';

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

  return data as TaskItem[];
}
const N8N_GET_TASKS_URL =
  'https://aihub.evngenco1.vn/n8n-app/webhook/task';

export async function getTasks(): Promise<TaskItem[]> {
  const response = await fetch(N8N_GET_TASKS_URL, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Không thể tải nhiệm vụ: HTTP ${response.status}`);
  }

  const data = await response.json();

  return data as TaskItem[];
}const N8N_UPDATE_TASK_URL =
  'https://aihub.evngenco1.vn/n8n-app/webhook/task-update';

export async function updateTask(task: TaskItem): Promise<void> {
  const response = await fetch(N8N_UPDATE_TASK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: task.code,
      status: task.status,
      progress: task.progress,
      updatedAt: task.updatedAt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Không thể cập nhật nhiệm vụ: HTTP ${response.status}`);
  }
}
