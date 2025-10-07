import { Route, Routes, Navigate } from "react-router-dom";
import "./App.css";
import { useIsAuthenticated } from "./stores/authStore";

// Layout
import Sidebar from "./components/layout/Sidebar";
import Footer from "./components/layout/Footer";

// Pages
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import WeightClassListPage from "./pages/weight-class/ListPage";
import FistContentListPage from "./pages/fist-content/ListPage";
import MusicContentListPage from "./pages/music-content/ListPage";
import Home from "./pages/Home";
import TournamentListPage from "./pages/tournament/ListPage";
import CompetitionFormPage from "./pages/tournament/CompetitionFormPage";
import TournamentManage from "./pages/tournament/TournamentManagement";
import FormResults from "./features/tournament/FormResults";
import FormBuilder from "./features/tournament/FormBuilder";
import PublishedForm from "./features/tournament/PublishedForm";

export default function App() {
  const isAuthenticated = useIsAuthenticated();

  // Nếu chưa login → chuyển sang /login
  // Nếu đã login → hiển thị layout chính
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
        />
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    );
  }

  // Nếu đã login → hiển thị layout chính
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/weight-classes" element={<WeightClassListPage />} />
            <Route path="/fist-contents" element={<FistContentListPage />} />
            <Route path="/music-contents" element={<MusicContentListPage />} />
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

            {/* 404 */}
            <Route path="*" element={<div>404 Not Found</div>} />
          </Routes>
          <Footer />
        </main>
      </div>
    </div>
  );
}
