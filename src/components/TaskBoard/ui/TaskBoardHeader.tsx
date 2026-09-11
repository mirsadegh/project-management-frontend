import React from 'react';
import { Link } from 'react-router-dom';
import AdvancedSearch from '../../common/AdvancedSearch';
import type { TaskFilters } from '../../../services/taskService';
import type { ApiError } from '../../../services/types';
import { getErrorMessage } from '../hooks/useTaskBoardMutations';

interface TaskBoardHeaderProps {
  projectId: string | undefined;
  taskFilters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  error: ApiError | null;
}
const PRIORITY_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'TODO', label: 'انجام‌نشده' },
  { value: 'IN_PROGRESS', label: 'در حال انجام' },
  { value: 'IN_REVIEW', label: 'در حال بررسی' },
  { value: 'COMPLETED', label: 'تکمیل‌شده' },
  { value: 'BLOCKED', label: 'مسدودشده' },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'priority', label: 'اولویت' },
  { value: 'due_date', label: 'مهلت' },
  { value: 'title', label: 'عنوان' },
];


export const TaskBoardHeader: React.FC<TaskBoardHeaderProps> = ({
  projectId,
  taskFilters,
  onFiltersChange,
  error,
}) => {
  if (error) {
    return (
      <div className="error-message">
        {getErrorMessage(error, 'بارگذاری پروژه یا وظایف ناموفق بود')}
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="header-left">
          <Link to={`/projects/${projectId}`} className="back-link">
            → بازگشت به پروژه
          </Link>
          <h1>بورد وظایف</h1>
        </div>
      </div>

      <AdvancedSearch
        filters={taskFilters}
        onFiltersChange={onFiltersChange}
        searchPlaceholder="جستجو در وظایف..."
        statusOptions={PRIORITY_STATUS_OPTIONS}
        sortOptions={SORT_OPTIONS}
      />
    </>
  );
};
