import { useFistContentStore } from '../../stores/fistContent';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../components/common/ToastContext';
import { validateLength, validateRequired, validateNameSpecialChars } from '../../utils/validation';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Alert,
  Stack,
} from '@mui/material';

export default function FistContentModal() {
  const { modalOpen, closeModal, isLoading, editing, create, update, error: storeError } = useFistContentStore();
  const { success: showSuccess, error: toastError } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setName(editing.name || '');
      setDescription(editing.description || '');
      setActive(!!editing.status);
      // parent only
    } else {
      setName('');
      setDescription('');
      setActive(true);
      // parent only
    }
    setError(null);
    setSuccessMsg(null);
  }, [editing, modalOpen]);

  // parent only, no extra preload

  // Show store errors
  useEffect(() => {
    if (storeError) {
      setError(storeError);
    }
  }, [storeError]);

  // Name validation
  const nameValidation = useMemo(() => {
    const requiredValidation = validateRequired(name, 'Nội dung Quyền');
    if (!requiredValidation.isValid) return requiredValidation;
    
    const lengthValidation = validateLength(name, { min: 1, max: 100, fieldName: 'Nội dung Quyền' });
    if (!lengthValidation.isValid) return lengthValidation;
    
    const specialCharsValidation = validateNameSpecialChars(name, 'Nội dung Quyền');
    if (!specialCharsValidation.isValid) return specialCharsValidation;
    
    // Note: Duplicate checking would require access to fistContents from store
    // For now, we'll skip duplicate checking to avoid store dependency issues
    
    return { isValid: true };
  }, [name, editing]);

  // Description validation
  const descriptionValidation = useMemo(() => {
    if (!description || description.trim() === '') {
      return { isValid: true }; // Description is optional
    }
    
    const lengthValidation = validateLength(description, { max: 500, fieldName: 'Ghi chú' });
    return lengthValidation;
  }, [description]);

  // Overall form validation
  const isFormValid = useMemo(() => {
    return nameValidation.isValid && descriptionValidation.isValid;
  }, [nameValidation.isValid, descriptionValidation.isValid]);

  const getValidationError = () => {
    if (!nameValidation.isValid) return nameValidation.errorMessage;
    if (!descriptionValidation.isValid) return descriptionValidation.errorMessage;
    return null;
  };

  if (!modalOpen) return null;

  const onSaveDraft = async () => {
    const validationError = getValidationError();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSuccessMsg(null);
    try {
      if (editing) {
        await update(editing.id, { name, description, status: false });
        setSuccessMsg('Đã lưu nháp thành công!');
        setTimeout(() => setSuccessMsg(null), 2000);
        showSuccess('Đã lưu nháp loại');
      } else {
        await create({ name, description, status: false });
        setSuccessMsg('Đã tạo nháp thành công!');
        setTimeout(() => setSuccessMsg(null), 2000);
        showSuccess('Đã tạo nháp loại');
      }
    } catch (err) {
      toastError('Lưu nháp thất bại');
    }
  };

  const onSave = async () => {
    const validationError = getValidationError();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSuccessMsg(null);
    try {
      if (editing) {
        await update(editing.id, { name, description, status: active });
        setSuccessMsg('Đã cập nhật thành công!');
        setTimeout(() => setSuccessMsg(null), 2000);
        showSuccess('Đã cập nhật loại');
      } else {
        await create({ name, description, status: active });
        setSuccessMsg('Đã tạo thành công!');
        setTimeout(() => setSuccessMsg(null), 2000);
        showSuccess('Đã tạo loại');
      }
    } catch (err) {
      toastError('Lưu loại thất bại');
    }
  };

  return (
    <Dialog open={modalOpen} onClose={closeModal} fullWidth maxWidth="sm">
      <DialogTitle>{editing ? 'Chỉnh sửa nội dung Quyền' : 'Thêm nội dung Quyền'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {/* Parent only: no type selector here */}

          <TextField
            label="Nội dung Quyền"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null); }}
            placeholder="VD: Song Luyện quyền 1"
            error={!nameValidation.isValid && name !== ''}
            helperText={!nameValidation.isValid && name !== '' ? nameValidation.errorMessage : ''}
            inputProps={{ maxLength: 100 }}
          />

          <TextField
            label="Ghi chú"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="VD: Áp dụng theo chuẩn Vovinam 2025"
            multiline
            rows={3}
            error={!descriptionValidation.isValid && description !== ''}
            helperText={!descriptionValidation.isValid && description !== '' ? descriptionValidation.errorMessage : ''}
            inputProps={{ maxLength: 500 }}
          />

          <FormControlLabel
            control={<Checkbox checked={active} onChange={(e) => setActive(e.target.checked)} />}
            label="Đang dùng"
          />

          {error && <Alert severity="error">{error}</Alert>}
          {successMsg && <Alert severity="success">{successMsg}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeModal} color="inherit">Hủy</Button>
        <Button onClick={onSaveDraft} disabled={isLoading || !isFormValid} variant="outlined">Lưu nháp</Button>
        <Button onClick={onSave} disabled={isLoading || !isFormValid} variant="contained">Lưu</Button>
      </DialogActions>
    </Dialog>
  );
}


