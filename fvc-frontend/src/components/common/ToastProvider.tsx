import React, { useCallback, useMemo, useState } from "react";
import { Snackbar, Alert, type AlertColor } from "@mui/material";
import { ToastContext, type ToastContextValue } from "./ToastContext";

type ToastProviderProps = {
  children: React.ReactNode;
  defaultDurationMs?: number;
};

export function ToastProvider({
  children,
  defaultDurationMs = 1000,
}: ToastProviderProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<AlertColor>("info");
  const [duration, setDuration] = useState<number>(defaultDurationMs);

  const show = useCallback(
    (msg: string, sev: AlertColor = "info", durationMs?: number) => {
      setMessage(msg);
      setSeverity(sev);
      setDuration(durationMs ?? defaultDurationMs);
      setOpen(true);
    },
    [defaultDurationMs]
  );

  const close = useCallback(() => setOpen(false), []);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (msg, d) => show(msg, "success", d),
      error: (msg, d) => show(msg, "error", d),
      warning: (msg, d) => show(msg, "warning", d),
      info: (msg, d) => show(msg, "info", d),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={duration}
        onClose={close}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={close}
          severity={severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
