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
  } = useMusicContentStore();
  const { success, error: toastError } = useToast();
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [performersPerEntry, setPerformersPerEntry] = useState<number>(1);

  // UI state
  const [nameError, setNameError] = useState<string>("");
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
    setNameError("");
    setSaving(false);
  }, [editing, modalOpen]);

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

  if (!modalOpen) return null;

  const onSaveDraft = async () => {
    // cho phép lưu nháp ngay cả khi isActive = false; nhưng vẫn cần name hợp lệ
    if (!isFormValid || nameError) {
      return;
    }
    setSaving(true);
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

      success("Đã lưu nháp nội dung");
      closeModal();
      setSaving(false);
    } catch (e: any) {
      setSaving(false);
      // Check for duplicate name error
      if (e?.response?.data?.errorCode === "DUPLICATE_NAME") {
        setNameError("Tên nội dung đã bị trùng");
        toastError("Tên nội dung đã bị trùng");
      } else {
        toastError("Lưu nháp thất bại");
      }
    }
  };

  const onSave = async () => {
    // Publish: bắt buộc name hợp lệ; isActive sẽ true
    if (!isFormValid || nameError) {
      return;
    }
    setSaving(true);
    try {
      const payload: MusicContentCreateRequest | MusicContentUpdateRequest = {
        name: name.trim(),
        description: description.trim(),
        isActive,
      };

      if (editing)
        await update(editing.id, payload as MusicContentUpdateRequest);
      else await create(payload as MusicContentCreateRequest);

      success(editing ? "Đã cập nhật nội dung" : "Đã tạo nội dung");
      closeModal();
      setSaving(false);
    } catch (e: any) {
      setSaving(false);
      // Check for duplicate name error
      if (e?.response?.data?.errorCode === "DUPLICATE_NAME") {
        setNameError("Tên nội dung đã bị trùng");
        toastError("Tên nội dung đã bị trùng");
      } else {
        toastError("Lưu nội dung thất bại");
      }
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
              const value = e.target.value;
              setName(value);
              
              // Clear previous errors when user types
              setNameError("");
              
              // Validate special characters
              const specialCharsRegex = /[!@#$%^&*()+=\[\]{};':"\\|,.<>?]/;
              if (specialCharsRegex.test(value)) {
                setNameError("Tên nội dung không được chứa ký tự đặc biệt");
              }
            }}
            placeholder="Ví dụ: Võ nhạc số 1"
            error={!!nameError || (!nameValidation.isValid && name !== "")}
            helperText={nameError || (!nameValidation.isValid && name !== "" ? nameValidation.errorMessage : "")}
            required
            inputProps={{ maxLength: NAME_MAX }}
          />
          <TextField
            label="Ghi chú"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
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
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => {
          closeModal();
          setNameError("");
        }} color="inherit">
          Hủy
        </Button>
        {!editing && (
          <Button
            onClick={onSaveDraft}
            disabled={saving || !isFormValid || !!nameError || !name.trim()}
            variant="outlined"
          >
            Lưu nháp
          </Button>
        )}
        <Button
          onClick={onSave}
          disabled={saving || !isFormValid || !!nameError || !name.trim()}
          variant="contained"
        >
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
}
