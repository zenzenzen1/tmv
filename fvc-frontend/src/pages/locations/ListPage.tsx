import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Refresh, Search } from "@mui/icons-material";
import { CommonTable, type TableColumn } from "@/components/common/CommonTable";
import { useToast } from "@/components/common/ToastContext";
import { useLocationStore } from "@/stores/locations";
import { globalErrorHandler } from "@/utils/errorHandler";
import type { LocationDto } from "@/types/location";
import LocationFormDialog from "./LocationFormDialog";

type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";

export default function LocationListPage() {
  const toast = useToast();
  const {
    list,
    filters,
    isLoading,
    error,
    fetch,
    openCreate,
    openEdit,
    deactivate,
  } = useLocationStore();

  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>(
    filters.isActive === undefined
      ? "ALL"
      : filters.isActive
      ? "ACTIVE"
      : "INACTIVE"
  );

  useEffect(() => {
    fetch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilters = async (override?: Partial<{ search: string; active: ActiveFilter }>) => {
    const nextSearch = override?.search ?? searchInput.trim();
    const nextActive = override?.active ?? activeFilter;
    await fetch({
      page: 0,
      search: nextSearch || undefined,
      isActive:
        nextActive === "ALL" ? undefined : nextActive === "ACTIVE",
    });
  };

  const handleApplyFilters = () => {
    void applyFilters();
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setActiveFilter("ALL");
    void applyFilters({ search: "", active: "ALL" });
  };

  const handleRefresh = () => {
    void fetch();
  };

  const handlePageChange = (newPage: number) => {
    void fetch({ page: newPage - 1 });
  };

  const handlePageSizeChange = (newSize: number) => {
    void fetch({ page: 0, size: newSize });
  };

  const data = list?.content ?? [];
  const page = (filters.page ?? 0) + 1;
  const pageSize = filters.size ?? 10;
  const total = list?.totalElements ?? data.length;

  const columns: TableColumn<LocationDto>[] = useMemo(
    () => [
      {
        key: "index",
        title: "#",
        sortable: false,
        render: (row) => {
          const index = data.findIndex((item) => item.id === row.id);
          return index >= 0 ? (filters.page ?? 0) * pageSize + index + 1 : "—";
        },
      },
      {
        key: "name",
        title: "Tên địa điểm",
        sortable: false,
        render: (row) => (
          <Box>
            <Typography fontWeight={600}>{row.name}</Typography>
            {row.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {row.description}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        key: "address",
        title: "Địa chỉ",
        sortable: false,
        render: (row) => row.address || "—",
      },
      {
        key: "capacityDefault",
        title: "Sức chứa mặc định",
        sortable: false,
        render: (row) =>
          typeof row.capacityDefault === "number"
            ? row.capacityDefault.toLocaleString("vi-VN")
            : "—",
      },
      {
        key: "isActive",
        title: "Trạng thái",
        sortable: false,
        render: (row) => (
          <Chip
            label={row.isActive ? "Đang sử dụng" : "Ngừng sử dụng"}
            color={row.isActive ? "success" : "default"}
            size="small"
          />
        ),
      },
      {
        key: "actions",
        title: "Thao tác",
        sortable: false,
        render: (row) => (
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" onClick={() => openEdit(row)}>
              Chỉnh sửa
            </Button>
            {row.isActive && (
              <Button
                size="small"
                color="error"
                onClick={async () => {
                  const confirmed = window.confirm(
                    `Bạn có chắc chắn muốn ngừng sử dụng địa điểm "${row.name}"?`
                  );
                  if (!confirmed) return;
                  try {
                    await deactivate(row.id);
                    toast.success("Đã ngừng sử dụng địa điểm");
                  } catch (err) {
                    const { message } = globalErrorHandler(err);
                    toast.error(message);
                  }
                }}
              >
                Ngừng
              </Button>
            )}
          </Stack>
        ),
      },
    ],
    [data, deactivate, filters.page, openEdit, pageSize, toast]
  );

  return (
    <Box sx={{ p: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3, flexWrap: "wrap", gap: 2 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Quản lý địa điểm tập luyện
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Theo dõi và quản lý danh sách địa điểm sử dụng cho các buổi tập.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            Làm mới
          </Button>
          <Button variant="contained" color="primary" onClick={openCreate}>
            Thêm địa điểm
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Tìm kiếm theo tên, địa chỉ..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleApplyFilters();
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Select
            size="small"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}
            sx={{ width: { xs: "100%", sm: 220 } }}
          >
            <MenuItem value="ALL">Tất cả trạng thái</MenuItem>
            <MenuItem value="ACTIVE">Chỉ địa điểm đang sử dụng</MenuItem>
            <MenuItem value="INACTIVE">Địa điểm đã ngừng</MenuItem>
          </Select>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={handleApplyFilters} disabled={isLoading}>
              Lọc
            </Button>
            <Button variant="text" onClick={handleResetFilters} disabled={isLoading}>
              Đặt lại
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        {isLoading && (
          <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
            Đang tải dữ liệu...
          </Typography>
        )}
        {error && !isLoading && (
          <Typography align="center" color="error" sx={{ py: 4 }}>
            {error}
          </Typography>
        )}
        {!isLoading && !error && (
          <CommonTable<LocationDto>
            columns={columns}
            data={data}
            keyField="id"
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
        {!isLoading && !error && data.length === 0 && (
          <Typography align="center" color="text.secondary" sx={{ py: 6 }}>
            Không tìm thấy địa điểm nào phù hợp với bộ lọc hiện tại.
          </Typography>
        )}
      </Paper>

      <LocationFormDialog />
    </Box>
  );
}


