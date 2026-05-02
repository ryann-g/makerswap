import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Consistently converts Firestore timestamps or date strings to ISO strings.
 * Handles serverTimestamp() pending states and legacy date formats.
 */
export function formatFirestoreDate(val: any): string {
  if (!val) return new Date().toISOString();
  
  try {
    // Handle Firestore Timestamp object
    if (val && typeof val === 'object' && 'seconds' in val) {
      return new Date(val.seconds * 1000).toISOString();
    }
    
    // Handle legacy toDate() method if present
    if (typeof val.toDate === 'function') {
      return val.toDate().toISOString();
    }
    
    // Handle existing Date or string formats
    const date = new Date(val);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch (e) {
    console.warn("Date conversion fallback triggered:", e);
  }
  
  return new Date().toISOString();
}
