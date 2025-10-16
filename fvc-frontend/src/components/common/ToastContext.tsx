import { createContext, useContext } from "react";
import type { AlertColor } from "@mui/material";

export type ToastContextValue = {
  show: (message: string, severity?: AlertColor, durationMs?: number) => void;
  success: (message: string, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  warning: (message: string, durationMs?: number) => void;
  info: (message: string, durationMs?: number) => void;
};

export const ToastContext = createContext<ToastContextValue | undefined>(
  undefined
);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
