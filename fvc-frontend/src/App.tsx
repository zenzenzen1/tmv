import { Route, Routes, Navigate } from "react-router-dom";
import "./App.css";
import { useIsAuthenticated, useAuthStore } from "./stores/authStore";
import { getRoleLandingRoute, getManageIndexRoute } from "./utils/roleRouting";
import type { SystemRole } from "@/types/user";

// Pages
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/profile/ProfilePage";
import ProfileLayout from "./components/layout/ProfileLayout";
import SubmittedFormsPage from "./pages/submitted-forms/ListPage";
import FormListPage from "./pages/forms/ListPage";
import FormBuilderPage from "./pages/forms/BuilderPage";
import FormEditPage from "./pages/forms/EditPage";
import FormRegistrationPage from "./pages/forms/RegistrationPage";

import Home from "./pages/Home";
import LandingPage from "./pages/LandingPage";
import TournamentListPage from "./pages/tournament/ListPage";
import CompetitionFormPage from "./pages/tournament/CompetitionFormPage";
import FormBuilder from "./features/tournament/FormBuilder";
import PublishedForm from "./features/tournament/PublishedForm";
import TournamentFormList from "./features/tournament/TournamentFormList";
import TournamentFormViewPage from "./features/tournament/TournamentFormViewPage";
import ResultsListPage from "./features/tournament/ResultsListPage";
import AthleteManagementWrapper from "./pages/athletes/AthleteManagementWrapper";

import MemberManagementListPage from "./pages/member-management/ListPage";

import MainLayout from "./components/layout/MainLayout";
import { ToastProvider } from "./components/common/ToastProvider";
import WeightClassListPage from "./pages/weight-class/ListPage";
import FistContentListPage from "./pages/fist-content/ListPage";
import MusicContentListPage from "./pages/music-content/ListPage";
import FistItemsPage from "./pages/fist-content/ItemsPage";
import ArrangeOrderWrapper from "./pages/arrange/ArrangeOrderWrapper";
import BracketBuilder from "./pages/brackets/BracketBuilder";
import BracketViewPage from "./pages/brackets/BracketViewPage";
import MatchScoringPage from "./pages/scoring/MatchScoringPage";
import SelectMatchPage from "./pages/scoring/SelectMatchPage";
import MatchListPage from "./pages/scoring/MatchListPage";
import AssessorPage from "./pages/scoring/AssessorPage";
import AssignAssessorsPage from "./pages/scoring/AssignAssessorsPage";
import ProjectionScreen from "./pages/performance/ProjectionScreen";
import JudgeScoringScreen from "./pages/performance/JudgeScoringScreen";
import PerformanceResultScreen from "./pages/performance/PerformanceResultScreen";
import JudgeDashboard from "./pages/judge/JudgeDashboard";
import AssessorLayout from "./components/layout/AssessorLayout";
import MatchManagementPage from "./pages/scoring/MatchManagementPage";
import UserManagementPage from "./pages/user-management/UserManagementPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import FieldManagementPage from "./pages/field-management/FieldManagementPage";
import RequireRole from "./components/common/RequireRole";
import SelectPerformanceMatchPage from "./pages/performance/SelectPerformanceMatchPage";
import CycleList from "./pages/cycles/CycleList";
import CycleDetail from "./pages/cycles/CycleDetail";
import CycleCreate from "./pages/cycles/CycleCreate";
import LocationListPage from "./pages/locations/ListPage";
import TrainingSessionListPage from "./pages/training-sessions/ListPage";
import TrainingSessionCalendarPage from "./pages/training-sessions/CalendarPage";
import TrainingSessionCreatePage from "./pages/training-sessions/CreatePage";

