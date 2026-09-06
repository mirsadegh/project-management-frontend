/** برچسب‌ها و ترجمه‌های مشترک فارسی */

import { toJalali } from './date';

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'مدیر سیستم',
  PM: 'مدیر پروژه',
  TL: 'سرپرست تیم',
  DEV: 'توسعه‌دهنده',
  DES: 'طراح',
  CLIENT: 'کارفرما',
  OWNER: 'مالک',
  MANAGER: 'مدیر',
  MEMBER: 'عضو',
  VIEWER: 'بازدیدکننده',
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  PLANNING: 'برنامه‌ریزی',
  IN_PROGRESS: 'در حال انجام',
  ON_HOLD: 'متوقف',
  COMPLETED: 'تکمیل‌شده',
  CANCELLED: 'لغوشده',
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'کم',
  MEDIUM: 'متوسط',
  HIGH: 'بالا',
  CRITICAL: 'بحرانی',
  URGENT: 'فوری',
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  TODO: 'انجام‌نشده',
  IN_PROGRESS: 'در حال انجام',
  IN_REVIEW: 'در حال بررسی',
  COMPLETED: 'تکمیل‌شده',
  BLOCKED: 'مسدود',
};

export function getRoleLabel(role?: string | null): string {
  if (!role) return '—';
  return ROLE_LABELS[role] || role;
}

export function getStatusLabel(status?: string | null): string {
  if (!status) return '—';
  return PROJECT_STATUS_LABELS[status] || status.replace(/_/g, ' ');
}

export function getPriorityLabel(priority?: string | null): string {
  if (!priority) return '—';
  return PRIORITY_LABELS[priority] || priority;
}

export function getTaskStatusLabel(status?: string | null): string {
  if (!status) return '—';
  return TASK_STATUS_LABELS[status] || status.replace(/_/g, ' ');
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  // Backend returns Gregorian YYYY-MM-DD; display as Jalali
  const j = toJalali(dateString);
  if (!j) return '—';
  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '—';
  // Backend returns Gregorian YYYY-MM-DD; display as Jalali
  const j = toJalali(dateString);
  if (!j) return '—';
  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
}

// Re-export Jalali utilities for use in components
export { toJalali, toDate, toGregorianString, toJalaliDate, fromJalaliDate } from './date';
export type { JalaliDate } from './date';
