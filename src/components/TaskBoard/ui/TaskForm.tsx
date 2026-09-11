import React, { useState } from 'react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import type { Value } from 'react-multi-date-picker';
import type { Task, TaskList, UserSummary } from '../../../services/taskService';
import { PRIORITIES, STATUSES } from '../constants';
import {
  getPriorityLabel,
  getTaskStatusLabel,
  toPersianNumerals,
} from '../../../utils/labels';
import { toJalaliDate, fromJalaliDate } from '../../../utils/date';
import type { TaskFormState, NewTaskPayload, UpdateTaskPayload } from '../types';

interface TaskFormProps {
  mode: 'create' | 'edit';
  projectId: number | undefined;
  taskLists: TaskList[];
  users: UserSummary[];
  initialTask?: Partial<TaskFormState>;
  isPending: boolean;
  error: string | null;
  onSubmit: (data: NewTaskPayload | UpdateTaskPayload) => void;
  onCancel: () => void;
}

const initialFormState: TaskFormState = {
  task_list: '',
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'TODO',
  due_date: '',
  assignee_id: '',
};

export const TaskForm: React.FC<TaskFormProps> = ({
  mode,
  projectId,
  taskLists,
  users,
  initialTask,
  isPending,
  error: errorProp,
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState<TaskFormState>({
    ...initialFormState,
    ...(initialTask ?? {}),
  });
  const [error, setError] = useState<string | null>(errorProp);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('عنوان وظیفه الزامی است');
      return;
    }
    if (mode === 'create' && form.task_list === '') {
      setError('لطفاً یک لیست وظایف انتخاب کنید');
      return;
    }
    setError(null);
    if (mode === 'create') {
      onSubmit({
        project: projectId!,
        task_list: Number(form.task_list),
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        status: form.status,
        due_date: form.due_date || null,
        assignee_id:
          form.assignee_id === '' ? null : Number(form.assignee_id),
      } as NewTaskPayload);
    } else {
      onSubmit({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        status: form.status,
        assignee_id:
          form.assignee_id === '' ? null : Number(form.assignee_id),
      } as UpdateTaskPayload);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{mode === 'create' ? 'افزودن وظیفه' : 'ویرایش وظیفه'}</h3>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>لیست وظایف</label>
            <select
              value={form.task_list}
              onChange={(e) =>
                setForm({
                  ...form,
                  task_list:
                    e.target.value === '' ? '' : Number(e.target.value),
                })
              }
              disabled={isPending}
              required
            >
              {taskLists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>عنوان</label>
            <input
              type="text"
              maxLength={300}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="عنوان وظیفه"
              disabled={isPending}
              required
            />
            <div
              className={`char-counter ${
                form.title.length > 270
                  ? 'error'
                  : form.title.length > 210
                    ? 'warning'
                    : ''
              }`}
            >
              {toPersianNumerals(form.title.length)}/{toPersianNumerals(300)}
            </div>
          </div>
          <div className="form-group">
            <label>توضیحات</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              disabled={isPending}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>اولویت</label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({
                    ...form,
                    priority: e.target.value as Task['priority'],
                  })
                }
                disabled={isPending}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {getPriorityLabel(p)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>وضعیت</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as Task['status'],
                  })
                }
                disabled={isPending}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {getTaskStatusLabel(s)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>مهلت</label>
              <DatePicker
                value={toJalaliDate(form.due_date || null)}
                onChange={(v: Value) =>
                  setForm({
                    ...form,
                    due_date: fromJalaliDate(v as Date | null) || '',
                  })
                }
                disabled={isPending}
                calendar={persian}
                locale={persian_fa}
                inputClass="date-input"
                containerClassName="date-picker-container"
                format="YYYY/MM/DD"
                placeholder="انتخاب تاریخ"
              />
            </div>
            <div className="form-group">
              <label>مسئول (اختیاری)</label>
              <select
                value={form.assignee_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    assignee_id:
                      e.target.value === '' ? '' : Number(e.target.value),
                  })
                }
                disabled={isPending}
              >
                <option value="">بدون مسئول</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.username}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              disabled={isPending}
            >
              انصراف
            </button>
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending
                ? mode === 'create'
                  ? 'در حال ایجاد...'
                  : 'در حال ذخیره...'
                : mode === 'create'
                  ? 'ایجاد وظیفه'
                  : 'ذخیره تغییرات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export type { Task };
