import { useEffect, useState, useMemo } from "react";
import { useMusicContentStore } from "../../stores/musicContent";
import type {
  MusicContentCreateRequest,
  MusicContentUpdateRequest,
} from "../../types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Alert,
  Stack,
} from "@mui/material";
import { useToast } from "../../components/common/ToastContext";

const NAME_MIN = 1;
const NAME_MAX = 120;
const DESC_MAX = 500;

export default function MusicContentModal() {
  const {
    modalOpen,
    editing,
    closeModal,
    create,
    update,
    error: storeError,
  } = useMusicContentStore();
  const { success, error: toastError } = useToast();
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [performersPerEntry, setPerformersPerEntry] = useState<number>(1);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setDescription(editing.description || "");
      setIsActive(editing.isActive);
      setPerformersPerEntry((editing as any).performersPerEntry ?? 1);
    } else {
      setName("");
      setDescription("");
      setIsActive(true);
      setPerformersPerEntry(1);
    }
    setError(null);
    setSaving(false);
  }, [editing, modalOpen]);

  // Hiển thị lỗi từ store (nếu có)
  useEffect(() => {
    if (storeError) setError(storeError);
  }, [storeError]);

  // Validate logic
  const nameError = useMemo(() => {
    const trimmed = name.trim();
    if (trimmed.length < NAME_MIN) return "Vui lòng nhập nội dung võ nhạc!";
    if (trimmed.length > NAME_MAX)
      return `Tên quá dài (tối đa ${NAME_MAX} ký tự).`;
    return null;
  }, [name]);

  const descError = useMemo(() => {
    if (description && description.length > DESC_MAX) {
      return `Ghi chú quá dài (tối đa ${DESC_MAX} ký tự).`;
    }
    return null;
  }, [description]);

  const firstError = useMemo(
    () => nameError || descError || null,
    [nameError, descError]
  );

  if (!modalOpen) return null;

  const handleResultOk = (msg: string) => {
    setError(null);
  };

  const handleResultErr = (e?: unknown) => {
    // lỗi chi tiết đã được store set vào storeError -> effect ở trên sẽ hiển thị
    if (!storeError && !firstError) {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
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
    try {
      const payload: MusicContentCreateRequest | MusicContentUpdateRequest =
        editing
          ? {
              name: name.trim(),
              description: description.trim(),
              isActive: false,
            }
          : {
              name: name.trim(),
              description: description.trim(),
              isActive: false,
            };

      if (editing)
        await update(editing.id, payload as MusicContentUpdateRequest);
      else await create(payload as MusicContentCreateRequest);

      handleResultOk("Đã lưu nháp thành công!");
      success("Đã lưu nháp nội dung");
    } catch (e) {
      handleResultErr(e);
      toastError("Lưu nháp thất bại");
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
    try {
      const payload: MusicContentCreateRequest | MusicContentUpdateRequest = {
        name: name.trim(),
        description: description.trim(),
        isActive,
      };

      if (editing)
        await update(editing.id, payload as MusicContentUpdateRequest);
      else await create(payload as MusicContentCreateRequest);

      handleResultOk(
        editing ? "Đã cập nhật thành công!" : "Đã tạo thành công!"
      );
      success(editing ? "Đã cập nhật nội dung" : "Đã tạo nội dung");
    } catch (e) {
      handleResultErr(e);
      toastError("Lưu nội dung thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={modalOpen} onClose={closeModal} fullWidth maxWidth="sm">
      <DialogTitle>
        {editing ? "Chỉnh sửa nội dung Võ nhạc" : "Thêm nội dung Võ nhạc"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            label="Nội dung Võ nhạc"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="Ví dụ: Võ nhạc số 1"
            error={!!nameError}
            helperText={nameError || " "}
            inputProps={{ maxLength: NAME_MAX + 10 }}
          />
          <TextField
            label="Ghi chú"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError(null);
            }}
            placeholder="VD: Áp dụng theo chuẩn Vovinam 2025"
            error={!!descError}
            helperText={descError || " "}
            inputProps={{ maxLength: DESC_MAX + 50 }}
          />
          <TextField
            label="Số người/tiết mục"
            type="number"
            value={performersPerEntry}
            onChange={(e) =>
              setPerformersPerEntry(Math.max(1, Number(e.target.value || 1)))
            }
            inputProps={{ min: 1 }}
            helperText="Ví dụ: 1 (đơn), 2 (song), 3 (tam)"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
            }
            label="Đang dùng"
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeModal} color="inherit">
          Hủy
        </Button>
        {!editing && (
          <Button onClick={onSaveDraft} disabled={saving} variant="outlined">
            Lưu nháp
          </Button>
        )}
        <Button
          onClick={async () => {
            if (nameError || descError) return;
            setSaving(true);
            try {
              if (editing) {
                await update({
                  name: name.trim(),
                  description: description || undefined,
                  isActive,
                  performersPerEntry,
                } as unknown as MusicContentUpdateRequest);
                success("Đã cập nhật nội dung võ nhạc");
              } else {
                await create({
                  name: name.trim(),
                  description: description || undefined,
                  isActive,
                  performersPerEntry,
                } as unknown as MusicContentCreateRequest);
                success("Đã tạo nội dung võ nhạc");
              }
              closeModal();
            } catch (e: any) {
              console.error(e);
              toastError(e?.message || "Lưu thất bại");
            } finally {
              setSaving(false);
            }
          }}
          disabled={saving}
          variant="contained"
        >
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
}
