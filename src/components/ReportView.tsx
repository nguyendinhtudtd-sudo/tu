import React, { useState } from 'react';
import { TaskItem } from '../types/task';
import { Printer, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { sendTelegramReport } from '../services/n8nApi';

interface ReportViewProps {
  tasks: TaskItem[];
  departments: string[];
  currentMonth: string;
  onNotify?: (type: 'syncing' | 'success' | 'error' | 'info', message: string, description?: string) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  tasks,
  departments,
  currentMonth,
  onNotify,
}) => {
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handlePrint = () => {
    window.print();
  };

  const completed = tasks.filter((t) => t.status === 'Hoàn thành' || t.progress === 100).length;
  const inProgress = tasks.filter((t) => t.status === 'Đang thực hiện').length;
  const delayed = tasks.filter((t) => t.status === 'Chậm tiến độ').length;
  const avg = tasks.length > 0 ? Math.round(tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length) : 0;

  const handleSendTelegram = async () => {
    setIsSendingTelegram(true);
    setTelegramStatus('idle');
    if (onNotify) {
      onNotify('syncing', 'Đang gửi báo cáo vào Telegram...', 'Đang tổng hợp số liệu kỳ giao ban');
    }

    try {
      await sendTelegramReport({
        month: currentMonth,
        totalTasks: tasks.length,
        completedTasks: completed,
        inProgressTasks: inProgress,
        delayedTasks: delayed,
        averageProgress: avg,
        departmentsCount: departments.length,
        sentAt: new Date().toISOString(),
      });

      setTelegramStatus('success');
      if (onNotify) {
        onNotify('success', 'Đã bắn báo cáo vào Telegram thành công!', `Tổng hợp ${tasks.length} nhiệm vụ tháng ${currentMonth}`);
      }
      setTimeout(() => setTelegramStatus('idle'), 4000);
    } catch (error) {
      console.error('Lỗi gửi Telegram:', error);
      setTelegramStatus('error');
      if (onNotify) {
        onNotify('error', 'Không thể gửi tin nhắn Telegram', 'Vui lòng kiểm tra lại webhook trên n8n');
      }
      setTimeout(() => setTelegramStatus('idle'), 4000);
    } finally {
      setIsSendingTelegram(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action bar for Report */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-xl shadow-xs print:hidden">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Bản Báo Cáo In & Thông Báo Điều Hành</h2>
          <p className="text-xs text-slate-500">
            Xuất văn bản thể thức giao ban hoặc gửi nhanh báo cáo tóm tắt tới nhóm Telegram Ban Giám đốc
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Nút gửi Telegram */}
          <button
            onClick={handleSendTelegram}
            disabled={isSendingTelegram}
            className={`flex items-center gap-2 px-4 py-2 text-white text-xs font-semibold rounded-lg transition-all shadow-xs cursor-pointer ${
              telegramStatus === 'success'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : telegramStatus === 'error'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-sky-600 hover:bg-sky-700'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isSendingTelegram ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : telegramStatus === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : telegramStatus === 'error' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>
              {isSendingTelegram
                ? 'Đang gửi Telegram...'
                : telegramStatus === 'success'
                ? 'Đã gửi thành công!'
                : telegramStatus === 'error'
                ? 'Gửi thất bại'
                : 'Bắn tin nhắn Telegram'}
            </span>
          </button>

          {/* Nút in báo cáo */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In báo cáo / Lưu PDF (Ctrl+P)</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="bg-white border border-slate-200 p-8 sm:p-12 rounded-xl shadow-sm print:border-none print:shadow-none print:p-0 max-w-5xl mx-auto text-slate-900 text-xs">
        {/* National & Corporate Header */}
        <div className="flex justify-between items-start border-b border-slate-900/20 pb-4 mb-6">
          <div className="flex items-start gap-3 text-left">
            <img src="/logo.png" alt="EVN Development" className="h-12 w-auto object-contain" />
            <div className="font-serif text-[11px] leading-tight">
              <p className="font-bold text-slate-800">CÔNG TY CỔ PHẦN PHÁT TRIỂN ĐIỆN LỰC VIỆT NAM</p>
              <p className="font-semibold text-slate-600 mt-0.5">BAN TỔNG GIÁM ĐỐC</p>
              <p className="text-[10px] text-slate-500 mt-1">Số: .../BC-VNPD</p>
            </div>
          </div>

          <div className="text-center font-serif text-[11px] leading-tight">
            <p className="font-bold text-slate-900 uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="font-bold text-slate-800 mt-0.5">Độc lập - Tự do - Hạnh phúc</p>
            <p className="text-[10px] text-slate-400 mt-1">-------o0o-------</p>
            <p className="text-[10px] text-slate-500 italic mt-1">Hà Nội, ngày 26 tháng 09 năm 2026</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center my-6">
          <h1 className="text-base font-bold font-serif uppercase tracking-wide text-slate-900">
            BÁO CÁO TIẾN ĐỘ THỰC HIỆN KẾT LUẬN HỌP GIAO BAN
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-serif italic">
            Kỳ giao ban trực tuyến tháng {currentMonth}
          </p>
        </div>

        {/* General Summary */}
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg print:border-slate-300">
          <h3 className="font-bold text-slate-900 mb-2">I. ĐÁNH GIÁ CHUNG VỀ TIẾN ĐỘ:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Tổng nhiệm vụ:</span>
              <strong className="font-mono text-sm">{tasks.length} nhiệm vụ</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Đã hoàn thành:</span>
              <strong className="font-mono text-sm text-emerald-700">{completed} nhiệm vụ</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Đang triển khai:</span>
              <strong className="font-mono text-sm text-blue-700">{inProgress} nhiệm vụ</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Tiến độ bình quân:</span>
              <strong className="font-mono text-sm text-slate-900">{avg}%</strong>
            </div>
          </div>
        </div>

        {/* Task List Grouped by Department */}
        <div className="space-y-6">
          <h3 className="font-bold text-slate-900">II. CHI TIẾT TỪNG NHIỆM VỤ THEO ĐƠN VỊ:</h3>

          {departments.map((dept) => {
            const deptTasks = tasks.filter((t) => t.department === dept);
            if (deptTasks.length === 0) return null;

            return (
              <div key={dept} className="space-y-2">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide border-l-2 border-blue-600 pl-2">
                  {dept} ({deptTasks.length} nhiệm vụ)
                </h4>

                <table className="w-full border-collapse border border-slate-300 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 font-semibold text-slate-700 text-center">
                      <th className="border border-slate-300 py-1.5 px-2 w-10">Mã</th>
                      <th className="border border-slate-300 py-1.5 px-3 text-left">Nội dung nhiệm vụ</th>
                      <th className="border border-slate-300 py-1.5 px-2 text-left w-36">Mốc kết quả</th>
                      <th className="border border-slate-300 py-1.5 px-2 text-left w-28">Chỉ đạo</th>
                      <th className="border border-slate-300 py-1.5 px-2 text-left w-24">Thời hạn</th>
                      <th className="border border-slate-300 py-1.5 px-1.5 w-16">Tiến độ</th>
                      <th className="border border-slate-300 py-1.5 px-2 w-24">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptTasks.map((t) => (
                      <tr key={t.code} className="hover:bg-slate-50">
                        <td className="border border-slate-300 py-1.5 px-2 text-center font-mono font-medium">
                          {t.code}
                        </td>
                        <td className="border border-slate-300 py-1.5 px-3 leading-relaxed">
                          {t.task}
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2 text-slate-600 italic">
                          {t.milestone || '—'}
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2 text-slate-700">
                          {t.directedBy}
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2 text-slate-600">
                          {t.implementationTime}
                        </td>
                        <td className="border border-slate-300 py-1.5 px-1.5 text-center font-mono font-bold">
                          {t.progress}%
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2 text-center">
                          <span
                            className={
                              t.status === 'Hoàn thành'
                                ? 'text-emerald-700 font-bold'
                                : t.status === 'Chậm tiến độ'
                                ? 'text-rose-700 font-bold'
                                : t.status === 'Đang thực hiện'
                                ? 'text-blue-700 font-medium'
                                : 'text-slate-600'
                            }
                          >
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        {/* Signature Area */}
        <div className="grid grid-cols-3 gap-6 mt-12 pt-6 text-center font-serif text-[11px] leading-tight">
          <div>
            <p className="font-bold text-slate-800 uppercase">NGƯỜI LẬP BIỂU</p>
            <p className="text-[10px] text-slate-500 italic mt-1">(Ký, ghi rõ họ tên)</p>
            <div className="h-16" />
            <p className="font-medium">Chuyên viên Tổng hợp</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 uppercase">TRƯỞNG PHÒNG TỔNG HỢP</p>
            <p className="text-[10px] text-slate-500 italic mt-1">(Ký, ghi rõ họ tên)</p>
            <div className="h-16" />
            <p className="font-medium">Phòng Tổng hợp</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 uppercase">TỔNG GIÁM ĐỐC</p>
            <p className="text-[10px] text-slate-500 italic mt-1">(Ký, đóng dấu)</p>
            <div className="h-16" />
            <p className="font-bold text-slate-900">Nguyễn Anh Tuấn</p>
          </div>
        </div>
      </div>
    </div>
  );
};
