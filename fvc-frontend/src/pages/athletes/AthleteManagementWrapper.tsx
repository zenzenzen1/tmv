import { useState } from "react";
import AthleteManagementPage from "./AthleteManagementPage";

type CompetitionType = "fighting" | "quyen" | "music";

export default function AthleteManagementWrapper() {
  const [activeTab, setActiveTab] = useState<CompetitionType>("fighting"); // Set to 'fighting' as default

  const handleTabChange = (tab: CompetitionType) => {
    setActiveTab(tab);
  };

  return (
    <div className="m-6">
      <AthleteManagementPage
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
}
