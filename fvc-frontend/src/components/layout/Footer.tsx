import { Box, Container, Typography, Divider } from '@mui/material';

export default function Footer() {
  return (
    <Box component="footer" sx={{ py: 6, color: 'common.white', background: 'linear-gradient(135deg, #74a6ff, #4d7dff, #2b57ff)' }}>
      <Container maxWidth="md">
        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>FPTU Vovinam CMS</Typography>
        <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
          Nền tảng quản lý giải đấu & CLB Vovinam toàn diện.
        </Typography>
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap={3}>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>Liên kết</Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2, m: 0, opacity: 0.9 }}>
              <li>Trang chủ</li>
              <li>Giải đấu</li>
              <li>Đăng ký</li>
              <li>Kết quả</li>
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>Hỗ trợ</Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2, m: 0, opacity: 0.9 }}>
              <li>Tài liệu</li>
              <li>FAQ</li>
              <li>Liên hệ</li>
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>Theo dõi</Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2, m: 0, opacity: 0.9 }}>
              <li>Facebook</li>
              <li>YouTube</li>
            </Box>
          </Box>
        </Box>
        <Divider sx={{ mt: 4, borderColor: 'rgba(255,255,255,0.3)' }} />
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 2, opacity: 0.8 }}>
          © 2025 FPTU Vovinam CMS. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
