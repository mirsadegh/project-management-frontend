import React, { useState, useEffect } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
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
  // Local state for instant UI feedback while typing. The input uses
  // `key={filters.query}` so that when the parent clears the query (clear
  // button), React remounts the input and re-initializes localQuery â
  // avoiding setState-inside-effect (react-hooks/set-state-in-effect)
  // while preserving the previous sync behavior.
  const [localQuery, setLocalQuery] = useState(filters.query ?? '');
  const debouncedQuery = useDebounce(localQuery, 300);
  useEffect(() => {
    if (debouncedQuery !== filters.query) {
      onFiltersChange({ ...filters, query: debouncedQuery });
    }
  }, [debouncedQuery, filters, onFiltersChange]);

  return (
    <div className="advanced-search" role="search">
      <div className="search-input-wrapper">
        <input
          key={filters.query ?? '__empty'}
          type="text"
          className="search-input"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label="جستجو"
        />
        {localQuery && (
          <button
            className="search-clear-btn"
            onClick={() => {
              setLocalQuery('');
              onFiltersChange({ ...filters, query: '' });
            }}
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
