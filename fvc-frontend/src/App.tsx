import "./App.css";
import { Route, Routes, Navigate } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Footer from "./components/layout/Footer";
import WeightClassListPage from "./pages/weight-class/ListPage";
import SubmittedFormsPage from "./pages/submitted-forms/ListPage";
import FormEditPage from "./pages/forms/EditPage";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/weight-classes" element={<WeightClassListPage />} />
            <Route path="/submitted-forms" element={<SubmittedFormsPage />} />
            <Route path="/forms/member/edit" element={<FormEditPage />} />
            <Route path="/" element={<Navigate to="/weight-classes" replace />} />
            <Route path="*" element={<div>404 Not Found</div>} />
          </Routes>
          <Footer />
        </main>
      </div>
    </div>
  );
}
