import { useMemo, useState } from "react";
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
  gender: "Nam" | "Nữ";
  studentCode: string;
  phone: string;
  department: string | null;
  statusLabel: "ĐANG THAM GIA" | "NGỪNG THAM GIA" | string;
  joinedAt?: string | null;
  activityLogs?: string[];
};

const FAKE_MEMBERS: Member[] = [
  {
    id: "1",
    fullName: "Phạm A",
    email: "aphe170001@fpt.edu.vn",
    gender: "Nam",
    studentCode: "HE170001",
    phone: "012356789",
    department: "Ban chủ nhiệm",
    statusLabel: "ĐANG THAM GIA",
    joinedAt: "2023-10-25",
    activityLogs: [
      "FA23: Hoạt động ở ban chuyên môn",
      "SP25: Dừng hoạt động ở ban chuyên môn",
    ],
  },
  {
    id: "2",
    fullName: "Phạm B",
    email: "bphe170002@fpt.edu.vn",
    gender: "Nữ",
    studentCode: "HE170002",
    phone: "012356789",
    department: "Hậu cần",
    statusLabel: "ĐANG THAM GIA",
  },
  {
    id: "3",
    fullName: "Phạm C",
    email: "cphe170003@fpt.edu.vn",
    gender: "Nam",
    studentCode: "HE170003",
    phone: "012356789",
    department: "Truyền thông",
    statusLabel: "ĐANG THAM GIA",
  },
  {
    id: "4",
    fullName: "Phạm D",
    email: "dphe170004@fpt.edu.vn",
    gender: "Nữ",
    studentCode: "HE170004",
    phone: "012356789",
    department: "Sự kiện",
    statusLabel: "ĐANG THAM GIA",
  },
  {
    id: "5",
    fullName: "Phạm E",
    email: "ephe170005@fpt.edu.vn",
    gender: "Nam",
    studentCode: "HE170005",
    phone: "012356789",
    department: null,
    statusLabel: "NGỪNG THAM GIA",
    joinedAt: "2023-10-25",
    activityLogs: ["Chưa có hoạt động"],
  },
];

export default function MemberManagementListPage() {
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState<number>(2);
  const pageSize = 4;
  const [openDetail, setOpenDetail] = useState(false);
  const [selected, setSelected] = useState<Member | null>(null);

  const filtered = useMemo(() => {
    return FAKE_MEMBERS.filter((m) => {
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        m.fullName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.studentCode.toLowerCase().includes(q) ||
        m.phone.includes(q);
      const matchGender = !gender || m.gender === gender;
      const matchStatus = !status || m.statusLabel === status;
      return matchQuery && matchGender && matchStatus;
    });
  }, [query, gender, status]);

  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const statusChipColor = (s: string) =>
    s === "ĐANG THAM GIA"
      ? { className: "bg-green-100 text-green-700" }
      : { className: "bg-red-100 text-red-700" };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F6FF] to-[#E0EAFF] grid grid-cols-[16rem_1fr] grid-rows-[1fr_auto] items-stretch">
      <div className="row-span-2 h-full">
        <TournamentSidebar activeMenu="memberManagement" onChange={() => {}} />
      </div>

      <div className="p-6">
        <Paper className="card">
          <Typography variant="h6" className="mb-4">Danh sách thành viên CLB</Typography>

          <div className="flex items-center gap-3 mb-4">
            <TextField
              placeholder="Tìm theo tên, MSSV, Email, SĐT..."
              size="small"
              className="w-full md:w-80"
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
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="ĐANG THAM GIA">ĐANG THAM GIA</MenuItem>
              <MenuItem value="NGỪNG THAM GIA">NGỪNG THAM GIA</MenuItem>
            </Select>
            <Button variant="contained" color="success" startIcon={<FileDown size={16} />}>Xuất Excel</Button>
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
                {pageData.map((m, idx) => (
                  <TableRow key={m.id} className={m.statusLabel === "NGỪNG THAM GIA" ? "text-red-500" : ""}>
                    <TableCell>{(page - 1) * pageSize + idx + 1}</TableCell>
                    <TableCell>{m.fullName}</TableCell>
                    <TableCell>{m.email}</TableCell>
                    <TableCell>{m.gender}</TableCell>
                    <TableCell>{m.studentCode}</TableCell>
                    <TableCell>{m.phone}</TableCell>
                    <TableCell>
                      <Chip size="small" label={m.statusLabel} className={`px-2 ${statusChipColor(m.statusLabel).className}`} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Chi tiết">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            setSelected(m);
                            setOpenDetail(true);
                          }}
                        >
                          <Eye size={16} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {pageData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Box className="text-center text-gray-500 py-8">Không có dữ liệu</Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <div className="flex justify-center py-3">
            <Pagination
              count={Math.max(1, Math.ceil(filtered.length / pageSize))}
              page={page}
              onChange={(_, p) => setPage(p)}
              color="primary"
              siblingCount={1}
            />
          </div>
        </Paper>
      </div>

      <div className="col-span-2">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <TextField size="small" label="Tên" fullWidth value={selected?.fullName ?? ""} disabled />
            </div>
            <div>
              <TextField size="small" label="Email" fullWidth value={selected?.email ?? ""} disabled />
            </div>
            <div>
              <TextField size="small" label="Giới tính" fullWidth value={selected?.gender ?? ""} disabled />
            </div>
            <div>
              <TextField size="small" label="MSSV" fullWidth value={selected?.studentCode ?? ""} disabled />
            </div>
            <div>
              <TextField size="small" label="SDT" fullWidth value={selected?.phone ?? ""} disabled />
            </div>
            <div>
              <TextField size="small" label="Ngày tham gia" fullWidth value={selected?.joinedAt ? new Date(selected.joinedAt).toLocaleDateString("vi-VN") : ""} disabled />
            </div>
            <div className="md:col-span-2">
              <TextField size="small" label="Phòng ban" fullWidth value={selected?.department ?? ""} disabled />
            </div>

            <div className="md:col-span-2">
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary" className="mb-2">Lịch sử hoạt động</Typography>
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
              <Typography variant="subtitle2" color="text.secondary" className="mb-2">Trạng thái</Typography>
              <Chip
                size="small"
                label={selected?.statusLabel ?? ""}
                className={`px-2 ${statusChipColor(selected?.statusLabel ?? "").className}`}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


