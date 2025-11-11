import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Refresh, Search } from "@mui/icons-material";
import { CommonTable, type TableColumn } from "@/components/common/CommonTable";
import { trainingSessionService } from "@/services/trainingSessions";
import { useToast } from "@/components/common/ToastContext";
import { globalErrorHandler } from "@/utils/errorHandler";
import type { TrainingSessionListDto, TrainingSessionStatus } from "@/types/training";
import type { PaginationResponse } from "@/types/api";
import { useNavigate } from "react-router-dom";

function toLocalDateTimeRange(date: string, endOfDay = false): string {
  return `${date}T${endOfDay ? "23:59:59" : "00:00:00"}`;
}

type StatusFilter = TrainingSessionStatus | "ALL";

export default function TrainingSessionListPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<TrainingSessionListDto[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [refreshVersion, setRefreshVersion] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await trainingSessionService.list({
        page: page - 1,
        size: pageSize,
        search: search || undefined,
        status: status === "ALL" ? undefined : status,
        startDate: startDate ? toLocalDateTimeRange(startDate, false) : undefined,
        endDate: endDate ? toLocalDateTimeRange(endDate, true) : undefined,
      });
      const data = resp.data as unknown as PaginationResponse<TrainingSessionListDto>;
      setRows(data.content ?? []);
      setTotal(data.totalElements ?? 0);
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
  }, [page, pageSize, status, startDate, endDate, refreshVersion]);

  const applySearch = () => {
    setPage(1);
    void fetchData();
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("ALL");
    setStartDate("");
    setEndDate("");
    setPage(1);
    setRefreshVersion((v) => v + 1);
  };

  const columns: TableColumn<TrainingSessionListDto>[] = useMemo(
    () => [
      {
        key: "title",
        title: "Tiêu đề",
        render: (row) => (
          <Box>
            <Typography fontWeight={600}>{row.title}</Typography>
            {row.description && (
              <Typography variant="body2" color="text.secondary">
                {row.description}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        key: "startTime",
        title: "Bắt đầu",
        render: (row) =>
          row.startTime ? new Date(row.startTime).toLocaleString("vi-VN") : "—",
      },
      {
        key: "endTime",
        title: "Kết thúc",
        render: (row) =>
          row.endTime ? new Date(row.endTime).toLocaleString("vi-VN") : "—",
      },
      {
        key: "status",
        title: "Trạng thái",
        render: (row) => (
          <Chip
            size="small"
            label={row.status}
            color={
              row.status === "PLANNED"
                ? "default"
                : row.status === "IN_PROGRESS"
                ? "info"
                : row.status === "COMPLETED"
                ? "success"
                : "warning"
            }
          />
        ),
      },
      {
        key: "capacity",
        title: "Sức chứa",
        render: (row) =>
          typeof row.capacity === "number"
            ? row.capacity.toLocaleString("vi-VN")
            : "—",
      },
    ],
    []
  );

  return (
    <Box sx={{ p: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Danh sách buổi tập luyện
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Lọc theo ngày, trạng thái hoặc tìm kiếm tiêu đề.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={() => navigate("/manage/training-sessions/new")}>Tạo buổi tập</Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Refresh />}
            onClick={() => setRefreshVersion((v) => v + 1)}
            disabled={loading}
          >
            Làm mới
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Tìm kiếm theo tiêu đề..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            InputProps={{
              startAdornment: <Search fontSize="small" />,
            }}
          />
          <Select
            size="small"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            sx={{ width: { xs: "100%", md: 220 } }}
          >
            <MenuItem value="ALL">Tất cả trạng thái</MenuItem>
            <MenuItem value="PLANNED">Chưa bắt đầu</MenuItem>
            <MenuItem value="IN_PROGRESS">Đang diễn ra</MenuItem>
            <MenuItem value="COMPLETED">Đã kết thúc</MenuItem>
            <MenuItem value="CANCELLED">Đã hủy</MenuItem>
          </Select>
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
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={applySearch} disabled={loading}>
              Lọc
            </Button>
            <Button variant="text" onClick={resetFilters} disabled={loading}>
              Đặt lại
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        {loading && (
          <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
            Đang tải dữ liệu...
          </Typography>
        )}
        {error && !loading && (
          <Typography align="center" color="error" sx={{ py: 4 }}>
            {error}
          </Typography>
        )}
        {!loading && !error && (
          <CommonTable<TrainingSessionListDto>
            columns={columns}
            data={rows}
            keyField="id"
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
          />
        )}
        {!loading && !error && rows.length === 0 && (
          <Typography align="center" color="text.secondary" sx={{ py: 6 }}>
            Không có buổi tập nào.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}


