import "./App.css";
import { Route, Routes } from "react-router-dom";

import TournamentManage from "./pages/tournament/TournamentManagement";

export default function App() {
  return (
    <Routes>
      S <Route path="*" element={<div>404 Not Found</div>} />
      <Route path="/manage" element={<TournamentManage />} />
    </Routes>
  );
}
