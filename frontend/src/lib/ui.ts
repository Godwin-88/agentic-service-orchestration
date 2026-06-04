import { toast } from "sonner";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const showToast = {
  success: (msg: string, options?: any) => toast.success(msg, options),
  error: (msg: string, options?: any) => toast.error(msg, options),
  loading: (msg: string) => toast.loading(msg),
};
