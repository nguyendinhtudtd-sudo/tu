import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TaskItem, TaskStatus, ViewMode, FilterState, TaskNote, isGeneralDirective, TaskType } from './types/task';
import {
  getStoredTasks,
  saveStoredTasks,
  resetStoredTasks,
} from './utils/taskStorage';
import { Header } from './components/Header';
import { ExecutiveStats } from './components/ExecutiveStats';
import { FilterToolbar } from './components/FilterToolbar';
import { TaskTableView } from './components/TaskTableView';
import { TaskKanbanView } from './components/TaskKanbanView';
import { DepartmentGroupView } from './components/DepartmentGroupView';
import { ExecutiveGroupView } from './components/ExecutiveGroupView';
import { AnalyticsView } from './components/AnalyticsView';
import { TaskModal } from './components/TaskModal';
import { TaskDetailDrawer } from './components/TaskDetailDrawer';
import { ImportExportModal } from './components/ImportExportModal';
import { getTasks, syncTaskToSheet } from './services/n8nApi';
import { ToastContainer, useToast } from './components/Toast';

export default function App() {
  const [tasks, setTasks] = useState<TaskItem[]>(() => getStoredTasks());
  const { toasts, addToast, removeToast, removeSyncingToasts } = useToast();
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    const loadTasks = async () => {
      addToast('syncing', 'Đang tải dữ liệu từ Google Sheets...');
      try {
        const remoteTasks = await getTasks();
        removeSyncingToasts();

        if (Array.isArray(remoteTasks) && remoteTasks.length > 0) {
          setTasks(remoteTasks);
          addToast('success', `Đã đồng bộ ${remoteTasks.length} nhiệm vụ từ Google Sheets`);
        }
      } catch (error) {
        removeSyncingToasts();
        console.error(
          'Không thể tải nhiệm vụ từ n8n/Google Sheets. Tiếp tục dùng dữ liệu localStorage.',
          error
        );
        addToast(
          'error',
          'Không thể kết nối n8n/Google Sheets',
          'Đang sử dụng dữ liệu lưu tạm trong máy'
        );
      }
    };

    loadTasks();
  }, []);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filter, setFilter] = useState<FilterState>({
    search: '',
    department: '',
    directedBy: '',
    status: '',
    month: 'all',
    sortBy: 'code',
    sortOrder: 'asc',
  });

  // Modal / Drawer state
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);
  const [taskForDetail, setTaskForDetail] = useState<TaskItem | null>(null);
  const [defaultDeptForNewTask, setDefaultDeptForNewTask] = useState<string>('Phòng Tổng hợp');
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);

  // Sync to localStorage on tasks state change
  useEffect(() => {
    saveStoredTasks(tasks);
  }, [tasks]);

  // Tách biệt: Nhiệm vụ có đơn vị chủ trì cụ thể (tracked_task) và Chỉ đạo chung (general_directive)
  const specificTasks = useMemo(() => {
    return tasks.filter((t) => !isGeneralDirective(t.department) && t.taskType !== 'general_directive');
  }, [tasks]);

  const generalDirectives = useMemo(() => {
    return tasks.filter((t) => isGeneralDirective(t.department) || t.taskType === 'general_directive');
  }, [tasks]);

  // Extract distinct departments (chỉ lấy đơn vị cụ thể, loại bỏ hoàn toàn các giá trị chung chung)
  const departments = useMemo(() => {
    const set = new Set<string>();
    specificTasks.forEach((t) => {
      if (t.department && !isGeneralDirective(t.department)) {
        set.add(t.department);
      }
    });
    return Array.from(set);
  }, [specificTasks]);

  const leaders = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.directedBy) set.add(t.directedBy);
    });
    return Array.from(set);
  }, [tasks]);

  const months = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.month) set.add(t.month);
    });
    return Array.from(set);
  }, [tasks]);

  // Next suggested code calculation
  const nextSuggestedCode = useMemo(() => {
    const currentMonth = months[0] || '09/2026';
    const regex = new RegExp(`^${currentMonth.replace('/', '\\/')}-(\\d+)$`);
    let maxNum = 0;
    tasks.forEach((t) => {
      const match = t.code.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `${currentMonth}-${String(maxNum + 1).padStart(3, '0')}`;
  }, [tasks, months]);

  // Filter specific tasks based on search & filters (chỉ dành cho bảng tiến độ TASKS)
  const filteredTasks = useMemo(() => {
    return specificTasks.filter((t) => {
      // Search
      if (filter.search) {
        const q = filter.search.toLowerCase();
        const matches =
          t.code.toLowerCase().includes(q) ||
          t.task.toLowerCase().includes(q) ||
          t.milestone.toLowerCase().includes(q) ||
          t.department.toLowerCase().includes(q) ||
          t.directedBy.toLowerCase().includes(q) ||
          t.collaborators.toLowerCase().includes(q) ||
          t.pageReference.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Department
      if (filter.department && t.department !== filter.department) {
        return false;
      }

      // Directed By
      if (filter.directedBy && t.directedBy !== filter.directedBy) {
        return false;
      }

      // Status
      if (filter.status && t.status !== filter.status) {
        return false;
      }

      // Month
      if (filter.month && filter.month !== 'all' && t.month !== filter.month) {
        return false;
      }

      return true;
    });
  }, [specificTasks, filter]);

  // Filter general directives (để xem trong tab Chỉ đạo chung)
  const filteredGeneralDirectives = useMemo(() => {
    return generalDirectives.filter((t) => {
      if (filter.search) {
        const q = filter.search.toLowerCase();
        const matches =
          t.code.toLowerCase().includes(q) ||
          t.task.toLowerCase().includes(q) ||
          t.milestone.toLowerCase().includes(q) ||
          t.directedBy.toLowerCase().includes(q) ||
          t.collaborators.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (filter.directedBy && t.directedBy !== filter.directedBy) {
        return false;
      }
      if (filter.status && t.status !== filter.status) {
        return false;
      }
      if (filter.month && filter.month !== 'all' && t.month !== filter.month) {
        return false;
      }
      return true;
    });
  }, [generalDirectives, filter]);

  // Action Handlers
  const handleUpdateStatus = (code: string, newStatus: TaskStatus) => {
    let taskToSync: TaskItem | null = null;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.code === code) {
          const newProgress = newStatus === 'Hoàn thành' ? 100 : t.progress === 100 ? 90 : t.progress;
          const updated: TaskItem = {
            ...t,
            status: newStatus,
            progress: newProgress,
            updatedAt: new Date().toISOString(),
          };
          taskToSync = updated;
          if (taskForDetail && taskForDetail.code === code) {
            setTaskForDetail(updated);
          }
          return updated;
        }
        return t;
      })
    );

    if (taskToSync) {
      const task = taskToSync as TaskItem;
      addToast('syncing', `Đang cập nhật trạng thái nhiệm vụ ${code}...`);
      syncTaskToSheet(task)
        .then(() => {
          removeSyncingToasts();
          addToast('success', `Nhiệm vụ ${code}: chuyển sang "${newStatus}"`);
        })
        .catch((error) => {
          removeSyncingToasts();
          console.error('Lỗi cập nhật trạng thái lên Google Sheets:', error);
          addToast('error', `Lỗi đồng bộ trạng thái ${code}`, 'Thay đổi đã được lưu tạm trên máy');
        });
    }
  };

  const handleUpdateProgress = (code: string, newProgress: number) => {
    let taskToSync: TaskItem | null = null;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.code === code) {
          let updatedStatus = t.status;
          if (newProgress === 100) {
            updatedStatus = 'Hoàn thành';
          } else if (newProgress > 0 && (t.status === 'Chưa cập nhật' || t.status === 'Chưa thực hiện')) {
            updatedStatus = 'Đang thực hiện';
          }
          const updated: TaskItem = {
            ...t,
            progress: newProgress,
            status: updatedStatus,
            updatedAt: new Date().toISOString(),
          };
          taskToSync = updated;
          if (taskForDetail && taskForDetail.code === code) {
            setTaskForDetail(updated);
          }
          return updated;
        }
        return t;
      })
    );

    // Áp dụng Debounce 500ms khi kéo thanh trượt để tránh spam request sang n8n/Sheet
    if (taskToSync) {
      const task = taskToSync as TaskItem;
      if (debounceTimers.current[code]) {
        clearTimeout(debounceTimers.current[code]);
      }

      debounceTimers.current[code] = setTimeout(async () => {
        addToast('syncing', `Đang lưu tiến độ nhiệm vụ ${code}...`);
        try {
          await syncTaskToSheet(task);
          removeSyncingToasts();
          addToast('success', `Đã lưu tiến độ ${task.progress}% cho nhiệm vụ ${code}`);
        } catch (error) {
          removeSyncingToasts();
          console.error('Lỗi cập nhật tiến độ lên Google Sheets:', error);
          addToast('error', `Lỗi đồng bộ nhiệm vụ ${code}`, 'Tiến độ đã được lưu tạm trên máy');
        }
      }, 500);
    }
  };

  const handleSaveTask = (savedTask: TaskItem) => {
    const isExisting = tasks.some((t) => t.code === savedTask.code);
    const department = savedTask.department?.trim() || '';
    const taskType: TaskType =
      savedTask.taskType === 'general_directive' || savedTask.taskType === 'tracked_task'
        ? savedTask.taskType
        : isGeneralDirective(department)
        ? 'general_directive'
        : 'tracked_task';

    const taskWithTimestamp: TaskItem = {
      ...savedTask,
      department,
      taskType,
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => {
      const exists = prev.some((t) => t.code === taskWithTimestamp.code);
      if (exists) {
        return prev.map((t) => (t.code === taskWithTimestamp.code ? taskWithTimestamp : t));
      } else {
        return [taskWithTimestamp, ...prev];
      }
    });

    if (taskForDetail && taskForDetail.code === taskWithTimestamp.code) {
      setTaskForDetail(taskWithTimestamp);
    }
    setTaskToEdit(null);
    setIsNewTaskModalOpen(false);

    addToast(
      'syncing',
      isExisting
        ? `Đang cập nhật nhiệm vụ ${taskWithTimestamp.code}...`
        : `Đang thêm mới nhiệm vụ ${taskWithTimestamp.code}...`
    );

    syncTaskToSheet(taskWithTimestamp)
      .then(() => {
        removeSyncingToasts();
        addToast(
          'success',
          isExisting
            ? `Đã cập nhật nhiệm vụ ${taskWithTimestamp.code}`
            : `Đã thêm nhiệm vụ ${taskWithTimestamp.code} vào Sheet`
        );
      })
      .catch((error) => {
        removeSyncingToasts();
        console.error('Lỗi đồng bộ nhiệm vụ lên Google Sheets:', error);
        addToast('error', 'Không thể đồng bộ với Google Sheets', 'Dữ liệu đã được lưu tạm trên máy');
      });
  };

  const handleDuplicateTask = (task: TaskItem) => {
    const taskType: TaskType =
      task.taskType === 'general_directive' || task.taskType === 'tracked_task'
        ? task.taskType
        : isGeneralDirective(task.department)
        ? 'general_directive'
        : 'tracked_task';

    const duplicated: TaskItem = {
      ...task,
      code: nextSuggestedCode,
      itemNo: tasks.length + 1,
      task: `[Bản sao] ${task.task}`,
      status: 'Chưa cập nhật',
      progress: 0,
      taskType,
      notes: [],
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => [duplicated, ...prev]);

    addToast('syncing', `Đang sao chép nhiệm vụ ${duplicated.code}...`);
    syncTaskToSheet(duplicated)
      .then(() => {
        removeSyncingToasts();
        addToast('success', `Đã tạo bản sao ${duplicated.code} trên Sheet`);
      })
      .catch((error) => {
        removeSyncingToasts();
        console.error('Lỗi sao chép nhiệm vụ lên Sheet:', error);
        addToast('error', 'Lỗi đồng bộ bản sao', 'Bản sao đã được lưu tạm trên máy');
      });
  };

  const handleDeleteTask = (code: string) => {
    const taskToDelete = tasks.find((t) => t.code === code);
    setTasks((prev) => prev.filter((t) => t.code !== code));
    if (taskForDetail && taskForDetail.code === code) {
      setTaskForDetail(null);
    }

    if (taskToDelete) {
      // Soft delete: đồng bộ trạng thái "Tạm hoãn" lên Sheet để lưu vết
      const softDeleted: TaskItem = {
        ...taskToDelete,
        status: 'Tạm hoãn',
        updatedAt: new Date().toISOString(),
      };
      addToast('syncing', `Đang cập nhật trạng thái xóa ${code}...`);
      syncTaskToSheet(softDeleted)
        .then(() => {
          removeSyncingToasts();
          addToast('info', `Nhiệm vụ ${code} đã được chuyển sang "Tạm hoãn" trên Sheet`);
        })
        .catch((error) => {
          removeSyncingToasts();
          console.error('Lỗi cập nhật xóa trên Sheet:', error);
          addToast('error', `Lỗi đồng bộ xóa nhiệm vụ ${code}`);
        });
    }
  };

  const handleBulkComplete = (codes: string[]) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (codes.includes(t.code)) {
          const updated: TaskItem = {
            ...t,
            status: 'Hoàn thành',
            progress: 100,
            updatedAt: new Date().toISOString(),
          };
          syncTaskToSheet(updated).catch(console.error);
          return updated;
        }
        return t;
      })
    );
    addToast('success', `Đã cập nhật hoàn thành cho ${codes.length} nhiệm vụ`);
  };

  const handleBulkDelete = (codes: string[]) => {
    setTasks((prev) => prev.filter((t) => !codes.includes(t.code)));
  };

  const handleAddNote = (code: string, noteContent: string) => {
    const newNote: TaskNote = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
      content: noteContent,
    };

    let updatedTask: TaskItem | null = null;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.code === code) {
          const updatedNotes = [newNote, ...(t.notes || [])];
          const updated: TaskItem = {
            ...t,
            notes: updatedNotes,
            updatedAt: new Date().toISOString(),
          };
          updatedTask = updated;
          if (taskForDetail && taskForDetail.code === code) {
            setTaskForDetail(updated);
          }
          return updated;
        }
        return t;
      })
    );

    if (updatedTask) {
      addToast('syncing', `Đang lưu ghi chú nhiệm vụ ${code}...`);
      syncTaskToSheet(updatedTask)
        .then(() => {
          removeSyncingToasts();
          addToast('success', `Đã lưu ghi chú vào Google Sheets`);
        })
        .catch((error) => {
          removeSyncingToasts();
          console.error('Lỗi lưu ghi chú lên Sheet:', error);
          addToast('error', 'Lỗi đồng bộ ghi chú', 'Ghi chú đã được lưu trên máy');
        });
    }
  };

  const handleDeleteNote = (code: string, noteId: string) => {
    let updatedTask: TaskItem | null = null;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.code === code) {
          const updatedNotes = (t.notes || []).filter((n) => n.id !== noteId);
          const updated: TaskItem = {
            ...t,
            notes: updatedNotes,
            updatedAt: new Date().toISOString(),
          };
          updatedTask = updated;
          if (taskForDetail && taskForDetail.code === code) {
            setTaskForDetail(updated);
          }
          return updated;
        }
        return t;
      })
    );

    if (updatedTask) {
      addToast('syncing', `Đang cập nhật ghi chú...`);
      syncTaskToSheet(updatedTask)
        .then(() => {
          removeSyncingToasts();
          addToast('success', `Đã xóa ghi chú trên Google Sheets`);
        })
        .catch((error) => {
          removeSyncingToasts();
          console.error('Lỗi xóa ghi chú trên Sheet:', error);
          addToast('error', 'Lỗi đồng bộ xóa ghi chú');
        });
    }
  };

  const handleImportTasks = (importedTasks: TaskItem[], overwrite: boolean) => {
    if (overwrite) {
      setTasks(importedTasks);
    } else {
      // Merge unique by code
      const map = new Map<string, TaskItem>();
      tasks.forEach((t) => map.set(t.code, t));
      importedTasks.forEach((t) => map.set(t.code, t));
      setTasks(Array.from(map.values()));
    }
  };

  const handleResetToDefault = () => {
    const initial = resetStoredTasks();
    setTasks(initial);
    setTaskForDetail(null);
  };

  const handleOpenAddNewForDept = (deptName: string) => {
    setDefaultDeptForNewTask(deptName);
    setTaskToEdit(null);
    setIsNewTaskModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Strict Top Bar */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenNewTask={() => {
          setDefaultDeptForNewTask('Phòng Tổng hợp');
          setTaskToEdit(null);
          setIsNewTaskModalOpen(true);
        }}
        onOpenImportExport={() => setIsImportExportModalOpen(true)}
        onResetData={handleResetToDefault}
      />

      {/* Khối KPI tổng quan: CHỈ HIỂN THỊ Ở TAB DANH SÁCH BẢNG theo yêu cầu */}
      {viewMode === 'table' && (
        <ExecutiveStats tasks={specificTasks} currentMonth={months[0] || '09/2026'} />
      )}

      {/* Thanh lọc: Hiển thị cho các tab danh sách, kanban, phòng ban, lãnh đạo; Ẩn ở tab Phân tích (Dashboard độc lập) */}
      {viewMode !== 'analytics' && (
        <FilterToolbar
          filter={filter}
          onFilterChange={setFilter}
          departments={departments}
          leaders={leaders}
          months={months}
          totalCount={specificTasks.length}
          filteredCount={filteredTasks.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 ${
          viewMode === 'analytics' ? 'max-w-[1800px]' : 'max-w-[1600px]'
        }`}
      >
        {viewMode === 'table' && (
          <TaskTableView
            tasks={filteredTasks}
            generalDirectives={filteredGeneralDirectives}
            onUpdateStatus={handleUpdateStatus}
            onUpdateProgress={handleUpdateProgress}
            onOpenEdit={(task) => {
              setTaskToEdit(task);
              setIsNewTaskModalOpen(true);
            }}
            onOpenDetail={(task) => setTaskForDetail(task)}
            onDuplicate={handleDuplicateTask}
            onDelete={handleDeleteTask}
            onBulkComplete={handleBulkComplete}
            onBulkDelete={handleBulkDelete}
            onResetFilters={() =>
              setFilter({
                ...filter,
                search: '',
                department: '',
                directedBy: '',
                status: '',
                month: 'all',
              })
            }
          />
        )}

        {viewMode === 'kanban' && (
          <TaskKanbanView
            tasks={filteredTasks}
            onUpdateStatus={handleUpdateStatus}
            onUpdateProgress={handleUpdateProgress}
            onOpenDetail={(task) => setTaskForDetail(task)}
            onOpenEdit={(task) => {
              setTaskToEdit(task);
              setIsNewTaskModalOpen(true);
            }}
            onAddNewForStatus={(status) => {
              setDefaultDeptForNewTask('Phòng Tổng hợp');
              setTaskToEdit(null);
              setIsNewTaskModalOpen(true);
            }}
          />
        )}

        {viewMode === 'department' && (
          <DepartmentGroupView
            tasks={filteredTasks}
            departments={filter.department ? [filter.department] : departments}
            onUpdateStatus={handleUpdateStatus}
            onUpdateProgress={handleUpdateProgress}
            onOpenDetail={(task) => setTaskForDetail(task)}
            onOpenEdit={(task) => {
              setTaskToEdit(task);
              setIsNewTaskModalOpen(true);
            }}
            onAddNewForDepartment={handleOpenAddNewForDept}
          />
        )}

        {viewMode === 'executive' && (
          <ExecutiveGroupView
            tasks={filteredTasks}
            leaders={filter.directedBy ? [filter.directedBy] : leaders}
            onUpdateStatus={handleUpdateStatus}
            onUpdateProgress={handleUpdateProgress}
            onOpenDetail={(task) => setTaskForDetail(task)}
            onOpenEdit={(task) => {
              setTaskToEdit(task);
              setIsNewTaskModalOpen(true);
            }}
          />
        )}

        {viewMode === 'analytics' && (
          <AnalyticsView
            tasks={specificTasks}
            departments={departments}
            leaders={leaders}
            months={months}
            onOpenDetail={(task) => setTaskForDetail(task)}
          />
        )}
      </main>

      {/* Slide-over Detail Drawer */}
      <TaskDetailDrawer
        task={taskForDetail}
        isOpen={Boolean(taskForDetail)}
        onClose={() => setTaskForDetail(null)}
        onUpdateStatus={handleUpdateStatus}
        onUpdateProgress={handleUpdateProgress}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
        onOpenEdit={(task) => {
          setTaskToEdit(task);
          setIsNewTaskModalOpen(true);
        }}
        onDelete={handleDeleteTask}
      />

      {/* Task Create / Edit Modal */}
      <TaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => {
          setIsNewTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        departments={departments}
        leaders={leaders}
        nextCode={nextSuggestedCode}
        defaultDepartment={defaultDeptForNewTask}
      />

      {/* Import / Export / Reset Modal */}
      <ImportExportModal
        isOpen={isImportExportModalOpen}
        onClose={() => setIsImportExportModalOpen(false)}
        tasks={tasks}
        onImportTasks={handleImportTasks}
        onResetToDefault={handleResetToDefault}
      />

      {/* Quiet Corporate Footer (Compliant with Anti-Slop section B) */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8 print:hidden">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            <span>Hệ thống Quản lý Nhiệm vụ Giao ban · Công ty Cổ phần Phát triển Điện lực Việt Nam (VNPD)</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono tabular-nums">Tổng {tasks.length} nhiệm vụ</span>
            <span aria-hidden="true">·</span>
            <span>Lưu trữ nội bộ an toàn (Local Storage)</span>
          </div>
        </div>
      </footer>

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