export default function App() {
  const isAuthenticated = useIsAuthenticated();
  const userRole = useAuthStore(
    (state) => (state.user?.systemRole as SystemRole | null) ?? null
  );

  function Protected({ children }: { children: React.ReactElement }) {
    // Wait for hydration to complete
    const isLoading = useAuthStore((state) => state.isLoading);

    if (isLoading) {
      return <div>Loading...</div>; // Or a proper loading component
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  }

  function AssessorProtected({ children }: { children: React.ReactElement }) {
    const user = useAuthStore((state) => state.user);
    const isAssessor = user?.systemRole === "TEACHER";
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    if (!isAssessor) {
      return <Navigate to="/manage/tournaments" replace />;
    }
    return children;
  }

  function ManageIndexRedirect({ role }: { role: SystemRole | null }) {
    const target = getManageIndexRoute(role);
    const to = target.startsWith("/") ? target : `/manage/${target}`;
    return <Navigate to={to} replace />;
  }

  // Nếu đã login → hiển thị layout chính
  return (
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      {/* Auth */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={getRoleLandingRoute(userRole)} replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route path="/forgot" element={<ForgotPasswordPage />} />

      {/* Profile page with its own layout */}
      <Route
        path="/profile"
        element={
          <Protected>
            <ProfileLayout />
          </Protected>
        }
      >
        <Route index element={<ProfilePage />} />
      </Route>

      {/* Landing page */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            // <Navigate to="/manage/tournaments" replace />
            <Navigate to={getRoleLandingRoute(userRole)} replace />
          ) : (
            <LandingPage />
          )
        }
      />
      {/* Member Management */}
      <Route path="/member-management" element={<MemberManagementListPage />} />
      {/* Tournaments */}
      <Route path="/tournaments" element={<TournamentListPage />} />
      <Route path="/tournaments/create" element={<CompetitionFormPage />} />
      <Route path="/tournaments/edit/:id" element={<CompetitionFormPage />} />
      <Route path="/tournaments/view/:id" element={<CompetitionFormPage />} />

      {/* Public Home */}
      <Route path="/home" element={<Home />} />
      <Route path="dashboard" element={<DashboardPage />} />

      {/* PERFORMANCE PUBLIC */}
      <Route path="/performance/projection" element={<ProjectionScreen />} />
      <Route path="/performance/judge" element={<JudgeScoringScreen />} />
      <Route path="/performance/result" element={<PerformanceResultScreen />} />
      {/* Public Form Registration - Guest access */}
      <Route path="/public/forms/:slug" element={<FormRegistrationPage />} />

      {/* Protected app routes under /manage */}
      <Route
        path="/manage"
        element={
          <Protected>
            <ToastProvider>
              <MainLayout />
            </ToastProvider>
          </Protected>
        }
      >
        {/* default */}
        <Route index element={<ManageIndexRedirect role={userRole} />} />

        {/* Dashboard/Home (optional) */}
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="home" element={<Home />} />

        {/* Tournaments */}
        <Route
          path="tournaments"
          element={
            <RequireRole roles={["EXECUTIVE_BOARD"]}>
              <TournamentListPage />
            </RequireRole>
          }
        />

        {/* Member Management */}
        <Route
          path="member-management"
          element={
            <RequireRole roles={["EXECUTIVE_BOARD"]}>
              <MemberManagementListPage />
            </RequireRole>
          }
        />

        {/* Challenge Cycles */}
        <Route
          path="cycles"
          element={
            <RequireRole roles={["EXECUTIVE_BOARD", "ADMIN"]}>
              <CycleList />
            </RequireRole>
          }
        />
        <Route
          path="cycles/new"
          element={
            <RequireRole roles={["EXECUTIVE_BOARD", "ADMIN"]}>
              <CycleCreate />
            </RequireRole>
          }
        />
        <Route
          path="cycles/:id"
          element={
            <RequireRole roles={["EXECUTIVE_BOARD", "ADMIN"]}>
              <CycleDetail />
            </RequireRole>
          }
        />
        <Route
          path="tournaments/create"
          element={
            <RequireRole roles={["EXECUTIVE_BOARD"]}>
              <CompetitionFormPage />
            </RequireRole>
          }
        />
        <Route
          path="tournaments/edit/:id"
          element={
            <RequireRole roles={["EXECUTIVE_BOARD"]}>
              <CompetitionFormPage />
            </RequireRole>
          }
        />
        <Route
          path="tournaments/view/:id"
          element={
            <RequireRole roles={["EXECUTIVE_BOARD"]}>
              <CompetitionFormPage />
            </RequireRole>
          }
        />

        {/* Forms */}
        <Route
          path="form-list"
          element={
            <RequireRole roles={["EXECUTIVE_BOARD"]}>
              <FormListPage />
            </RequireRole>
          }
        />
        <Route
          path="forms"
          element={
            <RequireRole
              roles={["ADMIN", "EXECUTIVE_BOARD", "ORGANIZATION_COMMITTEE"]}
            >
              <FormListPage />
            </RequireRole>
          }
        />
        <Route
          path="forms/new"
          element={
            <RequireRole
              roles={["ADMIN", "EXECUTIVE_BOARD", "ORGANIZATION_COMMITTEE"]}
            >
              <FormBuilderPage />
            </RequireRole>
          }
        />
        <Route
          path="forms/:id/edit"
          element={
            <RequireRole
              roles={["ADMIN", "EXECUTIVE_BOARD", "ORGANIZATION_COMMITTEE"]}
            >
              <FormEditPage />
            </RequireRole>
          }
        />
        <Route
          path="forms/:id/view"
          element={
            <RequireRole
              roles={["ADMIN", "EXECUTIVE_BOARD", "ORGANIZATION_COMMITTEE"]}
            >
              <FormRegistrationPage />
            </RequireRole>
          }
        />
        <Route
          path="forms/:id/fill"
          element={
            <RequireRole
              roles={["ADMIN", "EXECUTIVE_BOARD", "ORGANIZATION_COMMITTEE"]}
            >
              <PublishedForm />
            </RequireRole>
          }
        />
        <Route
          path="submitted-forms"
          element={
            <RequireRole roles={["EXECUTIVE_BOARD"]}>
              <SubmittedFormsPage />
            </RequireRole>
          }
        />
        <Route
          path="results"
          element={
            <RequireRole roles={["EXECUTIVE_BOARD"]}>
              <ResultsListPage />
            </RequireRole>
          }
        />

        <Route
          path="tournament-forms"
          element={
            <RequireRole roles={["EXECUTIVE_BOARD"]}>
              <TournamentFormList />
            </RequireRole>
          }
        />

        {/* Athletes */}
        <Route
          path="athletes"
          element={
            <RequireRole roles={["EXECUTIVE_BOARD"]}>
              <AthleteManagementWrapper />
            </RequireRole>
          }
        />
        <Route
          path="athletes/fighting"
          element={
            <RequireRole roles={["EXECUTIVE_BOARD"]}>
              <AthleteManagementWrapper />
            </RequireRole>
          }
        />
        <Route
          path="athletes/quyen"
          element={
            <RequireRole roles={["EXECUTIVE_BOARD"]}>
              <AthleteManagementWrapper />
            </RequireRole>
          }
        />
        <Route
          path="athletes/music"
          element={
            <RequireRole roles={["EXECUTIVE_BOARD"]}>
              <AthleteManagementWrapper />
            </RequireRole>
          }
        />

        {/* Content mgmt */}
        <Route
          path="weight-class"
          element={
            <RequireRole roles={["ORGANIZATION_COMMITTEE"]}>
              <WeightClassListPage />
            </RequireRole>
          }
        />
        <Route
          path="field-management"
          element={
            <RequireRole roles={["EXECUTIVE_BOARD"]}>
              <FieldManagementPage />
            </RequireRole>
          }
        />
        <Route
          path="locations"
          element={
            <RequireRole roles={["EXECUTIVE_BOARD", "ADMIN"]}>
              <LocationListPage />
            </RequireRole>
          }
        />
        <Route
          path="training-sessions"
          element={
            <RequireRole roles={["EXECUTIVE_BOARD", "ADMIN"]}>
              <TrainingSessionListPage />
            </RequireRole>
          }
        />
        <Route
          path="training-sessions/new"
          element={
            <RequireRole roles={["EXECUTIVE_BOARD", "ADMIN"]}>
              <TrainingSessionCreatePage />
            </RequireRole>
          }
        />
        <Route
          path="training-sessions/calendar"
          element={
            <RequireRole roles={["EXECUTIVE_BOARD", "ADMIN"]}>
              <TrainingSessionCalendarPage />
            </RequireRole>
          }
        />
        <Route
          path="fist-content"
          element={
            <RequireRole roles={["ORGANIZATION_COMMITTEE"]}>
              <FistContentListPage />
            </RequireRole>
          }
        />
        <Route
          path="fist-content/:id/items"
          element={
            <RequireRole roles={["ORGANIZATION_COMMITTEE"]}>
              <FistItemsPage />
            </RequireRole>
          }
        />
        <Route
          path="music-content"
          element={
            <RequireRole roles={["ORGANIZATION_COMMITTEE"]}>
              <MusicContentListPage />
            </RequireRole>
          }
        />
        <Route
          path="brackets"
          element={
            <RequireRole roles={["EXECUTIVE_BOARD"]}>
              <BracketBuilder />
            </RequireRole>
          }
        />
        <Route
          path="brackets/view"
          element={
            <RequireRole roles={["EXECUTIVE_BOARD"]}>
              <BracketViewPage />
            </RequireRole>
          }
        />

        {/* Scoring */}
        <Route
          path="scoring"
          element={
            <RequireRole roles={["ORGANIZATION_COMMITTEE"]}>
              <SelectMatchPage />
            </RequireRole>
          }
        />
        <Route
          path="scoring/matches"
          element={
            <RequireRole roles={["ORGANIZATION_COMMITTEE", "EXECUTIVE_BOARD"]}>
              <MatchListPage />
            </RequireRole>
          }
        />
        <Route
          path="scoring/:matchId"
          element={
            <RequireRole roles={["ORGANIZATION_COMMITTEE"]}>
              <MatchScoringPage />
            </RequireRole>
          }
        />
        <Route
          path="scoring/:matchId/assessor"
          element={
            <RequireRole roles={["ORGANIZATION_COMMITTEE"]}>
              <AssessorPage />
            </RequireRole>
          }
        />
        <Route
          path="scoring/assign-assessors"
          element={
            <RequireRole roles={["ORGANIZATION_COMMITTEE"]}>
              <AssignAssessorsPage />
            </RequireRole>
          }
        />
        <Route
          path="scoring/assign-assessors/:matchId"
          element={
            <RequireRole roles={["ORGANIZATION_COMMITTEE"]}>
              <AssignAssessorsPage />
            </RequireRole>
          }
        />
        <Route
          path="scoring/:matchId/manage"
          element={
            <RequireRole roles={["ORGANIZATION_COMMITTEE"]}>
              <MatchManagementPage />
            </RequireRole>
          }
        />

        {/* Performance Matches */}
        <Route
          path="performance-matches"
          element={
            <RequireRole roles={["ORGANIZATION_COMMITTEE"]}>
              <SelectPerformanceMatchPage />
            </RequireRole>
          }
        />
        <Route
          path="performance-matches/:matchId/manage"
          element={
            <RequireRole roles={["ORGANIZATION_COMMITTEE"]}>
              <SelectPerformanceMatchPage />
            </RequireRole>
          }
        />

        {/* Arrange */}
        <Route path="performance" element={<ArrangeOrderWrapper />} />
        <Route
          path="performance/fist-order"
          element={<ArrangeOrderWrapper />}
        />
        <Route path="arrange" element={<ArrangeOrderWrapper />} />
        <Route path="arrange/fist-order" element={<ArrangeOrderWrapper />} />

        {/* Tournament Forms - Merge: Routes from HEAD branch */}
        <Route path="tournament-forms" element={<TournamentFormList />} />
        <Route path="tournament-forms/new" element={<FormBuilder />} />
        <Route path="tournament-forms/:id/edit" element={<FormBuilder />} />
        <Route
          path="tournament-forms/:id/view"
          element={<TournamentFormViewPage />}
        />

        {/* User Management - Merge: Route from master branch */}
        <Route
          path="users"
          element={
            <RequireRole roles={["ADMIN"]}>
              <UserManagementPage />
            </RequireRole>
          }
        />
      </Route>

      {/* Assessor Dashboard - Separate route without MainLayout */}
      <Route
        path="/assessor"
        element={
          <AssessorProtected>
            <ToastProvider>
              <AssessorLayout />
            </ToastProvider>
          </AssessorProtected>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<JudgeDashboard />} />
      </Route>

      {/* Legacy redirects to /manage */}
      <Route
        path="/tournaments/*"
        element={<Navigate to="/manage/tournaments" replace />}
      />
      <Route
        path="/athletes/*"
        element={<Navigate to="/manage/athletes" replace />}
      />
      <Route
        path="/arrange/*"
        element={<Navigate to="/manage/performance" replace />}
      />
      <Route
        path="/form-list"
        element={<Navigate to="/manage/form-list" replace />}
      />
      <Route
        path="/submitted-forms"
        element={<Navigate to="/manage/submitted-forms" replace />}
      />
      <Route
        path="/forms/*"
        element={<Navigate to="/manage/forms" replace />}
      />
      <Route
        path="/manage/judge/*"
        element={<Navigate to="/assessor/dashboard" replace />}
      />
      <Route
        path="/assessor/dashboard"
        element={<Navigate to="/assessor/dashboard" replace />}
      />

      <Route path="/published-form/:id" element={<PublishedForm />} />
      <Route path="/scoring" element={<SelectMatchPage />} />
      <Route path="/scoring/:matchId" element={<MatchScoringPage />} />
      <Route path="/scoring/:matchId/assessor" element={<AssessorPage />} />
      {/* 404 */}
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}
