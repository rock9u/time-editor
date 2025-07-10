import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a unique identifier for timeline intervals
 */
export function generateUUID(): string {
  return crypto.randomUUID()
}

/**
 * Deep clone an object to prevent shared references
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}
