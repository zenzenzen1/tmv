import { useAuth, useAuthActions } from "@/stores/authStore";
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
import { Settings, Logout, Person, ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  showBackButton?: boolean;
  onBackClick?: () => void;
  title?: string;
}

export default function Header({ 
  showBackButton = false,
  onBackClick,
  title = "FVCMS"
}: HeaderProps) {
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
    navigate('/profile');
    handleClose();
  };

  const handleSettings = () => {
    handleClose();
  };

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate('/manage/dashboard');
    }
  };

  return (
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
        {/* Left side - Back button and Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {showBackButton && (
            <IconButton
              onClick={handleBack}
              sx={{
                color: 'text.secondary',
                mr: 2,
                '&:hover': { backgroundColor: 'action.hover' }
              }}
              aria-label="back"
            >
              <ArrowBack />
            </IconButton>
          )}
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
            {title}
          </Typography>
        </Box>

        {/* Right side - User profile */}
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
              {user?.role || 'User'}
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
  );
}

