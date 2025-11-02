import { Outlet } from "react-router-dom";
import { Box, Container } from "@mui/material";

export default function AssessorLayout() {
  // Layout without sidebar for assessor dashboard
  return (
    <Box
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      bgcolor={(t) => t.palette.background.default}
    >
      <Box component="main" flexGrow={1} overflow="auto">
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
