import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCyclesStore } from "../../stores/cyclesStore";
import type { ChallengeCycleDto, ChallengeCycleStatus } from "../../types/cycle";
import {
  Button,
  Chip,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { Search, Add } from "@mui/icons-material";
import CommonTable, { type TableColumn } from "../../components/common/CommonTable";

export default function CycleList() {
  const navigate = useNavigate();
  const { items, page, loading, error, fetch } = useCyclesStore();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ChallengeCycleStatus | "">("");

  useEffect(() => {
    fetch({ page: 0 });
  }, [fetch]);

  const handleFilter = () => {
    fetch({ page: 0, search: search || undefined, status: status || undefined });
  };

  const handlePageChange = (newPage: number) => {
    fetch({ page: newPage - 1, search: search || undefined, status: status || undefined });
  };

  const getStatusColor = (status: ChallengeCycleStatus): "default" | "success" | "info" | "secondary" => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "COMPLETED":
        return "info";
      case "ARCHIVED":
        return "secondary";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: ChallengeCycleStatus): string => {
    const labels: Record<ChallengeCycleStatus, string> = {
      DRAFT: "Nháp",
      ACTIVE: "Đang hoạt động",
      COMPLETED: "Đã hoàn thành",
      ARCHIVED: "Đã lưu trữ",
    };
    return labels[status] || status;
  };

  const currentPage = page?.page ?? 0;
  const totalElements = page?.totalElements ?? 0;
  const pageSize = page?.size ?? 10;

  const columns: TableColumn<ChallengeCycleDto>[] = [
    {
      key: "index",
      title: "STT",
      sortable: false,
      render: (cycle) => {
        const idx = items.findIndex((item) => item.id === cycle.id);
        return currentPage * pageSize + idx + 1;
      },
    },
    {
      key: "name",
      title: "Tên Chu Kỳ",
      render: (cycle) => (
        <div>
          <div className="font-medium">{cycle.name}</div>
          {cycle.description && (
            <div className="text-sm text-gray-500">
              {cycle.description.slice(0, 50)}
              {cycle.description.length > 50 ? "..." : ""}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      title: "Trạng Thái",
      render: (cycle) => (
        <Chip
          size="small"
          label={getStatusLabel(cycle.status)}
          color={getStatusColor(cycle.status)}
        />
      ),
    },
    {
      key: "startDate",
      title: "Ngày Bắt Đầu",
    },
    {
      key: "endDate",
      title: "Ngày Kết Thúc",
      render: (cycle) => cycle.endDate || "-",
    },
    {
      key: "actions",
      title: "Thao Tác",
      className: "text-right",
      sortable: false,
      render: (cycle) => (
        <div className="text-right">
          <Button
            size="small"
            variant="text"
            color="primary"
            onClick={() => navigate(`/manage/cycles/${cycle.id}`)}
          >
            Xem
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <Typography variant="h5" fontWeight="medium" className="mb-4">
        Quản Lý Chu Kỳ Tuyển Thành Viên
      </Typography>

      <Paper sx={{ p: 3 }}>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <TextField
            placeholder="Tìm kiếm theo tên chu kỳ, mô tả..."
            size="small"
            className="flex-1 min-w-[200px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleFilter();
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
            displayEmpty
            value={status}
            onChange={(e) => setStatus(e.target.value as ChallengeCycleStatus | "")}
            renderValue={(v) => (v ? getStatusLabel(v as ChallengeCycleStatus) : "Tất cả trạng thái")}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Tất cả trạng thái</MenuItem>
            <MenuItem value="DRAFT">Nháp</MenuItem>
            <MenuItem value="ACTIVE">Đang hoạt động</MenuItem>
            <MenuItem value="COMPLETED">Đã hoàn thành</MenuItem>
            <MenuItem value="ARCHIVED">Đã lưu trữ</MenuItem>
          </Select>
          <Button variant="contained" onClick={handleFilter}>
            Lọc
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => navigate("/manage/cycles/new")}
          >
            Tạo Chu Kỳ Mới
          </Button>
        </div>

        {loading && (
          <div className="text-gray-500 py-6 text-center">Đang tải...</div>
        )}
        {error && !loading && (
          <div className="text-red-600 py-6 text-center">{error}</div>
        )}
        {!loading && !error && (
          <CommonTable<ChallengeCycleDto>
            columns={columns}
            data={items}
            keyField="id"
            page={currentPage + 1}
            pageSize={pageSize}
            total={totalElements}
            onPageChange={handlePageChange}
            showPageSizeSelector={false}
          />
        )}
        {!loading && !error && items.length === 0 && (
          <div className="text-center text-gray-500 py-8">Không có dữ liệu</div>
        )}
      </Paper>
    </div>
  );
}
