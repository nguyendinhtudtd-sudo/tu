import React, { useState } from 'react';

import { TaskItem } from '../types/task';

import { processMeetingPdf } from '../services/n8nApi';

import { downloadJSON, downloadCSV } from '../utils/taskStorage';

import {
  X,
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  RotateCcw,
  Check,
  AlertTriangle,
} from 'lucide-react';


interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onImportTasks: (newTasks: TaskItem[], overwrite: boolean) => void;
  onResetToDefault: () => void;
}


export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onImportTasks,
  onResetToDefault,
}) => {
  const [activeTab, setActiveTab] =
    useState<'export' | 'import' | 'reset'>('export');

  const [jsonInput, setJsonInput] = useState('');

  const [importMode, setImportMode] =
    useState<'replace' | 'merge'>('replace');

  const [importError, setImportError] =
    useState<string | null>(null);

  const [importSuccess, setImportSuccess] =
    useState<string | null>(null);

  // Trạng thái xử lý PDF qua n8n
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);


  if (!isOpen) return null;


  // ============================================================
  // 1. ĐỌC FILE JSON TỪ MÁY TÍNH
  // ============================================================

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;

        setJsonInput(text);
        setImportError(null);
      } catch (err) {
        setImportError(
          'Không thể đọc tệp tin. Vui lòng chọn tệp tin JSON hợp lệ.'
        );
      }
    };

    reader.readAsText(file);
  };


  // ============================================================
  // 2. GỬI PDF SANG n8n
  // ============================================================

  const handlePdfUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setImportError('Vui lòng chọn đúng tệp PDF.');
      e.target.value = '';
      return;
    }

    setImportError(null);
    setImportSuccess(null);
    setIsPdfProcessing(true);

    try {
      // Gửi PDF sang Production Webhook n8n
      // n8n xử lý PDF -> AI -> JSON -> trả TaskItem[]
      const newTasks = await processMeetingPdf(file);

      if (!Array.isArray(newTasks)) {
        setImportError(
          'Dữ liệu n8n trả về không đúng định dạng danh sách nhiệm vụ.'
        );
        return;
      }

      if (newTasks.length === 0) {
        setImportError(
          'n8n đã xử lý nhưng không trả về nhiệm vụ nào.'
        );
        return;
      }

      // Kiểm tra tối thiểu dữ liệu trả về
      const invalidItem = newTasks.find(
        (item) => !item.code || !item.task
      );

      if (invalidItem) {
        setImportError(
          'Dữ liệu n8n trả về có nhiệm vụ thiếu trường "code" hoặc "task".'
        );
        return;
      }

      // Đưa dữ liệu n8n vào TaskFlow
      onImportTasks(
        newTasks,
        importMode === 'replace'
      );

      setImportSuccess(
        `Đã xử lý PDF qua n8n và nhập thành công ${newTasks.length} nhiệm vụ vào TaskFlow!`
      );

      // Chưa tự đóng modal ngay để anh nhìn được kết quả
      // Có thể đóng thủ công sau khi kiểm tra
    } catch (err: any) {
      console.error('Lỗi xử lý PDF qua n8n:', err);

      setImportError(
        `Không thể xử lý PDF qua n8n: ${
          err?.message || 'Lỗi không xác định'
        }`
      );
    } finally {
      setIsPdfProcessing(false);

      // Cho phép chọn lại chính file vừa chọn nếu cần test lại
      e.target.value = '';
    }
  };


  // ============================================================
  // 3. NHẬP JSON THỦ CÔNG
  // ============================================================

  const handleExecuteImport = () => {
    setImportError(null);
    setImportSuccess(null);

    if (!jsonInput.trim()) {
      setImportError(
        'Vui lòng dán nội dung JSON hoặc tải lên tệp tin.'
      );
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);

      if (!Array.isArray(parsed)) {
        setImportError(
          'Dữ liệu JSON phải là một mảng danh sách các nhiệm vụ ([ ... ]).'
        );
        return;
      }

      if (parsed.length === 0) {
        setImportError(
          'Mảng JSON không chứa nhiệm vụ nào.'
        );
        return;
      }

      // Check schema validity
      const invalidItem = parsed.find(
        (item) => !item.code || !item.task
      );

      if (invalidItem) {
        setImportError(
          'Mỗi mục trong danh sách bắt buộc phải có ít nhất trường "code" và "task".'
        );
        return;
      }

      const formattedTasks: TaskItem[] = parsed.map(
        (item, idx) => ({
          code: String(
            item.code ||
              `09/2026-${String(idx + 1).padStart(3, '0')}`
          ),

          month: String(
            item.month || '09/2026'
          ),

          title: String(
            item.title ||
              'Thông báo kết luận họp giao ban'
          ),

          department: String(
            item.department || 'Phòng Tổng hợp'
          ),

          itemNo:
            Number(item.itemNo) || idx + 1,

          task: String(
            item.task || ''
          ),

          collaborators: String(
            item.collaborators || ''
          ),

          directedBy: String(
            item.directedBy || ''
          ),

          implementationTime: String(
            item.implementationTime || ''
          ),

          deadline: String(
            item.deadline || ''
          ),

          milestone: String(
            item.milestone || ''
          ),

          status:
            item.status || 'Chưa cập nhật',

          progress:
            Number(item.progress) || 0,

          pageReference: String(
            item.pageReference || ''
          ),

          priority:
            item.priority,

          notes:
            Array.isArray(item.notes)
              ? item.notes
              : [],

          updatedAt:
            item.updatedAt,
        })
      );

      onImportTasks(
        formattedTasks,
        importMode === 'replace'
      );

      setImportSuccess(
        `Đã nhập thành công ${formattedTasks.length} nhiệm vụ vào hệ thống!`
      );

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setImportError(
        `Cú pháp JSON không hợp lệ: ${err.message}`
      );
    }
  };


  // ============================================================
  // GIAO DIỆN
  // ============================================================

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">

      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Quản Lý & Xuất/Nhập Dữ Liệu
            </h2>

            <p className="text-xs text-slate-500 mt-0.5">
              Định dạng chuẩn theo kết cấu JSON giao ban của VNPD
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

        </div>


        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 px-6 pt-3 gap-4 text-xs font-semibold">

          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'export'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất dữ liệu</span>
          </button>


          <button
            onClick={() => setActiveTab('import')}
            className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'import'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Nhập dữ liệu</span>
          </button>


          <button
            onClick={() => setActiveTab('reset')}
            className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'reset'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục gốc</span>
          </button>

        </div>


        {/* Content */}
        <div className="p-6 text-xs">


          {/* =====================================================
              TAB 1: EXPORT
          ====================================================== */}

          {activeTab === 'export' && (

            <div className="space-y-4">

              <p className="text-slate-600">
                Tải về toàn bộ danh sách gồm{' '}
                <strong className="text-slate-900 font-mono">
                  {tasks.length} nhiệm vụ
                </strong>{' '}
                hiện tại kèm tiến độ và ghi chú cập nhật:
              </p>


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <button
                  type="button"
                  onClick={() => downloadJSON(tasks)}
                  className="flex flex-col items-center justify-center p-4 border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 rounded-xl transition-all cursor-pointer group text-center"
                >
                  <FileJson className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-105 transition-transform" />

                  <span className="font-bold text-slate-900 group-hover:text-blue-600">
                    Tệp JSON gốc
                  </span>

                  <span className="text-[11px] text-slate-500 mt-1">
                    Chuẩn định dạng JSON đã cung cấp, tái sử dụng trực tiếp
                  </span>
                </button>


                <button
                  type="button"
                  onClick={() => downloadCSV(tasks)}
                  className="flex flex-col items-center justify-center p-4 border border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/50 rounded-xl transition-all cursor-pointer group text-center"
                >
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600 mb-2 group-hover:scale-105 transition-transform" />

                  <span className="font-bold text-slate-900 group-hover:text-emerald-600">
                    Tệp Excel / CSV
                  </span>

                  <span className="text-[11px] text-slate-500 mt-1">
                    Mở bằng Microsoft Excel
                    (hỗ trợ đầy đủ tiếng Việt UTF-8)
                  </span>
                </button>

              </div>

            </div>
          )}


          {/* =====================================================
              TAB 2: IMPORT
          ====================================================== */}

          {activeTab === 'import' && (

            <div className="space-y-3.5">


              {/* Thông báo lỗi */}
              {importError && (

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">

                  {importError}

                </div>
              )}


              {/* Thông báo thành công */}
              {importSuccess && (

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold flex items-center gap-2">

                  <Check className="w-4 h-4" />

                  <span>
                    {importSuccess}
                  </span>

                </div>
              )}


              {/* =================================================
                  NHẬP PDF QUA n8n
              ================================================== */}

              <div className="p-4 border border-blue-200 bg-blue-50/50 rounded-xl">

                <label className="block font-bold text-slate-800 mb-1">
                  Nhập Thông báo giao ban PDF qua n8n
                </label>

                <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                  Chọn file PDF thông báo giao ban.
                  TaskFlow sẽ gửi file sang n8n,
                  AI tự động phân tích và trả danh sách
                  nhiệm vụ về Web.
                </p>


                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handlePdfUpload}
                  disabled={isPdfProcessing}
                  className="
                    block w-full
                    text-xs text-slate-500
                    file:mr-4
                    file:py-1.5
                    file:px-3
                    file:rounded-md
                    file:border-0
                    file:text-xs
                    file:font-semibold
                    file:bg-blue-600
                    file:text-white
                    hover:file:bg-blue-700
                    cursor-pointer
                    disabled:opacity-50
                  "
                />


                {isPdfProcessing && (

                  <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-blue-700">

                    <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />

                    <span>
                      Đang gửi PDF sang n8n và chờ AI xử lý...
                    </span>

                  </div>
                )}

              </div>


              {/* Ngăn cách */}
              <div className="flex items-center gap-3 py-1">

                <div className="h-px bg-slate-200 flex-1" />

                <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                  Hoặc nhập JSON thủ công
                </span>

                <div className="h-px bg-slate-200 flex-1" />

              </div>


              {/* =================================================
                  NHẬP JSON TỪ FILE
              ================================================== */}

              <div>

                <label className="block font-semibold text-slate-700 mb-1">
                  Chọn tệp JSON từ máy tính:
                </label>

                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />

              </div>


              {/* Dán JSON */}
              <div>

                <label className="block font-semibold text-slate-700 mb-1">
                  Hoặc dán trực tiếp chuỗi JSON:
                </label>

                <textarea
                  rows={5}
                  value={jsonInput}
                  onChange={(e) =>
                    setJsonInput(e.target.value)
                  }
                  placeholder='[ { "code": "09/2026-001", "task": "...", "department": "..." } ]'
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono text-[11px]"
                />

              </div>


              {/* Phương thức nhập */}
              <div>

                <label className="block font-semibold text-slate-700 mb-1">
                  Phương thức nhập:
                </label>

                <div className="flex gap-4">

                  <label className="flex items-center gap-1.5 cursor-pointer">

                    <input
                      type="radio"
                      name="importMode"
                      checked={
                        importMode === 'replace'
                      }
                      onChange={() =>
                        setImportMode('replace')
                      }
                      className="text-blue-600"
                    />

                    <span>
                      Thay thế toàn bộ danh sách hiện tại
                    </span>

                  </label>


                  <label className="flex items-center gap-1.5 cursor-pointer">

                    <input
                      type="radio"
                      name="importMode"
                      checked={
                        importMode === 'merge'
                      }
                      onChange={() =>
                        setImportMode('merge')
                      }
                      className="text-blue-600"
                    />

                    <span>
                      Nối thêm vào danh sách
                    </span>

                  </label>

                </div>

              </div>


              {/* Nút nhập JSON */}
              <button
                type="button"
                onClick={handleExecuteImport}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5 mt-2"
              >

                <Upload className="w-3.5 h-3.5" />

                <span>
                  Tiến hành nhập JSON
                </span>

              </button>

            </div>
          )}


          {/* =====================================================
              TAB 3: RESET
          ====================================================== */}

          {activeTab === 'reset' && (

            <div className="space-y-4">


              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">

                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />

                <div className="text-amber-800 text-xs">

                  <p className="font-bold">
                    Khôi phục về 47 kết luận họp giao ban ban đầu
                  </p>

                  <p className="mt-1 leading-relaxed">
                    Hành động này sẽ thiết lập lại toàn bộ
                    dữ liệu ban đầu theo đúng danh sách kết
                    luận họp giao ban trực tuyến tháng
                    09/2026 của VNPD. Mọi chỉnh sửa tự tạo
                    thêm sẽ được đặt lại.
                  </p>

                </div>

              </div>


              <button
                type="button"
                onClick={() => {

                  if (
                    window.confirm(
                      'Xác nhận khôi phục về danh sách 47 nhiệm vụ ban đầu?'
                    )
                  ) {

                    onResetToDefault();

                    onClose();
                  }

                }}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >

                <RotateCcw className="w-3.5 h-3.5" />

                <span>
                  Xác nhận khôi phục 47 nhiệm vụ gốc
                </span>

              </button>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};