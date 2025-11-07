import { Box, Typography, Button, Container, Paper, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  SportsMartialArts, 
  EmojiEvents, 
  Groups, 
  Security,
  Speed,
  Sync,
  Shield
} from '@mui/icons-material';
import heroSectionImage from '../assets/herosection.jpg';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <SportsMartialArts sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Quản lý Giải đấu',
      description: 'Tổ chức và quản lý các giải đấu Vovinam một cách chuyên nghiệp và hiệu quả'
    },
    {
      icon: <EmojiEvents sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Theo dõi Thành tích',
      description: 'Ghi nhận và theo dõi thành tích của vận động viên một cách minh bạch và chính xác'
    },
    {
      icon: <Groups sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Quản lý CLB',
      description: 'Quản lý thành viên, hoạt động và các sự kiện của CLB Vovinam FPTU'
    },
    {
      icon: <Security sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Bảo mật Cao',
      description: 'Hệ thống được bảo vệ với các biện pháp bảo mật tiên tiến, đảm bảo an toàn dữ liệu'
    }
  ];

  const benefits = [
    {
      icon: <Speed sx={{ fontSize: 32, color: '#10b981' }} />,
      title: 'Nhanh chóng',
      description: 'Truy cập và tra cứu thông tin tức thì, 24/7'
    },
    {
      icon: <Sync sx={{ fontSize: 32, color: '#10b981' }} />,
      title: 'Đồng bộ',
      description: 'Thông tin được cập nhật và đồng bộ nhất quán'
    },
    {
      icon: <Shield sx={{ fontSize: 32, color: '#10b981' }} />,
      title: 'An toàn',
      description: 'Bảo vệ dữ liệu người dùng với tiêu chuẩn cao nhất'
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: `url(${heroSectionImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.5))',
            backdropFilter: 'blur(1px)',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 8 }}>
          <Box
            sx={{
              textAlign: 'center',
              color: 'white',
              maxWidth: '900px',
              mx: 'auto',
            }}
          >
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 700,
                mb: 3,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                lineHeight: 1.2,
              }}
            >
              Chào mừng đến với Hệ thống Quản lý CLB Vovinam FPTU
            </Typography>
            <Typography
              variant="h5"
              sx={{
                mb: 2,
                fontSize: { xs: '1.1rem', md: '1.5rem' },
                textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)',
                opacity: 0.95,
              }}
            >
              Hệ thống quản lý giải đấu, thành tích và hoạt động CLB Vovinam toàn diện
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mb: 4,
                fontSize: { xs: '1rem', md: '1.2rem' },
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                opacity: 0.9,
                maxWidth: '800px',
                mx: 'auto',
              }}
            >
              Chúng tôi mang đến một nền tảng giúp tổ chức giải đấu một cách chuyên nghiệp, 
              dễ dàng theo dõi thành tích của vận động viên và quản lý các hoạt động nội bộ của CLB.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  boxShadow: '0 8px 20px rgba(14, 165, 233, 0.4)',
                  '&:hover': {
                    boxShadow: '0 12px 24px rgba(14, 165, 233, 0.5)',
                  },
                }}
              >
                Đăng nhập
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
            Tính năng nổi bật
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '700px', mx: 'auto' }}>
            Khám phá những tính năng mạnh mẽ giúp quản lý CLB Vovinam hiệu quả hơn
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 4,
          }}
        >
          {features.map((feature, index) => (
            <Paper
              key={index}
              elevation={2}
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                borderRadius: 3,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <Box sx={{ mb: 2 }}>{feature.icon}</Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {feature.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {feature.description}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>

      {/* Benefits Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
    

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(3, 1fr)',
              },
              gap: 4,
            }}
          >
            {benefits.map((benefit, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  gap: 2,
                  p: 3,
                  bgcolor: 'white',
                  borderRadius: 2,
                  boxShadow: 1,
                }}
              >
                <Box sx={{ flexShrink: 0 }}>{benefit.icon}</Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {benefit.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {benefit.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Paper
          elevation={3}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(124, 58, 237, 0.1))',
          }}
        >
          <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
            Sẵn sàng bắt đầu?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}>
            Tham gia cùng chúng tôi để trải nghiệm hệ thống quản lý CLB Vovinam tốt nhất
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
              }}
            >
              Đăng nhập
            </Button>
          </Stack>
        </Paper>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.900', color: 'grey.300', py: 4, mt: 'auto' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">
              © {new Date().getFullYear()} FVCMS - Hệ thống Quản lý CLB Vovinam FPTU
            </Typography>
            <Typography variant="body2">
              Hỗ trợ: contact@fvcms.com
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

