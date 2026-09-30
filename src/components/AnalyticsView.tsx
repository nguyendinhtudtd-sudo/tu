import React, { useState, useMemo } from 'react';
import { TaskItem, isGeneralDirective } from '../types/task';
import {
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  Building2,
  Calendar,
  Flame,
  FileText,
  ChevronRight,
  HelpCircle,
  CheckCircle,
  Sparkles,
  Filter,
  RotateCcw,
  Activity
} from 'lucide-react';

interface AnalyticsViewProps {
  tasks: TaskItem[];
  departments: string[];
  leaders: string[];
  months?: string[];
  onOpenDetail?: (task: TaskItem) => void;
}

function parseTaskDeadline(deadlineStr?: string): Date | null {
  if (!deadlineStr || !deadlineStr.trim()) return null;
  const str = deadlineStr.trim();

  // Khớp định dạng DD/MM/YYYY hoặc D/M/YYYY
  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const d = new Date(parseInt(dmy[3], 10), parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10));
    if (!isNaN(d.getTime())) return d;
  }

  // Khớp định dạng YYYY-MM-DD
  const ymd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymd) {
    const d = new Date(parseInt(ymd[1], 10), parseInt(ymd[2], 10) - 1, parseInt(ymd[3], 10));
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

function parseMonthKey(m: string): { year: number; month: number; val: number } {
  if (!m) return { year: 0, month: 0, val: 0 };
  const clean = m.trim();
  const match = clean.match(/^(\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const month = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);
    return { year, month, val: year * 10000 + month };
  }
  const yfirst = clean.match(/^(\d{4})[\/\-](\d{1,2})$/);
  if (yfirst) {
    const year = parseInt(yfirst[1], 10);
    const month = parseInt(yfirst[2], 10);
    return { year, month, val: year * 10000 + month };
  }
  return { year: 0, month: 0, val: 0 };
}

function formatExecutiveName(name: string): string {
  if (!name) return '—';
  return name
    .replace(/^Phó Tổng Giám đốc\s+/i, 'PTGĐ ')
    .replace(/^Tổng Giám đốc\s+/i, 'TGĐ ')
    .replace(/^Chủ tịch HĐQT\s+/i, 'CT HĐQT ')
    .replace(/^Thành viên HĐQT\s+/i, 'TV HĐQT ');
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  tasks,
  departments,
  leaders,
  months = [],
  onOpenDetail,
}) => {
  // 1. Bộ lọc riêng độc lập của màn hình Dashboard
  const [dashFilter, setDashFilter] = useState({
    month: 'all',
    department: 'all',
    directedBy: 'all',
    status: 'all',
  });

  // Tab con lọc trong khối "Công việc cần chú ý"
  const [attentionTab, setAttentionTab] = useState<'all' | 'overdue' | 'dueSoon' | 'unupdated' | 'issues'>('all');

  // Danh sách các tháng giao ban thực tế từ dữ liệu
  const availableMonths = useMemo(() => {
    if (months && months.length > 0) return months;
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.month) set.add(t.month);
    });
    return Array.from(set);
  }, [months, tasks]);

  // 2. Lọc bỏ các nhiệm vụ Chỉ đạo chung (general_directive) - Chỉ giữ tracked_task cụ thể
  const baseTrackedTasks = useMemo(() => {
    return tasks.filter((t) => !isGeneralDirective(t.department) && t.taskType !== 'general_directive');
  }, [tasks]);

  // 3. Áp dụng bộ lọc riêng của Dashboard
  const filteredTasks = useMemo(() => {
    return baseTrackedTasks.filter((t) => {
      if (dashFilter.month !== 'all' && t.month !== dashFilter.month) return false;
      if (dashFilter.department !== 'all' && t.department !== dashFilter.department) return false;
      if (dashFilter.directedBy !== 'all' && t.directedBy !== dashFilter.directedBy) return false;
      if (dashFilter.status !== 'all' && t.status !== dashFilter.status) return false;
      return true;
    });
  }, [baseTrackedTasks, dashFilter]);

  const hasActiveDashFilter =
    dashFilter.month !== 'all' ||
    dashFilter.department !== 'all' ||
    dashFilter.directedBy !== 'all' ||
    dashFilter.status !== 'all';

  const handleResetDashFilter = () => {
    setDashFilter({
      month: 'all',
      department: 'all',
      directedBy: 'all',
      status: 'all',
    });
  };

  // 4. Tính toán 6 chỉ số KPI cốt lõi
  const total = filteredTasks.length;
  const completed = filteredTasks.filter((t) => t.status === 'Hoàn thành' || t.progress === 100).length;
  const inProgress = filteredTasks.filter((t) => t.status === 'Đang thực hiện' && t.progress < 100).length;
  const pending = filteredTasks.filter((t) => (t.status === 'Chưa cập nhật' || t.status === 'Chưa thực hiện') && t.progress === 0).length;
  const delayed = filteredTasks.filter((t) => t.status === 'Chậm tiến độ').length;
  const paused = filteredTasks.filter((t) => t.status === 'Tạm hoãn').length;

  const avgProgress = total > 0 ? Math.round(filteredTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / total) : 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // 5. Phân tích "Công việc cần chú ý" (Attention Tasks)
  const now = new Date();
  const next7Days = new Date();
  next7Days.setDate(now.getDate() + 7);

  const categorizedAttention = useMemo(() => {
    const overdue: { task: TaskItem; reason: string; severity: 'high' | 'medium' | 'info' }[] = [];
    const dueSoon: { task: TaskItem; reason: string; severity: 'high' | 'medium' | 'info' }[] = [];
    const unupdated: { task: TaskItem; reason: string; severity: 'high' | 'medium' | 'info' }[] = [];
    const issues: { task: TaskItem; reason: string; severity: 'high' | 'medium' | 'info' }[] = [];

    filteredTasks.forEach((t) => {
      if (t.status === 'Hoàn thành' || t.progress === 100) return;

      const deadlineDate = parseTaskDeadline(t.deadline);
      let isOverdue = false;

      // 1. Quá hạn / Chậm tiến độ
      if (t.status === 'Chậm tiến độ') {
        isOverdue = true;
        overdue.push({ task: t, reason: 'Ghi nhận chậm tiến độ so với kế hoạch', severity: 'high' });
      } else if (deadlineDate && deadlineDate < now) {
        isOverdue = true;
        overdue.push({ task: t, reason: `Đã quá hạn chót (${t.deadline})`, severity: 'high' });
      }

      // 2. Sắp đến hạn (trong vòng 7 ngày tới)
      if (!isOverdue && deadlineDate && deadlineDate >= now && deadlineDate <= next7Days) {
        dueSoon.push({ task: t, reason: `Hạn chót trong 7 ngày tới (${t.deadline})`, severity: 'medium' });
      }

      // 3. Chưa cập nhật lâu (tiến độ vẫn 0%)
      if (t.status === 'Chưa cập nhật' || (t.status === 'Chưa thực hiện' && t.progress === 0)) {
        unupdated.push({ task: t, reason: 'Chưa cập nhật tiến độ (0%)', severity: 'info' });
      }

      // 4. Có vướng mắc (từ ghi chú phản ánh hoặc ưu tiên khẩn cấp)
      const noteIssue = t.notes?.find((n) =>
        /vướng|khó khăn|ách tắc|chưa giải quyết|chờ|chậm|tồn đọng/i.test(n.content)
      );
      if (noteIssue) {
        issues.push({ task: t, reason: `Vướng mắc: "${noteIssue.content.slice(0, 50)}..."`, severity: 'high' });
      } else if (t.priority === 'Khẩn cấp' && t.progress < 50) {
        issues.push({ task: t, reason: 'Nhiệm vụ khẩn cấp nhưng tiến độ dưới 50%', severity: 'high' });
      } else if (t.status === 'Chậm tiến độ' && !noteIssue) {
        issues.push({ task: t, reason: 'Cần đôn đốc tháo gỡ điểm nghẽn', severity: 'medium' });
      }
    });

    // Gom danh sách tất cả (khử trùng lặp mã nhiệm vụ)
    const allMap = new Map<string, { task: TaskItem; reasons: string[]; severity: 'high' | 'medium' | 'info' }>();
    const addAll = (list: { task: TaskItem; reason: string; severity: 'high' | 'medium' | 'info' }[]) => {
      list.forEach((item) => {
        if (!allMap.has(item.task.code)) {
          allMap.set(item.task.code, { task: item.task, reasons: [item.reason], severity: item.severity });
        } else {
          const entry = allMap.get(item.task.code)!;
          if (!entry.reasons.includes(item.reason)) {
            entry.reasons.push(item.reason);
          }
          if (item.severity === 'high') entry.severity = 'high';
        }
      });
    };

    addAll(overdue);
    addAll(issues);
    addAll(dueSoon);
    addAll(unupdated);

    return {
      overdue,
      dueSoon,
      unupdated,
      issues,
      all: Array.from(allMap.values()).map((v) => ({
        task: v.task,
        reason: v.reasons.join(' · '),
        severity: v.severity,
      })),
    };
  }, [filteredTasks]);

  const currentAttentionList = useMemo(() => {
    switch (attentionTab) {
      case 'overdue':
        return categorizedAttention.overdue;
      case 'dueSoon':
        return categorizedAttention.dueSoon;
      case 'unupdated':
        return categorizedAttention.unupdated;
      case 'issues':
        return categorizedAttention.issues;
      default:
        return categorizedAttention.all;
    }
  }, [attentionTab, categorizedAttention]);

  // 6. Thống kê theo Phòng ban / Đơn vị
  const activeDepartments = useMemo(() => {
    if (departments && departments.length > 0) return departments;
    const set = new Set<string>();
    filteredTasks.forEach((t) => {
      if (t.department) set.add(t.department);
    });
    return Array.from(set);
  }, [departments, filteredTasks]);

  const deptStats = useMemo(() => {
    return activeDepartments
      .map((dept) => {
        const deptTasks = filteredTasks.filter((t) => t.department === dept);
        const deptCompleted = deptTasks.filter((t) => t.status === 'Hoàn thành' || t.progress === 100).length;
        const deptInProgress = deptTasks.filter((t) => t.status === 'Đang thực hiện' && t.progress < 100).length;
        const deptDelayed = deptTasks.filter((t) => t.status === 'Chậm tiến độ').length;
        const deptPending = deptTasks.filter((t) => t.status === 'Chưa cập nhật' || t.status === 'Chưa thực hiện').length;
        const deptAvg = deptTasks.length > 0 ? Math.round(deptTasks.reduce((s, t) => s + (t.progress || 0), 0) / deptTasks.length) : 0;
        return {
          department: dept,
          total: deptTasks.length,
          completed: deptCompleted,
          inProgress: deptInProgress,
          delayed: deptDelayed,
          pending: deptPending,
          avgProgress: deptAvg,
          share: total > 0 ? Math.round((deptTasks.length / total) * 100) : 0,
        };
      })
      .filter((d) => d.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [activeDepartments, filteredTasks, total]);

  // 7. Thống kê theo Lãnh đạo chỉ đạo
  const activeLeaders = useMemo(() => {
    if (leaders && leaders.length > 0) return leaders;
    const set = new Set<string>();
    filteredTasks.forEach((t) => {
      if (t.directedBy) set.add(t.directedBy);
    });
    return Array.from(set);
  }, [leaders, filteredTasks]);

  const leaderStats = useMemo(() => {
    return activeLeaders
      .map((leader) => {
        const leaderTasks = filteredTasks.filter((t) => t.directedBy === leader);
        const leaderCompleted = leaderTasks.filter((t) => t.status === 'Hoàn thành' || t.progress === 100).length;
        const leaderDelayed = leaderTasks.filter((t) => t.status === 'Chậm tiến độ').length;
        const leaderAvg = leaderTasks.length > 0 ? Math.round(leaderTasks.reduce((s, t) => s + (t.progress || 0), 0) / leaderTasks.length) : 0;
        return {
          leader,
          total: leaderTasks.length,
          completed: leaderCompleted,
          delayed: leaderDelayed,
          avgProgress: leaderAvg,
          share: total > 0 ? Math.round((leaderTasks.length / total) * 100) : 0,
        };
      })
      .filter((l) => l.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [activeLeaders, filteredTasks, total]);

  // 8. Thống kê theo Tháng (sắp xếp thời gian tăng dần, cập nhật theo bộ lọc phòng ban & lãnh đạo)
  const monthlyStats = useMemo(() => {
    // Lọc theo phòng ban và lãnh đạo đang được chọn trên Dashboard
    const scopedTasks = baseTrackedTasks.filter((t) => {
      if (dashFilter.department !== 'all' && t.department !== dashFilter.department) return false;
      if (dashFilter.directedBy !== 'all' && t.directedBy !== dashFilter.directedBy) return false;
      return true;
    });

    const monthSet = new Set<string>();
    baseTrackedTasks.forEach((t) => {
      if (t.month && t.month.trim()) monthSet.add(t.month.trim());
    });
    availableMonths.forEach((m) => {
      if (m && m.trim()) monthSet.add(m.trim());
    });

    // Sắp xếp tháng theo thời gian tăng dần (không xếp theo chuỗi alphabet)
    const sortedMonths = Array.from(monthSet).sort((a, b) => {
      return parseMonthKey(a).val - parseMonthKey(b).val;
    });

    return sortedMonths.map((m) => {
      const mTasks = scopedTasks.filter((t) => t.month === m);
      const mTotal = mTasks.length;
      const mCompleted = mTasks.filter((t) => t.status === 'Hoàn thành' || t.progress === 100).length;
      const mInProgress = mTasks.filter((t) => t.status === 'Đang thực hiện' && t.progress < 100).length;
      const mPending = mTasks.filter((t) => (t.status === 'Chưa cập nhật' || t.status === 'Chưa thực hiện') && t.progress === 0).length;
      const mDelayed = mTasks.filter((t) => t.status === 'Chậm tiến độ').length;
      const mPaused = mTasks.filter((t) => t.status === 'Tạm hoãn').length;
      const mAvgProgress = mTotal > 0 ? Math.round(mTasks.reduce((s, t) => s + (t.progress || 0), 0) / mTotal) : 0;

      return {
        month: m,
        total: mTotal,
        completed: mCompleted,
        inProgress: mInProgress,
        pending: mPending,
        delayed: mDelayed,
        paused: mPaused,
        avgProgress: mAvgProgress,
      };
    });
  }, [baseTrackedTasks, availableMonths, dashFilter.department, dashFilter.directedBy]);

  const maxMonthlyTotal = useMemo(() => {
    return Math.max(...monthlyStats.map((m) => m.total), 1);
  }, [monthlyStats]);

  // Nhận định tự động
  const topVolumeDept = deptStats[0];
  const topProgressDept = [...deptStats].filter((d) => d.total >= 2).sort((a, b) => b.avgProgress - a.avgProgress)[0];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* 1. HEADER DASHBOARD ĐIỀU HÀNH & BỘ LỌC ĐỘC LẬP           */}
      {/* ======================================================== */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1 uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              <span>TRUNG TÂM CHỈ HUY & ĐIỀU HÀNH TỔNG THỂ</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight uppercase">
              DASHBOARD THEO DÕI TIẾN ĐỘ KẾT LUẬN GIAO BAN
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Đồng bộ dữ liệu thời gian thực từ Google Sheets · Đang theo dõi{' '}
              <strong className="text-slate-800 font-mono font-semibold">{total}</strong> nhiệm vụ giao ban được giao cho các đơn vị
            </p>
          </div>

          {/* Kỳ giao ban & Tổng tiến độ */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold tracking-wider">KỲ GIAO BAN</span>
              <span className="font-bold text-slate-800 font-mono">
                {dashFilter.month === 'all' ? (availableMonths[0] || 'Tất cả các kỳ') : `Tháng ${dashFilter.month}`}
              </span>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-blue-50/70 rounded-lg border border-blue-200 text-xs">
              <div>
                <span className="text-blue-600 block text-[10px] uppercase font-semibold tracking-wider">TIẾN ĐỘ BÌNH QUÂN</span>
                <span className="text-xl font-bold text-blue-700 font-mono tabular-nums leading-none">
                  {avgProgress}%
                </span>
              </div>
              <div className="w-20 bg-blue-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${avgProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* BỘ LỌC RIÊNG CỦA DASHBOARD (GỌN GÀNG, ĐỘC LẬP) */}
        <div className="pt-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium mr-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Lọc Dashboard:</span>
            </div>

            {/* Lọc Kỳ giao ban */}
            <select
              value={dashFilter.month}
              onChange={(e) => setDashFilter((prev) => ({ ...prev, month: e.target.value }))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white text-slate-700 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Kỳ giao ban: Tất cả</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>

            {/* Lọc Phòng ban / đơn vị */}
            <select
              value={dashFilter.department}
              onChange={(e) => setDashFilter((prev) => ({ ...prev, department: e.target.value }))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white text-slate-700 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[220px] truncate"
            >
              <option value="all">Đơn vị: Tất cả ({activeDepartments.length})</option>
              {activeDepartments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Lọc Lãnh đạo chỉ đạo */}
            <select
              value={dashFilter.directedBy}
              onChange={(e) => setDashFilter((prev) => ({ ...prev, directedBy: e.target.value }))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white text-slate-700 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[220px] truncate"
            >
              <option value="all">Lãnh đạo: Tất cả ({activeLeaders.length})</option>
              {activeLeaders.map((l) => (
                <option key={l} value={l}>{formatExecutiveName(l)}</option>
              ))}
            </select>

            {/* Lọc Trạng thái */}
            <select
              value={dashFilter.status}
              onChange={(e) => setDashFilter((prev) => ({ ...prev, status: e.target.value }))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white text-slate-700 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Trạng thái: Tất cả</option>
              <option value="Hoàn thành">Hoàn thành</option>
              <option value="Đang thực hiện">Đang thực hiện</option>
              <option value="Chưa cập nhật">Chưa cập nhật</option>
              <option value="Chậm tiến độ">Chậm tiến độ</option>
              <option value="Tạm hoãn">Tạm hoãn</option>
            </select>
          </div>

          {hasActiveDashFilter && (
            <button
              onClick={handleResetDashFilter}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại bộ lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. HÀNG 6 KPI CARDS (TỐI ƯU GIAO DIỆN LÃNH ĐẠO, KHÔNG LẶP) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* 1. Tổng nhiệm vụ */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-bold uppercase tracking-wider text-[11px]">TỔNG NHIỆM VỤ</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums tracking-tight">
            {total}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Đơn vị chủ trì cụ thể</div>
        </div>

        {/* 2. Hoàn thành (Xanh lá) */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:border-emerald-300 transition-colors border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-emerald-700 text-xs mb-1.5">
            <span className="font-bold uppercase tracking-wider text-[11px]">ĐÃ HOÀN THÀNH</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-700 font-mono tabular-nums tracking-tight">
            {completed}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium font-mono">
            {completionRate}% tổng khối lượng
          </div>
        </div>

        {/* 3. Đang thực hiện (Xanh dương) */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:border-blue-300 transition-colors border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-blue-700 text-xs mb-1.5">
            <span className="font-bold uppercase tracking-wider text-[11px]">ĐANG THỰC HIỆN</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-700 font-mono tabular-nums tracking-tight">
            {inProgress}
          </div>
          <div className="text-[11px] text-blue-600 mt-1 font-medium font-mono">
            {total > 0 ? Math.round((inProgress / total) * 100) : 0}% đang bám sát
          </div>
        </div>

        {/* 4. Chưa cập nhật (Xám) */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:border-slate-400 transition-colors border-l-4 border-l-slate-400">
          <div className="flex items-center justify-between text-slate-600 text-xs mb-1.5">
            <span className="font-bold uppercase tracking-wider text-[11px]">CHƯA CẬP NHẬT</span>
            <HelpCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-700 font-mono tabular-nums tracking-tight">
            {pending}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Tiến độ ở mức 0%</div>
        </div>

        {/* 5. Chậm tiến độ (Đỏ) */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:border-rose-300 transition-colors border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-rose-700 text-xs mb-1.5">
            <span className="font-bold uppercase tracking-wider text-[11px]">CHẬM TIẾN ĐỘ</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-rose-700 font-mono tabular-nums tracking-tight">
            {delayed}
          </div>
          <div className="text-[11px] text-rose-600 mt-1 font-medium">Cần đôn đốc xử lý</div>
        </div>

        {/* 6. Tiến độ bình quân */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:border-indigo-300 transition-colors border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-indigo-700 text-xs mb-1.5">
            <span className="font-bold uppercase tracking-wider text-[11px]">TIẾN ĐỘ BÌNH QUÂN</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-indigo-700 font-mono tabular-nums tracking-tight">
            {avgProgress}%
          </div>
          <div className="text-[11px] text-indigo-600 mt-1 font-medium">
            {avgProgress >= 80 ? 'Mức xuất sắc' : avgProgress >= 50 ? 'Đang đạt kỳ vọng' : 'Cần tăng tốc'}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. KHU VỰC PHÂN TÍCH THEO THÁNG (CƠ CẤU & XU HƯỚNG TIẾN ĐỘ) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Biểu đồ 1: Số lượng nhiệm vụ từng tháng theo nhóm trạng thái */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">CƠ CẤU NHIỆM VỤ THEO THÁNG</h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Phân bố số lượng nhiệm vụ theo thời gian tăng dần
                  {dashFilter.department !== 'all' && ` · ${dashFilter.department}`}
                  {dashFilter.directedBy !== 'all' && ` · ${formatExecutiveName(dashFilter.directedBy)}`}
                </p>
              </div>

              {/* Legend trạng thái */}
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Hoàn thành</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>Đang làm</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  <span>Chưa CN</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Chậm</span>
                </span>
              </div>
            </div>

            {/* Stacked Bars Container */}
            <div className="pt-3 pb-1">
              <div className="flex items-end justify-around gap-3 min-h-[170px] border-b border-slate-200 px-2">
                {monthlyStats.map((item) => {
                  const isCurrentFilter = dashFilter.month === item.month;
                  const barHeightPx = item.total === 0 ? 8 : Math.max(26, Math.round((item.total / maxMonthlyTotal) * 125));

                  return (
                    <div
                      key={item.month}
                      onClick={() => setDashFilter((prev) => ({
                        ...prev,
                        month: prev.month === item.month ? 'all' : item.month,
                      }))}
                      className={`flex flex-col items-center flex-1 max-w-[100px] cursor-pointer group transition-all ${
                        isCurrentFilter ? 'scale-105' : 'hover:opacity-90'
                      }`}
                      title={`Tháng ${item.month}: ${item.total} việc (Hoàn thành: ${item.completed}, Đang thực hiện: ${item.inProgress}, Chưa cập nhật: ${item.pending}, Chậm: ${item.delayed})`}
                    >
                      {/* Total badge on top of bar */}
                      <span className={`text-[11px] font-bold font-mono mb-1.5 tabular-nums transition-colors ${
                        isCurrentFilter ? 'text-blue-700 font-extrabold' : 'text-slate-700'
                      }`}>
                        {item.total} việc
                      </span>

                      {/* Stacked Vertical Bar */}
                      <div
                        style={{ height: `${barHeightPx}px` }}
                        className={`w-full min-w-[34px] max-w-[50px] rounded-t-lg overflow-hidden flex flex-col-reverse shadow-xs border transition-all ${
                          isCurrentFilter ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-200 group-hover:border-slate-300'
                        }`}
                      >
                        {item.total === 0 ? (
                          <div className="w-full h-full bg-slate-100" />
                        ) : (
                          <>
                            {item.completed > 0 && (
                              <div
                                style={{ height: `${(item.completed / item.total) * 100}%` }}
                                className="bg-emerald-500 w-full"
                              />
                            )}
                            {item.inProgress > 0 && (
                              <div
                                style={{ height: `${(item.inProgress / item.total) * 100}%` }}
                                className="bg-blue-600 w-full"
                              />
                            )}
                            {item.pending > 0 && (
                              <div
                                style={{ height: `${(item.pending / item.total) * 100}%` }}
                                className="bg-slate-300 w-full"
                              />
                            )}
                            {item.delayed > 0 && (
                              <div
                                style={{ height: `${(item.delayed / item.total) * 100}%` }}
                                className="bg-rose-500 w-full"
                              />
                            )}
                            {item.paused > 0 && (
                              <div
                                style={{ height: `${(item.paused / item.total) * 100}%` }}
                                className="bg-amber-400 w-full"
                              />
                            )}
                          </>
                        )}
                      </div>

                      {/* Month Label below bar */}
                      <span className={`text-xs font-semibold font-mono mt-2 transition-colors ${
                        isCurrentFilter ? 'text-blue-600 underline font-bold' : 'text-slate-600'
                      }`}>
                        T{item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Nhấn vào cột tháng để lọc chi tiết Dashboard</span>
            <span className="font-mono text-slate-700">{monthlyStats.length} kỳ theo dõi</span>
          </div>
        </div>

        {/* Biểu đồ 2: Đường thể hiện tiến độ bình quân của từng tháng (SVG) */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">XU HƯỚNG TIẾN ĐỘ BÌNH QUÂN THEO THÁNG</h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Đường xu hướng tỷ lệ % hoàn thành qua các kỳ giao ban tăng dần
                </p>
              </div>

              {monthlyStats.length > 0 && (
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Kỳ gần nhất</span>
                  <span className="text-sm font-bold text-blue-700 font-mono">
                    {monthlyStats[monthlyStats.length - 1]?.avgProgress}%
                  </span>
                </div>
              )}
            </div>

            {/* SVG Line Chart */}
            <div className="w-full relative py-1">
              <svg viewBox="0 0 540 180" className="w-full h-44 overflow-visible">
                <defs>
                  <linearGradient id="lineProgressGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Lines */}
                {[100, 75, 50, 25, 0].map((val) => {
                  const y = 20 + 120 * (1 - val / 100);
                  return (
                    <g key={val}>
                      <line
                        x1="45"
                        y1={y}
                        x2="520"
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray={val === 0 || val === 100 ? 'none' : '3 3'}
                        strokeWidth="1"
                      />
                      <text
                        x="38"
                        y={y + 3.5}
                        textAnchor="end"
                        className="text-[10px] fill-slate-400 font-mono"
                      >
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {/* Points and Line Coordinates */}
                {(() => {
                  const n = monthlyStats.length;
                  if (n === 0) return null;

                  const points = monthlyStats.map((item, i) => {
                    const x = n === 1 ? 282 : 65 + (i / (n - 1)) * 435;
                    const y = 20 + 120 * (1 - item.avgProgress / 100);
                    return { x, y, ...item };
                  });

                  // Path definition
                  let linePath = '';
                  let areaPath = '';

                  if (n === 1) {
                    const p = points[0];
                    linePath = `M 45,${p.y} L 520,${p.y}`;
                  } else {
                    linePath = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`), '');
                    areaPath = `${linePath} L ${points[n - 1].x},140 L ${points[0].x},140 Z`;
                  }

                  return (
                    <>
                      {/* Area Fill under line */}
                      {n > 1 && <path d={areaPath} fill="url(#lineProgressGrad)" />}

                      {/* Main Trend Line */}
                      <path
                        d={linePath}
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth={n === 1 ? '1.5' : '3'}
                        strokeDasharray={n === 1 ? '4 4' : 'none'}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Points and Labels */}
                      {points.map((p) => (
                        <g key={p.month} className="transition-all cursor-pointer">
                          {/* Outer pulse circle */}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="6"
                            className="fill-white stroke-blue-600 stroke-[2.5]"
                          />
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="2.5"
                            className="fill-blue-600"
                          />

                          {/* Value tag above point */}
                          <rect
                            x={p.x - 18}
                            y={p.y - 24}
                            width="36"
                            height="16"
                            rx="4"
                            className="fill-blue-50 stroke-blue-200 stroke-1"
                          />
                          <text
                            x={p.x}
                            y={p.y - 12}
                            textAnchor="middle"
                            className="text-[10px] font-bold fill-blue-700 font-mono"
                          >
                            {p.avgProgress}%
                          </text>

                          {/* Month Label below */}
                          <text
                            x={p.x}
                            y="160"
                            textAnchor="middle"
                            className="text-[11px] font-medium fill-slate-600 font-mono"
                          >
                            T{p.month}
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>

          <div className="mt-2 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Tiến độ trung bình sắp xếp thời gian tăng dần</span>
            <span className="font-semibold text-blue-600 font-mono">100% dữ liệu thực</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. KHU VỰC 3 BIỂU ĐỒ (ĐƠN VỊ, TRẠNG THÁI & LÃNH ĐẠO)       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Biểu đồ 1: Tiến độ theo Phòng ban / Đơn vị */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">TIẾN ĐỘ THEO ĐƠN VỊ / PHÒNG BAN</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">{deptStats.length} đơn vị</span>
            </div>

            <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
              {deptStats.map((item) => (
                <div key={item.department} className="text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-slate-800 truncate" title={item.department}>
                        {item.department}
                      </span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono shrink-0">
                        {item.total} việc
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-slate-500 font-mono text-[11px]">
                        {item.completed}/{item.total}
                      </span>
                      <span
                        className={`font-mono font-bold min-w-[34px] text-right ${
                          item.avgProgress >= 80
                            ? 'text-emerald-600'
                            : item.avgProgress >= 50
                            ? 'text-blue-600'
                            : item.delayed > 0
                            ? 'text-rose-600'
                            : 'text-slate-700'
                        }`}
                      >
                        {item.avgProgress}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${item.avgProgress}%` }}
                      className={`rounded-full transition-all duration-300 ${
                        item.avgProgress >= 80
                          ? 'bg-emerald-600'
                          : item.avgProgress >= 40
                          ? 'bg-blue-600'
                          : 'bg-amber-500'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {topVolumeDept && (
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Đơn vị nhiều việc nhất:</span>
              <strong className="text-slate-800">{topVolumeDept.department} ({topVolumeDept.total} việc)</strong>
            </div>
          )}
        </div>

        {/* Biểu đồ 2: Phân bố Trạng thái Nhiệm vụ (Multi-Bar & Thẻ) */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">PHÂN BỐ TRẠNG THÁI NHIỆM VỤ</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">{total} việc</span>
            </div>

            {/* Visual Multi-Bar */}
            <div className="h-4 w-full bg-slate-100 rounded-lg overflow-hidden flex shadow-inner mb-4">
              {completed > 0 && (
                <div
                  style={{ width: `${(completed / total) * 100}%` }}
                  className="bg-emerald-600 transition-all duration-300"
                  title={`Hoàn thành: ${completed} (${Math.round((completed / total) * 100)}%)`}
                />
              )}
              {inProgress > 0 && (
                <div
                  style={{ width: `${(inProgress / total) * 100}%` }}
                  className="bg-blue-600 transition-all duration-300"
                  title={`Đang thực hiện: ${inProgress} (${Math.round((inProgress / total) * 100)}%)`}
                />
              )}
              {delayed > 0 && (
                <div
                  style={{ width: `${(delayed / total) * 100}%` }}
                  className="bg-rose-500 transition-all duration-300"
                  title={`Chậm tiến độ: ${delayed} (${Math.round((delayed / total) * 100)}%)`}
                />
              )}
              {paused > 0 && (
                <div
                  style={{ width: `${(paused / total) * 100}%` }}
                  className="bg-amber-500 transition-all duration-300"
                  title={`Tạm hoãn: ${paused} (${Math.round((paused / total) * 100)}%)`}
                />
              )}
              {pending > 0 && (
                <div
                  style={{ width: `${(pending / total) * 100}%` }}
                  className="bg-slate-300 transition-all duration-300"
                  title={`Chưa cập nhật: ${pending} (${Math.round((pending / total) * 100)}%)`}
                />
              )}
            </div>

            {/* Breakdown Cards */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span className="font-medium text-slate-700">Hoàn thành</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <strong className="text-emerald-700">{completed} việc</strong>
                  <span className="text-slate-400">({total > 0 ? Math.round((completed / total) * 100) : 0}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 border border-blue-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span className="font-medium text-slate-700">Đang thực hiện</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <strong className="text-blue-700">{inProgress} việc</strong>
                  <span className="text-slate-400">({total > 0 ? Math.round((inProgress / total) * 100) : 0}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="font-medium text-slate-700">Chưa cập nhật (0%)</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <strong className="text-slate-700">{pending} việc</strong>
                  <span className="text-slate-400">({total > 0 ? Math.round((pending / total) * 100) : 0}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/50 border border-rose-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="font-medium text-slate-700">Chậm tiến độ</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <strong className="text-rose-700">{delayed} việc</strong>
                  <span className="text-slate-400">({total > 0 ? Math.round((delayed / total) * 100) : 0}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 border border-amber-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="font-medium text-slate-700">Tạm hoãn</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <strong className="text-amber-700">{paused} việc</strong>
                  <span className="text-slate-400">({total > 0 ? Math.round((paused / total) * 100) : 0}%)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Tỷ lệ hoàn thành:</span>
            <strong className="text-emerald-700 font-mono font-semibold">{completionRate}%</strong>
          </div>
        </div>

        {/* Biểu đồ 3: Nhiệm vụ theo Lãnh đạo chỉ đạo */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">PHÂN CÔNG LÃNH ĐẠO CHỈ ĐẠO</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">{leaderStats.length} Lãnh đạo</span>
            </div>

            <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
              {leaderStats.map((item) => (
                <div key={item.leader} className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/80 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900" title={item.leader}>
                      {formatExecutiveName(item.leader)}
                    </span>
                    <span className="font-mono font-bold text-blue-700 text-[11px] tabular-nums">
                      {item.total} việc ({item.share}%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 mb-1 text-[11px]">
                    <span>
                      Đã xong: <strong className="text-emerald-700 font-mono">{item.completed}</strong> việc
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-slate-800">
                      Tiến độ TB: {item.avgProgress}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${item.avgProgress}%` }}
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {topProgressDept && (
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Đơn vị tiến độ cao nhất:</span>
              <strong className="text-emerald-700">{topProgressDept.department} ({topProgressDept.avgProgress}%)</strong>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. KHU VỰC “CÔNG VIỆC CẦN CHÚ Ý” (NỔI BẬT DÀNH CHO LÃNH ĐẠO)*/}
      {/* ======================================================== */}
      <div className="bg-white border-2 border-amber-300/80 rounded-xl p-5 shadow-sm relative overflow-hidden">
        {/* Subtle Accent Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-rose-500 to-amber-400" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">DANH MỤC CÔNG VIỆC CẦN CHÚ Ý & ĐÔN ĐỐC</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-rose-100 text-rose-700 border border-rose-200">
                  {categorizedAttention.all.length} nhiệm vụ
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Các nhiệm vụ quá hạn, sắp đến hạn, vướng mắc hoặc chưa cập nhật cần Ban Lãnh đạo chỉ đạo tháo gỡ
              </p>
            </div>
          </div>

          {/* Sub-Tabs: Quá hạn, Sắp đến hạn, Chưa cập nhật lâu, Có vướng mắc */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-medium self-start md:self-auto">
            <button
              onClick={() => setAttentionTab('all')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                attentionTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({categorizedAttention.all.length})
            </button>
            <button
              onClick={() => setAttentionTab('overdue')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                attentionTab === 'overdue'
                  ? 'bg-rose-600 text-white font-semibold shadow-xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <span>Quá hạn</span>
              <span className="font-mono font-bold">({categorizedAttention.overdue.length})</span>
            </button>
            <button
              onClick={() => setAttentionTab('dueSoon')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                attentionTab === 'dueSoon'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <span>Sắp đến hạn</span>
              <span className="font-mono font-bold">({categorizedAttention.dueSoon.length})</span>
            </button>
            <button
              onClick={() => setAttentionTab('issues')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                attentionTab === 'issues'
                  ? 'bg-purple-600 text-white font-semibold shadow-xs'
                  : 'text-purple-700 hover:bg-purple-50'
              }`}
            >
              <span>Có vướng mắc</span>
              <span className="font-mono font-bold">({categorizedAttention.issues.length})</span>
            </button>
            <button
              onClick={() => setAttentionTab('unupdated')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                attentionTab === 'unupdated'
                  ? 'bg-slate-700 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Chưa cập nhật lâu</span>
              <span className="font-mono font-bold">({categorizedAttention.unupdated.length})</span>
            </button>
          </div>
        </div>

        {/* Attention Tasks List Items */}
        {currentAttentionList.length === 0 ? (
          <div className="py-10 text-center text-slate-500 bg-slate-50/80 rounded-xl border border-dashed border-slate-200">
            <CheckCircle className="w-9 h-9 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">Không có nhiệm vụ nào phát sinh cảnh báo trong mục này</p>
            <p className="text-xs text-slate-400 mt-1">Các phòng ban đang bám sát đúng mốc tiến độ theo kết luận giao ban.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto pr-1">
            {currentAttentionList.map(({ task, reason }) => {
              const isOverdue = task.status === 'Chậm tiến độ' || reason.includes('quá hạn');
              const isIssue = reason.includes('Vướng mắc') || task.priority === 'Khẩn cấp';
              const isDueSoon = reason.includes('Hạn chót trong');

              return (
                <div
                  key={task.code}
                  onClick={() => onOpenDetail && onOpenDetail(task)}
                  className="py-3 px-3 hover:bg-amber-50/40 rounded-lg transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-3 group cursor-pointer border border-transparent hover:border-amber-200"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                        {task.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                        {task.department}
                      </span>

                      {/* Lý do cảnh báo */}
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                          isOverdue
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : isIssue
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : isDueSoon
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>{reason}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-900 font-medium line-clamp-2 leading-relaxed">
                      {task.task}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                      <span>
                        Chỉ đạo: <strong className="text-slate-800">{formatExecutiveName(task.directedBy)}</strong>
                      </span>
                      {task.deadline && (
                        <span>
                          Hạn chót: <strong className="text-rose-600 font-mono font-semibold">{task.deadline}</strong>
                        </span>
                      )}
                      {task.implementationTime && (
                        <span>Thời gian TH: <strong className="text-slate-700">{task.implementationTime}</strong></span>
                      )}
                      {task.notes && task.notes.length > 0 && (
                        <span className="text-blue-600 font-medium">{task.notes.length} ghi chú/nhật ký</span>
                      )}
                    </div>
                  </div>

                  {/* Tiến độ & Mũi tên xem chi tiết */}
                  <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-slate-800">{task.progress}%</div>
                      <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full transition-all ${
                            task.progress >= 70
                              ? 'bg-emerald-600'
                              : task.progress > 0
                              ? 'bg-blue-600'
                              : 'bg-slate-400'
                          }`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>

                    {onOpenDetail && (
                      <div className="p-2 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all rounded-lg group-hover:bg-blue-50">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 6. KHỐI NHẬN ĐỊNH ĐIỀU HÀNH TỔNG QUAN                     */}
      {/* ======================================================== */}
      <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-700">
        <div className="font-bold flex items-center gap-1.5 mb-1.5 text-blue-900 uppercase tracking-tight">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>NHẬN ĐỊNH TỔNG QUAN DÀNH CHO BAN LÃNH ĐẠO (DỮ LIỆU THỰC TẾ):</span>
        </div>
        <p className="text-slate-600 leading-relaxed">
          Kỳ giao ban hiện tại ghi nhận <strong>{total}</strong> nhiệm vụ đã giao đơn vị chủ trì với tiến độ bình quân toàn Công ty đạt{' '}
          <strong className="text-slate-900 font-mono font-semibold">{avgProgress}%</strong> (Đã hoàn thành <strong>{completed}</strong> việc, đang triển khai <strong>{inProgress}</strong> việc).
          {topVolumeDept && (
            <> Khối lượng công việc tập trung cao nhất tại <strong>{topVolumeDept.department}</strong> ({topVolumeDept.total} nhiệm vụ).</>
          )}
          {topProgressDept && (
            <> Đơn vị có tỷ lệ hoàn thành xuất sắc nhất là <strong>{topProgressDept.department}</strong> (đạt tiến độ TB {topProgressDept.avgProgress}%).</>
          )}
          {categorizedAttention.all.length > 0 ? (
            <> Toàn hệ thống có <strong>{categorizedAttention.all.length} nhiệm vụ cần chú ý</strong> (trong đó có {categorizedAttention.overdue.length} việc chậm tiến độ/quá hạn và {categorizedAttention.issues.length} việc có vướng mắc phát sinh). Ban Tổng Giám đốc và các Lãnh đạo phụ trách cần trực tiếp chỉ đạo đôn đốc tháo gỡ điểm nghẽn.</>
          ) : (
            <> Không có nhiệm vụ nào bị quá hạn hay phát sinh vướng mắc nghiêm trọng.</>
          )}
        </p>
      </div>
    </div>
  );
};
