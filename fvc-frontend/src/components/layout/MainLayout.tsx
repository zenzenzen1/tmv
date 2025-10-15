import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import { defaultMenuItems } from "@/components/layout/sidebarMenu";
import { Box, Container } from "@mui/material";

export default function MainLayout() {
  const location = useLocation();

  // derive active menu from path
  const path = location.pathname;
  let activeKey: string | undefined;
  if (path.startsWith("/submitted-forms")) activeKey = "submittedForms";
  else if (path.startsWith("/formList") || path.startsWith("/forms")) activeKey = "formList";
  else activeKey = undefined;

  return (
    <Box display="flex" height="100vh" width="100vw" overflow="hidden" bgcolor={(t) => t.palette.background.default}>
      <Sidebar activeMenu={activeKey} menuItems={defaultMenuItems} />
      <Box display="flex" flexDirection="column" flexGrow={1} minHeight="100vh" sx={{ ml: '256px' }}>
        <Box component="main" flexGrow={1} overflow="auto">
          <Container maxWidth="lg" sx={{ py: 3 }}>
            <Outlet />
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
