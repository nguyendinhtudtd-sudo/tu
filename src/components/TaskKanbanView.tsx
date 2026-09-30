import React, { useState } from 'react';
import { TaskItem, TaskStatus } from '../types/task';
import { ProgressBar } from './ProgressBar';
import {
  Clock,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  GripVertical,
  Plus,
  Kanban,
  CornerDownRight,
  Layers,
} from 'lucide-react';

interface TaskKanbanViewProps {
  tasks: TaskItem[];
  allTasks?: TaskItem[];
  onUpdateStatus: (code: string, status: TaskStatus) => void;
  onUpdateProgress: (code: string, progress: number) => void;
  onOpenDetail: (task: TaskItem) => void;
  onOpenEdit: (task: TaskItem) => void;
  onAddNewForStatus?: (status: TaskStatus) => void;
}

interface ColumnConfig {
  key: string;
  title: string;
  targetStatus: TaskStatus;
  color: string;
  bgColor: string;
  borderColor: string;
  activeBorderColor: string;
  icon: React.ReactNode;
  filterFn: (task: TaskItem) => boolean;
}

export const TaskKanbanView: React.FC<TaskKanbanViewProps> = ({
  tasks,
  allTasks,
  onUpdateStatus,
  onUpdateProgress,
  onOpenDetail,
  onOpenEdit,
  onAddNewForStatus,
}) => {
  const [draggedCode, setDraggedCode] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const columns: ColumnConfig[] = [
    {
      key: 'pending',
      title: 'CHƯA THỰC HIỆN / CHƯA CẬP NHẬT',
      targetStatus: 'Chưa thực hiện',
      color: 'text-slate-700',
      bgColor: 'bg-slate-100/60',
      borderColor: 'border-slate-200',
      activeBorderColor: 'border-blue-500 bg-blue-50/20',
      icon: <Clock className="w-4 h-4 text-slate-500" />,
      filterFn: (t) => t.status === 'Chưa cập nhật' || t.status === 'Chưa thực hiện',
    },
    {
      key: 'in_progress',
      title: 'ĐANG THỰC HIỆN',
      targetStatus: 'Đang thực hiện',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50/40',
      borderColor: 'border-blue-200',
      activeBorderColor: 'border-blue-500 bg-blue-100/30',
      icon: <PlayCircle className="w-4 h-4 text-blue-600" />,
      filterFn: (t) => t.status === 'Đang thực hiện',
    },
    {
      key: 'completed',
      title: 'ĐÃ HOÀN THÀNH',
      targetStatus: 'Hoàn thành',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50/40',
      borderColor: 'border-emerald-200',
      activeBorderColor: 'border-emerald-500 bg-emerald-100/30',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      filterFn: (t) => t.status === 'Hoàn thành',
    },
    {
      key: 'delayed',
      title: 'CHẬM TIẾN ĐỘ',
      targetStatus: 'Chậm tiến độ',
      color: 'text-rose-700',
      bgColor: 'bg-rose-50/40',
      borderColor: 'border-rose-200',
      activeBorderColor: 'border-rose-500 bg-rose-100/30',
      icon: <AlertCircle className="w-4 h-4 text-rose-600" />,
      filterFn: (t) => t.status === 'Chậm tiến độ',
    },
    {
      key: 'paused',
      title: 'TẠM HOÃN',
      targetStatus: 'Tạm hoãn',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50/40',
      borderColor: 'border-amber-200',
      activeBorderColor: 'border-amber-500 bg-amber-100/30',
      icon: <PauseCircle className="w-4 h-4 text-amber-600" />,
      filterFn: (t) => t.status === 'Tạm hoãn',
    },
  ];

  const handleDragStart = (e: React.DragEvent, code: string) => {
    setDraggedCode(code);
    e.dataTransfer.setData('text/plain', code);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnKey) {
      setDragOverColumn(columnKey);
    }
  };

  const handleDragLeave = (e: React.DragEvent, columnKey: string) => {
    if (dragOverColumn === columnKey) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, column: ColumnConfig) => {
    e.preventDefault();
    setDragOverColumn(null);
    const code = e.dataTransfer.getData('text/plain') || draggedCode;
    if (code) {
      onUpdateStatus(code, column.targetStatus);
      // Auto-set progress if dropped to completed
      if (column.targetStatus === 'Hoàn thành') {
        onUpdateProgress(code, 100);
      }
    }
    setDraggedCode(null);
  };

  return (
    <div className="space-y-4">
      {/* Dedicated Kanban Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold shrink-0">
            <Kanban className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">BẢNG KANBAN TIẾN ĐỘ THỰC HIỆN</h2>
            <p className="text-xs text-slate-500">Kéo & thả thẻ nhiệm vụ giữa các cột quy trình để cập nhật trạng thái xử lý tức thời</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <span className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 font-mono font-bold text-slate-700">
            {tasks.length} nhiệm vụ trên bảng
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3.5 items-start">
        {columns.map((column) => {
          const columnTasks = tasks.filter(column.filterFn);
          const isOver = dragOverColumn === column.key;

          return (
            <div
              key={column.key}
              onDragOver={(e) => handleDragOver(e, column.key)}
              onDragLeave={(e) => handleDragLeave(e, column.key)}
              onDrop={(e) => handleDrop(e, column)}
              className={`rounded-xl border transition-all duration-150 flex flex-col min-h-[500px] max-h-[82vh] ${
                isOver ? column.activeBorderColor + ' ring-2 ring-blue-500/20 shadow-md' : column.borderColor + ' ' + column.bgColor
              }`}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-slate-200/80 bg-white/80 backdrop-blur-xs rounded-t-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {column.icon}
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${column.color}`}>{column.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-bold text-slate-700 tabular-nums">
                    {columnTasks.length}
                  </span>
                  {onAddNewForStatus && (
                    <button
                      onClick={() => onAddNewForStatus(column.targetStatus)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 cursor-pointer"
                      title={`Thêm việc vào ${column.title}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Column Cards Container */}
              <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1">
                {columnTasks.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 italic border-2 border-dashed border-slate-200/70 rounded-lg">
                    {isOver ? 'Thả vào đây để chuyển' : 'Kéo nhiệm vụ vào đây'}
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.code}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.code)}
                      onDragEnd={() => setDraggedCode(null)}
                      className={`bg-white border border-slate-200 hover:border-blue-300 rounded-lg p-3 shadow-2xs hover:shadow-xs transition-all cursor-grab active:cursor-grabbing group ${
                        draggedCode === task.code ? 'opacity-40 scale-95' : ''
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 cursor-grab" />
                          <div>
                            <div className="text-xs font-bold text-slate-800">
                              {task.department}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Mục {task.itemNo}
                            </div>
                          </div>
                        </div>

                        {/* Quick Move Dropdown */}
                        <select
                          value={task.status}
                          onChange={(e) => onUpdateStatus(task.code, e.target.value as TaskStatus)}
                          className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 focus:outline-none cursor-pointer"
                          title="Chuyển trạng thái cột"
                        >
                          <option value="Chưa cập nhật">Chưa cập nhật</option>
                          <option value="Chưa thực hiện">Chưa thực hiện</option>
                          <option value="Đang thực hiện">Đang thực hiện</option>
                          <option value="Hoàn thành">Hoàn thành</option>
                          <option value="Chậm tiến độ">Chậm tiến độ</option>
                          <option value="Tạm hoãn">Tạm hoãn</option>
                        </select>
                      </div>

                      {/* Hiển thị quan hệ Cha - Con */}
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
                                  className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/70 px-1.5 py-0.5 rounded font-medium max-w-full truncate cursor-pointer transition-colors"
                                  title="Bấm để mở nhiệm vụ cha"
                                >
                                  <CornerDownRight className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                                  <span className="truncate">Thuộc: {parentTask.task}</span>
                                </button>
                              </div>
                            )}

                            {/* Task Description */}
                            <p
                              onClick={() => onOpenDetail(task)}
                              className="text-xs text-slate-900 font-medium line-clamp-3 leading-snug hover:text-blue-600 cursor-pointer"
                              title={task.task}
                            >
                              {task.task}
                            </p>

                            {childCount > 0 && (
                              <div className="mt-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                                  <Layers className="w-2.5 h-2.5 text-indigo-500" />
                                  <span>{childCount} nhiệm vụ con</span>
                                </span>
                              </div>
                            )}
                          </>
                        );
                      })()}

                      {/* Milestone */}
                      {task.milestone && (
                        <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                          <span className="text-slate-400">Mốc KQ: </span>
                          <span className="font-medium italic text-slate-700">{task.milestone}</span>
                        </div>
                      )}

                      {/* Leader & Timeline */}
                      <div className="mt-2 text-[10px] text-slate-500 space-y-0.5">
                        <div>
                          <span className="text-slate-400">Chỉ đạo: </span>
                          <span className="font-medium text-slate-700">{task.directedBy}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Thời gian: </span>
                          <span>{task.implementationTime}</span>
                          {task.deadline && (
                            <span className="text-rose-600 font-mono ml-1 font-medium">
                              (Hạn: {task.deadline})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar & Quick Action */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <ProgressBar
                            progress={task.progress}
                            onChange={(val) => onUpdateProgress(task.code, val)}
                          />
                        </div>
                        <button
                          onClick={() => onOpenEdit(task)}
                          className="text-[11px] text-slate-400 hover:text-slate-700 font-medium cursor-pointer"
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
