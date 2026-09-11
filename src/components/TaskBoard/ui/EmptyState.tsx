import React from 'react';

interface EmptyStateProps {
  onAddList: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onAddList }) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">📋</div>
      <h3>هنوز لیست وظایفی وجود ندارد</h3>
      <p>اولین لیست وظایف را بسازید تا کارها را سازمان‌دهی کنید</p>
      <button className="btn-primary" onClick={onAddList}>
        + افزودن لیست وظایف
      </button>
    </div>
  );
};
