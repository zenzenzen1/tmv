import { useEffect, useMemo, useState } from "react";
import { useWeightClassStore } from "../../stores/weightClass";
import { Gender, WeightClassStatus } from "../../types";
import type {
  CreateWeightClassRequest,
  UpdateWeightClassRequest,
} from "../../types";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, Button, Alert, Stack, InputLabel, FormControl } from '@mui/material';
import { useToast } from '../../components/common/ToastContext';

export default function WeightClassModal() {
  const { modalOpen, editing, closeModal, create, update } =
    useWeightClassStore();
  const { success, error: toastError } = useToast();
  const [gender, setGender] = useState<Gender>(Gender.MALE);
  const [minWeight, setMinWeight] = useState<string>("");
  const [maxWeight, setMaxWeight] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setGender(editing.gender);
      setMinWeight(String(editing.minWeight ?? ""));
      setMaxWeight(String(editing.maxWeight ?? ""));
      setNote(editing.note || "");
    } else {
      setGender(Gender.MALE);
      setMinWeight("");
      setMaxWeight("");
      setNote("");
    }
    setError(null);
  }, [editing, modalOpen]);

  const isValid = useMemo(() => {
    const min = Number(minWeight);
    const max = Number(maxWeight);
    if (Number.isNaN(min) || Number.isNaN(max)) return false;
    return min > 0 && max > 0 && min < max;
  }, [minWeight, maxWeight]);

  if (!modalOpen) return null;

  const onSaveDraft = async () => {
    if (!isValid) {
      setError("Vui lòng nhập cân nặng hợp lệ (min < max).");
      return;
    }
    try {
      if (editing) {
        const payload: UpdateWeightClassRequest = {
          minWeight: Number(minWeight),
          maxWeight: Number(maxWeight),
          note: note || undefined,
        };
        await update(editing.id, payload);
      } else {
        const payload: CreateWeightClassRequest = {
          gender,
          minWeight: Number(minWeight),
          maxWeight: Number(maxWeight),
          note: note || undefined,
          saveMode: WeightClassStatus.DRAFT,
        };
        await create(payload);
      }
      success('Đã lưu nháp hạng cân');
    } catch (e) {
      // error handled in store
      toastError('Lưu nháp hạng cân thất bại');
    }
  };

  const onSave = async () => {
    if (!isValid) {
      setError("Vui lòng nhập cân nặng hợp lệ (min < max).");
      return;
    }
    try {
      if (editing) {
        const payload: UpdateWeightClassRequest = {
          minWeight: Number(minWeight),
          maxWeight: Number(maxWeight),
          note: note || undefined,
        };
        await update(editing.id, payload);
      } else {
        const payload: CreateWeightClassRequest = {
          gender,
          minWeight: Number(minWeight),
          maxWeight: Number(maxWeight),
          note: note || undefined,
          saveMode: WeightClassStatus.ACTIVE,
        };
        await create(payload);
      }
      success(editing ? 'Đã cập nhật hạng cân' : 'Đã tạo hạng cân');
    } catch {}
  };

  return (
    <Dialog open={modalOpen} onClose={closeModal} fullWidth maxWidth="sm">
      <DialogTitle>{editing ? "Chỉnh sửa hạng cân" : "Thêm hạng cân"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Hạng cân (kg) - Min"
              value={minWeight}
              onChange={(e) => setMinWeight(e.target.value)}
              placeholder="45"
              fullWidth
            />
            <TextField
              label="Hạng cân (kg) - Max"
              value={maxWeight}
              onChange={(e) => setMaxWeight(e.target.value)}
              placeholder="50"
              fullWidth
            />
          </Stack>

          {!editing && (
            <FormControl fullWidth>
              <InputLabel id="gender-label">Giới tính</InputLabel>
              <Select
                labelId="gender-label"
                label="Giới tính"
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
              >
                <MenuItem value={Gender.MALE}>Nam</MenuItem>
                <MenuItem value={Gender.FEMALE}>Nữ</MenuItem>
              </Select>
            </FormControl>
          )}

          <TextField
            label="Ghi chú"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="VD: Chuẩn quốc gia / Áp dụng 2025"
            fullWidth
          />

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeModal} color="inherit">Hủy</Button>
        <Button onClick={onSaveDraft} variant="outlined">Lưu nháp</Button>
        <Button onClick={onSave} variant="contained">Lưu</Button>
      </DialogActions>
    </Dialog>
  );
}
