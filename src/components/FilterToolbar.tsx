import React from 'react';
import { FilterState, ViewMode } from '../types/task';
import { Search, X, Filter, RotateCcw, Table, Kanban, Building2, UserCheck } from 'lucide-react';

interface FilterToolbarProps {
  filter: FilterState;
  onFilterChange: (newFilter: FilterState) => void;
  departments: string[];
  leaders: string[];
  months: string[];
  totalCount: number;
  filteredCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  filter,
  onFilterChange,
  departments,
  leaders,
  months,
  totalCount,
  filteredCount,
  viewMode,
  onViewModeChange,
}) => {
  const hasActiveFilters = Boolean(
    filter.search ||
    filter.department ||
    filter.directedBy ||
    filter.status ||
    (filter.month && months.length > 1 && filter.month !== 'all')
  );

  const handleResetFilters = () => {
    onFilterChange({
      ...filter,
      search: '',
      department: '',
      directedBy: '',
      status: '',
      month: 'all',
    });
  };

  return (
    <div className="bg-white border-b border-slate-200 print:hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[280px] max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã việc, nội dung công việc, mốc kết quả, đơn vị..."
              value={filter.search}
              onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white text-slate-800 placeholder-slate-400 transition-colors"
            />
            {filter.search && (
              <button
                onClick={() => onFilterChange({ ...filter, search: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Department */}
            <select
              value={filter.department}
              onChange={(e) => onFilterChange({ ...filter, department: e.target.value })}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
            >
              <option value="">Tất cả phòng ban / đơn vị</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* Directed By */}
            <select
              value={filter.directedBy}
              onChange={(e) => onFilterChange({ ...filter, directedBy: e.target.value })}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
            >
              <option value="">Tất cả lãnh đạo chỉ đạo</option>
              {leaders.map((leader) => (
                <option key={leader} value={leader}>
                  {leader}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              value={filter.status}
              onChange={(e) => onFilterChange({ ...filter, status: e.target.value })}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Chưa cập nhật">Chưa cập nhật</option>
              <option value="Chưa thực hiện">Chưa thực hiện</option>
              <option value="Đang thực hiện">Đang thực hiện</option>
              <option value="Hoàn thành">Hoàn thành</option>
              <option value="Chậm tiến độ">Chậm tiến độ</option>
              <option value="Tạm hoãn">Tạm hoãn</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                title="Bỏ toàn bộ bộ lọc"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {/* Secondary row: Quick status pills, count and mobile view toggles */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Lọc nhanh:</span>
            {[
              { label: 'Tất cả', val: '' },
              { label: 'Chưa làm', val: 'Chưa cập nhật' },
              { label: 'Đang làm', val: 'Đang thực hiện' },
              { label: 'Hoàn thành', val: 'Hoàn thành' },
              { label: 'Chậm tiến độ', val: 'Chậm tiến độ' },
            ].map((st) => (
              <button
                key={st.label}
                type="button"
                onClick={() => onFilterChange({ ...filter, status: st.val })}
                className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-colors cursor-pointer ${
                  filter.status === st.val
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
            <span>
              Hiển thị <strong className="text-slate-900 font-mono tabular-nums">{filteredCount}</strong>/{totalCount} việc
            </span>

            {/* Quick view switch for responsive screens */}
            <div className="flex md:hidden items-center gap-1 bg-slate-100 p-0.5 rounded-md">
              <button
                onClick={() => onViewModeChange('table')}
                className={`p-1 rounded ${viewMode === 'table' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500'}`}
                title="Bảng chi tiết"
              >
                <Table className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onViewModeChange('kanban')}
                className={`p-1 rounded ${viewMode === 'kanban' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500'}`}
                title="Bảng Kanban"
              >
                <Kanban className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onViewModeChange('department')}
                className={`p-1 rounded ${viewMode === 'department' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500'}`}
                title="Theo Phòng ban"
              >
                <Building2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onViewModeChange('executive')}
                className={`p-1 rounded ${viewMode === 'executive' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500'}`}
                title="Theo Lãnh đạo"
              >
                <UserCheck className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
