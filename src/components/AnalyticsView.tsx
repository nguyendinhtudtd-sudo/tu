import React from 'react';
import { TaskItem } from '../types/task';
import { BarChart3, PieChart, Users, CheckCircle2, Clock, AlertCircle, TrendingUp, Building2 } from 'lucide-react';

interface AnalyticsViewProps {
  tasks: TaskItem[];
  departments: string[];
  leaders: string[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tasks, departments, leaders }) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'Hoàn thành' || t.progress === 100).length;
  const inProgress = tasks.filter((t) => t.status === 'Đang thực hiện' && t.progress < 100).length;
  const pending = tasks.filter((t) => (t.status === 'Chưa cập nhật' || t.status === 'Chưa thực hiện') && t.progress === 0).length;
  const delayed = tasks.filter((t) => t.status === 'Chậm tiến độ').length;
  const paused = tasks.filter((t) => t.status === 'Tạm hoãn').length;

  const avgProgress = total > 0 ? Math.round(tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / total) : 0;

  // Department statistics
  const deptStats = departments.map((dept) => {
    const deptTasks = tasks.filter((t) => t.department === dept);
    const deptCompleted = deptTasks.filter((t) => t.status === 'Hoàn thành' || t.progress === 100).length;
    const deptInProgress = deptTasks.filter((t) => t.status === 'Đang thực hiện' && t.progress < 100).length;
    const deptPending = deptTasks.filter((t) => (t.status === 'Chưa cập nhật' || t.status === 'Chưa thực hiện')).length;
    const deptAvg = deptTasks.length > 0 ? Math.round(deptTasks.reduce((s, t) => s + (t.progress || 0), 0) / deptTasks.length) : 0;
    return {
      department: dept,
      total: deptTasks.length,
      completed: deptCompleted,
      inProgress: deptInProgress,
      pending: deptPending,
      avgProgress: deptAvg,
      share: total > 0 ? Math.round((deptTasks.length / total) * 100) : 0,
    };
  }).sort((a, b) => b.total - a.total);

  // Leadership statistics
  const leaderStats = leaders.map((leader) => {
    const leaderTasks = tasks.filter((t) => t.directedBy === leader);
    const leaderCompleted = leaderTasks.filter((t) => t.status === 'Hoàn thành' || t.progress === 100).length;
    const leaderAvg = leaderTasks.length > 0 ? Math.round(leaderTasks.reduce((s, t) => s + (t.progress || 0), 0) / leaderTasks.length) : 0;
    return {
      leader,
      total: leaderTasks.length,
      completed: leaderCompleted,
      avgProgress: leaderAvg,
      share: total > 0 ? Math.round((leaderTasks.length / total) * 100) : 0,
    };
  }).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Báo Cáo Phân Tích Tổng Quan</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Tổng hợp Tiến độ Kết luận Giao ban Ban Điều hành
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Dữ liệu phân tích thực tế từ 47 nhiệm vụ giao ban được giao cho các đơn vị
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 self-start md:self-auto">
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-medium">Tiến độ tổng thể</div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{avgProgress}%</div>
            </div>
            <div className="w-28 bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${avgProgress}%` }} />
            </div>
          </div>
        </div>

        {/* Status Distribution Visual Bar */}
        <div className="pt-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700">Cơ cấu trạng thái nhiệm vụ:</span>
            <span className="text-slate-400 font-mono tabular-nums">Tổng {total} việc</span>
          </div>

          <div className="h-4 w-full bg-slate-100 rounded-lg overflow-hidden flex shadow-inner">
            {completed > 0 && (
              <div
                style={{ width: `${(completed / total) * 100}%` }}
                className="bg-emerald-600 transition-all duration-300"
                title={`Hoàn thành: ${completed} việc (${Math.round((completed / total) * 100)}%)`}
              />
            )}
            {inProgress > 0 && (
              <div
                style={{ width: `${(inProgress / total) * 100}%` }}
                className="bg-blue-600 transition-all duration-300"
                title={`Đang thực hiện: ${inProgress} việc (${Math.round((inProgress / total) * 100)}%)`}
              />
            )}
            {delayed > 0 && (
              <div
                style={{ width: `${(delayed / total) * 100}%` }}
                className="bg-rose-500 transition-all duration-300"
                title={`Chậm tiến độ: ${delayed} việc (${Math.round((delayed / total) * 100)}%)`}
              />
            )}
            {paused > 0 && (
              <div
                style={{ width: `${(paused / total) * 100}%` }}
                className="bg-amber-500 transition-all duration-300"
                title={`Tạm hoãn: ${paused} việc (${Math.round((paused / total) * 100)}%)`}
              />
            )}
            {pending > 0 && (
              <div
                style={{ width: `${(pending / total) * 100}%` }}
                className="bg-slate-300 transition-all duration-300"
                title={`Chưa làm / Chưa cập nhật: ${pending} việc (${Math.round((pending / total) * 100)}%)`}
              />
            )}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0" />
              <span className="text-slate-600">Hoàn thành:</span>
              <strong className="font-mono tabular-nums text-slate-900">{completed}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0" />
              <span className="text-slate-600">Đang làm:</span>
              <strong className="font-mono tabular-nums text-slate-900">{inProgress}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-400 shrink-0" />
              <span className="text-slate-600">Chưa cập nhật:</span>
              <strong className="font-mono tabular-nums text-slate-900">{pending}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
              <span className="text-slate-600">Chậm tiến độ:</span>
              <strong className="font-mono tabular-nums text-slate-900">{delayed}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
              <span className="text-slate-600">Tạm hoãn:</span>
              <strong className="font-mono tabular-nums text-slate-900">{paused}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Department Progress Comparison & Leadership Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Ranking & Completion Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Tiến độ theo Đơn vị / Phòng ban</h3>
            </div>
            <span className="text-xs text-slate-400">{departments.length} đơn vị</span>
          </div>

          <div className="space-y-4">
            {deptStats.map((item) => (
              <div key={item.department} className="text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-slate-800">{item.department}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-mono tabular-nums">
                      {item.completed}/{item.total} việc xong
                    </span>
                    <span className="font-mono font-bold text-blue-600 tabular-nums min-w-[36px] text-right">
                      {item.avgProgress}%
                    </span>
                  </div>
                </div>

                {/* Multi-segment progress bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${item.avgProgress}%` }}
                    className="bg-blue-600 rounded-full transition-all duration-300"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leadership Distribution & Responsibilities */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Phân công Lãnh đạo Chỉ đạo</h3>
              </div>
              <span className="text-xs text-slate-400">{leaders.length} Lãnh đạo</span>
            </div>

            <div className="space-y-4">
              {leaderStats.map((item) => (
                <div key={item.leader} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-slate-900 text-xs">{item.leader}</div>
                    <span className="font-mono font-bold text-blue-600 text-xs tabular-nums">
                      {item.total} nhiệm vụ ({item.share}%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                    <span>Đã hoàn thành: {item.completed} việc</span>
                    <span className="font-mono tabular-nums font-medium">Tiến độ TB: {item.avgProgress}%</span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${item.avgProgress}%` }}
                      className="bg-blue-600 h-full transition-all duration-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/50 border border-blue-200/60 rounded-lg text-xs text-blue-900 mt-4">
            <div className="font-semibold mb-1">Đánh giá chung kỳ giao ban:</div>
            <p className="text-slate-600 leading-relaxed">
              Các nhiệm vụ tháng 09/2026 tập trung cao độ vào Phòng Kinh tế Kế hoạch (11 nhiệm vụ), Phòng Kỹ thuật (11 nhiệm vụ) và Phòng Đầu tư Xây dựng (9 nhiệm vụ). Cần tiếp tục đôn đốc các Nhà máy Khe Bố, Bắc Bình, Nậm Má hoàn thành đúng kỳ hạn mốc quan trắc và hồ sơ an toàn đập.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
