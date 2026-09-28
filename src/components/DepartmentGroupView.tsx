import React, { useState } from 'react';
import { TaskItem, TaskStatus } from '../types/task';
import { ProgressBar } from './ProgressBar';
import { StatusIndicator } from './StatusIndicator';
import { Building2, ChevronDown, ChevronRight, Plus, CheckCircle2 } from 'lucide-react';

interface DepartmentGroupViewProps {
  tasks: TaskItem[];
  departments: string[];
  onUpdateStatus: (code: string, status: TaskStatus) => void;
  onUpdateProgress: (code: string, progress: number) => void;
  onOpenDetail: (task: TaskItem) => void;
  onOpenEdit: (task: TaskItem) => void;
  onAddNewForDepartment: (departmentName: string) => void;
}

export const DepartmentGroupView: React.FC<DepartmentGroupViewProps> = ({
  tasks,
  departments,
  onUpdateStatus,
  onUpdateProgress,
  onOpenDetail,
  onOpenEdit,
  onAddNewForDepartment,
}) => {
  const [collapsedDepts, setCollapsedDepts] = useState<Record<string, boolean>>({});

  const toggleCollapse = (dept: string) => {
    setCollapsedDepts((prev) => ({
      ...prev,
      [dept]: !prev[dept],
    }));
  };

  return (
    <div className="space-y-4">
      {departments.map((dept) => {
        const deptTasks = tasks.filter((t) => t.department === dept);
        const total = deptTasks.length;
        const completed = deptTasks.filter((t) => t.status === 'Hoàn thành' || t.progress === 100).length;
        const avgProgress =
          total > 0
            ? Math.round(deptTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / total)
            : 0;
        const isCollapsed = collapsedDepts[dept];

        return (
          <div
            key={dept}
            className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden transition-all"
          >
            {/* Department Summary Header */}
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div
                onClick={() => toggleCollapse(dept)}
                className="flex items-center gap-2.5 cursor-pointer select-none group"
              >
                <div className="p-1 text-slate-500 group-hover:text-blue-600 transition-colors">
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {dept}
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="font-mono tabular-nums">{total} nhiệm vụ</span>
                    <span>·</span>
                    <span className="text-emerald-700 font-mono tabular-nums">
                      {completed} đã hoàn thành
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress and Add Action */}
              <div className="flex items-center gap-4 self-end sm:self-auto">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-200">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Tiến độ
                    </div>
                    <div className="text-xs font-bold text-blue-600 font-mono tabular-nums">
                      {avgProgress}%
                    </div>
                  </div>
                  <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${avgProgress}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => onAddNewForDepartment(dept)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 rounded-md transition-colors cursor-pointer"
                  title={`Thêm nhiệm vụ cho ${dept}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Giao việc</span>
                </button>
              </div>
            </div>

            {/* Tasks in Department */}
            {!isCollapsed && (
              <div className="divide-y divide-slate-100">
                {deptTasks.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 italic">
                    Không có nhiệm vụ nào thuộc đơn vị này trong danh sách lọc.
                  </div>
                ) : (
                  deptTasks.map((task) => (
                    <div
                      key={task.code}
                      className="p-3.5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      {/* Left: Code & Task Description */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            onClick={() => onOpenDetail(task)}
                            className="font-mono text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                          >
                            {task.code}
                          </button>
                          <span className="text-slate-400">·</span>
                          <span className="text-[11px] text-slate-500">
                            Chỉ đạo: {task.directedBy}
                          </span>
                          {task.pageReference && (
                            <>
                              <span className="text-slate-400">·</span>
                              <span className="text-[11px] text-slate-400">
                                {task.pageReference}
                              </span>
                            </>
                          )}
                        </div>

                        <p
                          onClick={() => onOpenDetail(task)}
                          className="text-slate-900 font-medium leading-relaxed hover:text-blue-600 cursor-pointer"
                        >
                          {task.task}
                        </p>

                        {task.milestone && (
                          <div className="mt-1 text-[11px] text-slate-500">
                            <span className="font-medium text-slate-600">Mốc hoàn thành: </span>
                            <span className="italic">{task.milestone}</span>
                          </div>
                        )}

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          <div>
                            <span className="text-slate-400">Thời gian: </span>
                            <span className="text-slate-700">{task.implementationTime}</span>
                          </div>
                          {task.deadline && (
                            <div>
                              <span className="text-slate-400">Hạn chót: </span>
                              <span className="text-rose-600 font-mono font-medium">
                                {task.deadline}
                              </span>
                            </div>
                          )}
                          {task.collaborators && (
                            <div>
                              <span className="text-slate-400">Phối hợp: </span>
                              <span>{task.collaborators}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Progress, Status & Quick Edit */}
                      <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                        <ProgressBar
                          progress={task.progress}
                          onChange={(val) => onUpdateProgress(task.code, val)}
                        />

                        <StatusIndicator
                          status={task.status}
                          onChange={(val) => onUpdateStatus(task.code, val)}
                        />

                        <button
                          onClick={() => onOpenEdit(task)}
                          className="px-2 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded text-xs transition-colors cursor-pointer"
                        >
                          Sửa
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
