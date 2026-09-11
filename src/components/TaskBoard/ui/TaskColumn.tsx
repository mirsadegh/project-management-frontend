import type { Task, TaskList } from '../../../services/taskService';
import { TaskCard } from './TaskCard';

interface TaskColumnProps {
  list: TaskList;
  editingList: TaskList | null;
  editingTask: Task | null;
  deleteListMutationPending: boolean;
  deleteTaskMutationPending: boolean;
  onAddTask: (listId: number) => void;
  onEditList: (list: TaskList) => void;
  onDeleteList: (list: TaskList) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

export const TaskColumn: React.FC<TaskColumnProps> = ({
  list,
  editingList,
  editingTask,
  deleteListMutationPending,
  deleteTaskMutationPending,
  onAddTask,
  onEditList,
  onDeleteList,
  onEditTask,
  onDeleteTask,
}) => {
  return (
    <div key={list.id} className="task-column">
      <div className="column-header">
        <div className="column-title-row">
          <h3>{list.name}</h3>
          <span className="task-count">
            {list.tasks?.length || 0}
          </span>
        </div>
        <div className="column-actions">
          <button
            className="icon-btn"
            title="ویرایش لیست"
            aria-label="ویرایش لیست"
            onClick={() => onEditList(list)}
            disabled={!!editingList}
          >
            ✏️
          </button>
          <button
            className="icon-btn"
            title="حذف لیست"
            aria-label="حذف لیست"
            onClick={() => onDeleteList(list)}
            disabled={deleteListMutationPending}
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="task-list">
        {list.tasks?.length === 0 && (
          <div className="empty-list-message">وظیفه‌ای در این لیست نیست</div>
        )}
        {list.tasks?.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            editingTask={editingTask}
            editingTaskMutationPending={deleteTaskMutationPending}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
          />
        ))}
        <button
          className="add-task-btn"
          onClick={() => onAddTask(list.id)}
        >
          + افزودن وظیفه
        </button>
      </div>
    </div>
  );
};
