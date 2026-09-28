import React from 'react';
import { TaskItem, TaskStatus } from '../types/task';
import { ProgressBar } from './ProgressBar';
import { StatusIndicator } from './StatusIndicator';
import { UserCheck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface ExecutiveGroupViewProps {
  tasks: TaskItem[];
  leaders: string[];
  onUpdateStatus: (code: string, status: TaskStatus) => void;
  onUpdateProgress: (code: string, progress: number) => void;
  onOpenDetail: (task: TaskItem) => void;
  onOpenEdit: (task: TaskItem) => void;
}

export const ExecutiveGroupView: React.FC<ExecutiveGroupViewProps> = ({
  tasks,
  leaders,
  onUpdateStatus,
  onUpdateProgress,
  onOpenDetail,
  onOpenEdit,
}) => {
  return (
    <div className="space-y-6">
      {leaders.map((leader) => {
        const leaderTasks = tasks.filter((t) => t.directedBy === leader);
        const total = leaderTasks.length;
        const completed = leaderTasks.filter((t) => t.status === 'Hoàn thành' || t.progress === 100).length;
        const inProgress = leaderTasks.filter((t) => t.status === 'Đang thực hiện').length;
        const delayed = leaderTasks.filter((t) => t.status === 'Chậm tiến độ').length;
        const avgProgress =
          total > 0
            ? Math.round(leaderTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / total)
            : 0;

        return (
          <div
            key={leader}
            className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden"
          >
            {/* Leader Header */}
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                  <UserCheck className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{leader}</h3>
                  <div className="text-xs text-slate-500">
                    Chỉ đạo trực tiếp <span className="font-mono font-semibold">{total}</span> nhiệm vụ
                  </div>
                </div>
              </div>

              {/* Leader Metrics */}
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-700 bg-white px-2.5 py-1 rounded border border-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Hoàn thành: <strong>{completed}</strong></span>
                </div>

                <div className="flex items-center gap-1.5 text-blue-700 bg-white px-2.5 py-1 rounded border border-slate-200">
                  <span>Đang làm: <strong>{inProgress}</strong></span>
                </div>

                {delayed > 0 && (
                  <div className="flex items-center gap-1.5 text-rose-700 bg-white px-2.5 py-1 rounded border border-slate-200">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Chậm tiến độ: <strong>{delayed}</strong></span>
                  </div>
                )}

                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded border border-slate-200">
                  <span className="text-slate-400">Tiến độ bình quân:</span>
                  <span className="font-mono font-bold text-blue-600">{avgProgress}%</span>
                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600"
                      style={{ width: `${avgProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Leader Tasks Table */}
            <div className="divide-y divide-slate-100">
              {leaderTasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  Không có nhiệm vụ nào do lãnh đạo này chỉ đạo trong kết quả lọc.
                </div>
              ) : (
                leaderTasks.map((task) => (
                  <div
                    key={task.code}
                    className="p-3.5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => onOpenDetail(task)}
                          className="font-mono text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                        >
                          {task.code}
                        </button>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-800 font-medium">{task.department}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">{task.implementationTime}</span>
                      </div>

                      <p
                        onClick={() => onOpenDetail(task)}
                        className="text-slate-900 font-medium leading-relaxed hover:text-blue-600 cursor-pointer"
                      >
                        {task.task}
                      </p>

                      {task.milestone && (
                        <div className="mt-1 text-[11px] text-slate-500">
                          <span className="font-medium text-slate-600">Mốc KQ: </span>
                          <span className="italic">{task.milestone}</span>
                        </div>
                      )}

                      {task.collaborators && (
                        <div className="mt-1 text-[11px] text-slate-500">
                          <span className="text-slate-400">Phối hợp: </span>
                          <span>{task.collaborators}</span>
                        </div>
                      )}
                    </div>

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
          </div>
        );
      })}
    </div>
  );
};
