import { Outlet } from "react-router-dom";
import { Box, Container } from "@mui/material";
import Header from "@/components/common/Header";

export default function AssessorLayout() {
  // Layout without sidebar for assessor dashboard
  return (
    <Box
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      bgcolor={(t) => t.palette.background.default}
    >
      <Header title="Khu vực giám định" />

      <Box component="main" flexGrow={1} overflow="auto">
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
