import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { taskService, type Task, type TaskList } from '../services/taskService';
import { projectService, type Project } from '../services/projectService';

const TaskBoard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProjectAndTasks(projectId);
    }
  }, [projectId]);

  const loadProjectAndTasks = async (projectSlug: string) => {
    try {
      setLoading(true);
      // First load the project to get its ID
      const projectData = await projectService.getProject(projectSlug);
      setProject(projectData);

      // Then load task lists using the project ID
      const taskListsData = await taskService.getTaskLists(projectData.id);
      setTaskLists(taskListsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load project or tasks');
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

  if (loading) {
    return <div className="page-loading">Loading task board...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="task-board-page">
      <div className="page-header">
        <div className="header-left">
          <Link to={`/projects/${projectId}`} className="back-link">← Back to Project</Link>
          <h1>Task Board</h1>
        </div>
        <div className="header-actions">
          <button className="btn-primary">+ Add Task</button>
        </div>
      </div>

      {taskLists.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No task lists yet</h3>
          <p>Create your first task list to start organizing tasks</p>
          <button className="btn-primary">+ Add Task List</button>
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
                        {task.priority}
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
                          <span className="unassigned">Unassigned</span>
                        )}
                      </div>
                      {task.due_date && (
                        <span className={`task-due-date ${task.is_overdue ? 'overdue' : ''}`}>
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <button className="add-task-btn">+ Add Task</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
