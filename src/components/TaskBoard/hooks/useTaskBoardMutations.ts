/** All mutations used by TaskBoard, extracted for clarity. */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../../../services/taskService';
import type { Task, NewTaskPayload, UpdateTaskPayload } from '../types';
import type { ApiError } from '../../../services/types';
import { toast } from 'react-toastify';

export const getErrorMessage = (
  err: unknown,
  fallback: string,
): string => {
  const data = (err as ApiError).response?.data as
    | { detail?: string; name?: string[]; title?: string[] }
    | undefined;
  return (data?.title?.[0] ?? data?.name?.[0] ?? data?.detail) ?? fallback;
};

export interface UseTaskBoardMutationsProps {
  projectId: string | undefined;
  project_id: number | undefined;
}

export const useTaskBoardMutations = ({
  projectId,
  project_id,
}: UseTaskBoardMutationsProps) => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['project-tasks', project_id] });
    queryClient.invalidateQueries({ queryKey: ['project', projectId] });
  };

  const createList = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      taskService.createTaskList(project_id!, data.name),
    onSuccess: () => {
      invalidate();
      toast.success('لیست وظایف ایجاد شد');
    },
    onError: (err: ApiError) => {
      toast.error(getErrorMessage(err, 'ایجاد لیست وظایف ناموفق بود'));
    },
  });

  const deleteList = useMutation({
    mutationFn: (listId: number) => taskService.deleteTaskList(listId),
    onSuccess: () => {
      invalidate();
      toast.success('لیست وظایف حذف شد');
    },
    onError: (err: ApiError) => {
      toast.error(getErrorMessage(err, 'حذف لیست ناموفق بود'));
    },
  });

  const updateList = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { name: string; description?: string };
    }) => taskService.updateTaskList(id, data),
    onSuccess: () => {
      invalidate();
      toast.success('لیست وظایف ویرایش شد');
    },
    onError: (err: ApiError) => {
      toast.error(getErrorMessage(err, 'ویرایش لیست ناموفق بود'));
    },
  });

  const createTask = useMutation({
    mutationFn: (data: NewTaskPayload) => taskService.createTask(data),
    onSuccess: () => {
      invalidate();
      toast.success('وظیفه ایجاد شد');
    },
    onError: (err: ApiError) => {
      toast.error(getErrorMessage(err, 'ایجاد وظیفه ناموفق بود'));
    },
  });

  const deleteTask = useMutation({
    mutationFn: (taskId: number) => taskService.deleteTask(taskId),
    onSuccess: () => {
      invalidate();
      toast.success('وظیفه حذف شد');
    },
    onError: (err: ApiError) => {
      toast.error(getErrorMessage(err, 'حذف وظیفه ناموفق بود'));
    },
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTaskPayload }) =>
      taskService.updateTask(id, data),
    onSuccess: () => {
      invalidate();
      toast.success('وظیفه ویرایش شد');
    },
    onError: (err: ApiError) => {
      toast.error(getErrorMessage(err, 'ویرایش وظیفه ناموفق بود'));
    },
  });

  return {
    createList,
    deleteList,
    updateList,
    createTask,
    deleteTask,
    updateTask,
  };
};

// Re-export Task type for components that need it
export type { Task };
