import { useEffect, useState } from "react";
import apiService from "@/services/api";
import memberService from "@/services/memberService";
import { API_ENDPOINTS } from "@/config/endpoints";
import type { PaginationResponse } from "@/types/api";
import Footer from "@/components/layout/Footer";
import TournamentSidebar from "@/components/layout/Sidebar";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
// Fallback to simple layout using CSS grid to avoid Grid types mismatch
import { Search, FileDown, Eye } from "lucide-react";

type Member = {
  id: string;
  fullName: string;
  email: string;
  gender?: string; // API returns string
  studentCode?: string;
  phone?: string;
  department?: string | null;
  statusLabel?: string;
  joinedAt?: string | null;
  activityLogs?: string[];
};

// Members will be fetched from API

export default function MemberManagementListPage() {
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;
  const [members, setMembers] = useState<Member[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [tableError, setTableError] = useState<string>("");
  const [openDetail, setOpenDetail] = useState(false);
  const [selected, setSelected] = useState<Member | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string>("");

  // Fetch members when filters/page change
  useEffect(() => {
    let ignore = false;
    const fetchMembers = async () => {
      setTableError("");
      setTableLoading(true);
      try {
        const data: PaginationResponse<Member> = await memberService.getMembers(
          {
            page: page - 1, // backend thường 0-based
            size: pageSize,
            search: query || undefined,
            gender: gender || undefined,
            status: status || undefined,
          }
        );
        if (!ignore) {
          setMembers(data.content || []);
          setTotalPages(Math.max(1, data.totalPages || 1));
        }
      } catch (e: unknown) {
        if (!ignore) {
          const message =
            typeof e === "object" && e && "message" in e
              ? String((e as { message?: string }).message || "")
              : "";
          setTableError(message || "Không tải được danh sách thành viên");
          setMembers([]);
          setTotalPages(1);
        }
      } finally {
        if (!ignore) setTableLoading(false);
      }
    };
    fetchMembers();
    return () => {
      ignore = true;
    };
  }, [page, pageSize, query, gender, status]);

  const statusChipColor = (s: string) =>
    s === "ĐANG THAM GIA"
      ? { className: "bg-green-100 text-green-700" }
      : { className: "bg-red-100 text-red-700" };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F6FF] to-[#E0EAFF] flex">
      <div className="flex-shrink-0">
        <TournamentSidebar activeMenu="memberManagement" onChange={() => {}} />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-6">
          <Paper className="card">
            <Typography variant="h6" className="mb-4">
              Danh sách thành viên CLB
            </Typography>

            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <TextField
                placeholder="Tìm theo tên, MSSV, Email, SĐT..."
                size="small"
                className="flex-1 min-w-[200px]"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} />
                    </InputAdornment>
                  ),
                }}
              />
              <Select
                size="small"
                displayEmpty
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                renderValue={(v) => (v ? (v as string) : "Giới tính")}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="Nam">Nam</MenuItem>
                <MenuItem value="Nữ">Nữ</MenuItem>
              </Select>
              <Select
                size="small"
                displayEmpty
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                renderValue={(v) => (v ? (v as string) : "Trạng thái")}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="ĐANG THAM GIA">ĐANG THAM GIA</MenuItem>
                <MenuItem value="NGỪNG THAM GIA">NGỪNG THAM GIA</MenuItem>
              </Select>
              <Button
                variant="contained"
                color="success"
                startIcon={<FileDown size={16} />}
              >
                Xuất Excel
              </Button>
            </div>

            <TableContainer component={Paper} className="shadow-none">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>STT</TableCell>
                    <TableCell>Tên</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Giới tính</TableCell>
                    <TableCell>MSSV</TableCell>
                    <TableCell>SDT</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell align="right">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableLoading && (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Box className="text-gray-500 py-6">Đang tải...</Box>
                      </TableCell>
                    </TableRow>
                  )}
                  {!!tableError && !tableLoading && (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Box className="text-red-600 py-6">{tableError}</Box>
                      </TableCell>
                    </TableRow>
                  )}
                  {!tableLoading &&
                    !tableError &&
                    members.map((m, idx) => (
                      <TableRow
                        key={m.id}
                        className={
                          m.statusLabel === "NGỪNG THAM GIA" ? "text-red-500" : ""
                        }
                      >
                        <TableCell>{(page - 1) * pageSize + idx + 1}</TableCell>
                        <TableCell>{m.fullName}</TableCell>
                        <TableCell>{m.email}</TableCell>
                        <TableCell>{m.gender}</TableCell>
                        <TableCell>{m.studentCode}</TableCell>
                        <TableCell>{m.phone}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={m.statusLabel}
                            className={`px-2 ${
                              statusChipColor(m.statusLabel || "").className
                            }`}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Chi tiết">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={async () => {
                                setDetailError("");
                                setLoadingDetail(true);
                                setOpenDetail(true);
                                try {
                                  // Gọi API lấy chi tiết member theo id
                                  const res = await apiService.get<Member>(
                                    API_ENDPOINTS.CLUB_MEMBERS.BY_ID(m.id)
                                  );
                                  // API chuẩn trả về { success, message, data }
                                  if (res && res.data) {
                                    setSelected(res.data as Member);
                                  } else {
                                    setSelected(m);
                                  }
                                } catch (e: unknown) {
                                  const message =
                                    typeof e === "object" && e && "message" in e
                                      ? String(
                                          (e as { message?: string }).message ||
                                            ""
                                        )
                                      : "";
                                  setDetailError(
                                    message || "Không tải được chi tiết"
                                  );
                                  setSelected(m);
                                } finally {
                                  setLoadingDetail(false);
                                }
                              }}
                            >
                              <Eye size={16} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  {!tableLoading && !tableError && members.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Box className="text-center text-gray-500 py-8">
                          Không có dữ liệu
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <div className="flex justify-center py-3">
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, p) => setPage(p)}
                color="primary"
                siblingCount={1}
              />
            </div>
          </Paper>
        </div>

        <Footer />
      </div>

      {/* Detail Modal with MUI */}
      <Dialog
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pr: 6 }}>
          Chi tiết thành viên
          <IconButton
            onClick={() => setOpenDetail(false)}
            size="small"
            sx={{ position: "absolute", right: 12, top: 12 }}
            aria-label="close"
          >
            {/* simple close glyph */}
            <span className="text-xl leading-none">×</span>
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loadingDetail && (
            <Box className="text-gray-500 mb-3">Đang tải chi tiết...</Box>
          )}
          {!!detailError && (
            <Box className="text-red-600 mb-3">{detailError}</Box>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <TextField
                size="small"
                label="Tên"
                fullWidth
                value={selected?.fullName ?? ""}
                disabled
              />
            </div>
            <div>
              <TextField
                size="small"
                label="Email"
                fullWidth
                value={selected?.email ?? ""}
                disabled
              />
            </div>
            <div>
              <TextField
                size="small"
                label="Giới tính"
                fullWidth
                value={selected?.gender ?? ""}
                disabled
              />
            </div>
            <div>
              <TextField
                size="small"
                label="MSSV"
                fullWidth
                value={selected?.studentCode ?? ""}
                disabled
              />
            </div>
            <div>
              <TextField
                size="small"
                label="SDT"
                fullWidth
                value={selected?.phone ?? ""}
                disabled
              />
            </div>
            <div>
              <TextField
                size="small"
                label="Ngày tham gia"
                fullWidth
                value={
                  selected?.joinedAt
                    ? new Date(selected.joinedAt).toLocaleDateString("vi-VN")
                    : ""
                }
                disabled
              />
            </div>
            <div className="md:col-span-2">
              <TextField
                size="small"
                label="Phòng ban"
                fullWidth
                value={selected?.department ?? ""}
                disabled
              />
            </div>

            <div className="md:col-span-2">
              <Divider sx={{ my: 1 }} />
              <Typography
                variant="subtitle2"
                color="text.secondary"
                className="mb-2"
              >
                Lịch sử hoạt động
              </Typography>
              <Paper variant="outlined" className="p-3">
                {(selected?.activityLogs ?? []).length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {(selected?.activityLogs ?? []).map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500 text-sm">Chưa có hoạt động</div>
                )}
              </Paper>
            </div>

            <div className="md:col-span-2">
              <Typography
                variant="subtitle2"
                color="text.secondary"
                className="mb-2"
              >
                Trạng thái
              </Typography>
              <Chip
                size="small"
                label={selected?.statusLabel ?? ""}
                className={`px-2 ${
                  statusChipColor(selected?.statusLabel ?? "").className
                }`}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
