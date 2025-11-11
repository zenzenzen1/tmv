import { useEffect, useMemo, useState } from "react";
import { Box, Paper, Stack, TextField, Typography, Button } from "@mui/material";
import { trainingSessionService } from "@/services/trainingSessions";
import type { TrainingSessionListDto } from "@/types/training";
import type { PaginationResponse } from "@/types/api";
import { globalErrorHandler } from "@/utils/errorHandler";
import { useToast } from "@/components/common/ToastContext";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function toLocalDateTimeRange(date: string, endOfDay = false): string {
  // Backend expects LocalDateTime (ISO without timezone is fine for local)
  return `${date}T${endOfDay ? "23:59:59" : "00:00:00"}`;
}

export default function TrainingSessionCalendarPage() {
  const toast = useToast();
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [items, setItems] = useState<TrainingSessionListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await trainingSessionService.calendar({
        startDate: toLocalDateTimeRange(startDate, false),
        endDate: toLocalDateTimeRange(endDate, true),
      });
      const page: PaginationResponse<TrainingSessionListDto> | undefined = resp.data;
      const data = page?.content ?? [];
      setItems(data);
    } catch (err) {
      const { message } = globalErrorHandler(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, TrainingSessionListDto[]>();
    for (const s of items) {
      const key = (s.startTime || "").slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? -1 : 1));
  }, [items]);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
        Lịch buổi tập luyện
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Từ ngày"
            type="date"
            size="small"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Đến ngày"
            type="date"
            size="small"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="contained" onClick={fetchData} disabled={loading}>
            Xem lịch
          </Button>
        </Stack>
      </Paper>

      {loading && (
        <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
          Đang tải lịch...
        </Typography>
      )}
      {error && !loading && (
        <Typography align="center" color="error" sx={{ py: 4 }}>
          {error}
        </Typography>
      )}

      {!loading && !error && grouped.map(([date, sessions]) => (
        <Paper key={date} sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {formatDate(date)}
          </Typography>
          <Stack spacing={1}>
            {sessions.map((s) => (
              <Box key={s.id} sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography fontWeight={600}>{s.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {s.startTime ? new Date(s.startTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : ""}
                  {" - "}
                  {s.endTime ? new Date(s.endTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : ""}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      ))}
      {!loading && !error && grouped.length === 0 && (
        <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
          Không có buổi tập nào trong khoảng thời gian này.
        </Typography>
      )}
    </Box>
  );
}


