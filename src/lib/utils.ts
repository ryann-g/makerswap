import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFirestoreDate(val: any): string {
  if (!val) return new Date().toISOString();

  try {
    if (val && typeof val === 'object' && 'seconds' in val) {
      return new Date(val.seconds * 1000).toISOString();
    }

    if (typeof val.toDate === 'function') {
      return val.toDate().toISOString();
    }

    const date = new Date(val);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch (e) {
    if (isDev) console.warn("Date conversion fallback triggered:", e);
  }

  return new Date().toISOString();
}
