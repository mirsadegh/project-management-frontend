import React from 'react';
import type { DeleteTarget } from '../types';

interface DeleteConfirmModalProps {
  target: DeleteTarget | null;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  target,
  isPending,
  onConfirm,
  onCancel,
}) => {
  if (!target) return null;

  const message =
    target.type === 'list'
      ? `آیا از حذف لیست «${target.name}» مطمئن هستید؟ تمام وظایف داخل این لیست نیز حذف خواهند شد.`
      : `آیا از حذف وظیفه «${target.name}» مطمئن هستید؟`;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>تأیید حذف</h3>
        <p>{message}</p>
        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
          >
            انصراف
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'در حال حذف...' : 'حذف'}
          </button>
        </div>
      </div>
    </div>
  );
};
