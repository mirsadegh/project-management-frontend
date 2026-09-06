import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { taskService, type Task, type TaskList } from '../services/taskService';
import { projectService, type Project } from '../services/projectService';
import { authService } from '../services/authService';
import { getPriorityLabel, getTaskStatusLabel } from '../utils/labels';
import { toJalaliDate, fromJalaliDate, formatDateJalali } from '../utils/date';
import type { ApiError } from '../services/types';
import { toast } from 'react-toastify';
import type { Value } from 'react-multi-date-picker';

const PRIORITIES: Task['priority'][] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const STATUSES: Task['status'][] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'];

const getErrorMessage = (err: unknown, fallback: string): string => {
  const data = (err as ApiError).response?.data as
    | { detail?: string; name?: string[]; title?: string[] }
    | undefined;
  return (data?.title?.[0] ?? data?.name?.[0] ?? data?.detail) ?? fallback;
};

const TaskBoard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // List form state
  const [showListForm, setShowListForm] = useState(false);
  const [listName, setListName] = useState('');
  const [listDesc, setListDesc] = useState('');
  const [creatingList, setCreatingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Edit list modal state
  const [editingList, setEditingList] = useState<TaskList | null>(null);
  const [editListName, setEditListName] = useState('');
  const [editListDesc, setEditListDesc] = useState('');
  const [updatingList, setUpdatingList] = useState(false);
  const [editListError, setEditListError] = useState<string | null>(null);

  // Task modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [users, setUsers] = useState<Array<{ id: number; username: string; full_name: string }>>([]);
  const [taskForm, setTaskForm] = useState({
    task_list: '' as number | '',
    title: '',
    description: '',
    priority: 'MEDIUM' as Task['priority'],
    status: 'TODO' as Task['status'],
    due_date: '',
    assignee_id: '' as number | '',
  });
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  // Edit task modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskForm, setEditTaskForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Task['priority'],
    status: 'TODO' as Task['status'],
    due_date: '',
    assignee_id: '' as number | '',
  });
  const [updatingTask, setUpdatingTask] = useState(false);
  const [editTaskError, setEditTaskError] = useState<string | null>(null);

  // Delete confirmation state
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'task' | 'list'; id: number; name: string } | null>(null);

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const loadProjectAndTasks = async (projectSlug: string) => {
    try {
      setLoading(true);
      const projectData = await projectService.getProject(projectSlug);
      setProject(projectData);
      const taskListsData = await taskService.getTaskLists(projectData.id);
      setTaskLists(taskListsData);
    } catch (err) {
      setError(getErrorMessage(err, 'بارگذاری پروژه یا وظایف ناموفق بود'));
    } finally {
      setLoading(false);
    }
  };

  const deleteListMutation = useMutation({
    mutationFn: (listId: number) => taskService.deleteTaskList(listId),
    onSuccess: async () => {
      setConfirmDelete(null);
      toast.success('لیست وظایف حذف شد');
      await loadProjectAndTasks(projectId!);
    },
    onError: (err: ApiError) => {
      toast.error(getErrorMessage(err, 'حذف لیست ناموفق بود'));
    },
  });

  const updateListMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; description?: string } }) =>
      taskService.updateTaskList(id, data),
    onSuccess: async () => {
      setEditingList(null);
      toast.success('لیست وظایف ویرایش شد');
      await loadProjectAndTasks(projectId!);
    },
    onError: (err: ApiError) => {
      setEditListError(getErrorMessage(err, 'ویرایش لیست ناموفق بود'));
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: number) => taskService.deleteTask(taskId),
    onSuccess: async () => {
      setConfirmDelete(null);
      toast.success('وظیفه حذف شد');
      await loadProjectAndTasks(projectId!);
    },
    onError: (err: ApiError) => {
      toast.error(getErrorMessage(err, 'حذف وظیفه ناموفق بود'));
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Task> }) =>
      taskService.updateTask(id, data),
    onSuccess: async () => {
      setEditingTask(null);
      toast.success('وظیفه ویرایش شد');
      await loadProjectAndTasks(projectId!);
    },
    onError: (err: ApiError) => {
      setEditTaskError(getErrorMessage(err, 'ویرایش وظیفه ناموفق بود'));
    },
  });

  // ─── Effects ────────────────────────────────────────────────────────────────

  React.useEffect(() => {
    if (projectId) {
      loadProjectAndTasks(projectId);
    }
  }, [projectId]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const openListForm = () => {
    setListName('');
    setListDesc('');
    setListError(null);
    setShowListForm(true);
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !listName.trim()) {
      setListError('نام لیست الزامی است');
      return;
    }
    setCreatingList(true);
    setListError(null);
    try {
      await taskService.createTaskList(project.id, listName.trim());
      setShowListForm(false);
      await loadProjectAndTasks(projectId!);
    } catch (err) {
      setListError(getErrorMessage(err, 'ایجاد لیست وظایف ناموفق بود'));
    } finally {
      setCreatingList(false);
    }
  };

  const openEditListModal = (list: TaskList) => {
    setEditingList(list);
    setEditListName(list.name);
    setEditListDesc(list.description || '');
    setEditListError(null);
  };

  const handleUpdateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingList || !editListName.trim()) {
      setEditListError('نام لیست الزامی است');
      return;
    }
    setUpdatingList(true);
    setEditListError(null);
    try {
      await updateListMutation.mutateAsync({
        id: editingList.id,
        data: { name: editListName.trim(), description: editListDesc.trim() || undefined },
      });
    } finally {
      setUpdatingList(false);
    }
  };

  const handleDeleteList = (list: TaskList) => {
    setConfirmDelete({ type: 'list', id: list.id, name: list.name });
  };

  const confirmDeleteList = async () => {
    if (!confirmDelete || confirmDelete.type !== 'list') return;
    await deleteListMutation.mutateAsync(confirmDelete.id);
  };

  const openTaskModal = async (presetListId?: number) => {
    if (taskLists.length === 0) {
      setTaskError('ابتدا یک لیست وظایف بسازید');
      return;
    }
    setTaskError(null);
    setTaskForm({
      task_list: presetListId ?? taskLists[0].id,
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'TODO',
      due_date: '',
      assignee_id: '',
    });
    try {
      const data = await authService.getUsers();
      setUsers(data);
    } catch {
      setUsers([]);
    }
    setShowTaskModal(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !taskForm.title.trim()) {
      setTaskError('عنوان وظیفه الزامی است');
      return;
    }
    if (taskForm.task_list === '') {
      setTaskError('لطفاً یک لیست وظایف انتخاب کنید');
      return;
    }
    setCreatingTask(true);
    setTaskError(null);
    try {
      await taskService.createTask({
        project: project.id,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        task_list: Number(taskForm.task_list),
        priority: taskForm.priority,
        status: taskForm.status,
        due_date: taskForm.due_date || null,
        assignee_id: taskForm.assignee_id === '' ? null : Number(taskForm.assignee_id),
      });
      setShowTaskModal(false);
      await loadProjectAndTasks(projectId!);
    } catch (err) {
      setTaskError(getErrorMessage(err, 'ایجاد وظیفه ناموفق بود'));
    } finally {
      setCreatingTask(false);
    }
  };

  const openEditTaskModal = async (task: Task) => {
    setEditingTask(task);
    setEditTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      due_date: task.due_date || '',
      assignee_id: task.assignee?.id ?? '',
    });
    setEditTaskError(null);
    try {
      const data = await authService.getUsers();
      setUsers(data);
    } catch {
      setUsers([]);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTaskForm.title.trim()) {
      setEditTaskError('عنوان وظیفه الزامی است');
      return;
    }
    setUpdatingTask(true);
    setEditTaskError(null);
    try {
      await updateTaskMutation.mutateAsync({
        id: editingTask.id,
        data: {
          title: editTaskForm.title.trim(),
          description: editTaskForm.description.trim() || undefined,
          priority: editTaskForm.priority,
          status: editTaskForm.status,
          due_date: editTaskForm.due_date || null,
          assignee_id: editTaskForm.assignee_id === '' ? null : Number(editTaskForm.assignee_id),
        },
      });
    } finally {
      setUpdatingTask(false);
    }
  };

  const handleDeleteTask = (task: Task) => {
    setConfirmDelete({ type: 'task', id: task.id, name: task.title });
  };

  const confirmDeleteTask = async () => {
    if (!confirmDelete || confirmDelete.type !== 'task') return;
    await deleteTaskMutation.mutateAsync(confirmDelete.id);
  };

  // ─── Priority colour helper ────────────────────────────────────────────────

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return '#10b981';
      case 'MEDIUM': return '#f59e0b';
      case 'HIGH': return '#f97316';
      case 'URGENT': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return <div className="page-loading">در حال بارگذاری بورد وظایف...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="task-board-page">
      <div className="page-header">
        <div className="header-left">
          <Link to={`/projects/${projectId}`} className="back-link">→ بازگشت به پروژه</Link>
          <h1>بورد وظایف</h1>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => openTaskModal()}> + افزودن وظیفه</button>
        </div>
      </div>

      {/* Create list form */}
      {showListForm && (
        <form className="create-list-form" onSubmit={handleCreateList}>
          {listError && <div className="error-message">{listError}</div>}
          <div className="form-group">
            <label>نام لیست</label>
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="مثلاً: انجام‌نشده"
              disabled={creatingList}
            />
          </div>
          <div className="form-group">
            <label>توضیحات (اختیاری)</label>
            <input
              type="text"
              value={listDesc}
              onChange={(e) => setListDesc(e.target.value)}
              disabled={creatingList}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowListForm(false)} disabled={creatingList}>
              انصراف
            </button>
            <button type="submit" className="btn-primary" disabled={creatingList}>
              {creatingList ? 'در حال ایجاد...' : 'ایجاد لیست'}
            </button>
          </div>
        </form>
      )}

      {/* Task board */}
      {taskLists.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>هنوز لیست وظایفی وجود ندارد</h3>
          <p>اولین لیست وظایف را بسازید تا کارها را سازمان‌دهی کنید</p>
          <button className="btn-primary" onClick={openListForm}>+ افزودن لیست وظایف</button>
        </div>
      ) : (
        <div className="task-board">
          {taskLists.map((list) => (
            <div key={list.id} className="task-column">
              {/* Column header with edit/delete actions */}
              <div className="column-header">
                <div className="column-title-row">
                  <h3>{list.name}</h3>
                  <span className="task-count">{list.tasks?.length || 0}</span>
                </div>
                <div className="column-actions">
                  <button
                    className="icon-btn"
                    title="ویرایش لیست"
                    aria-label="ویرایش لیست"
                    onClick={() => openEditListModal(list)}
                    disabled={!!editingList}
                  >
                    ✏️
                  </button>
                  <button
                    className="icon-btn"
                    title="حذف لیست"
                    aria-label="حذف لیست"
                    onClick={() => handleDeleteList(list)}
                    disabled={deleteListMutation.isPending}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Task cards */}
              <div className="task-list">
                {list.tasks?.map((task) => (
                  <div key={task.id} className="task-card">
                    <div className="task-card-header">
                      <h4 className="task-card-title">{task.title}</h4>
                      <div className="task-card-actions">
                        <button
                          className="icon-btn icon-btn-sm"
                          title="ویرایش وظیفه"
                          aria-label="ویرایش وظیفه"
                          onClick={() => openEditTaskModal(task)}
                          disabled={!!editingTask}
                        >
                          ✏️
                        </button>
                        <button
                          className="icon-btn icon-btn-sm"
                          title="حذف وظیفه"
                          aria-label="حذف وظیفه"
                          onClick={() => handleDeleteTask(task)}
                          disabled={deleteTaskMutation.isPending}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="task-card-priority">
                      <span
                        className="task-priority"
                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                      >
                        {getPriorityLabel(task.priority)}
                      </span>
                    </div>
                    <div className="task-card-footer">
                      <div className="task-assignee">
                        {task.assignee ? (
                          <>
                            <div className="assignee-avatar">
                              {task.assignee.full_name?.charAt(0) || task.assignee.username.charAt(0)}
                            </div>
                          </>
                        ) : (
                          <span className="unassigned">بدون مسئول</span>
                        )}
                      </div>
                      {task.due_date && (
                        <span className={`task-due-date ${task.is_overdue ? 'overdue' : ''}`}>
                          {formatDateJalali(task.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <button className="add-task-btn" onClick={() => openTaskModal(list.id)}>+ افزودن وظیفه</button>
              </div>
            </div>
          ))}
          <button className="btn-primary add-list-btn" onClick={openListForm}>+ افزودن لیست</button>
        </div>
      )}

      {/* Create task modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>افزودن وظیفه</h3>
            {taskError && <div className="error-message">{taskError}</div>}
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>لیست وظایف</label>
                <select
                  value={taskForm.task_list}
                  onChange={(e) => setTaskForm({ ...taskForm, task_list: e.target.value === '' ? '' : Number(e.target.value) })}
                  disabled={creatingTask}
                  required
                >
                  {taskLists.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>عنوان</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="عنوان وظیفه"
                  disabled={creatingTask}
                  required
                />
              </div>
              <div className="form-group">
                <label>توضیحات</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  disabled={creatingTask}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>اولویت</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as Task['priority'] })}
                    disabled={creatingTask}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{getPriorityLabel(p)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>وضعیت</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as Task['status'] })}
                    disabled={creatingTask}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{getTaskStatusLabel(s)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>مهلت</label>
                  <DatePicker
                    value={toJalaliDate(taskForm.due_date || null)}
                    onChange={(v: Value) =>
                      setTaskForm({ ...taskForm, due_date: fromJalaliDate(v as Date | null) || '' })
                    }
                    disabled={creatingTask}
                    calendar={persian}
                    locale={persian_fa}
                    inputClass="date-input"
                    containerClassName="date-picker-container"
                    format="YYYY/MM/DD"
                    placeholder="انتخاب تاریخ"
                  />
                </div>
                <div className="form-group">
                  <label>مسئول (اختیاری)</label>
                  <select
                    value={taskForm.assignee_id}
                    onChange={(e) => setTaskForm({ ...taskForm, assignee_id: e.target.value === '' ? '' : Number(e.target.value) })}
                    disabled={creatingTask}
                  >
                    <option value="">بدون مسئول</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.full_name || u.username}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowTaskModal(false)} disabled={creatingTask}>
                  انصراف
                </button>
                <button type="submit" className="btn-primary" disabled={creatingTask}>
                  {creatingTask ? 'در حال ایجاد...' : 'ایجاد وظیفه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit list modal */}
      {editingList && (
        <div className="modal-overlay" onClick={() => setEditingList(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>ویرایش لیست وظایف</h3>
            {editListError && <div className="error-message">{editListError}</div>}
            <form onSubmit={handleUpdateList}>
              <div className="form-group">
                <label>نام لیست *</label>
                <input
                  type="text"
                  value={editListName}
                  onChange={(e) => setEditListName(e.target.value)}
                  placeholder="نام لیست"
                  required
                  disabled={updatingList}
                />
              </div>
              <div className="form-group">
                <label>توضیحات (اختیاری)</label>
                <input
                  type="text"
                  value={editListDesc}
                  onChange={(e) => setEditListDesc(e.target.value)}
                  disabled={updatingList}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setEditingList(null)} disabled={updatingList}>
                  انصراف
                </button>
                <button type="submit" className="btn-primary" disabled={updatingList}>
                  {updatingList ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit task modal */}
      {editingTask && (
        <div className="modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>ویرایش وظیفه</h3>
            {editTaskError && <div className="error-message">{editTaskError}</div>}
            <form onSubmit={handleUpdateTask}>
              <div className="form-group">
                <label>عنوان *</label>
                <input
                  type="text"
                  value={editTaskForm.title}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, title: e.target.value })}
                  placeholder="عنوان وظیفه"
                  required
                  disabled={updatingTask}
                />
              </div>
              <div className="form-group">
                <label>توضیحات</label>
                <textarea
                  value={editTaskForm.description}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, description: e.target.value })}
                  disabled={updatingTask}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>اولویت</label>
                  <select
                    value={editTaskForm.priority}
                    onChange={(e) => setEditTaskForm({ ...editTaskForm, priority: e.target.value as Task['priority'] })}
                    disabled={updatingTask}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{getPriorityLabel(p)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>وضعیت</label>
                  <select
                    value={editTaskForm.status}
                    onChange={(e) => setEditTaskForm({ ...editTaskForm, status: e.target.value as Task['status'] })}
                    disabled={updatingTask}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{getTaskStatusLabel(s)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>مهلت</label>
                  <DatePicker
                    value={toJalaliDate(editTaskForm.due_date || null)}
                    onChange={(v: Value) =>
                      setEditTaskForm({ ...editTaskForm, due_date: fromJalaliDate(v as Date | null) || '' })
                    }
                    disabled={updatingTask}
                    calendar={persian}
                    locale={persian_fa}
                    inputClass="date-input"
                    containerClassName="date-picker-container"
                    format="YYYY/MM/DD"
                    placeholder="انتخاب تاریخ"
                  />
                </div>
                <div className="form-group">
                  <label>مسئول (اختیاری)</label>
                  <select
                    value={editTaskForm.assignee_id}
                    onChange={(e) => setEditTaskForm({ ...editTaskForm, assignee_id: e.target.value === '' ? '' : Number(e.target.value) })}
                    disabled={updatingTask}
                  >
                    <option value="">بدون مسئول</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.full_name || u.username}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setEditingTask(null)} disabled={updatingTask}>
                  انصراف
                </button>
                <button type="submit" className="btn-primary" disabled={updatingTask}>
                  {updatingTask ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>تأیید حذف</h3>
            <p>
              {confirmDelete.type === 'list'
                ? `آیا از حذف لیست «${confirmDelete.name}» مطمئن هستید؟ تمام وظایف داخل این لیست نیز حذف خواهند شد.`
                : `آیا از حذف وظیفه «${confirmDelete.name}» مطمئن هستید؟`}
            </p>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setConfirmDelete(null)}>
                انصراف
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={confirmDelete.type === 'list' ? confirmDeleteList : confirmDeleteTask}
                disabled={deleteListMutation.isPending || deleteTaskMutation.isPending}
              >
                {deleteListMutation.isPending || deleteTaskMutation.isPending ? 'در حال حذف...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
