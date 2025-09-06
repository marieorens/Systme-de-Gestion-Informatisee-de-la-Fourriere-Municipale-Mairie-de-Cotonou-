
export function calculateImpoundFees(type: string, days: number): { removalFee: number, dailyFee: number, total: number } {
 
  const feeTable: Record<string, { removal: number, daily: number }> = {
    'Deux-roues motorisés': { removal: 5000, daily: 2000 },
    'Tricycles': { removal: 10000, daily: 3000 },
    'Véhicule de 4 à 12 places': { removal: 30000, daily: 5000 },
    'Véhicule de 13 à 30 places': { removal: 50000, daily: 10000 },
    'Véhicule à partir de 31 places': { removal: 80000, daily: 15000 },
    'Camion inférieur à 5 tonnes': { removal: 50000, daily: 10000 },
    'Camion de 5 à 10 tonnes': { removal: 120000, daily: 15000 },
    'Camion supérieur à 10 tonnes': { removal: 150000, daily: 20000 },
  };

  const fees = feeTable[type] || { removal: 0, daily: 0 };
  const removalFee = fees.removal;
  const dailyFee = fees.daily;
  const total = removalFee + Math.max(days, 1) * dailyFee;
  return { removalFee, dailyFee, total };
}
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
