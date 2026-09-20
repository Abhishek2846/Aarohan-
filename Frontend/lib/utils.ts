import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactINR(amount: number): string {
  if (Math.abs(amount) >= 10000000) {
    const crores = amount / 10000000;
    return `₹${crores.toLocaleString("en-IN", { maximumFractionDigits: 1 })} Cr`;
  }
  if (Math.abs(amount) >= 100000) {
    const lakhs = amount / 100000;
    return `₹${lakhs.toLocaleString("en-IN", { maximumFractionDigits: 1 })} L`;
  }
  return formatINR(amount);
}

export function formatAreaHectares(hectares: number): string {
  if (!hectares || isNaN(hectares)) return "0 Acres (0 Ha)";
  const acres = Number((hectares * 2.47105).toFixed(2));
  return `${acres.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} Acres (~${hectares.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} Ha)`;
}

export function formatULPIN(ulpin: string): string {
  if (!ulpin) return "";
  // Formats 14 alphanumeric character ULPIN into 4-4-4-2 readable segments
  return ulpin.replace(/(\w{4})(\w{4})(\w{4})(\w{2})/, "$1-$2-$3-$4");
}

