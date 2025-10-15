import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";
import { defaultMenuItems } from "@/components/layout/sidebarMenu";

export default function MainLayout() {
  const location = useLocation();

  // derive active menu from path
  const path = location.pathname;
  let activeKey: string | undefined;
  if (path.startsWith("/submitted-forms")) activeKey = "submittedForms";
  else if (path.startsWith("/formList") || path.startsWith("/forms")) activeKey = "formList";
  else activeKey = undefined;

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar activeMenu={activeKey} menuItems={defaultMenuItems} />
      <div className="flex min-h-screen flex-1 flex-col bg-gray-50">
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1200px] p-6">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
