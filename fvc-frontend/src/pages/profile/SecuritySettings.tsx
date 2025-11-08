import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Security,
  Lock,
  Visibility,
  VisibilityOff,
  Shield,
  Notifications,
  Key,
} from '@mui/icons-material';
import { useState } from 'react';
import profileService from '@/services/profileService';
import type { ChangePasswordRequest } from '@/types';

export default function SecuritySettings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  type NotificationsState = {
    emailNotifications: boolean;
    securityAlerts: boolean;
    loginAlerts: boolean;
  };
  const [notifications, setNotifications] = useState<NotificationsState>({
    emailNotifications: false,
    securityAlerts: false,
    loginAlerts: false,
  });
  const handleNotificationChange = (field: keyof NotificationsState) => (_event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setNotifications(prev => ({ ...prev, [field]: checked }));
  };

  const handlePasswordChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    // Clear messages when user starts typing
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  const handleChangePassword = async () => {
    try {
      setIsChanging(true);
      setError(null);
      setSuccess(false);

      // Basic validations
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setError('Vui lòng nhập đầy đủ thông tin mật khẩu');
        setIsChanging(false);
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setError('Mật khẩu mới phải có ít nhất 8 ký tự');
        setIsChanging(false);
        return;
      }

      if (passwordData.newPassword.length > 64) {
        setError('Mật khẩu mới không được vượt quá 64 ký tự');
        setIsChanging(false);
        return;
      }

      // Validate password pattern: must have upper, lower, digit, special and no spaces
      const passwordPattern = /^(?=\S+$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,64}$/;
      if (!passwordPattern.test(passwordData.newPassword)) {
        setError('Mật khẩu phải có chữ hoa, chữ thường, số, ký tự đặc biệt và không có khoảng trắng');
        setIsChanging(false);
        return;
      }

      // Validate passwords match
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('Mật khẩu mới và xác nhận mật khẩu không khớp');
        setIsChanging(false);
        return;
      }

      const changePasswordData: ChangePasswordRequest = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      };

      await profileService.changePassword(changePasswordData);
      setSuccess(true);
      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Password change error:', err);
      // Try to extract the error message from various possible locations
      // The axios interceptor transforms errors, so check both structures
      const apiMessage = err?.message ||  // Transformed error from interceptor
                        err?.response?.data?.message ||  // Original axios error
                        err?.response?.data?.error?.message ||
                        'Không thể thay đổi mật khẩu. Vui lòng thử lại.';
      setError(apiMessage);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Security sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Bảo mật
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Password Section */}
        <Box>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Lock sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Thay đổi mật khẩu
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Mật khẩu hiện tại"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange('currentPassword')}
                  InputProps={{
                    endAdornment: (
                      <Button
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        sx={{ minWidth: 'auto', p: 1 }}
                      >
                        {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                      </Button>
                    ),
                  }}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Mật khẩu mới"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange('newPassword')}
                  InputProps={{
                    endAdornment: (
                      <Button
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        sx={{ minWidth: 'auto', p: 1 }}
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </Button>
                    ),
                  }}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Xác nhận mật khẩu mới"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange('confirmPassword')}
                  InputProps={{
                    endAdornment: (
                      <Button
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        sx={{ minWidth: 'auto', p: 1 }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </Button>
                    ),
                  }}
                />
              </Box>
            </Box>

            {/* Error and Success Messages */}
            {error && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }} onClose={() => setSuccess(false)}>
                Mật khẩu đã được thay đổi thành công!
              </Alert>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleChangePassword}
                disabled={
                  isChanging ||
                  !passwordData.currentPassword ||
                  !passwordData.newPassword ||
                  !passwordData.confirmPassword
                }
                sx={{ borderRadius: 2 }}
              >
                {isChanging ? 'Đang xử lý...' : 'Thay đổi mật khẩu'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setError(null);
                  setSuccess(false);
                }}
                sx={{ borderRadius: 2 }}
              >
                Hủy
              </Button>
            </Box>
          </Paper>
        </Box>

        {/* Security Features */}
        <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
          <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Shield sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Tính năng bảo mật
              </Typography>
            </Box>

            <List>
              <ListItem>
                <ListItemIcon>
                  <Key sx={{ color: 'text.secondary' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Xác thực hai yếu tố"
                  secondary="Thêm lớp bảo mật cho tài khoản"
                />
                <Button variant="outlined" size="small" sx={{ borderRadius: 2 }}>
                  Bật
                </Button>
              </ListItem>

              <Divider sx={{ my: 1 }} />

              <ListItem>
                <ListItemIcon>
                  <Security sx={{ color: 'text.secondary' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Phiên đăng nhập"
                  secondary="Quản lý các thiết bị đã đăng nhập"
                />
                <Button variant="outlined" size="small" sx={{ borderRadius: 2 }}>
                  Xem
                </Button>
              </ListItem>
            </List>
          </Paper>
          </Box>

        {/* Notifications */}
          <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Notifications sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Thông báo bảo mật
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.emailNotifications}
                    onChange={handleNotificationChange('emailNotifications')}
                  />
                }
                label="Thông báo qua email"
                labelPlacement="start"
                sx={{ justifyContent: 'space-between', m: 0 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.securityAlerts}
                    onChange={handleNotificationChange('securityAlerts')}
                  />
                }
                label="Cảnh báo bảo mật"
                labelPlacement="start"
                sx={{ justifyContent: 'space-between', m: 0 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.loginAlerts}
                    onChange={handleNotificationChange('loginAlerts')}
                  />
                }
                label="Thông báo đăng nhập"
                labelPlacement="start"
                sx={{ justifyContent: 'space-between', m: 0 }}
              />
            </Box>
          </Paper>
          </Box>
        </Box>

        {/* Security Tips */}
        <Box>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Mẹo bảo mật:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>Sử dụng mật khẩu mạnh với ít nhất 8 ký tự</li>
              <li>Không chia sẻ thông tin đăng nhập với người khác</li>
              <li>Đăng xuất khỏi các thiết bị công cộng</li>
              <li>Bật xác thực hai yếu tố để tăng cường bảo mật</li>
            </ul>
          </Alert>
        </Box>
      </Box>
    </Box>
  );
}