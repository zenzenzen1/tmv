import { Route, Routes, Navigate } from "react-router-dom";
import "./App.css";
import { useIsAuthenticated, useAuthStore } from "./stores/authStore";

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
import TournamentListPage from "./pages/tournament/ListPage";
import CompetitionFormPage from "./pages/tournament/CompetitionFormPage";
import FormResults from "./features/tournament/FormResults";
import FormBuilder from "./features/tournament/FormBuilder";
import PublishedForm from "./features/tournament/PublishedForm";
import TournamentFormList from "./features/tournament/TournamentFormList";
import AthleteManagementWrapper from "./pages/athletes/AthleteManagementWrapper";

import MemberManagementListPage from "./pages/member-management/ListPage";

import MainLayout from "./components/layout/MainLayout";
import { ToastProvider } from "./components/common/ToastProvider";
import WeightClassListPage from "./pages/weight-class/ListPage";
import FistContentListPage from "./pages/fist-content/ListPage";
import MusicContentListPage from "./pages/music-content/ListPage";
import BracketBuilder from "./pages/brackets/BracketBuilder";
import FistItemsPage from "./pages/fist-content/ItemsPage";
import ArrangeOrderWrapper from "./pages/arrange/ArrangeOrderWrapper";
import MatchScoringPage from "./pages/scoring/MatchScoringPage";
import SelectMatchPage from "./pages/scoring/SelectMatchPage";
import AssessorPage from "./pages/scoring/AssessorPage";
import AssignAssessorsPage from "./pages/scoring/AssignAssessorsPage";
import UserManagementPage from "./pages/user-management/UserManagementPage";
import RegisterPage from "./pages/auth/RegisterPage";

export default function App() {
  const isAuthenticated = useIsAuthenticated();

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

  // Nếu đã login → hiển thị layout chính
  return (
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      {/* Auth */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/manage/tournaments" replace />
          ) : (
            <LoginPage />
          )
        }
      />

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

      {/* Landing redirect */}
      <Route
        path="/"
        element={
          <Navigate
            to={isAuthenticated ? "/manage/tournaments" : "/login"}
            replace
          />
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
        <Route index element={<Navigate to="tournaments" replace />} />

        {/* Dashboard/Home (optional) */}
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="home" element={<Home />} />

        {/* Tournaments */}
        <Route path="tournaments" element={<TournamentListPage />} />
        <Route path="tournaments/create" element={<CompetitionFormPage />} />
        <Route path="tournaments/edit/:id" element={<CompetitionFormPage />} />
        <Route path="tournaments/view/:id" element={<CompetitionFormPage />} />

        {/* Forms */}
        <Route path="form-list" element={<FormListPage />} />
        <Route path="forms" element={<FormListPage />} />
        <Route path="forms/new" element={<FormBuilderPage />} />
        <Route path="forms/:id/edit" element={<FormEditPage />} />
        <Route path="forms/:id/view" element={<FormRegistrationPage />} />
        <Route path="forms/:id/fill" element={<PublishedForm />} />
        <Route path="submitted-forms" element={<SubmittedFormsPage />} />
        <Route path="results/:id" element={<FormResults />} />
        <Route path="tournament-forms" element={<TournamentFormList />} />

        {/* Athletes */}
        <Route path="athletes" element={<AthleteManagementWrapper />} />
        <Route
          path="athletes/fighting"
          element={<AthleteManagementWrapper />}
        />
        <Route path="athletes/quyen" element={<AthleteManagementWrapper />} />
        <Route path="athletes/music" element={<AthleteManagementWrapper />} />

        {/* Content mgmt */}
        <Route path="weight-class" element={<WeightClassListPage />} />
        <Route path="fist-content" element={<FistContentListPage />} />
        <Route path="fist-content/:id/items" element={<FistItemsPage />} />
        <Route path="music-content" element={<MusicContentListPage />} />
        <Route path="brackets" element={<BracketBuilder />} />

        {/* Scoring */}
        <Route path="scoring" element={<SelectMatchPage />} />
        <Route path="scoring/:matchId" element={<MatchScoringPage />} />
        <Route path="scoring/:matchId/assessor" element={<AssessorPage />} />
        <Route path="scoring/assign-assessors" element={<AssignAssessorsPage />} />
        <Route path="scoring/assign-assessors/:matchId" element={<AssignAssessorsPage />} />

        {/* Arrange */}
        <Route path="arrange" element={<ArrangeOrderWrapper />} />
        <Route path="arrange/fist-order" element={<ArrangeOrderWrapper />} />

        {/* Tournament Forms - Merge: Routes from HEAD branch */}
        <Route path="tournament-forms" element={<TournamentFormList />} />
        <Route path="tournament-forms/new" element={<FormBuilder />} />
        <Route path="tournament-forms/:id/edit" element={<FormBuilder />} />

        {/* User Management - Merge: Route from master branch */}
        <Route path="users" element={<UserManagementPage />} />
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
        element={<Navigate to="/manage/arrange" replace />}
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
      <Route path="/results/:id" element={<FormResults />} />
      <Route path="/published-form/:id" element={<PublishedForm />} />
      <Route path="/scoring" element={<SelectMatchPage />} />
      <Route path="/scoring/:matchId" element={<MatchScoringPage />} />
      <Route path="/scoring/:matchId/assessor" element={<AssessorPage />} />
      {/* 404 */}
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}
