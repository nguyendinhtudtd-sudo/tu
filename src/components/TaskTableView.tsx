import React, { useState } from 'react';
import { TaskItem, TaskStatus } from '../types/task';
import { StatusIndicator } from './StatusIndicator';
import { ProgressBar } from './ProgressBar';
import {
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';

interface TaskTableViewProps {
  tasks: TaskItem[];
  onUpdateStatus: (code: string, status: TaskStatus) => void;
  onUpdateProgress: (code: string, progress: number) => void;
  onOpenEdit: (task: TaskItem) => void;
  onOpenDetail: (task: TaskItem) => void;
  onDuplicate: (task: TaskItem) => void;
  onDelete: (code: string) => void;
  onBulkComplete: (codes: string[]) => void;
  onBulkDelete: (codes: string[]) => void;
  onResetFilters: () => void;
}

type SortField = 'code' | 'department' | 'progress' | 'status' | 'itemNo';

export const TaskTableView: React.FC<TaskTableViewProps> = ({
  tasks,
  onUpdateStatus,
  onUpdateProgress,
  onOpenEdit,
  onOpenDetail,
  onDuplicate,
  onDelete,
  onBulkComplete,
  onBulkDelete,
  onResetFilters,
}) => {
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeMenuCode, setActiveMenuCode] = useState<string | null>(null);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCodes(tasks.map((t) => t.code));
    } else {
      setSelectedCodes([]);
    }
  };

  const handleToggleSelect = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'code') {
      comparison = a.code.localeCompare(b.code);
    } else if (sortField === 'department') {
      comparison = a.department.localeCompare(b.department);
    } else if (sortField === 'progress') {
      comparison = (a.progress || 0) - (b.progress || 0);
    } else if (sortField === 'status') {
      comparison = a.status.localeCompare(b.status);
    } else if (sortField === 'itemNo') {
      comparison = (a.itemNo || 0) - (b.itemNo || 0);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const allSelected = tasks.length > 0 && selectedCodes.length === tasks.length;
  const someSelected = selectedCodes.length > 0 && selectedCodes.length < tasks.length;

  return (
    <div className="relative">
      {/* Floating Bulk Action Bar */}
      {selectedCodes.length > 0 && (
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl mb-3 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <span className="font-semibold">Đã chọn {selectedCodes.length} nhiệm vụ</span>
            <span className="text-slate-400">·</span>
            <button
              onClick={() => setSelectedCodes([])}
              className="text-slate-300 hover:text-white underline cursor-pointer"
            >
              Bỏ chọn tất cả
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onBulkComplete(selectedCodes);
                setSelectedCodes([]);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đánh dấu Hoàn thành (100%)</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Xác nhận xóa ${selectedCodes.length} nhiệm vụ đã chọn?`)) {
                  onBulkDelete(selectedCodes);
                  setSelectedCodes([]);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th
                  onClick={() => toggleSort('code')}
                  className="py-3 px-3 w-28 cursor-pointer hover:text-slate-900 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Mã việc</span>
                    {sortField === 'code' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('department')}
                  className="py-3 px-3 w-40 cursor-pointer hover:text-slate-900 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Đơn vị chủ trì</span>
                    {sortField === 'department' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-3 min-w-[280px]">Nhiệm vụ & Mốc hoàn thành</th>
                <th className="py-3 px-3 w-36 whitespace-nowrap">Lãnh đạo chỉ đạo</th>
                <th className="py-3 px-3 w-36 whitespace-nowrap">Đơn vị phối hợp</th>
                <th className="py-3 px-3 w-32 whitespace-nowrap">Thời hạn TH</th>
                <th
                  onClick={() => toggleSort('progress')}
                  className="py-3 px-3 w-28 cursor-pointer hover:text-slate-900 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Tiến độ</span>
                    {sortField === 'progress' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('status')}
                  className="py-3 px-3 w-36 cursor-pointer hover:text-slate-900 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Trạng thái</span>
                    {sortField === 'status' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-3 w-16 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedTasks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-sm font-medium text-slate-700">Không tìm thấy nhiệm vụ phù hợp</p>
                      <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa hoặc điều kiện bộ lọc.</p>
                      <button
                        onClick={onResetFilters}
                        className="mt-3 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md font-medium text-xs hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        Bỏ toàn bộ bộ lọc
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedTasks.map((item) => {
                  const isSelected = selectedCodes.includes(item.code);
                  const isMenuOpen = activeMenuCode === item.code;

                  return (
                    <tr
                      key={item.code}
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.code)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Code */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <button
                          onClick={() => onOpenDetail(item)}
                          className="font-mono text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline tracking-tight cursor-pointer"
                        >
                          {item.code}
                        </button>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Mục {item.itemNo}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{item.department}</div>
                        <div className="text-[11px] text-slate-400">{item.pageReference}</div>
                      </td>

                      {/* Task Content & Milestone */}
                      <td className="py-2.5 px-3">
                        <p
                          onClick={() => onOpenDetail(item)}
                          className="text-slate-900 font-medium leading-relaxed hover:text-blue-600 cursor-pointer"
                        >
                          {item.task}
                        </p>
                        {item.milestone && (
                          <div className="mt-1 flex items-start gap-1 text-[11px] text-slate-500">
                            <span className="font-medium text-slate-600">Mốc KQ:</span>
                            <span className="text-slate-600 italic">{item.milestone}</span>
                          </div>
                        )}
                        {item.notes && item.notes.length > 0 && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-600">
                            <MessageSquare className="w-3 h-3" />
                            <span>{item.notes.length} ghi chú tiến độ</span>
                          </div>
                        )}
                      </td>

                      {/* Directed By */}
                      <td className="py-2.5 px-3 text-slate-700">
                        <span className="text-[11px] font-medium leading-tight block">
                          {item.directedBy}
                        </span>
                      </td>

                      {/* Collaborators */}
                      <td className="py-2.5 px-3 text-slate-600">
                        <span className="text-[11px] line-clamp-2" title={item.collaborators}>
                          {item.collaborators || '—'}
                        </span>
                      </td>

                      {/* Implementation Time / Deadline */}
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                        <div className="text-[11px] font-medium">{item.implementationTime}</div>
                        {item.deadline && (
                          <div className="text-[10px] text-rose-600 font-mono mt-0.5">
                            Hạn: {item.deadline}
                          </div>
                        )}
                      </td>

                      {/* Progress */}
                      <td className="py-2.5 px-3">
                        <ProgressBar
                          progress={item.progress}
                          onChange={(newProgress) => onUpdateProgress(item.code, newProgress)}
                        />
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3">
                        <StatusIndicator
                          status={item.status}
                          onChange={(newStatus) => onUpdateStatus(item.code, newStatus)}
                        />
                      </td>

                      {/* Action Menu */}
                      <td className="py-2.5 px-3 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenDetail(item)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Xem chi tiết & nhật ký"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenEdit(item)}
                            className="p-1 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Chỉnh sửa nhiệm vụ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDuplicate(item)}
                            className="p-1 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-100 transition-colors cursor-pointer hidden sm:inline-block"
                            title="Nhân bản nhiệm vụ"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Xác nhận xóa nhiệm vụ ${item.code}?`)) {
                                onDelete(item.code);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Xóa nhiệm vụ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
