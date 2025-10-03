import "./App.css";
import { Route, Routes, Navigate } from "react-router-dom";

import Sidebar from "./components/layout/Sidebar";
import Footer from "./components/layout/Footer";

import WeightClassListPage from "./pages/weight-class/ListPage";
import FistContentListPage from "./pages/fist-content/ListPage";
import MusicContentListPage from "./pages/music-content/ListPage";

import TournamentManage from "./pages/tournament/TournamentManagement";
import FormResults from "./features/tournament/FormResults";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6">
          <Routes>

            <Route path="/weight-class" element={<WeightClassListPage />} />
            <Route path="/fist-content" element={<FistContentListPage />} />
            <Route path="/music-content" element={<MusicContentListPage />} />


            <Route path="/manage" element={<TournamentManage />} />
            <Route path="/results/:id" element={<FormResults />} />

            <Route path="*" element={<div>404 Not Found</div>} />
          </Routes>
          <Footer />
        </main>
      </div>
    </div>
  );
}

