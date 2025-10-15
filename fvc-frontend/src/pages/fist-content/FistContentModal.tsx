import { useFistContentStore } from '../../stores/fistContent';
import { useState, useEffect, useMemo } from 'react';
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
  MenuItem,
} from '@mui/material';

export default function FistContentModal() {
  const { modalOpen, closeModal, isLoading, editing, create, update, error: storeError } = useFistContentStore();
  const [contentType, setContentType] = useState<'' | 'song-luyen' | 'don-luyen' | 'da-luyen' | 'dong-doi'>('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setName(editing.name || '');
      setDescription(editing.description || '');
      setActive(!!editing.status);
    } else {
      setName('');
      setDescription('');
      setActive(true);
    }
    setError(null);
    setSuccess(null);
  }, [editing, modalOpen]);

  // Show store errors
  useEffect(() => {
    if (storeError) {
      setError(storeError);
    }
  }, [storeError]);

  const isValid = useMemo(() => {
    return name.trim().length > 0 && contentType !== '';
  }, [name, contentType]);

  const getValidationError = () => {
    if (name.trim().length === 0) return 'Vui lòng nhập nội dung quyền!';
    if (contentType === '') return 'Vui lòng chọn loại nội dung!';
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
    setSuccess(null);
    try {
      if (editing) {
        await update(editing.id, { name, description, status: false });
        setSuccess('Đã lưu nháp thành công!');
        setTimeout(() => setSuccess(null), 2000);
      } else {
        await create({ name, description, status: false });
        setSuccess('Đã tạo nháp thành công!');
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch (err) {
      // Error handled in store
    }
  };

  const onSave = async () => {
    const validationError = getValidationError();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      if (editing) {
        await update(editing.id, { name, description, status: active });
        setSuccess('Đã cập nhật thành công!');
        setTimeout(() => setSuccess(null), 2000);
      } else {
        await create({ name, description, status: active });
        setSuccess('Đã tạo thành công!');
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch (err) {
      // Error handled in store
    }
  };

  return (
    <Dialog open={modalOpen} onClose={closeModal} fullWidth maxWidth="sm">
      <DialogTitle>{editing ? 'Chỉnh sửa nội dung Quyền' : 'Thêm nội dung Quyền'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            select
            label="Loại nội dung"
            value={contentType}
            onChange={(e) => { setContentType(e.target.value as any); setError(null); }}
          >
            <MenuItem value="">Chọn kiểu thi đấu</MenuItem>
            <MenuItem value="don-luyen">Đơn luyện</MenuItem>
            <MenuItem value="da-luyen">Đa luyện</MenuItem>
            <MenuItem value="dong-doi">Đồng đội</MenuItem>
            <MenuItem value="song-luyen">Song luyện</MenuItem>
          </TextField>

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
          {success && <Alert severity="success">{success}</Alert>}
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


