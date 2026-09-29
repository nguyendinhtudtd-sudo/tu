import React, { useState, useEffect, useMemo } from 'react';
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
  MessageSquare,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

function getPaginationPages(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }

  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }

  return [1, '...', current - 1, current, current + 1, '...', total];
}

function formatExecutiveName(name: string): string {
  if (!name) return '—';
  return name
    .replace(/^Phó Tổng Giám đốc\s+/i, 'PTGĐ ')
    .replace(/^Tổng Giám đốc\s+/i, 'TGĐ ')
    .replace(/^Chủ tịch HĐQT\s+/i, 'CT HĐQT ')
    .replace(/^Thành viên HĐQT\s+/i, 'TV HĐQT ');
}

interface TaskTableViewProps {
  tasks: TaskItem[];
  generalDirectives?: TaskItem[];
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
  generalDirectives = [],
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
  const [tableTab, setTableTab] = useState<'tasks' | 'directives'>('tasks');
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeMenuCode, setActiveMenuCode] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const currentList = tableTab === 'tasks' ? tasks : generalDirectives;

  // Tự động quay về trang 1 khi danh sách nhiệm vụ thay đổi (do thay đổi bộ lọc, tìm kiếm, chuyển tab hoặc đổi kích thước trang)
  const taskListSignature = useMemo(
    () => (tableTab === 'tasks' ? tasks : generalDirectives).map((t) => t.code).join(','),
    [tableTab, tasks, generalDirectives]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [taskListSignature, pageSize]);

  const sortedTasks = [...currentList].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'code') {
      comparison = a.code.localeCompare(b.code);
    } else if (sortField === 'department') {
      comparison = (a.department || '').localeCompare(b.department || '');
    } else if (sortField === 'progress') {
      comparison = (a.progress || 0) - (b.progress || 0);
    } else if (sortField === 'status') {
      comparison = a.status.localeCompare(b.status);
    } else if (sortField === 'itemNo') {
      comparison = (a.itemNo || 0) - (b.itemNo || 0);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const totalTasks = currentList.length;
  const totalPages = Math.max(1, Math.ceil(totalTasks / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalTasks);
  const paginatedTasks = sortedTasks.slice(startIndex, endIndex);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageCodes = paginatedTasks.map((t) => t.code);
      setSelectedCodes((prev) => Array.from(new Set([...prev, ...pageCodes])));
    } else {
      const pageCodeSet = new Set(paginatedTasks.map((t) => t.code));
      setSelectedCodes((prev) => prev.filter((code) => !pageCodeSet.has(code)));
    }
  };

  const handleToggleSelect = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const allSelected =
    paginatedTasks.length > 0 && paginatedTasks.every((t) => selectedCodes.includes(t.code));
  const someSelected =
    paginatedTasks.some((t) => selectedCodes.includes(t.code)) && !allSelected;

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

      {/* Category Switcher: TASKS vs GENERAL_DIRECTIVE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="inline-flex items-center p-1 bg-slate-200/80 rounded-lg text-xs">
          <button
            onClick={() => {
              setTableTab('tasks');
              setSelectedCodes([]);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              tableTab === 'tasks'
                ? 'bg-white text-blue-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🎯 Tiến độ theo Đơn vị</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                tableTab === 'tasks' ? 'bg-blue-100 text-blue-700' : 'bg-slate-300 text-slate-700'
              }`}
            >
              {tasks.length}
            </span>
          </button>

          <button
            onClick={() => {
              setTableTab('directives');
              setSelectedCodes([]);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              tableTab === 'directives'
                ? 'bg-white text-amber-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📢 Chỉ đạo chung & Toàn Công ty</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                tableTab === 'directives'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-300 text-slate-700'
              }`}
            >
              {generalDirectives.length}
            </span>
          </button>
        </div>

        {tableTab === 'directives' && (
          <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-md flex items-center gap-1.5">
            <span className="font-semibold">Lưu ý:</span>
            <span>Các chỉ đạo chung không xác định 1 đầu mối chủ trì (được tách riêng, không tính vào KPI).</span>
          </div>
        )}
      </div>

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
                  className="py-3 px-3 w-24 cursor-pointer hover:text-slate-900 whitespace-nowrap"
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
                  className="py-3 px-3 w-36 cursor-pointer hover:text-slate-900 whitespace-nowrap"
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
                <th className="py-3 px-3 min-w-[260px]">Nhiệm vụ & Chi tiết thực hiện</th>
                <th className="py-3 px-3 w-28 whitespace-nowrap">Chỉ đạo</th>
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
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-sm font-medium text-slate-700">
                        {tableTab === 'directives'
                          ? 'Không có chỉ đạo chung nào phù hợp'
                          : 'Không tìm thấy nhiệm vụ phù hợp'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {tableTab === 'directives'
                          ? 'Tất cả các nhiệm vụ giao ban đều đã được phân định đơn vị chủ trì cụ thể.'
                          : 'Thử thay đổi từ khóa hoặc điều kiện bộ lọc.'}
                      </p>
                      {tableTab === 'tasks' && (
                        <button
                          onClick={onResetFilters}
                          className="mt-3 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md font-medium text-xs hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          Bỏ toàn bộ bộ lọc
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((item) => {
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

                      {/* Department / Directive Classification */}
                      <td className="py-2.5 px-3">
                        {tableTab === 'directives' ? (
                          <div>
                            <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              {item.department || 'Chỉ đạo chung'}
                            </span>
                            {item.pageReference && (
                              <div className="text-[10px] text-slate-400 mt-0.5">{item.pageReference}</div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium text-slate-800">{item.department}</div>
                            <div className="text-[11px] text-slate-400">{item.pageReference}</div>
                          </div>
                        )}
                      </td>

                      {/* Task Content, Milestone, Time & Collaborators */}
                      <td className="py-2.5 px-3">
                        <p
                          onClick={() => onOpenDetail(item)}
                          className="text-slate-900 font-medium leading-relaxed hover:text-blue-600 cursor-pointer"
                        >
                          {item.task}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]">
                          {item.milestone && (
                            <div className="flex items-center gap-1 text-slate-500">
                              <span className="font-semibold text-slate-600">Mốc KQ:</span>
                              <span className="text-slate-700 italic">{item.milestone}</span>
                            </div>
                          )}
                          {(item.implementationTime || item.deadline) && (
                            <div className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-medium border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600 flex-shrink-0" />
                              <span>{item.implementationTime || 'Hạn chót'}</span>
                              {item.deadline && (
                                <span className="text-rose-600 font-semibold font-mono">
                                  ({item.deadline})
                                </span>
                              )}
                            </div>
                          )}
                          {item.collaborators &&
                            item.collaborators.trim() !== '' &&
                            item.collaborators !== '—' && (
                              <div
                                className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] border border-slate-200"
                                title={`Đơn vị phối hợp: ${item.collaborators}`}
                              >
                                <Users className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span className="max-w-[200px] truncate">{item.collaborators}</span>
                              </div>
                            )}
                          {item.notes && item.notes.length > 0 && (
                            <div className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-medium">
                              <MessageSquare className="w-3 h-3" />
                              <span>{item.notes.length} ghi chú</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Directed By (Shortened) */}
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                        <span
                          className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                          title={item.directedBy}
                        >
                          {formatExecutiveName(item.directedBy)}
                        </span>
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

        {/* Pagination Bar */}
        {totalTasks > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50/80 border-t border-slate-200 text-xs text-slate-600 select-none">
            {/* Left: Page Size Selector & Record Count */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Hiển thị</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="border border-slate-300 rounded px-2 py-1 bg-white font-medium text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-xs"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-slate-500">nhiệm vụ / trang</span>
              </div>

              <span className="text-slate-300 hidden sm:inline">|</span>

              <div className="text-slate-600">
                Đang hiển thị{' '}
                <span className="font-semibold text-slate-900">
                  {startIndex + 1} - {endIndex}
                </span>{' '}
                trong tổng số <span className="font-semibold text-slate-900">{totalTasks}</span> nhiệm vụ
              </div>
            </div>

            {/* Right: Controls & Page Numbers */}
            <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-end">
              <span className="mr-2 text-slate-500 font-medium hidden md:inline">
                Trang <span className="text-slate-900 font-semibold">{validCurrentPage}</span> / {totalPages}
              </span>

              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={validCurrentPage === 1}
                className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors"
                title="Trang đầu"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              {/* Prev Page */}
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={validCurrentPage === 1}
                className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors font-medium"
                title="Trang trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Trước</span>
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {getPaginationPages(validCurrentPage, totalPages).map((p, index) => {
                  if (typeof p === 'string') {
                    return (
                      <span key={`ellipsis-${index}`} className="px-1 text-slate-400">
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`min-w-[28px] h-7 px-1.5 rounded font-medium transition-colors cursor-pointer text-xs ${
                        validCurrentPage === p
                          ? 'bg-blue-600 text-white font-semibold shadow-xs'
                          : 'border border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={validCurrentPage === totalPages}
                className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors font-medium"
                title="Trang sau"
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={validCurrentPage === totalPages}
                className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors"
                title="Trang cuối"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
