import React, { useState } from 'react';
import { toPersianNumerals } from '../../../utils/labels';

interface ListFormProps {
  mode: 'create' | 'edit';
  initialName?: string;
  initialDescription?: string;
  isPending: boolean;
  error: string | null;
  onSubmit: (data: { name: string; description?: string }) => void;
  onCancel: () => void;
}

export const ListForm: React.FC<ListFormProps> = ({
  mode,
  initialName = '',
  initialDescription = '',
  isPending,
  error: errorProp,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState<string | null>(errorProp);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('نام لیست الزامی است');
      return;
    }
    setError(null);
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <form className="create-list-form" onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}
      <div className="form-group">
        <label>نام لیست</label>
        <input
          type="text"
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثلاً: انجام‌نشده"
          disabled={isPending}
        />
        <div
          className={`char-counter ${
            name.length > 90 ? 'error' : name.length > 70 ? 'warning' : ''
          }`}
        >
          {toPersianNumerals(name.length)}/{toPersianNumerals(100)}
        </div>
      </div>
      <div className="form-group">
        <label>توضیحات (اختیاری)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isPending}
        />
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
              ? 'ایجاد لیست'
              : 'ذخیره تغییرات'}
        </button>
      </div>
    </form>
  );
};
