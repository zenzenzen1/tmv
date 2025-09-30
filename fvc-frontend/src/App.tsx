import { Route, Routes, Navigate } from "react-router-dom";
import "./App.css";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import { useIsAuthenticated } from "./stores/authStore";

function App() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
