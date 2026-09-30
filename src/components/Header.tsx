import React from 'react';
import { ViewMode, TaskItem } from '../types/task';
import { Plus, Download, LayoutGrid, Table, Kanban, Building2, UserCheck } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenNewTask: () => void;
  onOpenImportExport: () => void;
  onResetData: () => void;
  tasks?: TaskItem[];
  onOpenTaskDetail?: (task: TaskItem) => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  onOpenNewTask,
  onOpenImportExport,
  tasks = [],
  onOpenTaskDetail,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-2xs print:hidden">
      {/* 3 Balanced Zones: Left (Brand) — Center (Nav tabs dead-center) — Right (Actions) */}
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 h-[76px] grid grid-cols-2 md:grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* VÙNG 1 (BÊN TRÁI): Logo EVNDevelopment + badge TASKFLOW */}
        <div className="flex items-center gap-2.5 justify-start min-w-0">
          <a href="/" className="flex items-center gap-2.5 hover:opacity-95 transition-opacity">
            <img
              src="/logo.png"
              alt="EVN Development - VNPD Logo"
              className="h-10 sm:h-11 w-auto max-w-[240px] sm:max-w-[280px] object-contain"
            />
            <span className="hidden lg:inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 tracking-wider uppercase">
              TASKFLOW
            </span>
          </a>
        </div>

        {/* VÙNG 2 (Ở GIỮA): Nhóm menu điều hướng căn giữa theo chiều ngang */}
        <nav className="hidden md:flex items-center justify-center">
          <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 shadow-2xs">
            <button
              onClick={() => onViewModeChange('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Danh sách</span>
            </button>

            <button
              onClick={() => onViewModeChange('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>

            <button
              onClick={() => onViewModeChange('department')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                viewMode === 'department'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Phòng ban</span>
            </button>

            <button
              onClick={() => onViewModeChange('executive')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                viewMode === 'executive'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Lãnh đạo</span>
            </button>

            <button
              onClick={() => onViewModeChange('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                viewMode === 'analytics'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          </div>
        </nav>

        {/* VÙNG 3 (BÊN PHẢI): Notification Center + Dữ liệu JSON/CSV (Secondary) + + Thêm nhiệm vụ (Primary) */}
        <div className="flex items-center justify-end gap-2.5">
          {/* Notification Center */}
          <NotificationCenter
            email="tund@vnpd.vn"
            tasks={tasks}
            onOpenTaskDetail={onOpenTaskDetail}
          />

          {/* Nút Secondary: Dữ liệu JSON/CSV */}
          <button
            onClick={onOpenImportExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-lg transition-all shadow-2xs whitespace-nowrap cursor-pointer"
            title="Nhập / Xuất dữ liệu JSON & CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Dữ liệu JSON/CSV</span>
          </button>

          {/* Nút Primary: + Thêm nhiệm vụ */}
          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-xs hover:shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm nhiệm vụ</span>
          </button>
        </div>
      </div>
    </header>
  );
};
