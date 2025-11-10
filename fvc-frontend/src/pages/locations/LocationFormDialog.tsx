import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { useLocationStore } from "@/stores/locations";
import type {
  LocationCreateRequest,
  LocationUpdateRequest,
} from "@/types/location";
import { useToast } from "@/components/common/ToastContext";

type FormState = {
  name: string;
  address: string;
  capacityDefault: string;
  description: string;
  lat: string;
  lng: string;
  isActive: boolean;
};

const NAME_MAX = 150;
const ADDRESS_MAX = 255;
const DESCRIPTION_MAX = 500;

const defaultState: FormState = {
  name: "",
  address: "",
  capacityDefault: "",
  description: "",
  lat: "",
  lng: "",
  isActive: true,
};

export default function LocationFormDialog() {
  const toast = useToast();
  const {
    modalOpen,
    editing,
    isLoading,
    error,
    closeModal,
    create,
    update,
  } = useLocationStore();

  const [form, setForm] = useState<FormState>(defaultState);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name ?? "",
        address: editing.address ?? "",
        capacityDefault:
          editing.capacityDefault !== undefined && editing.capacityDefault !== null
            ? String(editing.capacityDefault)
            : "",
        description: editing.description ?? "",
        lat:
          editing.lat !== undefined && editing.lat !== null
            ? String(editing.lat)
            : "",
        lng:
          editing.lng !== undefined && editing.lng !== null
            ? String(editing.lng)
            : "",
        isActive: editing.isActive ?? true,
      });
    } else {
      setForm(defaultState);
    }
    setFormError(null);
  }, [editing, modalOpen]);

  const validationErrors = useMemo(() => {
    const errs: Record<string, string> = {};

    if (!form.name.trim()) {
      errs.name = "Tên địa điểm là bắt buộc";
    } else if (form.name.trim().length > NAME_MAX) {
      errs.name = `Tên tối đa ${NAME_MAX} ký tự`;
    }

    if (form.address.trim().length > ADDRESS_MAX) {
      errs.address = `Địa chỉ tối đa ${ADDRESS_MAX} ký tự`;
    }

    if (form.description.trim().length > DESCRIPTION_MAX) {
      errs.description = `Mô tả tối đa ${DESCRIPTION_MAX} ký tự`;
    }

    if (form.capacityDefault) {
      const value = Number(form.capacityDefault);
      if (Number.isNaN(value) || value < 0) {
        errs.capacityDefault = "Sức chứa phải là số không âm";
      }
    }

    if (form.lat) {
      const value = Number(form.lat);
      if (Number.isNaN(value)) {
        errs.lat = "Vĩ độ phải là số hợp lệ";
      }
    }

    if (form.lng) {
      const value = Number(form.lng);
      if (Number.isNaN(value)) {
        errs.lng = "Kinh độ phải là số hợp lệ";
      }
    }

    return errs;
  }, [form]);

  const hasErrors = Object.keys(validationErrors).length > 0;

  const handleChange =
    (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "isActive" ? event.target.checked : event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const buildPayload = (): LocationCreateRequest | LocationUpdateRequest => {
    const payload: LocationCreateRequest | LocationUpdateRequest = {
      name: form.name.trim(),
      address: form.address.trim() || undefined,
      description: form.description.trim() || undefined,
      capacityDefault: form.capacityDefault
        ? Number(form.capacityDefault)
        : undefined,
      lat: form.lat ? Number(form.lat) : undefined,
      lng: form.lng ? Number(form.lng) : undefined,
    };

    if (editing) {
      (payload as LocationUpdateRequest).isActive = form.isActive;
    }

    return payload;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (hasErrors) {
      const firstError = validationErrors.name
        ?? validationErrors.address
        ?? validationErrors.capacityDefault
        ?? validationErrors.description
        ?? validationErrors.lat
        ?? validationErrors.lng;
      setFormError(firstError || "Vui lòng kiểm tra lại thông tin.");
      return;
    }

    try {
      const payload = buildPayload();
      if (editing) {
        await update(editing.id, payload as LocationUpdateRequest);
        toast.success("Đã cập nhật địa điểm");
      } else {
        await create(payload as LocationCreateRequest);
        toast.success("Đã tạo địa điểm mới");
      }
    } catch (err) {
      if (!formError) {
        const message =
          (err as Error)?.message || "Không thể lưu địa điểm. Vui lòng thử lại.";
        setFormError(message);
      }
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    closeModal();
  };

  return (
    <Dialog open={modalOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editing ? "Chỉnh sửa địa điểm" : "Thêm địa điểm"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Tên địa điểm"
            value={form.name}
            onChange={handleChange("name")}
            required
            inputProps={{ maxLength: NAME_MAX }}
            error={Boolean(validationErrors.name)}
            helperText={validationErrors.name}
          />

          <TextField
            label="Địa chỉ"
            value={form.address}
            onChange={handleChange("address")}
            inputProps={{ maxLength: ADDRESS_MAX }}
            error={Boolean(validationErrors.address)}
            helperText={validationErrors.address}
          />

          <TextField
            label="Sức chứa mặc định"
            value={form.capacityDefault}
            onChange={handleChange("capacityDefault")}
            type="number"
            inputProps={{ min: 0 }}
            error={Boolean(validationErrors.capacityDefault)}
            helperText={validationErrors.capacityDefault}
          />

          <TextField
            label="Mô tả"
            value={form.description}
            onChange={handleChange("description")}
            multiline
            minRows={2}
            inputProps={{ maxLength: DESCRIPTION_MAX }}
            error={Boolean(validationErrors.description)}
            helperText={validationErrors.description}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Vĩ độ (Lat)"
              value={form.lat}
              onChange={handleChange("lat")}
              fullWidth
              error={Boolean(validationErrors.lat)}
              helperText={validationErrors.lat}
            />
            <TextField
              label="Kinh độ (Lng)"
              value={form.lng}
              onChange={handleChange("lng")}
              fullWidth
              error={Boolean(validationErrors.lng)}
              helperText={validationErrors.lng}
            />
          </Stack>

          {editing && (
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={handleChange("isActive")}
                  color="primary"
                />
              }
              label={form.isActive ? "Địa điểm đang sử dụng" : "Địa điểm đã ngừng"}
            />
          )}

          {formError && <Alert severity="error">{formError}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit" disabled={isLoading}>
          Hủy
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isLoading}>
          {editing ? "Lưu thay đổi" : "Tạo mới"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

