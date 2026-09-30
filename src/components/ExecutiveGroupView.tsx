import React from 'react';
import { TaskItem, TaskStatus } from '../types/task';
import { ProgressBar } from './ProgressBar';
import { StatusIndicator } from './StatusIndicator';
import { UserCheck, CheckCircle2, Clock, AlertCircle, CornerDownRight, Layers } from 'lucide-react';

interface ExecutiveGroupViewProps {
  tasks: TaskItem[];
  leaders: string[];
  allTasks?: TaskItem[];
  onUpdateStatus: (code: string, status: TaskStatus) => void;
  onUpdateProgress: (code: string, progress: number) => void;
  onOpenDetail: (task: TaskItem) => void;
  onOpenEdit: (task: TaskItem) => void;
}

export const ExecutiveGroupView: React.FC<ExecutiveGroupViewProps> = ({
  tasks,
  leaders,
  allTasks,
  onUpdateStatus,
  onUpdateProgress,
  onOpenDetail,
  onOpenEdit,
}) => {
  return (
    <div className="space-y-4">
      {/* Dedicated Executive Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold shrink-0">
            <UserCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">TIẾN ĐỘ THEO LÃNH ĐẠO CHỈ ĐẠO</h2>
            <p className="text-xs text-slate-500">Phân định trách nhiệm và tiến độ kết luận giao ban do từng Lãnh đạo trực tiếp chỉ đạo</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <span className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 font-mono font-bold text-slate-700">
            {leaders.length} Lãnh đạo chỉ đạo · {tasks.length} việc
          </span>
        </div>
      </div>

      <div className="space-y-5">
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
                  <span className="text-[11px] font-semibold uppercase tracking-wider">HOÀN THÀNH: <strong>{completed}</strong></span>
                </div>

                <div className="flex items-center gap-1.5 text-blue-700 bg-white px-2.5 py-1 rounded border border-slate-200">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">ĐANG LÀM: <strong>{inProgress}</strong></span>
                </div>

                {delayed > 0 && (
                  <div className="flex items-center gap-1.5 text-rose-700 bg-white px-2.5 py-1 rounded border border-slate-200">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider">CHẬM TIẾN ĐỘ: <strong>{delayed}</strong></span>
                  </div>
                )}

                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">TIẾN ĐỘ BQ:</span>
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
                      {/* Quan hệ Cha - Con (hiển thị tên nhiệm vụ cha thay vì mã) */}
                      {(() => {
                        const parentTask = task.parentCode
                          ? (allTasks || tasks).find((t) => t.code === task.parentCode)
                          : null;
                        const childCount = (allTasks || tasks).filter((t) => t.parentCode === task.code).length;

                        return (
                          <>
                            {parentTask && (
                              <div className="mb-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenDetail(parentTask);
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50/90 hover:bg-blue-100 border border-blue-200/80 px-2 py-0.5 rounded font-medium transition-colors cursor-pointer group"
                                  title="Bấm để xem nhiệm vụ cha"
                                >
                                  <CornerDownRight className="w-3 h-3 text-blue-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                  <span className="font-semibold text-blue-900">Thuộc nhiệm vụ:</span>
                                  <span className="max-w-[320px] truncate underline">{parentTask.task}</span>
                                </button>
                              </div>
                            )}

                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                Mục {task.itemNo}
                              </span>
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

                            {childCount > 0 && (
                              <div className="mt-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                                  <Layers className="w-3 h-3 text-indigo-500" />
                                  <span>{childCount} nhiệm vụ con</span>
                                </span>
                              </div>
                            )}
                          </>
                        );
                      })()}

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
    </div>
  );
};
