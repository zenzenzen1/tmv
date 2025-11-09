import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Divider,
  Stack,
  Checkbox,
  ListItem,
} from "@mui/material";
import {
  Add,
  Delete,
  Close,
  CalendarToday,
  People,
} from "@mui/icons-material";
import { cycleService } from "../../services/cycles";
import userService from "../../services/userService";
import type { ChallengeCycleBulkCreateRequest, ChallengePhaseCreateRequest } from "../../types/cycle";
import type { TeamWithMembersCreateRequest } from "../../types/team";
import type { TeamMemberAddRequest } from "../../types/teammember";
import type { UserResponse } from "../../types/user";

interface PhaseFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "DONE";
}

interface TeamFormData {
  code: string;
  name: string;
  description: string;
  members: Array<{ userId: string; userName: string; studentCode?: string }>;
}

const getTeamColor = (code: string): "primary" | "success" | "secondary" => {
  switch (code) {
    case "F":
      return "primary";
    case "V":
      return "success";
    case "C":
      return "secondary";
    default:
      return "primary";
  }
};

export default function CycleCreate() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [cycleForm, setCycleForm] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    cycleDurationMonths: 3,
    phaseDurationWeeks: 2,
    status: "DRAFT" as const,
    trainSessionsRequired: 0,
    eventsRequired: 0,
  });
  const [phases, setPhases] = useState<PhaseFormData[]>([]);
  const [teams, setTeams] = useState<TeamFormData[]>([
    { code: "F", name: "Fighting Team", description: "", members: [] },
    { code: "V", name: "Vovinam Team", description: "", members: [] },
    { code: "C", name: "Club Team", description: "", members: [] },
  ]);
  const [userSearch, setUserSearch] = useState<string>("");
  const [userResults, setUserResults] = useState<UserResponse[]>([]);
  const [allUsers, setAllUsers] = useState<UserResponse[]>([]); // Lưu danh sách đầy đủ để filter
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [autoGeneratePhases, setAutoGeneratePhases] = useState(true);

  // Tự động tính endDate từ startDate + cycleDurationMonths
  useEffect(() => {
    if (cycleForm.startDate && cycleForm.cycleDurationMonths > 0) {
      const startDate = new Date(cycleForm.startDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + cycleForm.cycleDurationMonths);
      
      // Format as YYYY-MM-DD
      const formattedEndDate = endDate.toISOString().split('T')[0];
      setCycleForm(prev => ({ ...prev, endDate: formattedEndDate }));
    }
  }, [cycleForm.startDate, cycleForm.cycleDurationMonths]);

  // Tự động tạo phases dựa trên cycleDurationMonths và phaseDurationWeeks
  useEffect(() => {
    if (
      autoGeneratePhases &&
      cycleForm.startDate &&
      cycleForm.endDate &&
      cycleForm.cycleDurationMonths > 0 &&
      cycleForm.phaseDurationWeeks > 0
    ) {
      const startDate = new Date(cycleForm.startDate);
      const endDate = new Date(cycleForm.endDate);
      const phaseDurationDays = cycleForm.phaseDurationWeeks * 7;
      
      const generatedPhases: PhaseFormData[] = [];
      let currentPhaseStart = new Date(startDate);
      let phaseNumber = 1;

      while (currentPhaseStart < endDate) {
        const phaseEnd = new Date(currentPhaseStart);
        phaseEnd.setDate(phaseEnd.getDate() + phaseDurationDays - 1);
        
        // Đảm bảo phase không vượt quá endDate
        if (phaseEnd > endDate) {
          phaseEnd.setTime(endDate.getTime());
        }

        generatedPhases.push({
          name: `Giai Đoạn ${phaseNumber}`,
          description: `Giai đoạn tự động tạo - ${cycleForm.phaseDurationWeeks} tuần`,
          startDate: currentPhaseStart.toISOString().split('T')[0],
          endDate: phaseEnd.toISOString().split('T')[0],
          status: "NOT_STARTED",
        });

        // Chuyển sang phase tiếp theo
        currentPhaseStart = new Date(phaseEnd);
        currentPhaseStart.setDate(currentPhaseStart.getDate() + 1);
        phaseNumber++;

        // Nếu phase tiếp theo vượt quá endDate, dừng lại
        if (currentPhaseStart >= endDate) {
          break;
        }
      }

      setPhases(generatedPhases);
    }
  }, [cycleForm.startDate, cycleForm.endDate, cycleForm.cycleDurationMonths, cycleForm.phaseDurationWeeks, autoGeneratePhases]);

  const addPhase = useCallback(() => {
    setAutoGeneratePhases(false); // Tắt auto-generate khi user thêm phase thủ công
    setPhases([...phases, {
      name: "",
      description: "",
      startDate: cycleForm.startDate || "",
      endDate: cycleForm.endDate || "",
      status: "NOT_STARTED",
    }]);
  }, [phases, cycleForm]);

  const removePhase = useCallback((index: number) => {
    setAutoGeneratePhases(false); // Tắt auto-generate khi user xóa phase
    setPhases(phases.filter((_, i) => i !== index));
  }, [phases]);

  const updatePhase = useCallback((index: number, field: keyof PhaseFormData, value: string) => {
    setAutoGeneratePhases(false); // Tắt auto-generate khi user chỉnh sửa phase
    const updated = [...phases];
    updated[index] = { ...updated[index], [field]: value };
    setPhases(updated);
  }, [phases]);

  const loadAllChallengeUsers = useCallback(async () => {
    try {
      const result = await userService.searchChallengeUsers(0, 1000);
      setAllUsers(result.content);
      setUserResults(result.content); // Hiển thị tất cả khi load
    } catch (error) {
      console.error("Error loading challenge users:", error);
      setAllUsers([]);
      setUserResults([]);
    }
  }, []);

  const filterUsers = useCallback((query: string) => {
    if (!query || query.trim().length === 0) {
      // Nếu không có query, hiển thị tất cả
      setUserResults(allUsers);
      return;
    }
    // Filter từ danh sách đầy đủ
    const queryLower = query.toLowerCase().trim();
    const filtered = allUsers.filter(user => 
      user.fullName?.toLowerCase().includes(queryLower) ||
      user.personalMail?.toLowerCase().includes(queryLower) ||
      user.studentCode?.toLowerCase().includes(queryLower)
    );
    setUserResults(filtered);
  }, [allUsers]);

  // Phân bổ members vào 3 team F, V, C theo alphabet
  const distributeMembers = useCallback((members: UserResponse[]) => {
    // Sắp xếp theo tên alphabet
    const sortedMembers = [...members].sort((a, b) => 
      a.fullName.localeCompare(b.fullName, 'vi')
    );

    const totalMembers = sortedMembers.length;
    const membersPerTeam = Math.floor(totalMembers / 3);
    const remainder = totalMembers % 3;

    // Tính số lượng cho mỗi team
    let fCount = membersPerTeam;
    let vCount = membersPerTeam;

    // Phân bổ phần dư: F -> V -> C
    if (remainder >= 1) fCount++;
    if (remainder >= 2) vCount++;
    // C sẽ nhận phần còn lại

    // Tìm index của các team F, V, C
    const fIndex = teams.findIndex(t => t.code === "F");
    const vIndex = teams.findIndex(t => t.code === "V");
    const cIndex = teams.findIndex(t => t.code === "C");

    const updated = [...teams];
    
    // Clear existing members
    updated[fIndex].members = [];
    updated[vIndex].members = [];
    updated[cIndex].members = [];

    // Phân bổ vào F
    for (let i = 0; i < fCount; i++) {
      updated[fIndex].members.push({
        userId: sortedMembers[i].id,
        userName: sortedMembers[i].fullName,
        studentCode: sortedMembers[i].studentCode || "",
      });
    }

    // Phân bổ vào V
    for (let i = fCount; i < fCount + vCount; i++) {
      updated[vIndex].members.push({
        userId: sortedMembers[i].id,
        userName: sortedMembers[i].fullName,
        studentCode: sortedMembers[i].studentCode || "",
      });
    }

    // Phân bổ vào C
    for (let i = fCount + vCount; i < totalMembers; i++) {
      updated[cIndex].members.push({
        userId: sortedMembers[i].id,
        userName: sortedMembers[i].fullName,
        studentCode: sortedMembers[i].studentCode || "",
      });
    }

    setTeams(updated);
  }, [teams]);

  const handleConfirmMemberSelection = useCallback(() => {
    const selectedUsers = userResults.filter(user => selectedMembers.has(user.id));
    if (selectedUsers.length > 0) {
      distributeMembers(selectedUsers);
    }
    setShowAddMemberModal(false);
    setSelectedMembers(new Set());
    setUserSearch("");
    setUserResults([]);
  }, [selectedMembers, userResults, distributeMembers]);

  const toggleMemberSelection = useCallback((userId: string) => {
    setSelectedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const allSelected = userResults.every(user => selectedMembers.has(user.id));
    if (allSelected) {
      // Bỏ chọn tất cả
      setSelectedMembers(prev => {
        const newSet = new Set(prev);
        userResults.forEach(user => newSet.delete(user.id));
        return newSet;
      });
    } else {
      // Chọn tất cả
      setSelectedMembers(prev => {
        const newSet = new Set(prev);
        userResults.forEach(user => newSet.add(user.id));
        return newSet;
      });
    }
  }, [userResults, selectedMembers]);

  // Tính toán trạng thái Select All
  const { allSelected, someSelected } = useMemo(() => {
    const all = userResults.length > 0 && userResults.every(user => selectedMembers.has(user.id));
    const some = userResults.some(user => selectedMembers.has(user.id)) && !all;
    return { allSelected: all, someSelected: some };
  }, [userResults, selectedMembers]);

  const removeMemberFromTeam = useCallback((teamIndex: number, memberIndex: number) => {
    const updated = [...teams];
    updated[teamIndex].members = updated[teamIndex].members.filter((_, i) => i !== memberIndex);
    setTeams(updated);
  }, [teams]);

  const onSubmit = async () => {
    if (!cycleForm.name || !cycleForm.startDate || !cycleForm.cycleDurationMonths || !cycleForm.phaseDurationWeeks) {
      alert("Vui lòng điền đầy đủ thông tin: tên cycle, ngày bắt đầu, thời lượng cycle và thời lượng phase");
      return;
    }
    if (cycleForm.trainSessionsRequired === undefined || cycleForm.trainSessionsRequired < 0) {
      alert("Vui lòng nhập số buổi tập bắt buộc (>= 0)");
      return;
    }
    if (cycleForm.eventsRequired === undefined || cycleForm.eventsRequired < 0) {
      alert("Vui lòng nhập số event tham gia bắt buộc (>= 0)");
      return;
    }

    setSubmitting(true);
    try {
      const bulkRequest: ChallengeCycleBulkCreateRequest = {
        cycle: cycleForm,
        phases: phases.map(p => ({
          name: p.name,
          description: p.description || undefined,
          startDate: p.startDate,
          endDate: p.endDate,
          status: p.status,
          order: null,
        } as ChallengePhaseCreateRequest)),
        teams: teams.map(t => ({
          team: {
            code: t.code,
            name: t.name || undefined,
            description: t.description || undefined,
          },
          members: t.members.map(m => ({ userId: m.userId } as TeamMemberAddRequest)),
        } as TeamWithMembersCreateRequest)),
      };

      const created = await cycleService.createBulk(bulkRequest);
      navigate(`/manage/cycles/${created.id}`);
    } catch (error: any) {
      console.error("Error creating cycle:", error);
      alert(error?.response?.data?.message || "Failed to create cycle");
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Box sx={{ p: 3, maxWidth: "1200px", mx: "auto" }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tạo Chu Kỳ Thử Thách
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tạo chu kỳ thử thách mới với các giai đoạn, đội và thành viên
        </Typography>
      </Box>

      {/* Cycle Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Thông Tin Chu Kỳ
        </Typography>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              required
              label="Tên Chu Kỳ"
              placeholder="VD: Chu Kỳ Tuyển Dụng Fall 2025"
              value={cycleForm.name}
              onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })}
              sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(50% - 8px)" } }}
            />
            <TextField
              required
              type="date"
              label="Ngày Bắt Đầu"
              InputLabelProps={{ shrink: true }}
              value={cycleForm.startDate}
              onChange={(e) => setCycleForm({ ...cycleForm, startDate: e.target.value })}
              sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(50% - 8px)" } }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              required
              type="number"
              label="Thời Lượng Chu Kỳ (Tháng)"
              placeholder="VD: 3"
              value={cycleForm.cycleDurationMonths}
              onChange={(e) => setCycleForm({ ...cycleForm, cycleDurationMonths: parseInt(e.target.value) || 0 })}
              helperText="Số tháng của chu kỳ (endDate sẽ được tính tự động)"
              sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(50% - 8px)" } }}
            />
            <TextField
              required
              type="number"
              label="Thời Lượng Mỗi Phase (Tuần)"
              placeholder="VD: 2"
              value={cycleForm.phaseDurationWeeks}
              onChange={(e) => setCycleForm({ ...cycleForm, phaseDurationWeeks: parseInt(e.target.value) || 0 })}
              helperText="Số tuần của mỗi phase (phases sẽ được tạo tự động)"
              sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(50% - 8px)" } }}
            />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Mô Tả"
            placeholder="Mô tả về chu kỳ"
            value={cycleForm.description}
            onChange={(e) => setCycleForm({ ...cycleForm, description: e.target.value })}
          />
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <FormControl sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(50% - 8px)" } }}>
              <InputLabel>Trạng Thái</InputLabel>
              <Select
                value={cycleForm.status}
                label="Trạng Thái"
                onChange={(e) => setCycleForm({ ...cycleForm, status: e.target.value as any })}
              >
                <MenuItem value="DRAFT">DRAFT</MenuItem>
                <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                <MenuItem value="COMPLETED">COMPLETED</MenuItem>
                <MenuItem value="ARCHIVED">ARCHIVED</MenuItem>
              </Select>
            </FormControl>
            <TextField
              type="date"
              label="Ngày Kết Thúc"
              InputLabelProps={{ shrink: true }}
              value={cycleForm.endDate}
              onChange={(e) => {
                setCycleForm({ ...cycleForm, endDate: e.target.value });
                setAutoGeneratePhases(false); // Tắt auto-generate khi user chỉnh sửa endDate
              }}
              helperText="Tự động tính từ thời lượng chu kỳ (có thể chỉnh sửa)"
              sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(50% - 8px)" } }}
            />
          </Box>
        </Stack>
        {cycleForm.cycleDurationMonths > 0 && cycleForm.phaseDurationWeeks > 0 && cycleForm.startDate && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Thông tin tự động:</strong> Với chu kỳ {cycleForm.cycleDurationMonths} tháng và mỗi phase {cycleForm.phaseDurationWeeks} tuần, 
              hệ thống sẽ tự động tạo khoảng <strong>{(cycleForm.cycleDurationMonths * 4 / cycleForm.phaseDurationWeeks).toFixed(0)}</strong> phases.
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Tiêu Chí Đánh Giá */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tiêu Chí Đánh Giá
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Các tiêu chí đánh giá mặc định sẽ được áp dụng cho tất cả các phase trong chu kỳ này
        </Typography>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              required
              type="number"
              label="Số Buổi Tập Bắt Buộc"
              placeholder="VD: 10"
              value={cycleForm.trainSessionsRequired}
              onChange={(e) => setCycleForm({ ...cycleForm, trainSessionsRequired: parseInt(e.target.value) || 0 })}
              helperText="Số buổi tập bắt buộc mỗi phase"
              inputProps={{ min: 0 }}
              sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(50% - 8px)" } }}
            />
            <TextField
              required
              type="number"
              label="Số Event Tham Gia Bắt Buộc"
              placeholder="VD: 3"
              value={cycleForm.eventsRequired}
              onChange={(e) => setCycleForm({ ...cycleForm, eventsRequired: parseInt(e.target.value) || 0 })}
              helperText="Số event tham gia bắt buộc mỗi phase"
              inputProps={{ min: 0 }}
              sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(50% - 8px)" } }}
            />
          </Box>
        </Stack>
      </Paper>

      {/* Phases */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Giai Đoạn Thử Thách
            </Typography>
            {phases.length > 0 && autoGeneratePhases && (
              <Typography variant="body2" color="success.main" sx={{ fontWeight: "medium" }}>
                ✓ Đã tự động tạo {phases.length} giai đoạn dựa trên thời lượng phase ({cycleForm.phaseDurationWeeks} tuần)
              </Typography>
            )}
            {phases.length === 0 && cycleForm.phaseDurationWeeks > 0 && (
              <Typography variant="body2" color="text.secondary">
                Phases sẽ được tự động tạo dựa trên thời lượng phase ({cycleForm.phaseDurationWeeks} tuần)
              </Typography>
            )}
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={addPhase}
          >
            Thêm Giai Đoạn
          </Button>
        </Box>
        <Stack spacing={3}>
          {phases.map((phase, index) => (
            <Paper key={index} variant="outlined" sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <TextField
                    required
                    label="Tên Giai Đoạn"
                    placeholder="VD: Giai Đoạn 1: Thử Thách Cơ Bản"
                    value={phase.name}
                    onChange={(e) => updatePhase(index, "name", e.target.value)}
                    sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(50% - 8px)" } }}
                  />
                  <TextField
                    label="Mô Tả"
                    placeholder="Mô tả về giai đoạn"
                    value={phase.description}
                    onChange={(e) => updatePhase(index, "description", e.target.value)}
                    sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(50% - 8px)" } }}
                  />
                </Box>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <TextField
                    required
                    type="date"
                    label="Ngày Bắt Đầu"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: <CalendarToday sx={{ mr: 1, color: "action.active" }} />,
                    }}
                    value={phase.startDate}
                    onChange={(e) => updatePhase(index, "startDate", e.target.value)}
                    sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(50% - 8px)" } }}
                  />
                  <TextField
                    required
                    type="date"
                    label="Ngày Kết Thúc"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: <CalendarToday sx={{ mr: 1, color: "action.active" }} />,
                    }}
                    value={phase.endDate}
                    onChange={(e) => updatePhase(index, "endDate", e.target.value)}
                    sx={{ flex: { xs: "1 1 100%", md: "1 1 calc(50% - 8px)" } }}
                  />
                </Box>
              </Stack>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button
                  color="error"
                  size="small"
                  startIcon={<Delete />}
                  onClick={() => removePhase(index)}
                >
                  Xóa Giai Đoạn
                </Button>
              </Box>
            </Paper>
          ))}
          {phases.length === 0 && (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Chưa có giai đoạn nào. Nhấn "Thêm Giai Đoạn" để bắt đầu.
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* Teams */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h6">
            Phân Bổ Đội
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={async () => {
              setShowAddMemberModal(true);
              setUserSearch("");
              setSelectedMembers(new Set());
              // Tự động load tất cả challenge users khi mở modal
              await loadAllChallengeUsers();
            }}
          >
            Thêm Thành Viên
          </Button>
        </Box>
        <Stack spacing={3}>
          {teams.map((team, teamIndex) => {
            const teamColor = getTeamColor(team.code);

  return (
              <Paper key={teamIndex} variant="outlined" sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Chip label={`Team ${team.code}`} color={teamColor} />
                    <Typography variant="body1" fontWeight="medium">
                      {team.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({team.members.length} thành viên)
                    </Typography>
                  </Box>
                </Box>

                {team.members.length > 0 ? (
                  <>
                    <Stack spacing={1} sx={{ mb: 2 }}>
                      {team.members.map((member, memberIndex) => (
                        <Paper
                          key={memberIndex}
                          variant="outlined"
                          sx={{
                            p: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            "&:hover": { bgcolor: "action.hover" },
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                            <Avatar
                              sx={{
                                bgcolor: teamColor === "primary" ? "primary.light" :
                                         teamColor === "success" ? "success.light" :
                                         "secondary.light",
                                color: teamColor === "primary" ? "primary.main" :
                                       teamColor === "success" ? "success.main" :
                                       "secondary.main",
                              }}
                            >
                              {getInitials(member.userName)}
                            </Avatar>
                            <Box>
                              <Typography variant="body1" fontWeight="medium">
                                {member.userName}
                              </Typography>
                              {member.studentCode && (
                                <Typography variant="caption" color="text.secondary">
                                  MSSV: {member.studentCode}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => removeMemberFromTeam(teamIndex, memberIndex)}
                          >
                            <Delete />
                          </IconButton>
                        </Paper>
                      ))}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {team.members.length} thành viên đã được thêm vào team này
                    </Typography>
                  </>
                ) : (
                  <>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        py: 6,
                        border: "2px dashed",
                        borderColor: "divider",
                        borderRadius: 2,
                        mb: 2,
                      }}
                    >
                      <People sx={{ fontSize: 64, color: "action.disabled", mb: 2 }} />
                      <Typography variant="body1" color="text.secondary" fontWeight="medium" gutterBottom>
                        Chưa có thành viên nào
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Nhấn "Thêm Thành Viên" để bắt đầu
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      0 thành viên đã được thêm vào team này
                    </Typography>
                  </>
                )}
              </Paper>
            );
          })}
        </Stack>
      </Paper>

      {/* Add Members Dialog - Single modal for all teams */}
      <Dialog
        open={showAddMemberModal}
        onClose={() => {
          setShowAddMemberModal(false);
          setUserSearch("");
          setUserResults([]);
          setSelectedMembers(new Set());
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Chọn Thành Viên</Typography>
            <IconButton
              aria-label="close"
              onClick={() => {
                setShowAddMemberModal(false);
                setUserSearch("");
                setUserResults([]);
                setSelectedMembers(new Set());
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Tìm kiếm"
            placeholder="Tìm kiếm theo tên, email hoặc mã sinh viên"
            value={userSearch}
            onChange={(e) => {
              const query = e.target.value;
              setUserSearch(query);
              filterUsers(query);
            }}
            sx={{ mb: 2 }}
          />
          {selectedMembers.size > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Đã chọn {selectedMembers.size} thành viên. Sau khi xác nhận, sẽ tự động phân bổ vào 3 team F, V, C theo thứ tự alphabet.
            </Alert>
          )}
          {userResults.length > 0 ? (
            <List sx={{ maxHeight: 400, overflow: "auto" }}>
              {/* Select All checkbox */}
              <ListItem
                secondaryAction={
                  <Checkbox
                    edge="end"
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={toggleSelectAll}
                  />
                }
                disablePadding
              >
                <ListItemButton onClick={toggleSelectAll}>
                  <ListItemText
                    primary="Chọn tất cả"
                    primaryTypographyProps={{
                      fontWeight: "medium",
                    }}
                  />
                </ListItemButton>
              </ListItem>
              <Divider />
              {userResults.map((user, idx) => (
                <Box key={user.id}>
                  <ListItem
                    secondaryAction={
                      <Checkbox
                        edge="end"
                        checked={selectedMembers.has(user.id)}
                        onChange={() => toggleMemberSelection(user.id)}
                      />
                    }
                    disablePadding
                  >
                    <ListItemButton onClick={() => toggleMemberSelection(user.id)}>
                      <ListItemAvatar>
                        <Avatar>{getInitials(user.fullName)}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.fullName}
                        secondary={`${user.personalMail}${user.studentCode ? ` • ${user.studentCode}` : ""}`}
                      />
                    </ListItemButton>
                  </ListItem>
                  {idx < userResults.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          ) : userSearch.length >= 2 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Không tìm thấy thành viên nào
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Nhập ít nhất 2 ký tự để tìm kiếm thành viên
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowAddMemberModal(false);
              setUserSearch("");
              setUserResults([]);
              setSelectedMembers(new Set());
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmMemberSelection}
            disabled={selectedMembers.size === 0}
          >
            Xác Nhận ({selectedMembers.size})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate("/manage/cycles")}
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          disabled={submitting}
          onClick={onSubmit}
        >
            {submitting ? "Đang tạo..." : "Tạo Chu Kỳ"}
        </Button>
      </Box>
    </Box>
  );
}
