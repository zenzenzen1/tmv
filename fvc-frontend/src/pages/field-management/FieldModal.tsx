import { useEffect, useMemo, useState } from "react";
import { useFieldStore } from "../../stores/field";
import type {
  CreateFieldRequest,
  UpdateFieldRequest,
} from "../../types";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert, Stack, FormControlLabel, Checkbox } from '@mui/material';
import { useToast } from '../../components/common/ToastContext';
import { validateLength } from '../../utils/validation';

export default function FieldModal() {
  const { modalOpen, editing, closeModal, create, update } =
    useFieldStore();
  const { success, error: toastError } = useToast();
  const [location, setLocation] = useState<string>("");
  const [isUsed, setIsUsed] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setLocation(editing.location);
      setIsUsed(editing.isUsed);
    } else {
      setLocation("");
      setIsUsed(false);
    }
    setError(null);
  }, [editing, modalOpen]);

  // Validation for location
  const locationValidation = useMemo(() => {
    if (!location || location.trim() === '') {
      return { isValid: false, errorMessage: 'Vị trí là bắt buộc' };
    }
    
    const lengthValidation = validateLength(location, {
      min: 1,
      max: 255,
      fieldName: 'Vị trí',
    });
    if (!lengthValidation.isValid) return lengthValidation;
    
    return { isValid: true };
  }, [location]);

  const isValid = useMemo(() => {
    return locationValidation.isValid;
  }, [locationValidation.isValid]);

  if (!modalOpen) return null;

  const onSave = async () => {
    if (!isValid) {
      const firstError = locationValidation.errorMessage;
      setError(firstError || "Vui lòng nhập thông tin hợp lệ.");
      return;
    }
    try {
      if (editing) {
        const payload: UpdateFieldRequest = {
          location: location.trim(),
          isUsed,
        };
        await update(editing.id, payload);
        success('Đã cập nhật sân đấu');
      } else {
        const payload: CreateFieldRequest = {
          location: location.trim(),
          isUsed,
        };
        await create(payload);
        success('Đã tạo sân đấu');
      }
    } catch (e) {
      // error handled in store
      toastError(editing ? 'Cập nhật sân đấu thất bại' : 'Tạo sân đấu thất bại');
    }
  };

  return (
    <Dialog open={modalOpen} onClose={closeModal} fullWidth maxWidth="sm">
      <DialogTitle>{editing ? "Chỉnh sửa sân đấu" : "Thêm sân đấu"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            label="Vị trí"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="VD: Sân đấu số 1, Khu vực A..."
            fullWidth
            required
            error={!locationValidation.isValid && location !== ''}
            helperText={!locationValidation.isValid && location !== '' ? locationValidation.errorMessage : ''}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={isUsed}
                onChange={(e) => setIsUsed(e.target.checked)}
                color="primary"
              />
            }
            label="Đang sử dụng"
          />

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeModal} color="inherit">Hủy</Button>
        <Button onClick={onSave} variant="contained" disabled={!isValid}>Lưu</Button>
      </DialogActions>
    </Dialog>
  );
}

