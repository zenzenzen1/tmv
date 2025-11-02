import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Chip,
  IconButton,
  Alert,
  InputAdornment,
} from "@mui/material";
import { Add, Delete, Search as SearchIcon, Visibility, VisibilityOff } from "@mui/icons-material";
import userService from "@/services/userService";
import type { CreateUserRequest, UserResponse, SystemRole } from "@/types/user";
import { CommonTable, type TableColumn } from "@/components/common/CommonTable";

const systemRoleLabels: Record<SystemRole, string> = {
  MEMBER: "Thành viên",
  TEACHER: "Giáo viên",
  EXECUTIVE_BOARD: "Ban chấp hành",
  ORGANIZATION_COMMITTEE: "Ban tổ chức",
  ADMIN: "Quản trị viên",
};

export default function UserManagementPage() {
  const [list, setList] = useState<{
    content: UserResponse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Search & filter states
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [formData, setFormData] = useState<CreateUserRequest>({
    fullName: "",
    personalMail: "",
    password: "",
    eduMail: "",
    dob: "",
    gender: undefined,
    systemRole: null,
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Reload when search query or filters change (but not on first mount)
  useEffect(() => {
    // Only auto-fetch if something is set (avoid fetching on mount)
    if (searchQuery !== "" || roleFilter !== "" || statusFilter !== "") {
      fetchUsers({ page: 0 });
    }
  }, [searchQuery, roleFilter, statusFilter]);

  const fetchUsers = async (params?: { page?: number; size?: number }) => {
    try {
      setLoading(true);
      setError(null);
      
      const page = params?.page ?? (list?.page || 0);
      const size = params?.size ?? (list?.size || 10);
      
      // Determine status filter
      let statusBoolean: boolean | undefined = undefined;
      if (statusFilter === "true") statusBoolean = true;
      else if (statusFilter === "false") statusBoolean = false;
      
      // Call search API
      const response = await userService.searchUsers(
        page,
        size,
        searchQuery || undefined,
        roleFilter || undefined,
        statusBoolean
      );
      
      setList({
        content: response.content || [],
        page: response.page ?? 0,
        size: response.size ?? 10,
        totalElements: response.totalElements ?? 0,
        totalPages: response.totalPages ?? 0,
      });
    } catch (err: any) {
      console.error("Failed to load users:", err);
      const errorMessage = err?.response?.data?.message || "Không thể tải danh sách người dùng";
      setError(errorMessage);
      setList(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const trimmedInput = searchInput.trim();
    setSearchQuery(trimmedInput);
  };

  const handleOpenDialog = () => {
    setFormData({
      fullName: "",
      personalMail: "",
      password: "",
      eduMail: "",
      dob: "",
      gender: undefined,
      systemRole: null,
    });
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (field: keyof CreateUserRequest, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear field error when user types
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName || formData.fullName.trim().length < 2) {
      errors.fullName = "Họ tên phải có ít nhất 2 ký tự";
    }

    if (!formData.personalMail) {
      errors.personalMail = "Email cá nhân là bắt buộc";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalMail)) {
      errors.personalMail = "Email không hợp lệ";
    }

    if (!formData.password) {
      errors.password = "Mật khẩu là bắt buộc";
    } else if (formData.password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Xác nhận mật khẩu là bắt buộc";
    } else if (formData.password !== confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    if (formData.eduMail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.eduMail)) {
      errors.eduMail = "Email giáo dục không hợp lệ";
    }

    if (!formData.systemRole) {
      errors.systemRole = "Vai trò là bắt buộc";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      
      // Validate form
      if (!validateForm()) {
        return;
      }

      setLoading(true);
      await userService.createUser(formData);
      
      setSuccess("Tạo người dùng thành công!");
      setOpenDialog(false);
      setFieldErrors({});
      fetchUsers({ page: 0 }); // Reset to first page and reload

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || "Có lỗi xảy ra khi tạo người dùng";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa người dùng này?")) return;

    try {
      await userService.deleteUser(id);
      setSuccess("Xóa người dùng thành công!");
      fetchUsers(); // Reload list
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || "Không thể xóa người dùng";
      setError(errorMessage);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Quản lý người dùng
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleOpenDialog}
        >
          Thêm người dùng
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Search and Filters */}
      <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          placeholder="Tìm theo tên, email..."
          size="small"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          sx={{ flexGrow: 1, minWidth: "250px" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: "150px" }}>
          <InputLabel>Vai trò</InputLabel>
          <Select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
            }}
            label="Vai trò"
          >
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="TEACHER">Giáo viên</MenuItem>
            <MenuItem value="EXECUTIVE_BOARD">Ban chấp hành</MenuItem>
            <MenuItem value="ORGANIZATION_COMMITTEE">Ban tổ chức</MenuItem>
            <MenuItem value="ADMIN">Quản trị viên</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: "150px" }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
            }}
            label="Trạng thái"
          >
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="true">Hoạt động</MenuItem>
            <MenuItem value="false">Ngưng</MenuItem>
          </Select>
        </FormControl>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSearch}
          startIcon={<SearchIcon />}
        >
          Tìm kiếm
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <div>Loading...</div>
        </Box>
      ) : (
        list && list.content && (
          <CommonTable<UserResponse>
            className="card"
            columns={[
              { key: "fullName", title: "Họ và tên" } as TableColumn<UserResponse>,
              { key: "personalMail", title: "Email" },
              {
                key: "systemRole",
                title: "Vai trò",
                render: (row) => (
                  <Chip
                    label={systemRoleLabels[row.systemRole] || row.systemRole}
                    size="small"
                    color={row.systemRole === "ADMIN" ? "error" : "default"}
                  />
                ),
              },
              {
                key: "status",
                title: "Trạng thái",
                render: (row) => (
                  <Chip
                    label={row.status ? "Hoạt động" : "Ngưng"}
                    size="small"
                    color={row.status ? "success" : "default"}
                  />
                ),
              },
              {
                key: "actions",
                title: "Thao tác",
                render: (row) => (
                  <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
                    <Delete />
                  </IconButton>
                ),
                sortable: false,
              },
            ]}
            data={list.content}
            keyField={"id"}
            page={(list.page ?? 0) + 1}
            pageSize={list.size}
            total={list.totalElements}
            onPageChange={(p) => {
              const nextPage = p - 1;
              fetchUsers({ page: nextPage, size: list.size });
            }}
          />
        )
      )}

      {/* Create User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm người dùng mới</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="Họ và tên *"
              fullWidth
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              error={!!fieldErrors.fullName}
              helperText={fieldErrors.fullName}
            />
            <TextField
              label="Email cá nhân *"
              type="email"
              fullWidth
              value={formData.personalMail}
              onChange={(e) => handleInputChange("personalMail", e.target.value)}
              error={!!fieldErrors.personalMail}
              helperText={fieldErrors.personalMail}
            />
            <TextField
              label="Mật khẩu *"
              type={showPassword ? "text" : "password"}
              fullWidth
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password || "Tối thiểu 6 ký tự"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Xác nhận mật khẩu *"
              type={showConfirmPassword ? "text" : "password"}
              fullWidth
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                // Clear field error when user types
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.confirmPassword;
                    return newErrors;
                  });
                }
              }}
              error={!!fieldErrors.confirmPassword}
              helperText={fieldErrors.confirmPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Email giáo dục"
              type="email"
              fullWidth
              value={formData.eduMail}
              onChange={(e) => handleInputChange("eduMail", e.target.value)}
              error={!!fieldErrors.eduMail}
              helperText={fieldErrors.eduMail}
            />
            <TextField
              label="Ngày sinh"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.dob}
              onChange={(e) => handleInputChange("dob", e.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel>Giới tính</InputLabel>
              <Select
                value={formData.gender || ""}
                onChange={(e) => handleInputChange("gender", e.target.value)}
              >
                <MenuItem value="">Chọn giới tính</MenuItem>
                <MenuItem value="MALE">Nam</MenuItem>
                <MenuItem value="FEMALE">Nữ</MenuItem>
                <MenuItem value="OTHER">Khác</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth error={!!fieldErrors.systemRole}>
              <InputLabel>Vai trò *</InputLabel>
              <Select
                value={formData.systemRole || ""}
                onChange={(e) => handleInputChange("systemRole", e.target.value as SystemRole || null)}
              >
                <MenuItem value="TEACHER">Giáo viên</MenuItem>
                <MenuItem value="EXECUTIVE_BOARD">Ban chấp hành</MenuItem>
                <MenuItem value="ORGANIZATION_COMMITTEE">Ban tổ chức</MenuItem>
                <MenuItem value="ADMIN">Quản trị viên</MenuItem>
              </Select>
              {fieldErrors.systemRole && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                  {fieldErrors.systemRole}
                </Typography>
              )}
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading}>
            Tạo người dùng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
