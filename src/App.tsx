import React, { useState, useEffect, useMemo } from 'react';
import { TaskItem, TaskStatus, ViewMode, FilterState, TaskNote } from './types/task';
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
import { ReportView } from './components/ReportView';
import { TaskModal } from './components/TaskModal';
import { TaskDetailDrawer } from './components/TaskDetailDrawer';
import { ImportExportModal } from './components/ImportExportModal';
import { getTasks, updateTask } from './services/n8nApi';
export default function App() {
  const [tasks, setTasks] = useState<TaskItem[]>(() => getStoredTasks());
  useEffect(() => {
  const loadTasks = async () => {
    try {
      const remoteTasks = await getTasks();

      if (Array.isArray(remoteTasks) && remoteTasks.length > 0) {
        setTasks(remoteTasks);
      }
    } catch (error) {
      console.error(
        'Không thể tải nhiệm vụ từ n8n/Google Sheets. Tiếp tục dùng dữ liệu localStorage.',
        error
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

  // Extract distinct departments, leaders, and months
  const departments = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.department) set.add(t.department);
    });
    return Array.from(set);
  }, [tasks]);

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

  // Filter tasks based on search & filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
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
  }, [tasks, filter]);

  // Action Handlers
  const handleUpdateStatus = (code: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.code === code) {
          // If status set to 'Hoàn thành', also boost progress to 100% if not already
          const newProgress = newStatus === 'Hoàn thành' ? 100 : t.progress === 100 ? 90 : t.progress;
          const updated = {
            ...t,
            status: newStatus,
            progress: newProgress,
            updatedAt: new Date().toISOString(),
          };
          updateTask(updated).catch((error) => {
  console.error('Lỗi cập nhật trạng thái lên Google Sheets:', error);
});
          if (taskForDetail && taskForDetail.code === code) {
            setTaskForDetail(updated);
          }
          return updated;
        }
        return t;
      })
    );
  };

  const handleUpdateProgress = (code: string, newProgress: number) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.code === code) {
          let updatedStatus = t.status;
          if (newProgress === 100) {
            updatedStatus = 'Hoàn thành';
          } else if (newProgress > 0 && (t.status === 'Chưa cập nhật' || t.status === 'Chưa thực hiện')) {
            updatedStatus = 'Đang thực hiện';
          }
          const updated = {
            ...t,
            progress: newProgress,
            status: updatedStatus,
            updatedAt: new Date().toISOString(),
          };
          updateTask(updated).catch((error) => {
  console.error('Lỗi cập nhật tiến độ lên Google Sheets:', error);
});
          if (taskForDetail && taskForDetail.code === code) {
            setTaskForDetail(updated);
          }
          return updated;
        }
        return t;
      })
    );
  };

  const handleSaveTask = (savedTask: TaskItem) => {
    setTasks((prev) => {
      const exists = prev.some((t) => t.code === savedTask.code);
      if (exists) {
        return prev.map((t) => (t.code === savedTask.code ? savedTask : t));
      } else {
        return [savedTask, ...prev];
      }
    });

    if (taskForDetail && taskForDetail.code === savedTask.code) {
      setTaskForDetail(savedTask);
    }
    setTaskToEdit(null);
    setIsNewTaskModalOpen(false);
  };

  const handleDuplicateTask = (task: TaskItem) => {
    const duplicated: TaskItem = {
      ...task,
      code: nextSuggestedCode,
      itemNo: tasks.length + 1,
      task: `[Bản sao] ${task.task}`,
      status: 'Chưa cập nhật',
      progress: 0,
      notes: [],
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => [duplicated, ...prev]);
  };

  const handleDeleteTask = (code: string) => {
    setTasks((prev) => prev.filter((t) => t.code !== code));
    if (taskForDetail && taskForDetail.code === code) {
      setTaskForDetail(null);
    }
  };

  const handleBulkComplete = (codes: string[]) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (codes.includes(t.code)) {
          return {
            ...t,
            status: 'Hoàn thành',
            progress: 100,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
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

    setTasks((prev) =>
      prev.map((t) => {
        if (t.code === code) {
          const updatedNotes = [newNote, ...(t.notes || [])];
          const updated = {
            ...t,
            notes: updatedNotes,
            updatedAt: new Date().toISOString(),
          };
          if (taskForDetail && taskForDetail.code === code) {
            setTaskForDetail(updated);
          }
          return updated;
        }
        return t;
      })
    );
  };

  const handleDeleteNote = (code: string, noteId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.code === code) {
          const updatedNotes = (t.notes || []).filter((n) => n.id !== noteId);
          const updated = {
            ...t,
            notes: updatedNotes,
            updatedAt: new Date().toISOString(),
          };
          if (taskForDetail && taskForDetail.code === code) {
            setTaskForDetail(updated);
          }
          return updated;
        }
        return t;
      })
    );
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
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
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

      {/* Main KPI Stats */}
      <ExecutiveStats tasks={tasks} currentMonth={months[0] || '09/2026'} />

      {/* Filter and Search Bar */}
      <FilterToolbar
        filter={filter}
        onFilterChange={setFilter}
        departments={departments}
        leaders={leaders}
        months={months}
        totalCount={tasks.length}
        filteredCount={filteredTasks.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'table' && (
          <TaskTableView
            tasks={filteredTasks}
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
            tasks={filteredTasks}
            departments={departments}
            leaders={leaders}
          />
        )}

        {viewMode === 'report' && (
          <ReportView
            tasks={filteredTasks}
            departments={departments}
            currentMonth={months[0] || '09/2026'}
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
      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            <span>Hệ thống Quản lý Nhiệm vụ Giao ban · Công ty Cổ phần Thủy điện VNPD</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono tabular-nums">Tổng {tasks.length} nhiệm vụ</span>
            <span aria-hidden="true">·</span>
            <span>Lưu trữ nội bộ an toàn (Local Storage)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
