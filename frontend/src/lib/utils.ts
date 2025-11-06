import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUZS(amount: number | string): string {
  const numeric = typeof amount === "string" ? Number(amount) : amount
  if (!Number.isFinite(numeric)) {
    return `${amount} сум`
  }
  return `${new Intl.NumberFormat('uz-UZ').format(Math.round(numeric))} сум`
}
