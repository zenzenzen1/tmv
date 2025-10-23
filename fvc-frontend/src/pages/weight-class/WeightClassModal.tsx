import { useEffect, useMemo, useState } from "react";
import { useWeightClassStore } from "../../stores/weightClass";
import { Gender, WeightClassStatus } from "../../types";
import type {
  CreateWeightClassRequest,
  UpdateWeightClassRequest,
} from "../../types";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, Button, Alert, Stack, InputLabel, FormControl } from '@mui/material';
import { useToast } from '../../components/common/ToastContext';
import { validateNonNegative, validateNumericRange } from '../../utils/validation';

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

  // Validation for min weight
  const minWeightValidation = useMemo(() => {
    if (!minWeight || minWeight.trim() === '') {
      return { isValid: false, errorMessage: 'Cân nặng tối thiểu là bắt buộc' };
    }
    
    const nonNegativeValidation = validateNonNegative(minWeight, 'Cân nặng tối thiểu');
    if (!nonNegativeValidation.isValid) return nonNegativeValidation;
    
    const rangeValidation = validateNumericRange(minWeight, 0, 200, 'Cân nặng tối thiểu');
    if (!rangeValidation.isValid) return rangeValidation;
    
    return { isValid: true };
  }, [minWeight]);

  // Validation for max weight
  const maxWeightValidation = useMemo(() => {
    if (!maxWeight || maxWeight.trim() === '') {
      return { isValid: false, errorMessage: 'Cân nặng tối đa là bắt buộc' };
    }
    
    const nonNegativeValidation = validateNonNegative(maxWeight, 'Cân nặng tối đa');
    if (!nonNegativeValidation.isValid) return nonNegativeValidation;
    
    const rangeValidation = validateNumericRange(maxWeight, 0, 200, 'Cân nặng tối đa');
    if (!rangeValidation.isValid) return rangeValidation;
    
    return { isValid: true };
  }, [maxWeight]);

  // Validation for weight range (min < max)
  const weightRangeValidation = useMemo(() => {
    if (minWeightValidation.isValid && maxWeightValidation.isValid) {
      const min = Number(minWeight);
      const max = Number(maxWeight);
      if (min >= max) {
        return { isValid: false, errorMessage: 'Cân nặng tối đa phải lớn hơn cân nặng tối thiểu' };
      }
    }
    return { isValid: true };
  }, [minWeightValidation, maxWeightValidation, minWeight, maxWeight]);

  const isValid = useMemo(() => {
    return minWeightValidation.isValid && maxWeightValidation.isValid && weightRangeValidation.isValid;
  }, [minWeightValidation.isValid, maxWeightValidation.isValid, weightRangeValidation.isValid]);

  if (!modalOpen) return null;

  const onSaveDraft = async () => {
    if (!isValid) {
      const firstError = minWeightValidation.errorMessage || maxWeightValidation.errorMessage || weightRangeValidation.errorMessage;
      setError(firstError || "Vui lòng nhập cân nặng hợp lệ.");
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
      const firstError = minWeightValidation.errorMessage || maxWeightValidation.errorMessage || weightRangeValidation.errorMessage;
      setError(firstError || "Vui lòng nhập cân nặng hợp lệ.");
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
              type="number"
              inputProps={{ min: 0, max: 200, step: 0.1 }}
              error={!minWeightValidation.isValid && minWeight !== ''}
              helperText={!minWeightValidation.isValid && minWeight !== '' ? minWeightValidation.errorMessage : ''}
            />
            <TextField
              label="Hạng cân (kg) - Max"
              value={maxWeight}
              onChange={(e) => setMaxWeight(e.target.value)}
              placeholder="50"
              fullWidth
              type="number"
              inputProps={{ min: 0, max: 200, step: 0.1 }}
              error={!maxWeightValidation.isValid && maxWeight !== ''}
              helperText={!maxWeightValidation.isValid && maxWeight !== '' ? maxWeightValidation.errorMessage : ''}
            />
          </Stack>

          {/* Weight range validation error */}
          {!weightRangeValidation.isValid && minWeight !== '' && maxWeight !== '' && (
            <Alert severity="error">{weightRangeValidation.errorMessage}</Alert>
          )}

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
