/** TaskBoard-specific constants and color helpers. */
import type { Task } from '../../services/taskService';

export const PRIORITIES: Task['priority'][] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
export const STATUSES: Task['status'][] = [
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'COMPLETED',
  'BLOCKED',
];

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

export const getPriorityColor = (priority: string): string =>
  PRIORITY_COLORS[priority] ?? '#6b7280';
