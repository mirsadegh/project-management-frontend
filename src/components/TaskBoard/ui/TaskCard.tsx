import type { Task, TaskList } from '../../../services/taskService';
import { getPriorityColor } from '../constants';
import { getPriorityLabel } from '../../../utils/labels';
import { formatDateJalali } from '../../../utils/date';

interface TaskCardProps {
  task: Task;
  editingTask: Task | null;
  editingTaskMutationPending: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  editingTask,
  editingTaskMutationPending,
  onEdit,
  onDelete,
}) => {
  return (
    <div key={task.id} className="task-card">
      <div className="task-card-header">
        <h4 className="task-card-title">{task.title}</h4>
        <div className="task-card-actions">
          <button
            className="icon-btn icon-btn-sm"
            title="ویرایش وظیفه"
            aria-label="ویرایش وظیفه"
            onClick={() => onEdit(task)}
            disabled={!!editingTask}
          >
            ✏️
          </button>
          <button
            className="icon-btn icon-btn-sm"
            title="حذف وظیفه"
            aria-label="حذف وظیفه"
            onClick={() => onDelete(task)}
            disabled={editingTaskMutationPending}
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
                {task.assignee.full_name?.charAt(0) ||
                  task.assignee.username.charAt(0)}
              </div>
            </>
          ) : (
            <span className="unassigned">بدون مسئول</span>
          )}
        </div>
        {task.due_date && (
          <span
            className={`task-due-date ${task.is_overdue ? 'overdue' : ''}`}
          >
            {formatDateJalali(task.due_date)}
          </span>
        )}
      </div>
    </div>
  );
};

export type { Task, TaskList };
