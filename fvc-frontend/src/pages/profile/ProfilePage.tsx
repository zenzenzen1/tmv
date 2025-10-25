import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
} from '@mui/material';
import {
  Person,
  Security,
} from '@mui/icons-material';
import PersonalInfo from './PersonalInfo';
import SecuritySettings from './SecuritySettings'; // Profile security component

type ProfileSection = 'personal' | 'security';

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState<ProfileSection>('personal');

  const menuItems = [
    {
      key: 'personal' as ProfileSection,
      label: 'Thông tin cá nhân',
      icon: <Person />,
    },
    {
      key: 'security' as ProfileSection,
      label: 'Bảo mật',
      icon: <Security />,
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'personal':
        return <PersonalInfo />;
      case 'security':
        return <SecuritySettings />;
      default:
        return <PersonalInfo />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: 'text.primary' }}>
          Hồ sơ cá nhân
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Sidebar */}
          <Box sx={{ width: { xs: '100%', md: '300px' }, flexShrink: 0 }}>
            <Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
              <List sx={{ p: 0 }}>
                {menuItems.map((item, index) => (
                  <React.Fragment key={item.key}>
                    <ListItem disablePadding>
                      <ListItemButton
                        selected={activeSection === item.key}
                        onClick={() => setActiveSection(item.key)}
                        sx={{
                          py: 2,
                          px: 3,
                          '&.Mui-selected': {
                            backgroundColor: 'primary.main',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'primary.dark',
                            },
                            '& .MuiListItemIcon-root': {
                              color: 'white',
                            },
                          },
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            color: activeSection === item.key ? 'white' : 'text.secondary',
                            minWidth: 40,
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontWeight: activeSection === item.key ? 600 : 400,
                            fontSize: '0.95rem',
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                    {index < menuItems.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1 }}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ p: 4 }}>
                {renderContent()}
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </div>
  );
}
