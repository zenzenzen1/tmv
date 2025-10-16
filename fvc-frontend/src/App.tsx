import { Route, Routes, Navigate } from "react-router-dom";
import "./App.css";
import { useIsAuthenticated } from "./stores/authStore";

// Pages
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import SubmittedFormsPage from "./pages/submitted-forms/ListPage";
import FormListPage from "./pages/forms/ListPage";
import FormBuilderPage from "./pages/forms/BuilderPage";
import FormEditPage from "./pages/forms/EditPage";
import FormRegistrationPage from "./pages/forms/RegistrationPage";

import Home from "./pages/Home";
import TournamentListPage from "./pages/tournament/ListPage";
import CompetitionFormPage from "./pages/tournament/CompetitionFormPage";
import FormResults from "./features/tournament/FormResults";
// import FormBuilder from "./features/tournament/FormBuilder";
import PublishedForm from "./features/tournament/PublishedForm";
import TournamentFormList from "./features/tournament/TournamentFormList";
import AthleteManagementWrapper from "./pages/athletes/AthleteManagementWrapper";

import MemberManagementListPage from "./pages/member-management/ListPage";

import MainLayout from "./components/layout/MainLayout";
import { ToastProvider } from "./components/common/ToastProvider";
import WeightClassListPage from "./pages/weight-class/ListPage";
import FistContentListPage from "./pages/fist-content/ListPage";
import MusicContentListPage from "./pages/music-content/ListPage";
import FistItemsPage from "./pages/fist-content/ItemsPage";
import ArrangeOrderWrapper from "./pages/arrange/ArrangeOrderWrapper";
import FormBuilder from "./features/tournament/FormBuilder";

export default function App() {
  const isAuthenticated = useIsAuthenticated();

  function Protected({ children }: { children: React.ReactElement }) {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  }

  // Nếu đã login → hiển thị layout chính
  return (
    <Routes>
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

        {/* Arrange */}
        <Route path="arrange" element={<ArrangeOrderWrapper />} />
        <Route path="arrange/fist-order" element={<ArrangeOrderWrapper />} />
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
      <Route path="/form-builder" element={<FormBuilder />} />
      <Route path="/form-builder/:id" element={<FormBuilder />} />
      <Route path="/results/:id" element={<FormResults />} />
      <Route path="/published-form/:id" element={<PublishedForm />} />

      {/* 404 */}
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}
