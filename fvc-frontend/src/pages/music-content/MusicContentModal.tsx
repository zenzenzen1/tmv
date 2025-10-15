import { useEffect, useState, useMemo } from 'react';
import { useMusicContentStore } from '../../stores/musicContent';
import type { MusicContentCreateRequest, MusicContentUpdateRequest } from '../../types';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, FormControlLabel, Button, Alert, Stack } from '@mui/material';

const NAME_MIN = 1;
const NAME_MAX = 120;
const DESC_MAX = 500;

export default function MusicContentModal() {
  const { modalOpen, editing, closeModal, create, update, error: storeError } = useMusicContentStore();
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setDescription(editing.description || '');
      setIsActive(editing.isActive);
    } else {
      setName('');
      setDescription('');
      setIsActive(true);
    }
    setError(null);
    setSuccess(null);
    setSaving(false);
  }, [editing, modalOpen]);

  // Hiển thị lỗi từ store (nếu có)
  useEffect(() => {
    if (storeError) setError(storeError);
  }, [storeError]);

  // Validate logic
  const nameError = useMemo(() => {
    const trimmed = name.trim();
    if (trimmed.length < NAME_MIN) return 'Vui lòng nhập nội dung võ nhạc!';
    if (trimmed.length > NAME_MAX) return `Tên quá dài (tối đa ${NAME_MAX} ký tự).`;
    return null;
  }, [name]);

  const descError = useMemo(() => {
    if (description && description.length > DESC_MAX) {
      return `Ghi chú quá dài (tối đa ${DESC_MAX} ký tự).`;
    }
    return null;
  }, [description]);

  const firstError = useMemo(() => nameError || descError || null, [nameError, descError]);

  if (!modalOpen) return null;

  const handleResultOk = (msg: string) => {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleResultErr = (e?: unknown) => {
    // lỗi chi tiết đã được store set vào storeError -> effect ở trên sẽ hiển thị
    if (!storeError && !firstError) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    }
    console.error(e);
  };

  const onSaveDraft = async () => {
    // cho phép lưu nháp ngay cả khi isActive = false; nhưng vẫn cần name hợp lệ
    if (firstError) {
      setError(firstError);
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: MusicContentCreateRequest | MusicContentUpdateRequest = editing
        ? { name: name.trim(), description: description.trim(), isActive: false }
        : { name: name.trim(), description: description.trim(), isActive: false };

      if (editing) await update(editing.id, payload as MusicContentUpdateRequest);
      else await create(payload as MusicContentCreateRequest);

      handleResultOk('Đã lưu nháp thành công!');
    } catch (e) {
      handleResultErr(e);
    } finally {
      setSaving(false);
    }
  };

  const onSave = async () => {
    // Publish: bắt buộc name hợp lệ; isActive sẽ true
    if (firstError) {
      setError(firstError);
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: MusicContentCreateRequest | MusicContentUpdateRequest = {
        name: name.trim(),
        description: description.trim(),
        isActive,
      };

      if (editing) await update(editing.id, payload as MusicContentUpdateRequest);
      else await create(payload as MusicContentCreateRequest);

      handleResultOk(editing ? 'Đã cập nhật thành công!' : 'Đã tạo thành công!');
    } catch (e) {
      handleResultErr(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={modalOpen} onClose={closeModal} fullWidth maxWidth="sm">
      <DialogTitle>{editing ? 'Chỉnh sửa nội dung Võ nhạc' : 'Thêm nội dung Võ nhạc'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            label="Nội dung Võ nhạc"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null); }}
            placeholder="Ví dụ: Võ nhạc số 1"
            error={!!nameError}
            helperText={nameError || ' '}
            inputProps={{ maxLength: NAME_MAX + 10 }}
          />
          <TextField
            label="Ghi chú"
            value={description}
            onChange={(e) => { setDescription(e.target.value); setError(null); }}
            placeholder="VD: Áp dụng theo chuẩn Vovinam 2025"
            error={!!descError}
            helperText={descError || ' '}
            inputProps={{ maxLength: DESC_MAX + 50 }}
          />
          <FormControlLabel control={<Checkbox checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />} label="Đang dùng" />
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeModal} color="inherit">Hủy</Button>
        {!editing && (
          <Button onClick={onSaveDraft} disabled={saving} variant="outlined">Lưu nháp</Button>
        )}
        <Button onClick={onSave} disabled={saving} variant="contained">Lưu</Button>
      </DialogActions>
    </Dialog>
  );
}
