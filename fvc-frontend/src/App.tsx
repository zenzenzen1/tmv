import { Route, Routes } from "react-router-dom";
import "./App.css";
// import { useIsAuthenticated } from "./stores/authStore";
import MainLayout from "./components/layout/MainLayout";

// Pages
// import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import SubmittedFormsPage from "./pages/submitted-forms/ListPage";
import FormListPage from "./pages/forms/ListPage";
import FormBuilderPage from "./pages/forms/BuilderPage";
import FormEditPage from "./pages/forms/EditPage";
import FormRegistrationPage from "./pages/forms/RegistrationPage";

import Home from "./pages/Home";
import TournamentListPage from "./pages/tournament/ListPage";
import CompetitionFormPage from "./pages/tournament/CompetitionFormPage";
import TournamentManage from "./pages/tournament/TournamentManagement";
import FormResults from "./features/tournament/FormResults";
import FormBuilder from "./features/tournament/FormBuilder";
import PublishedForm from "./features/tournament/PublishedForm";
import AthleteManagementWrapper from "./pages/athletes/AthleteManagementWrapper";

export default function App() {
  // const isAuthenticated = useIsAuthenticated();

  // If not authenticated → redirect to /login
  // If authenticated → show main layout
  // if (!isAuthenticated) {
  //   return (
  //     <Routes>
  //       <Route path="/login" element={<LoginPage />} />
  //       <Route path="*" element={<Navigate to="/login" replace />} />
  //     </Routes>
  //   );
  // }

  // If authenticated → show main layout
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/submitted-forms" element={<SubmittedFormsPage />} />
        <Route path="/formList" element={<FormListPage />} />
        <Route path="/forms" element={<FormListPage />} />
        <Route path="/forms/new" element={<FormBuilderPage />} />
        <Route path="/forms/:id/edit" element={<FormEditPage />} />
        <Route path="/forms/:id/view" element={<FormRegistrationPage />} />
        <Route path="/register/:id" element={<FormRegistrationPage />} />
        <Route path="/" element={<Home />} />

        {/* Tournaments */}
        <Route path="/tournaments" element={<TournamentListPage />} />
        <Route path="/tournaments/create" element={<CompetitionFormPage />} />
        <Route path="/tournaments/edit/:id" element={<CompetitionFormPage />} />
        <Route path="/tournaments/view/:id" element={<CompetitionFormPage />} />
        <Route path="/manage" element={<TournamentManage />} />

        {/* Form */}
        <Route path="/results/:id" element={<FormResults />} />
        <Route path="/form-builder" element={<FormBuilder />} />
        <Route path="/form-builder/:id" element={<FormBuilder />} />
        <Route path="/forms/:id/fill" element={<PublishedForm />} />

        {/* Athletes Management */}
        <Route path="/athletes" element={<AthleteManagementWrapper />} />
        <Route path="/athletes/fighting" element={<AthleteManagementWrapper />} />
        <Route path="/athletes/quyen" element={<AthleteManagementWrapper />} />
        <Route path="/athletes/music" element={<AthleteManagementWrapper />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}
