import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFirestoreDate(val: any): string {
  if (!val) return new Date().toISOString();
  try {
    if (typeof val.toDate === 'function') {
      return val.toDate().toISOString();
    }
    const date = new Date(val);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch (e) {
    console.error("Error formatting date:", e);
  }
  return new Date().toISOString();
}
