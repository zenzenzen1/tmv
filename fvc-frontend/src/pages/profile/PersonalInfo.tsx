import { useAuth } from '@/stores/authStore';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';
import { Person, Email, School, Badge } from '@mui/icons-material';
import { useState } from 'react';
import profileService from '@/services/profileService';
import { useToast } from '@/components/common/ToastContext';
import type { UpdateProfileRequest } from '@/types';

export default function PersonalInfo() {
  const { user } = useAuth();
  const toast = useToast();
  
  // Debug: Log user data
  console.log('User data:', user);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    studentCode: user?.studentCode || '',
    personalMail: user?.personalMail || '',
    eduMail: user?.eduMail || '',
    gender: user?.gender || '',
    dob: user?.dob || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleSelectChange = (field: string) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const [isSaving, setIsSaving] = useState(false);

  // Validation functions
  const validateFullName = (name: string): string | null => {
    if (!name || name.trim().length === 0) return null; // Optional field
    
    // Normalize: replace all Unicode whitespace with regular space
    const normalizedName = name.replace(/\s+/g, ' ').trim();
    
    if (normalizedName.length > 255) return 'Họ và tên không được vượt quá 255 ký tự';
    
    // Only allow letters (including Vietnamese) and regular spaces
    // \p{L} = Unicode letters, \p{M} = Unicode marks (for combining diacritics)
    if (!/^[\p{L}\p{M} ]+$/u.test(normalizedName)) {
      return 'Họ và tên chỉ được chứa chữ cái (bao gồm chữ có dấu tiếng Việt) và khoảng trắng, không được chứa số hoặc ký tự đặc biệt';
    }
    return null;
  };

  const validateEmail = (email: string): string | null => {
    if (!email || email.trim().length === 0) return null; // Optional field
    if (email.length > 50) return 'Email không được vượt quá 50 ký tự';
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return 'Email không đúng định dạng';
    }
    return null;
  };

  const validateDob = (dob: string): string | null => {
    if (!dob || dob.trim().length === 0) return null; // Optional field
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobRegex.test(dob)) {
      return 'Ngày sinh phải có định dạng YYYY-MM-DD (ví dụ: 2000-01-15)';
    }
    return null;
  };

  const handleSave = async () => {
    // Clear previous errors
    setErrors({});
    setGeneralError(null);

    // Validate all fields
    const validationErrors: Record<string, string> = {};

    if (formData.fullName) {
      const fullNameError = validateFullName(formData.fullName);
      if (fullNameError) validationErrors.fullName = fullNameError;
    }

    if (formData.personalMail) {
      const personalMailError = validateEmail(formData.personalMail);
      if (personalMailError) validationErrors.personalMail = personalMailError;
    }

    if (formData.eduMail) {
      const eduMailError = validateEmail(formData.eduMail);
      if (eduMailError) validationErrors.eduMail = eduMailError;
    }

    if (formData.dob) {
      const dobError = validateDob(formData.dob);
      if (dobError) validationErrors.dob = dobError;
    }

    // If there are validation errors, display them and stop
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Vui lòng kiểm tra lại thông tin đã nhập');
      return;
    }

    try {
      setIsSaving(true);

      const updateData: UpdateProfileRequest = {
        // Normalize fullName: replace all whitespace with single space
        fullName: formData.fullName ? formData.fullName.replace(/\s+/g, ' ').trim() : undefined,
        personalMail: formData.personalMail?.trim() || undefined,
        eduMail: formData.eduMail?.trim() || undefined,
        studentCode: formData.studentCode?.trim() || undefined,
        gender: formData.gender?.trim() || undefined,
        dob: formData.dob?.trim() || undefined,
      };

      await profileService.updateProfile(updateData);
      toast.success('Cập nhật thông tin thành công!');
      setIsEditing(false);
      setErrors({});
      setGeneralError(null);
    } catch (err: any) {
      console.error('Profile update error:', err);
      
      // Try to extract field-specific errors from backend
      const errorMessage = err?.response?.data?.message || 
                          err?.response?.data?.error?.message ||
                          err?.message ||
                          'Không thể cập nhật thông tin. Vui lòng thử lại.';
      
      // Check if it's a validation error with field details
      if (err?.response?.data?.error === 'VALIDATION_ERROR' || err?.response?.status === 400) {
        // Parse field-specific errors from backend message
        // Format: "fieldName: message; fieldName2: message2"
        const backendErrors: Record<string, string> = {};
        
        // If backend returns field-specific errors in errors object
        if (err?.response?.data?.errors) {
          Object.keys(err.response.data.errors).forEach(field => {
            backendErrors[field] = err.response.data.errors[field];
          });
        } else if (errorMessage) {
          // Parse error message with format "fieldName: message; fieldName2: message2"
          const errorParts = errorMessage.split(';');
          errorParts.forEach(part => {
            const colonIndex = part.indexOf(':');
            if (colonIndex > 0) {
              const fieldName = part.substring(0, colonIndex).trim();
              const message = part.substring(colonIndex + 1).trim();
              // Map backend field names to frontend field names
              const mappedFieldName = fieldName === 'personalMail' ? 'personalMail' :
                                     fieldName === 'eduMail' ? 'eduMail' :
                                     fieldName === 'fullName' ? 'fullName' :
                                     fieldName === 'dob' ? 'dob' : fieldName;
              backendErrors[mappedFieldName] = message;
            }
          });
        }
        
        if (Object.keys(backendErrors).length > 0) {
          setErrors(backendErrors);
        } else {
          setGeneralError(errorMessage);
        }
      } else {
        setGeneralError(errorMessage);
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || '',
      studentCode: user?.studentCode || '',
      personalMail: user?.personalMail || '',
      eduMail: user?.eduMail || '',
      gender: user?.gender || '',
      dob: user?.dob || '',
    });
    setErrors({});
    setGeneralError(null);
    setIsEditing(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Person sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Thông tin cá nhân
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Avatar Section */}
        <Box sx={{ width: { xs: '100%', md: '300px' }, flexShrink: 0 }}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 2,
                bgcolor: 'primary.main',
                fontSize: '2.5rem',
                fontWeight: 'bold',
              }}
            >
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              {user?.fullName || 'User'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {user?.role || 'User'}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              disabled={!isEditing}
              sx={{ borderRadius: 2 }}
            >
              Thay đổi ảnh
            </Button>
          </Paper>
        </Box>

        {/* Form Section */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Chi tiết thông tin
            </Typography>
            <Box>
              {!isEditing ? (
                <Button
                  variant="contained"
                  onClick={() => setIsEditing(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Chỉnh sửa
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    sx={{ borderRadius: 2 }}
                    disabled={isSaving}
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    sx={{ borderRadius: 2 }}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Đang lưu...' : 'Lưu'}
                  </Button>
                </Box>
              )}
            </Box>
          </Box>

          {/* General Error Message */}
          {generalError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setGeneralError(null)}>
              {generalError}
            </Alert>
          )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    label="Họ và tên"
                    value={formData.fullName}
                    onChange={handleInputChange('fullName')}
                    disabled={!isEditing}
                    error={!!errors.fullName}
                    helperText={errors.fullName}
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    label="Mã sinh viên"
                    value={formData.studentCode}
                    onChange={handleInputChange('studentCode')}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <Badge sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    label="Email cá nhân"
                    type="email"
                    value={formData.personalMail}
                    onChange={handleInputChange('personalMail')}
                    disabled={!isEditing}
                    error={!!errors.personalMail}
                    helperText={errors.personalMail}
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    label="Email trường"
                    type="email"
                    value={formData.eduMail}
                    onChange={handleInputChange('eduMail')}
                    disabled={!isEditing}
                    error={!!errors.eduMail}
                    helperText={errors.eduMail}
                    InputProps={{
                      startAdornment: <School sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth disabled={!isEditing}>
                    <InputLabel>Giới tính</InputLabel>
                    <Select
                      value={formData.gender}
                      onChange={handleSelectChange('gender')}
                      label="Giới tính"
                    >
                      <MenuItem value="">
                        <em>Chọn giới tính</em>
                      </MenuItem>
                      <MenuItem value="MALE">Nam</MenuItem>
                      <MenuItem value="FEMALE">Nữ</MenuItem>
                      <MenuItem value="OTHER">Khác</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    label="Ngày sinh"
                    type="date"
                    value={formData.dob}
                    onChange={handleInputChange('dob')}
                    disabled={!isEditing}
                    error={!!errors.dob}
                    helperText={errors.dob}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Box>
              </Box>
            </Box>
        </Box>
      </Box>
    </Box>
  );
}
