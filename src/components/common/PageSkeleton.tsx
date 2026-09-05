// src/components/common/PageSkeleton.tsx
//
// Lightweight loading skeleton shown by the route-level <Suspense>
// boundary while a lazy-loaded chunk is being fetched. The skeleton
// intentionally mirrors the protected-layout shape (top nav bar + a
// block of content lines + a card grid) so the page does not visually
// jump when the real component mounts.
//
// Notes:
//  - Uses CSS-only pulse animation (no external deps, no JS timers).
//  - `role="status"` + `aria-label="Loading"` for screen readers.
//  - RTL-safe: the layout is flex/grid based, no `left/right` offsets
//    that would flip incorrectly. We use `dir="rtl"` to match the app.
//  - Persian copy in the aria label matches the rest of the app
//    ("در حال بارگذاری..." = "Loading...").
import './PageSkeleton.css';

export default function PageSkeleton() {
  return (
    <div className="page-skeleton" role="status" aria-label="در حال بارگذاری..." dir="rtl">
      <div className="skeleton-header" />
      <div className="skeleton-content">
        <div className="skeleton-line skeleton-line-wide" />
        <div className="skeleton-line skeleton-line-medium" />
        <div className="skeleton-line skeleton-line-narrow" />
        <div className="skeleton-grid">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      </div>
    </div>
  );
}
