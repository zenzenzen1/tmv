import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import { getMenuItemsByRole } from "@/components/layout/sidebarMenu";
import { Box, Container } from "@mui/material";
import Header from "@/components/common/Header";
import { useAuth } from "@/stores/authStore";
import type { SystemRole } from "@/types/user";

export default function MainLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const role: SystemRole | undefined =
    user?.systemRole &&
    (["MEMBER", "TEACHER", "EXECUTIVE_BOARD", "ORGANIZATION_COMMITTEE", "ADMIN"] as const).includes(
      user.systemRole as SystemRole
    )
      ? (user.systemRole as SystemRole)
      : undefined;

  // derive active menu from path
  const path = location.pathname;
  let activeKey: string | undefined;
  if (path.startsWith("/submitted-forms")) activeKey = "submittedForms";
  else if (path.startsWith("/formList") || path.startsWith("/forms"))
    activeKey = "formList";
  else if (path.startsWith("/tournament-forms")) activeKey = "tournamentForm";
  else activeKey = undefined;

  return (
    <Box
      display="flex"
      height="100vh"
      width="100vw"
      overflow="hidden"
      bgcolor={(t) => t.palette.background.default}
    >
      <Sidebar activeMenu={activeKey} menuItems={getMenuItemsByRole(role)} />
      {/* Merge: Include Header component from master branch, preserve styling from HEAD */}
      <Box
        display="flex"
        flexDirection="column"
        flexGrow={1}
        minHeight="100vh"
        sx={{ ml: "256px" }}
      >
        <Header />
        <Box component="main" flexGrow={1} overflow="auto">
          <Container maxWidth="lg" sx={{ py: 3 }}>
            <Outlet />
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
