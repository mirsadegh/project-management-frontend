/**
 * Jalali/Gregorian date conversion utilities.
 * Backend stores Gregorian (YYYY-MM-DD); frontend displays Jalali.
 * Uses jalaali-js for conversion.
 */

import { toJalaali as _toJalaali, toGregorian as _toGregorian } from 'jalaali-js';

export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

/**
 * Convert a Gregorian YYYY-MM-DD string to a Jalali {jy, jm, jd} object.
 */
export function toJalali(dateString: string): JalaliDate | null {
  if (!dateString) return null;
  const [y, m, d] = dateString.split('-').map(Number);
  if (!y || !m || !d) return null;
  return _toJalaali(y, m, d);
}

/**
 * Convert a Jalali {jy, jm, jd} object to a JavaScript Date (local time).
 */
export function jalaliToDate(jalali: JalaliDate): Date {
  const { gy, gm, gd } = _toGregorian(jalali.jy, jalali.jm, jalali.jd);
  return new Date(gy, gm - 1, gd);
}

/**
 * Convert a Gregorian YYYY-MM-DD string to a JavaScript Date.
 */
export function toDate(dateString: string): Date | null {
  if (!dateString) return null;
  const [y, m, d] = dateString.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/**
 * Convert a JavaScript Date to a Gregorian YYYY-MM-DD string.
 */
export function toGregorianString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format a Gregorian YYYY-MM-DD string as a Jalali Persian display string
 * (e.g. "۱۴۰۴/۰۶/۱۵").
 */
export function formatDateJalali(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  const j = toJalali(dateString);
  if (!j) return '—';
  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
}

/**
 * Convert a Gregorian YYYY-MM-DD string to a Date object usable by
 * react-multi-date-picker in Jalali mode. Returns null for empty/invalid inputs.
 */
export function toJalaliDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  const j = toJalali(dateString);
  if (!j) return null;
  return jalaliToDate(j);
}

/**
 * Convert a react-multi-date-picker DateObject (or native Date) to a Gregorian
 * YYYY-MM-DD string for the backend.
 *
 * react-multi-date-picker's DateObject has:
 *   - year   : Jalali year
 *   - month.number : Jalali month (1-12)
 *   - day    : Jalali day
 *
 * We convert those Jalali values directly to Gregorian via jalaali-js.
 *
 * When onChange receives an array (multiple/range mode), the first element is used.
 * When it receives null/undefined, returns null.
 */
export function fromJalaliDate(
  value: unknown // DateObject | Date | Date[] | null
): string | null {
  if (!value) return null;

  // Handle array (multiple / range selection — take first item)
  if (Array.isArray(value)) {
    return fromJalaliDate(value[0] ?? null);
  }

  const date = value as { year: number; month: { number: number }; day: number };

  // DateObject from react-date-object (has year/month.number/day)
  if (typeof date.year === 'number' && typeof date.day === 'number') {
    const { gy, gm, gd } = _toGregorian(
      date.year,
      date.month.number,
      date.day
    );
    return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
  }

  // Native Date fallback
  if (value instanceof Date && !isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = value.getMonth() + 1;
    const d = value.getDate();
    const { gy, gm, gd } = _toGregorian(y, m, d);
    return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
  }

  return null;
}
