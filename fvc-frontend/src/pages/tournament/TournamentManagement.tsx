import Footer from "@/components/layout/Footer";
import TournamentSidebar from "@/components/layout/Sidebar";
import { useState } from "react";
import WeightClassListPage from "../weight-class/ListPage";
import TournamentFormList from "@/features/tournament/TournamentFormList";
import TournamentListPage from "./ListPage";
import FistContentListPage from "../fist-content/ListPage";
import MusicContentListPage from "../music-content/ListPage";
import AthleteManagementWrapper from "../athletes/AthleteManagementWrapper";
import SubmittedFormsPage from "../submitted-forms/ListPage";

export default function TournamentManage() {
  const [activeMenu, setActiveMenu] = useState<string>("tournamentForm");
  const contentWeightClass = <WeightClassListPage />;
  const contentTournamentForm = <TournamentFormList />;
  const contentTournament = <TournamentListPage />;
  const contentAthletes = <AthleteManagementWrapper />;
  const contentFist = <FistContentListPage />;
  const contentMusic = <MusicContentListPage />;
  const contentSubmittedForms = <SubmittedFormsPage />;

  const placeholder = (title: string) => (
    <div className="px-6 py-10 text-sm text-gray-600">{title}</div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F6FF] to-[#E0EAFF] grid grid-cols-[16rem_1fr] grid-rows-[1fr_auto] items-stretch">
      <div className="row-span-2 h-full">
        <TournamentSidebar activeMenu={activeMenu} onChange={setActiveMenu} />
      </div>
      <div className="flex flex-col h-full">
        {activeMenu === "weightClassPage" && contentWeightClass}
        {activeMenu === "tournamentForm" && contentTournamentForm}
        {activeMenu === "tournaments" && contentTournament}
        {activeMenu === "athletes" && contentAthletes}
        {activeMenu === "fighting" && placeholder("Đối kháng")}
        {activeMenu === "forms" && contentFist}
        {activeMenu === "music" && contentMusic}
        {activeMenu === "submittedForms" && contentSubmittedForms}
      </div>
      <div className="col-span-2">
        <Footer />
      </div>
    </div>
  );
}
