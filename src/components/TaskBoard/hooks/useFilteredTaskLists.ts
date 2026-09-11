/** Client-side filtering of task lists based on search/filter state. */
import { useMemo } from 'react';
import type { TaskList } from '../../../services/taskService';
import type { TaskFilters } from '../../../services/taskService';

export const useFilteredTaskLists = (
  taskLists: TaskList[],
  taskFilters: TaskFilters,
): TaskList[] => {
  return useMemo(() => {
    if (!taskFilters.query && !taskFilters.status && !taskFilters.priority) {
      return taskLists;
    }
    const q = taskFilters.query?.toLowerCase() ?? '';
    return taskLists
      .map((list) => ({
        ...list,
        tasks: list.tasks?.filter((task) => {
          if (
            q &&
            !task.title.toLowerCase().includes(q) &&
            !task.description?.toLowerCase().includes(q)
          ) {
            return false;
          }
          if (taskFilters.status && task.status !== taskFilters.status)
            return false;
          if (taskFilters.priority && task.priority !== taskFilters.priority)
            return false;
          return true;
        }),
      }))
      .filter((list) => list.tasks.length > 0 || !taskFilters.query);
  }, [taskLists, taskFilters]);
};
