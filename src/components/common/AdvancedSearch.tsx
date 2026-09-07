import React from 'react';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback';
import type { SearchFilters } from '../../services/projectService';
import './AdvancedSearch.css';

interface AdvancedSearchProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  searchPlaceholder?: string;
  statusOptions?: { value: string; label: string }[];
  sortOptions?: { value: string; label: string }[];
  showOwnerFilter?: boolean;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  filters,
  onFiltersChange,
  searchPlaceholder = 'جستجو...',
  statusOptions = [],
  sortOptions = [],
}) => {
  const debouncedChange = useDebouncedCallback(onFiltersChange, 300);

  const handleQueryChange = (query: string) => {
    debouncedChange({ ...filters, query });
  };

  return (
    <div className="advanced-search" role="search">
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          value={filters.query ?? ''}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label="جستجو"
        />
        {filters.query && (
          <button
            className="search-clear-btn"
            onClick={() => onFiltersChange({ ...filters, query: '' })}
            aria-label="پاک کردن جستجو"
          >
            ✕
          </button>
        )}
      </div>

      {statusOptions.length > 0 && (
        <select
          className="filter-select"
          value={filters.status ?? ''}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
          aria-label="فیلتر وضعیت"
        >
          <option value="">همه وضعیت‌ها</option>
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {sortOptions.length > 0 && (
        <select
          className="filter-select"
          value={filters.sortBy ?? 'created_at'}
          onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value })}
          aria-label="مرتب‌سازی"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      <button
        className="sort-order-btn"
        onClick={() =>
          onFiltersChange({
            ...filters,
            sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
          })
        }
        aria-label={filters.sortOrder === 'asc' ? 'صعودی' : 'نزولی'}
        title={filters.sortOrder === 'asc' ? 'صعودی' : 'نزولی'}
      >
        {filters.sortOrder === 'asc' ? '↑' : '↓'}
      </button>
    </div>
  );
};

export default AdvancedSearch;
