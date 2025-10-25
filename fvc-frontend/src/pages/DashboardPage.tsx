import { useAuth, useAuthActions } from "../stores/authStore";
import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Divider,
} from "@mui/material";
import {
  AccountCircle,
  Settings,
  Logout,
  Person,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const { user } = useAuth();
  const { logout } = useAuthActions();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    handleClose();
  };

  const handleProfile = () => {
    handleClose();
  };

  const handleSettings = () => {
    handleClose();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AppBar 
        position="static" 
        sx={{ 
          backgroundColor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: 3 }}>
          {/* Logo FVCMS */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 'bold',
                color: 'primary.main',
                fontSize: '1.5rem',
                letterSpacing: '0.5px'
              }}
            >
              FVCMS
            </Typography>
          </Box>

          {/* Profile Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                mr: 1,
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {user?.fullName || 'User'}
            </Typography>
            
            <IconButton
              onClick={handleProfileClick}
              size="small"
              sx={{ 
                ml: 2,
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
              aria-controls={open ? 'profile-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32,
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem'
                }}
              >
                {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
          </Box>

          {/* Profile Menu */}
          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            onClick={handleClose}
            PaperProps={{
              elevation: 3,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                mt: 1.5,
                minWidth: 200,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {/* User Info */}
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {user?.fullName || 'User'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {user?.systemRole || 'User'}
              </Typography>
            </Box>

            {/* Menu Items */}
            <MenuItem onClick={handleProfile} sx={{ py: 1.5 }}>
              <Person sx={{ mr: 1.5, fontSize: 20 }} />
              Profile
            </MenuItem>
            
            <MenuItem onClick={handleSettings} sx={{ py: 1.5 }}>
              <Settings sx={{ mr: 1.5, fontSize: 20 }} />
              Settings
            </MenuItem>
            
            <Divider />
            
            <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
              <Logout sx={{ mr: 1.5, fontSize: 20 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Dashboard Content */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h2 className="text-lg font-semibold text-green-800 mb-2">
                Welcome, {user?.fullName}!
              </h2>
              <p className="text-green-700">
                You have successfully logged in to the FVC Management System.
              </p>
              <div className="mt-4 text-sm text-green-600">
                <p>
                  <strong>Student Code:</strong> {user?.studentCode}
                </p>
                <p>
                  <strong>Personal Email:</strong> {user?.personalMail}
                </p>
                <p>
                  <strong>Edu Email:</strong> {user?.eduMail}
                </p>
                <p>
                  <strong>Role:</strong> {user?.systemRole}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
