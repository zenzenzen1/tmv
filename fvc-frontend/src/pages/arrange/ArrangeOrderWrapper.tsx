import { useState } from "react";
import ArrangeOrderPage from "./ArrangeOrderPage";

export type CompetitionType = "quyen" | "music";

export default function ArrangeOrderWrapper() {
  const [activeTab, setActiveTab] = useState<CompetitionType>("quyen");

  const handleTabChange = (tab: CompetitionType) => {
    setActiveTab(tab);
  };

  return (
    <div className="m-6">
      <ArrangeOrderPage
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
}
