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
import {
  validateLength,
  validateRequired,
  validateNameSpecialChars,
} from "../../utils/validation";

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

  // Validation logic
  const nameValidation = useMemo(() => {
    const requiredValidation = validateRequired(name, "Nội dung Võ nhạc");
    if (!requiredValidation.isValid) return requiredValidation;
    const lengthValidation = validateLength(name, {
      min: NAME_MIN,
      max: NAME_MAX,
      fieldName: "Nội dung Võ nhạc",
    });
    if (!lengthValidation.isValid) return lengthValidation;

    const specialCharsValidation = validateNameSpecialChars(
      name,
      "Nội dung Võ nhạc"
    );
    if (!specialCharsValidation.isValid) return specialCharsValidation;

    // Note: Duplicate checking would require access to musicContents from store
    // For now, we'll skip duplicate checking to avoid store dependency issues

    return { isValid: true };
  }, [name, editing]);

  const descriptionValidation = useMemo(() => {
    if (!description || description.trim() === "") {
      return { isValid: true }; // Description is optional
    }
    return validateLength(description, { max: DESC_MAX, fieldName: "Ghi chú" });
  }, [description]);

  const isFormValid = useMemo(() => {
    return nameValidation.isValid && descriptionValidation.isValid;
  }, [nameValidation.isValid, descriptionValidation.isValid]);

  const getValidationError = () => {
    if (!nameValidation.isValid) return nameValidation.errorMessage;
    if (!descriptionValidation.isValid)
      return descriptionValidation.errorMessage;
    return null;
  };

  if (!modalOpen) return null;

  const handleResultOk = () => {
    setError(null);
  };

  const handleResultErr = (e?: unknown) => {
    // lỗi chi tiết đã được store set vào storeError -> effect ở trên sẽ hiển thị
    if (!storeError && !getValidationError()) {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    }
    console.error(e);
  };

  const onSaveDraft = async () => {
    // cho phép lưu nháp ngay cả khi isActive = false; nhưng vẫn cần name hợp lệ
    if (!isFormValid) {
      setError(getValidationError() || "Vui lòng kiểm tra lại thông tin");
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

      handleResultOk();
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
    if (!isFormValid) {
      setError(getValidationError() || "Vui lòng kiểm tra lại thông tin");
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

      handleResultOk();
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
            error={!nameValidation.isValid && name !== ""}
            helperText={
              !nameValidation.isValid && name !== ""
                ? nameValidation.errorMessage
                : ""
            }
            inputProps={{ maxLength: NAME_MAX }}
          />
          <TextField
            label="Ghi chú"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError(null);
            }}
            placeholder="VD: Áp dụng theo chuẩn Vovinam 2025"
            error={!descriptionValidation.isValid && description !== ""}
            helperText={
              !descriptionValidation.isValid && description !== ""
                ? descriptionValidation.errorMessage
                : ""
            }
            inputProps={{ maxLength: DESC_MAX }}
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
          <Button
            onClick={onSaveDraft}
            disabled={saving || !isFormValid}
            variant="outlined"
          >
            Lưu nháp
          </Button>
        )}
        <Button
          onClick={onSave}
          disabled={saving || !isFormValid}
          variant="contained"
        >
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
}
