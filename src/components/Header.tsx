import React from 'react';
import { ViewMode } from '../types/task';
import { Plus, Download, RefreshCw, LayoutGrid, Table, Kanban, Building2, UserCheck } from 'lucide-react';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenNewTask: () => void;
  onOpenImportExport: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  onOpenNewTask,
  onOpenImportExport,
  onResetData,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      {/* Strict Top Bar Contract: Zone 1 (Single element wordmark) — Zone 2 (4 clean nav links) — Zone 3 (Primary actions) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element Brand mark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
            V
          </div>
          <a href="/" className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            VNPD TaskFlow
          </a>
        </div>

        {/* Zone 2: Navigation Links (Clean text with subtle active state) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onViewModeChange('table')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              viewMode === 'table'
                ? 'bg-slate-100 text-blue-600 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Danh sách bảng</span>
          </button>

          <button
            onClick={() => onViewModeChange('kanban')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-slate-100 text-blue-600 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Bảng Kanban</span>
          </button>

          <button
            onClick={() => onViewModeChange('department')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              viewMode === 'department'
                ? 'bg-slate-100 text-blue-600 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Theo Phòng ban</span>
          </button>

          <button
            onClick={() => onViewModeChange('executive')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              viewMode === 'executive'
                ? 'bg-slate-100 text-blue-600 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Theo Lãnh đạo</span>
          </button>

          <button
            onClick={() => onViewModeChange('analytics')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              viewMode === 'analytics'
                ? 'bg-slate-100 text-blue-600 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Phân tích</span>
          </button>

          <button
            onClick={() => onViewModeChange('report')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              viewMode === 'report'
                ? 'bg-slate-100 text-blue-600 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Bản in báo cáo</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenImportExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="Nhập / Xuất dữ liệu JSON & CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Dữ liệu JSON/CSV</span>
          </button>

          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm nhiệm vụ</span>
          </button>
        </div>
      </div>
    </header>
  );
};
