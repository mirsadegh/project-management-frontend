import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Task, TaskList, TaskFilters } from '../../services/taskService';
import { useProject, useUsers, useProjectTasks } from '../../services/queryHooks';
import { getErrorMessage } from './hooks/useTaskBoardMutations';
import type { ApiError } from '../../services/types';
import { useTaskBoardMutations } from './hooks/useTaskBoardMutations';
import { useFilteredTaskLists } from './hooks/useFilteredTaskLists';
import { TaskBoardHeader } from './ui/TaskBoardHeader';
import { TaskColumn } from './ui/TaskColumn';
import { ListForm } from './ui/ListForm';
import { TaskForm } from './ui/TaskForm';
import { DeleteConfirmModal } from './ui/DeleteConfirmModal';
import { EmptyState } from './ui/EmptyState';
import type { NewTaskPayload, UpdateTaskPayload, DeleteTarget } from './types';

const TaskBoard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [showListForm, setShowListForm] = useState(false);
  const [editingList, setEditingList] = useState<TaskList | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskModalListId, setTaskModalListId] = useState<number | ''>('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DeleteTarget | null>(
    null,
  );
  const [taskError, setTaskError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  // — Data queries —
  const {
    data: project,
    isLoading: loadingProject,
    error: projectError,
  } = useProject(projectId ?? '');
  const {
    data: taskLists = [],
    isLoading: loadingTasks,
    error: tasksError,
  } = useProjectTasks(project?.id);
  const { data: users = [] } = useUsers();

  const isLoading = loadingProject || loadingTasks;
  const error = (projectError || tasksError) as ApiError | null;
  const project_id = project?.id;

  // — Mutations —
  const {
    createList,
    deleteList,
    updateList,
    createTask,
    deleteTask,
    updateTask,
  } = useTaskBoardMutations({ projectId, project_id });

  // — Filtering —
  const [taskFilters, setTaskFilters] = useState<TaskFilters>({
    query: '',
    status: '',
    priority: '',
  });
  const filteredTaskLists = useFilteredTaskLists(taskLists, taskFilters);

  // — Modal open/close handlers —
  const openListForm = () => {
    setListError(null);
    setShowListForm(true);
  };

  const openEditListModal = (list: TaskList) => {
    setEditingList(list);
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
  };

  const handleAddTask = (listId: number) => {
    if (taskLists.length === 0) {
      setTaskError('ابتدا یک لیست وظایف بسازید');
      return;
    }
    setTaskError(null);
    setTaskModalListId(listId);
    setShowTaskModal(true);
  };

  const handleDeleteList = (list: TaskList) => {
    setConfirmDelete({ type: 'list', id: list.id, name: list.name });
  };

  const handleDeleteTask = (task: Task) => {
    setConfirmDelete({ type: 'task', id: task.id, name: task.title });
  };

  // — Mutation submit wrappers —
  const handleCreateList = (data: { name: string; description?: string }) => {
    createList.mutate(data);
    setShowListForm(false);
  };

  const handleUpdateList = (data: { name: string; description?: string }) => {
    updateList.mutate({
      id: editingList!.id,
      data,
    });
    setEditingList(null);
  };
  const handleCreateTask = (data: NewTaskPayload | UpdateTaskPayload) => {
    const payload = data as NewTaskPayload;
    createTask.mutate(payload);
    setShowTaskModal(false);
    setTaskModalListId('');
  };

  const handleUpdateTask = (data: NewTaskPayload | UpdateTaskPayload) => {
    const payload = data as UpdateTaskPayload;
    updateTask.mutate({ id: editingTask!.id, data: payload });
    setEditingTask(null);
  };

  const confirmDeleteAction = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'list') {
      deleteList.mutate(confirmDelete.id);
    } else {
      deleteTask.mutate(confirmDelete.id);
    }
  };

	// — Render —
  if (isLoading) {
    return <div className="page-loading">در حال بارگذاری بورد وظایف...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        {getErrorMessage(error, 'بارگذاری پروژه یا وظایف ناموفق بود')}
      </div>
    );
  }

  return (
    <div className="task-board-page">
      <TaskBoardHeader
        projectId={projectId}
        taskFilters={taskFilters}
        onFiltersChange={setTaskFilters}
        error={null}
      />

      {/* Create / edit list form */}
      {showListForm && (
        <div className="modal-overlay" onClick={() => setShowListForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>ایجاد لیست وظایف</h3>
            <ListForm
              mode="create"
              isPending={createList.isPending}
              error={listError}
              onSubmit={handleCreateList}
              onCancel={() => setShowListForm(false)}
            />
          </div>
        </div>
      )}
      {editingList && (
        <div className="modal-overlay" onClick={() => setEditingList(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>ویرایش لیست وظایف</h3>
            <ListForm
              mode="edit"
              initialName={editingList.name}
              initialDescription={editingList.description || ''}
              isPending={updateList.isPending}
              error={null}
              onSubmit={handleUpdateList}
              onCancel={() => setEditingList(null)}
            />
          </div>
        </div>
      )}

      {/* Task board */}
      {taskLists.length === 0 ? (
        <EmptyState onAddList={openListForm} />
      ) : (
        <div className="task-board">
          {filteredTaskLists.map((list) => (
            <TaskColumn
              key={list.id}
              list={list}
              editingList={editingList}
              editingTask={editingTask}
              deleteListMutationPending={deleteList.isPending}
              deleteTaskMutationPending={deleteTask.isPending}
              onAddTask={handleAddTask}
              onEditList={openEditListModal}
              onDeleteList={handleDeleteList}
              onEditTask={openEditTaskModal}
              onDeleteTask={handleDeleteTask}
            />
          ))}
          <button className="btn-primary add-list-btn" onClick={openListForm}>
            + افزودن لیست
          </button>
        </div>
      )}

      {/* Create task modal */}
      {showTaskModal && (
        <TaskForm
          key={taskModalListId === '' ? 'new-task' : `new-task-${taskModalListId}`}
          mode="create"
          projectId={project_id}
          taskLists={taskLists}
          users={users}
          initialTask={{ task_list: taskModalListId }}
          isPending={createTask.isPending}
          error={taskError}
          onSubmit={handleCreateTask}
          onCancel={() => {
            setShowTaskModal(false);
            setTaskModalListId('');
          }}
        />
      )}
      {/* Edit task modal */}
      {editingTask && (
        <TaskForm
          mode="edit"
          projectId={project_id}
          taskLists={taskLists}
          users={users}
          initialTask={{
            task_list: editingTask.task_list ?? '',
            title: editingTask.title,
            description: editingTask.description || '',
            priority: editingTask.priority,
            status: editingTask.status,
            due_date: editingTask.due_date || '',
            assignee_id: editingTask.assignee?.id ?? '',
          }}
          isPending={updateTask.isPending}
          error={null}
          onSubmit={handleUpdateTask}
          onCancel={() => setEditingTask(null)}
        />
      )}

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        target={confirmDelete}
        isPending={deleteList.isPending || deleteTask.isPending}
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default TaskBoard;
