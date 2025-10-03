import "./App.css";
import { Route, Routes } from "react-router-dom";

import TournamentManage from "./pages/tournament/TournamentManagement";
import FormResults from "./features/tournament/FormResults";
import FormBuilder from "./features/tournament/FormBuilder";

export default function App() {
  return (
    <Routes>
      <Route path="*" element={<div>404 Not Found</div>} />
      <Route path="/manage" element={<TournamentManage />} />
      <Route path="/results/:id" element={<FormResults />} />
      <Route path="/form-builder" element={<FormBuilder />} />
      <Route path="/form-builder/:id" element={<FormBuilder />} />
    </Routes>
  );
}
