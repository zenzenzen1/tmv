import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Select,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { trainingSessionService } from "@/services/trainingSessions";
import { locationService } from "@/services/locations";
import { cycleService } from "@/services/cycles";
import type { TrainingSessionCreateRequest, TrainingSessionStatus } from "@/types/training";
import type { LocationDto } from "@/types/location";
import type { ChallengeCycleDto } from "@/types/cycle";
import { useToast } from "@/components/common/ToastContext";
import { globalErrorHandler } from "@/utils/errorHandler";

const TITLE_MAX = 150;
const DESC_MAX = 500;

export default function TrainingSessionCreatePage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cycleId, setCycleId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [phaseId, setPhaseId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState<string>("");
  const [status, setStatus] = useState<TrainingSessionStatus>("PLANNED");

  const [cycles, setCycles] = useState<ChallengeCycleDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const fetchOptions = async () => {
      setLoading(true);
      setError(null);
      try {
        const [cycleResp, locationResp] = await Promise.all([
          cycleService.list({ page: 0, size: 100 }),
          locationService.list({ page: 0, size: 100 }),
        ]);
        if (!ignore) {
          setCycles(cycleResp.content ?? []);
          setLocations(locationResp.data.content ?? []);
        }
      } catch (err) {
        const { message } = globalErrorHandler(err);
        if (!ignore) setError(message);
        toast.error(message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchOptions();
    return () => {
      ignore = true;
    };
  }, [toast]);

  const validationErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Tiêu đề là bắt buộc";
    else if (title.trim().length > TITLE_MAX) errs.title = `Tối đa ${TITLE_MAX} ký tự`;
    if (!cycleId) errs.cycleId = "Chu kỳ là bắt buộc";
    if (!startTime) errs.startTime = "Thời gian bắt đầu là bắt buộc";
    if (!endTime) errs.endTime = "Thời gian kết thúc là bắt buộc";
    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      errs.endTime = "Kết thúc phải sau thời gian bắt đầu";
    }
    if (description.trim().length > DESC_MAX) errs.description = `Mô tả tối đa ${DESC_MAX} ký tự`;
    if (capacity) {
      const n = Number(capacity);
      if (Number.isNaN(n) || n < 0) errs.capacity = "Sức chứa phải là số không âm";
    }
    return errs;
  }, [capacity, cycleId, description, endTime, startTime, title]);

  const hasErrors = Object.keys(validationErrors).length > 0;

  const handleSave = async () => {
    if (hasErrors) {
      toast.error(Object.values(validationErrors)[0] || "Dữ liệu không hợp lệ");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: TrainingSessionCreateRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        cycleId,
        teamId: teamId || undefined,
        phaseId: phaseId || undefined,
        locationId: locationId || undefined,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        capacity: capacity ? Number(capacity) : undefined,
        status,
      };
      await trainingSessionService.create(payload);
      toast.success("Đã tạo buổi tập");
      navigate("/manage/training-sessions");
    } catch (err) {
      const { message } = globalErrorHandler(err);
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
        Tạo buổi tập luyện
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <TextField
            label="Tiêu đề"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            error={Boolean(validationErrors.title)}
            helperText={validationErrors.title}
            inputProps={{ maxLength: TITLE_MAX }}
          />
          <TextField
            label="Mô tả"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={2}
            inputProps={{ maxLength: DESC_MAX }}
            error={Boolean(validationErrors.description)}
            helperText={validationErrors.description}
          />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Select
              value={cycleId}
              onChange={(e) => setCycleId(e.target.value as string)}
              displayEmpty
              fullWidth
              size="small"
              error={Boolean(validationErrors.cycleId)}
            >
              <MenuItem value="">Chọn chu kỳ</MenuItem>
              {cycles.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
            <Select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value as string)}
              displayEmpty
              fullWidth
              size="small"
            >
              <MenuItem value="">Chọn địa điểm (tuỳ chọn)</MenuItem>
              {locations.map((l) => (
                <MenuItem key={l.id} value={l.id}>
                  {l.name}
                </MenuItem>
              ))}
            </Select>
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Team ID (tuỳ chọn)"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              fullWidth
            />
            <TextField
              label="Phase ID (tuỳ chọn)"
              value={phaseId}
              onChange={(e) => setPhaseId(e.target.value)}
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Bắt đầu"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              error={Boolean(validationErrors.startTime)}
              helperText={validationErrors.startTime}
            />
            <TextField
              label="Kết thúc"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              error={Boolean(validationErrors.endTime)}
              helperText={validationErrors.endTime}
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Sức chứa (tuỳ chọn)"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              inputProps={{ min: 0 }}
              fullWidth
              error={Boolean(validationErrors.capacity)}
              helperText={validationErrors.capacity}
            />
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as TrainingSessionStatus)}
              fullWidth
              size="small"
            >
              <MenuItem value="PLANNED">PLANNED</MenuItem>
              <MenuItem value="IN_PROGRESS">IN_PROGRESS</MenuItem>
              <MenuItem value="COMPLETED">COMPLETED</MenuItem>
              <MenuItem value="CANCELLED">CANCELLED</MenuItem>
            </Select>
          </Stack>
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button color="inherit" onClick={() => navigate(-1)} disabled={saving || loading}>
              Hủy
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={saving || loading}>
              Tạo buổi tập
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}


