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
import type { UpdateProfileRequest } from '@/types';

export default function PersonalInfo() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    studentCode: user?.studentCode || '',
    personalMail: user?.personalMail || '',
    eduMail: user?.eduMail || '',
    gender: '',
    dob: '',
  });

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSelectChange = (field: string) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(false);

      const updateData: UpdateProfileRequest = {
        fullName: formData.fullName || undefined,
        personalMail: formData.personalMail || undefined,
        eduMail: formData.eduMail || undefined,
        studentCode: formData.studentCode || undefined,
        gender: formData.gender || undefined,
        dob: formData.dob || undefined,
      };

      await profileService.updateProfile(updateData);
      setSuccess(true);
      setIsEditing(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
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
      gender: '',
      dob: '',
    });
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

      {/* Success Message */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(false)}>
          Profile updated successfully!
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

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

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    label="Họ và tên"
                    value={formData.fullName}
                    onChange={handleInputChange('fullName')}
                    disabled={!isEditing}
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
