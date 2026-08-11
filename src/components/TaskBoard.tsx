import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { taskService, type Task, type TaskList } from '../services/taskService';
import { projectService, type Project } from '../services/projectService';
import { authService } from '../services/authService';
import { getPriorityLabel, getTaskStatusLabel, formatDate } from '../utils/labels';

type ApiError = {
  response?: { data?: { detail?: string; name?: string[]; title?: string[] } };
};

const getErrorMessage = (err: unknown, fallback: string): string => {
  const data = (err as ApiError).response?.data;
  return data?.title?.[0] || data?.name?.[0] || data?.detail || fallback;
};

const PRIORITIES: Task['priority'][] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const STATUSES: Task['status'][] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'];

const TaskBoard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showListForm, setShowListForm] = useState(false);
  const [listName, setListName] = useState('');
  const [listDesc, setListDesc] = useState('');
  const [creatingList, setCreatingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

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

  useEffect(() => {
    if (projectId) {
      loadProjectAndTasks(projectId);
    }
  }, [projectId]);

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return '#10b981';
      case 'MEDIUM': return '#f59e0b';
      case 'HIGH': return '#f97316';
      case 'URGENT': return '#ef4444';
      default: return '#6b7280';
    }
  };

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
              <div className="column-header">
                <h3>{list.name}</h3>
                <span className="task-count">{list.tasks?.length || 0}</span>
              </div>
              <div className="task-list">
                {list.tasks?.map((task) => (
                  <div key={task.id} className="task-card">
                    <div className="task-card-header">
                      <h4 className="task-card-title">{task.title}</h4>
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
                          {formatDate(task.due_date)}
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
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    disabled={creatingTask}
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
    </div>
  );
};

export default TaskBoard;
