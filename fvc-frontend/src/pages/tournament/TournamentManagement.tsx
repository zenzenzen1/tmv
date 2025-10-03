import Footer from "@/components/layout/Footer";
import TournamentSidebar from "@/components/layout/Sidebar";
import { useState } from "react";
import WeightClassListPage from "../weight-class/ListPage";
import TournamentFormList from "@/features/tournament/TournamentFormList";

export default function TournamentManage() {
  const [activeMenu, setActiveMenu] = useState<string>("tournamentForm");
  const contentWeightClass = <WeightClassListPage />;
  const contentTournamentForm = <TournamentFormList />;

  const placeholder = (title: string) => (
    <div className="px-6 py-10 text-sm text-gray-600">{title}</div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F6FF] to-[#E0EAFF] grid grid-cols-[16rem_1fr] grid-rows-[1fr_auto] items-stretch">
      <div className="row-span-2 h-full">
        <TournamentSidebar activeMenu={activeMenu} onChange={setActiveMenu} />
      </div>
      <div className="flex flex-col">
        {activeMenu === "weightClassPage" && contentWeightClass}
        {activeMenu === "tournamentForm" && contentTournamentForm}
        {activeMenu === "tournaments" && placeholder("Danh sách giải đấu")}
        {activeMenu === "athletes" && placeholder("Quản lí VDV")}
        {activeMenu === "fighting" && placeholder("Đối kháng")}
        {activeMenu === "forms" && placeholder("Quyền")}
        {activeMenu === "music" && placeholder("Võ nhạc")}
      </div>
      <div className="col-span-2">
        <Footer />
      </div>
    </div>
  );
}
