import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a cryptocurrency balance for display
 */
export function formatBalance(balance: string, decimals: number = 8): string {
  // Convert to number, handle scientific notation
  const num = parseFloat(balance);
  
  // Format with appropriate number of decimals
  if (num === 0) return '0';
  
  if (num < 0.00001) {
    return num.toExponential(2);
  }
  
  // Format with appropriate number of decimals
  return num.toLocaleString(undefined, { 
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}
