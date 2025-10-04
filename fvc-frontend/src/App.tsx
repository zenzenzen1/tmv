import "./App.css";
import { Route, Routes } from "react-router-dom";

import Sidebar from "./components/layout/Sidebar";
import Footer from "./components/layout/Footer";

import WeightClassListPage from "./pages/weight-class/ListPage";
import FistContentListPage from "./pages/fist-content/ListPage";
import MusicContentListPage from "./pages/music-content/ListPage";

import TournamentListPage from "./pages/tournament/ListPage";
import CompetitionFormPage from "./pages/tournament/CompetitionFormPage";
import TournamentManage from "./pages/tournament/TournamentManagement";
import FormResults from "./features/tournament/FormResults";
import FormBuilder from "./features/tournament/FormBuilder";
import PublishedForm from "./features/tournament/PublishedForm";
import Home from "./pages/Home";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6">
          <Routes>

            <Route path="/weight-classes" element={<WeightClassListPage />} />
            <Route path="/fist-contents" element={<FistContentListPage />} />
            <Route path="/music-contents" element={<MusicContentListPage />} />

            <Route path="/" element={<Home />} />
            <Route path="/tournaments" element={<TournamentListPage />} />
            <Route path="/tournaments/create" element={<CompetitionFormPage />} />
            <Route path="/tournaments/edit/:id" element={<CompetitionFormPage />} />
            <Route path="/tournaments/view/:id" element={<CompetitionFormPage />} />
            <Route path="/manage" element={<TournamentManage />} />
            <Route path="/results/:id" element={<FormResults />} />
            <Route path="/form-builder" element={<FormBuilder />} />
            <Route path="/form-builder/:id" element={<FormBuilder />} />
            <Route path="/forms/:id/fill" element={<PublishedForm />} />

            <Route path="*" element={<div>404 Not Found</div>} />
          </Routes>
          <Footer />
        </main>
      </div>
    </div>
  );
}

