import { useFistContentStore } from '../../stores/fistContent';
import { useState, useEffect } from 'react';
import { useToast } from '../../components/common/ToastContext';
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

  // remove unused variable to satisfy linter

  const getValidationError = () => {
    if (name.trim().length === 0) return 'Vui lòng nhập nội dung quyền!';
    // parent has no type in this model
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
          />

          <TextField
            label="Ghi chú"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="VD: Áp dụng theo chuẩn Vovinam 2025"
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
        <Button onClick={onSaveDraft} disabled={isLoading} variant="outlined">Lưu nháp</Button>
        <Button onClick={onSave} disabled={isLoading} variant="contained">Lưu</Button>
      </DialogActions>
    </Dialog>
  );
}


