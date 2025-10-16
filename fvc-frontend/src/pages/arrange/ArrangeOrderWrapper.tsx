import { useState } from "react";
import ArrangeOrderPage from "./ArrangeOrderPage";

type CompetitionType = "fighting" | "quyen" | "music";

export default function ArrangeOrderWrapper() {
  const [activeTab, setActiveTab] = useState<CompetitionType>("quyen"); // Set to 'quyen' as default

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
