/** Shared form state types for TaskBoard modals. */
import type { Task } from '../../services/taskService';
import type { TaskList } from '../../services/taskService';

export interface ListFormState {
  name: string;
  description: string;
}

export interface TaskFormState {
  task_list: number | '';
  title: string;
  description: string;
  priority: Task['priority'];
  status: Task['status'];
  due_date: string;
  assignee_id: number | '';
}

export type NewTaskPayload = {
  project: number;
  task_list: number;
  title: string;
  description?: string;
  priority: Task['priority'];
  status: Task['status'];
  due_date: string | null;
  assignee_id: number | null;
};

export type UpdateTaskPayload = Partial<Task>;

export type DeleteTarget =
  | { type: 'task'; id: number; name: string }
  | { type: 'list'; id: number; name: string };

export type { Task, TaskList };
