import "./App.css";
import { Route, Routes, Navigate } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Footer from "./components/layout/Footer";
import WeightClassListPage from "./pages/weight-class/ListPage";
import SubmittedFormsPage from "./pages/submitted-forms/ListPage";
import FormListPage from "./pages/forms/ListPage";
import FormBuilderPage from "./pages/forms/BuilderPage";
import FormEditPage from "./pages/forms/EditPage";
import FormRegistrationPage from "./pages/forms/RegistrationPage";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/weight-classes" element={<WeightClassListPage />} />
            <Route path="/submitted-forms" element={<SubmittedFormsPage />} />
            <Route path="/formList" element={<FormListPage />} />
            <Route path="/forms" element={<FormListPage />} />
            <Route path="/forms/new" element={<FormBuilderPage />} />
            <Route path="/forms/:id/edit" element={<FormEditPage />} />
            <Route path="/forms/:id/view" element={<FormRegistrationPage />} />
            <Route path="/register/:id" element={<FormRegistrationPage />} />
            <Route path="/" element={<Navigate to="/weight-classes" replace />} />
            <Route path="*" element={<div>404 Not Found</div>} />
          </Routes>
          <Footer />
        </main>
      </div>
    </div>
  );
}
