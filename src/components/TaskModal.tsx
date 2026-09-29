import React, { useState, useEffect } from 'react';
import { TaskItem, TaskStatus } from '../types/task';
import { X, Check, Save } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: TaskItem) => void;
  taskToEdit?: TaskItem | null;
  departments: string[];
  leaders: string[];
  nextCode?: string;
  defaultDepartment?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  departments,
  leaders,
  nextCode = '09/2026-048',
  defaultDepartment = 'Phòng Tổng hợp',
}) => {
  const isEditing = Boolean(taskToEdit);

  const [formData, setFormData] = useState<Partial<TaskItem>>({
    code: nextCode,
    month: '09/2026',
    title: 'Thông báo kết luận họp giao ban trực tuyến tháng 9/2026',
    department: defaultDepartment,
    itemNo: 1,
    task: '',
    collaborators: '',
    directedBy: leaders[0] || 'Tổng Giám đốc Nguyễn Anh Tuấn',
    implementationTime: 'Trong tháng 9/2026',
    deadline: '',
    milestone: '',
    status: 'Chưa cập nhật' as TaskStatus,
    progress: 0,
    pageReference: 'Phụ lục - trang 1',
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskToEdit) {
      setFormData({ ...taskToEdit });
    } else {
      setFormData({
        code: nextCode,
        month: '09/2026',
        title: 'Thông báo kết luận họp giao ban trực tuyến tháng 9/2026',
        department: defaultDepartment || departments[0] || 'Phòng Tổng hợp',
        itemNo: 1,
        task: '',
        collaborators: '',
        directedBy: leaders[0] || 'Tổng Giám đốc Nguyễn Anh Tuấn',
        implementationTime: 'Trong tháng 9/2026',
        deadline: '',
        milestone: '',
        status: 'Chưa cập nhật',
        progress: 0,
        pageReference: 'Phụ lục - trang 1',
      });
    }
    setError(null);
  }, [taskToEdit, nextCode, defaultDepartment, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code?.trim()) {
      setError('Vui lòng nhập mã nhiệm vụ (vd: 09/2026-001)');
      return;
    }
    if (!formData.task?.trim()) {
      setError('Vui lòng nhập nội dung công việc');
      return;
    }
    if (!formData.department?.trim()) {
      setError('Vui lòng chọn hoặc nhập đơn vị chủ trì');
      return;
    }

    // Auto-update status if progress is 100% and still marked as 'Chưa cập nhật'
    let finalStatus = formData.status || 'Chưa cập nhật';
    const finalProgress = Number(formData.progress) || 0;
    if (finalProgress === 100 && finalStatus !== 'Hoàn thành') {
      finalStatus = 'Hoàn thành';
    } else if (finalProgress > 0 && finalProgress < 100 && finalStatus === 'Chưa cập nhật') {
      finalStatus = 'Đang thực hiện';
    }

    onSave({
      code: formData.code.trim(),
      month: formData.month?.trim() || '09/2026',
      title: formData.title?.trim() || 'Thông báo kết luận họp giao ban',
      department: formData.department.trim(),
      itemNo: Number(formData.itemNo) || 1,
      task: formData.task.trim(),
      collaborators: formData.collaborators?.trim() || '',
      directedBy: formData.directedBy?.trim() || leaders[0] || '',
      implementationTime: formData.implementationTime?.trim() || 'Trong tháng 9/2026',
      deadline: formData.deadline?.trim() || '',
      milestone: formData.milestone?.trim() || '',
      status: finalStatus,
      progress: finalProgress,
      pageReference: formData.pageReference?.trim() || 'Phụ lục - trang 1',
      taskType: formData.taskType,
      notes: formData.notes || [],
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isEditing ? `Chỉnh sửa nhiệm vụ [${taskToEdit?.code}]` : 'Thêm nhiệm vụ mới'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi và cập nhật theo kết luận họp giao ban VNPD
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Grid 1: Mã việc & Tháng & Số TT */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mã nhiệm vụ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="09/2026-001"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kỳ tháng</label>
                <input
                  type="text"
                  value={formData.month || ''}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  placeholder="09/2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số TT trong phụ lục</label>
                <input
                  type="number"
                  min="1"
                  value={formData.itemNo ?? 1}
                  onChange={(e) => setFormData({ ...formData, itemNo: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                />
              </div>
            </div>

            {/* Grid 2: Department & Directed By */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Đơn vị chủ trì <span className="text-rose-500">*</span>
                </label>
                <input
                  list="departments-list"
                  type="text"
                  value={formData.department || ''}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Chọn hoặc nhập phòng ban"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                <datalist id="departments-list">
                  {departments.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lãnh đạo chỉ đạo
                </label>
                <input
                  list="leaders-list"
                  type="text"
                  value={formData.directedBy || ''}
                  onChange={(e) => setFormData({ ...formData, directedBy: e.target.value })}
                  placeholder="Chọn lãnh đạo chỉ đạo"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                <datalist id="leaders-list">
                  {leaders.map((l) => (
                    <option key={l} value={l} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Task Content */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nội dung nhiệm vụ / công việc <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.task || ''}
                onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                placeholder="Mô tả cụ thể nội dung kết luận họp và nhiệm vụ cần triển khai..."
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 leading-relaxed"
              />
            </div>

            {/* Milestone */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mốc hoàn thành / Kết quả đầu ra (Milestone)
              </label>
              <input
                type="text"
                value={formData.milestone || ''}
                onChange={(e) => setFormData({ ...formData, milestone: e.target.value })}
                placeholder="Ví dụ: Ban hành quy định, Hoàn thiện hồ sơ quyết toán..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Collaborators & Page Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Đơn vị phối hợp</label>
                <input
                  type="text"
                  value={formData.collaborators || ''}
                  onChange={(e) => setFormData({ ...formData, collaborators: e.target.value })}
                  placeholder="Các phòng, đơn vị liên quan, nhà thầu..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tham chiếu văn bản</label>
                <input
                  type="text"
                  value={formData.pageReference || ''}
                  onChange={(e) => setFormData({ ...formData, pageReference: e.target.value })}
                  placeholder="Phụ lục - trang 1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Implementation Time & Deadline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Thời gian thực hiện</label>
                <input
                  type="text"
                  value={formData.implementationTime || ''}
                  onChange={(e) => setFormData({ ...formData, implementationTime: e.target.value })}
                  placeholder="Trong tháng 9/2026, Thường xuyên..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hạn chót (Deadline nếu có)</label>
                <input
                  type="text"
                  value={formData.deadline || ''}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  placeholder="dd/mm/yyyy hoặc ghi chú hạn"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                />
              </div>
            </div>

            {/* Status & Progress */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trạng thái</label>
                  <select
                    value={formData.status || 'Chưa cập nhật'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
                  >
                    <option value="Chưa cập nhật">Chưa cập nhật</option>
                    <option value="Chưa thực hiện">Chưa thực hiện</option>
                    <option value="Đang thực hiện">Đang thực hiện</option>
                    <option value="Hoàn thành">Hoàn thành</option>
                    <option value="Chậm tiến độ">Chậm tiến độ</option>
                    <option value="Tạm hoãn">Tạm hoãn</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Tiến độ thực hiện</label>
                    <span className="font-mono font-bold text-blue-600 tabular-nums">
                      {formData.progress || 0}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formData.progress || 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const updatedStatus =
                        val === 100
                          ? 'Hoàn thành'
                          : val > 0 && formData.status === 'Chưa cập nhật'
                          ? 'Đang thực hiện'
                          : formData.status;
                      setFormData({
                        ...formData,
                        progress: val,
                        status: updatedStatus,
                      });
                    }}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>0% (Chưa làm)</span>
                    <span>50% (Đang làm)</span>
                    <span>100% (Hoàn thành)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Lưu thay đổi' : 'Tạo nhiệm vụ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
