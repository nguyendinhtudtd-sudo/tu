import React from 'react';
import { TaskItem } from '../types/task';
import { CheckCircle2, Clock, AlertCircle, PlayCircle, BarChart3 } from 'lucide-react';

interface ExecutiveStatsProps {
  tasks: TaskItem[];
  currentMonth: string;
}

export const ExecutiveStats: React.FC<ExecutiveStatsProps> = ({ tasks, currentMonth }) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Hoàn thành' || t.progress === 100).length;
  const inProgressTasks = tasks.filter(t => t.status === 'Đang thực hiện' && t.progress < 100).length;
  const delayedTasks = tasks.filter(t => t.status === 'Chậm tiến độ').length;
  const pendingTasks = tasks.filter(
    t => (t.status === 'Chưa cập nhật' || t.status === 'Chưa thực hiện') && t.progress === 0
  ).length;

  const totalProgress = tasks.reduce((acc, curr) => acc + (curr.progress || 0), 0);
  const averageProgress = totalTasks > 0 ? Math.round(totalProgress / totalTasks) : 0;

  return (
    <div className="bg-white border-b border-slate-200 print:hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="font-semibold text-slate-700">CÔNG TY CỔ PHẦN PHÁT TRIỂN ĐIỆN LỰC VIỆT NAM (VNPD)</span>
              <span aria-hidden="true">·</span>
              <span>Kỳ giao ban tháng {currentMonth}</span>
              <span aria-hidden="true">·</span>
              <span>Tổng số {totalTasks} kết luận</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-wide text-slate-900 mt-1 uppercase">
              BẢNG THEO DÕI & ĐIỀU HÀNH TIẾN ĐỘ CÔNG VIỆC
            </h1>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 px-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                TIẾN ĐỘ BÌNH QUÂN
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-blue-600 font-mono tabular-nums">
                  {averageProgress}%
                </span>
                <span className="text-xs text-slate-500">
                  ({completedTasks}/{totalTasks} việc xong)
                </span>
              </div>
            </div>
            <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${averageProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50/70 border border-slate-200/70 rounded-lg">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider text-[11px] text-emerald-800">ĐÃ HOÀN THÀNH</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {completedTasks}
              </span>
              <span className="text-xs text-emerald-600 font-medium font-mono tabular-nums">
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Nhiệm vụ đã kết thúc 100%</div>
          </div>

          <div className="p-3.5 bg-slate-50/70 border border-slate-200/70 rounded-lg">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider text-[11px] text-blue-800">ĐANG THỰC HIỆN</span>
              <PlayCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {inProgressTasks}
              </span>
              <span className="text-xs text-blue-600 font-medium font-mono tabular-nums">
                {totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0}%
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Đang triển khai theo kế hoạch</div>
          </div>

          <div className="p-3.5 bg-slate-50/70 border border-slate-200/70 rounded-lg">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider text-[11px] text-slate-700">CHƯA CẬP NHẬT</span>
              <Clock className="w-4 h-4 text-slate-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {pendingTasks}
              </span>
              <span className="text-xs text-slate-500 font-medium font-mono tabular-nums">
                {totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0}%
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Cần đơn vị rà soát & cập nhật</div>
          </div>

          <div className="p-3.5 bg-slate-50/70 border border-slate-200/70 rounded-lg">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider text-[11px] text-rose-800">CHẬM TIẾN ĐỘ</span>
              <AlertCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {delayedTasks}
              </span>
              <span className="text-xs text-rose-600 font-medium font-mono tabular-nums">
                {totalTasks > 0 ? Math.round((delayedTasks / totalTasks) * 100) : 0}%
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Cần lãnh đạo chỉ đạo tháo gỡ</div>
          </div>
        </div>
      </div>
    </div>
  );
};
