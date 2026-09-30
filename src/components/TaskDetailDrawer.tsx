import React, { useState } from 'react';
import { TaskItem, TaskStatus, TaskNote } from '../types/task';
import { StatusIndicator } from './StatusIndicator';
import { ProgressBar } from './ProgressBar';
import {
  X,
  Edit2,
  Trash2,
  Copy,
  Calendar,
  Building2,
  UserCheck,
  Users,
  Target,
  FileText,
  Clock,
  Plus,
  MessageSquare,
  CheckCircle2,
  Share2
} from 'lucide-react';

interface TaskDetailDrawerProps {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (code: string, status: TaskStatus) => void;
  onUpdateProgress: (code: string, progress: number) => void;
  onAddNote: (code: string, noteText: string) => void;
  onDeleteNote: (code: string, noteId: string) => void;
  onOpenEdit: (task: TaskItem) => void;
  onDelete: (code: string) => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  isOpen,
  onClose,
  onUpdateStatus,
  onUpdateProgress,
  onAddNote,
  onDeleteNote,
  onOpenEdit,
  onDelete,
}) => {
  const [newNote, setNewNote] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !task) return null;

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(task.code, newNote.trim());
    setNewNote('');
  };

  const handleCopySummary = () => {
    const text = `[${task.code}] ${task.task}\n- Đơn vị: ${task.department}\n- Chỉ đạo: ${task.directedBy}\n- Mốc: ${task.milestone || 'N/A'}\n- Tiến độ: ${task.progress}% (${task.status})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-2xs flex justify-end">
      <div
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
      >
        {/* Top bar of drawer */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-blue-700">{task.code}</span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">Mục {task.itemNo}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopySummary}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              title="Sao chép tóm tắt nội dung"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {copied && <span className="text-[11px] text-emerald-600 font-medium">Đã chép!</span>}

            <button
              onClick={() => {
                onClose();
                onOpenEdit(task);
              }}
              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              title="Chỉnh sửa nhiệm vụ"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (window.confirm(`Xác nhận xóa nhiệm vụ ${task.code}?`)) {
                  onDelete(task.code);
                  onClose();
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
              title="Xóa nhiệm vụ"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Title & Document Context */}
          <div>
            <div className="text-[11px] text-slate-500 font-medium mb-1">
              {task.title} (Kỳ {task.month})
            </div>
            <h2 className="text-base font-bold text-slate-900 leading-snug">{task.task}</h2>
          </div>

          {/* Quick Status & Progress Control */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Trạng thái công việc:</span>
              <StatusIndicator
                status={task.status}
                onChange={(s) => onUpdateStatus(task.code, s)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-700">Tiến độ hoàn thành:</span>
                <span className="font-mono font-bold text-blue-600 tabular-nums text-sm">
                  {task.progress}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={task.progress}
                onChange={(e) => onUpdateProgress(task.code, Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-2"
              />
              <div className="grid grid-cols-5 gap-1.5">
                {[0, 25, 50, 75, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => onUpdateProgress(task.code, val)}
                    className={`py-1 text-center font-mono text-[11px] rounded border transition-colors cursor-pointer ${
                      task.progress === val
                        ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Metadata Section - Clean unboxed text with icons */}
          <div className="space-y-3.5 border-t border-b border-slate-100 py-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[11px]">Đơn vị chủ trì</span>
                <span className="font-medium text-slate-800 text-xs">{task.department}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <UserCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[11px]">Lãnh đạo chỉ đạo</span>
                <span className="font-medium text-slate-800 text-xs">{task.directedBy}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Target className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[11px]">Mốc hoàn thành (Milestone)</span>
                <span className="font-medium text-slate-800 text-xs italic">
                  {task.milestone || 'Chưa xác định mốc cụ thể'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[11px]">Thời gian thực hiện / Hạn chót</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800 text-xs">{task.implementationTime}</span>
                  {task.deadline && (
                    <span className="text-rose-600 font-mono font-medium">(Hạn: {task.deadline})</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[11px]">Đơn vị phối hợp</span>
                <span className="text-slate-700 text-xs">{task.collaborators || '—'}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[11px]">Tham chiếu văn bản</span>
                <span className="text-slate-700 text-xs">{task.pageReference}</span>
              </div>
            </div>
          </div>

          {/* Activity / Progress Log (Nhật ký thực hiện) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Nhật ký cập nhật tiến độ ({task.notes?.length || 0})</span>
              </div>
            </div>

            {/* Quick Type Selection for Jira-style Note Logging */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className="text-[10px] text-slate-400 font-medium mr-1">Phân loại nhanh:</span>
              <button
                type="button"
                onClick={() => setNewNote((prev) => prev.startsWith('[Kết quả] ') ? prev : `[Kết quả] ${prev.replace(/^\[(Kết quả|Vướng mắc|Kế hoạch)\]\s*/, '')}`)}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                + Kết quả
              </button>
              <button
                type="button"
                onClick={() => setNewNote((prev) => prev.startsWith('[Vướng mắc] ') ? prev : `[Vướng mắc] ${prev.replace(/^\[(Kết quả|Vướng mắc|Kế hoạch)\]\s*/, '')}`)}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                + Vướng mắc
              </button>
              <button
                type="button"
                onClick={() => setNewNote((prev) => prev.startsWith('[Kế hoạch] ') ? prev : `[Kế hoạch] ${prev.replace(/^\[(Kết quả|Vướng mắc|Kế hoạch)\]\s*/, '')}`)}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                + Kế hoạch
              </button>
            </div>

            {/* Note Input */}
            <form onSubmit={handleAddNoteSubmit} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ghi chú kết quả, vướng mắc phát sinh hoặc kế hoạch..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                />
                <button
                  type="submit"
                  disabled={!newNote.trim()}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Lưu</span>
                </button>
              </div>
            </form>

            {/* Notes List */}
            <div className="space-y-2.5">
              {!task.notes || task.notes.length === 0 ? (
                <div className="p-4 text-center bg-slate-50 border border-slate-100 rounded-lg text-slate-400 text-xs">
                  Chưa có ghi chú cập nhật tiến độ nào.
                </div>
              ) : (
                task.notes.map((note) => {
                  let badge = null;
                  let cleanContent = note.content;
                  if (note.content.startsWith('[Kết quả]')) {
                    badge = <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">Kết quả</span>;
                    cleanContent = note.content.replace(/^\[Kết quả\]\s*/, '');
                  } else if (note.content.startsWith('[Vướng mắc]')) {
                    badge = <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 shrink-0">Vướng mắc</span>;
                    cleanContent = note.content.replace(/^\[Vướng mắc\]\s*/, '');
                  } else if (note.content.startsWith('[Kế hoạch]')) {
                    badge = <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 shrink-0">Kế hoạch</span>;
                    cleanContent = note.content.replace(/^\[Kế hoạch\]\s*/, '');
                  }

                  return (
                    <div
                      key={note.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg relative group"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                        <div className="flex items-center gap-2">
                          {badge}
                          <span>{note.timestamp}</span>
                        </div>
                        <button
                          onClick={() => onDeleteNote(task.code, note.id)}
                          className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Xóa ghi chú"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap">
                        {cleanContent}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {task.updatedAt
              ? `Cập nhật: ${new Date(task.updatedAt).toLocaleDateString('vi-VN')}`
              : 'Dữ liệu giao ban tháng 09/2026'}
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenEdit(task);
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
          >
            Chỉnh sửa toàn diện
          </button>
        </div>
      </div>
    </div>
  );
};
