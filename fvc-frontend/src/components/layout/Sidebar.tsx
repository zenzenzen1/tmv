import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { defaultMenuItems } from "@/components/layout/sidebarMenu.ts";
import type { MenuItem } from "@/components/layout/sidebarMenu.ts";

type ActiveMenu = string;

type TournamentSidebarProps = {
  title?: string;
  menuItems?: MenuItem[];
  activeMenu?: ActiveMenu;
  onChange?: (next: ActiveMenu) => void;
};

export default function TournamentSidebar({
  title = "FPTU Vovinam CMS",
  menuItems,
  activeMenu: controlledActiveMenu,
  onChange,
}: TournamentSidebarProps) {
  const items = menuItems ?? defaultMenuItems;
  const navigate = useNavigate();

  // Map menu keys to routes
  const keyToPath: Record<string, string> = {
    formList: "/formList",
    submittedForms: "/submitted-forms",
  };

  const isControlled =
    controlledActiveMenu !== undefined && typeof onChange === "function";
  const [uncontrolledActiveMenu, setUncontrolledActiveMenu] =
    useState<ActiveMenu>(items[0]?.key ?? "");

  const activeMenu = isControlled
    ? (controlledActiveMenu as ActiveMenu)
    : uncontrolledActiveMenu;

  const handleChange = (next: ActiveMenu) => {
    if (isControlled) {
      (onChange as (n: ActiveMenu) => void)(next);
    } else {
      setUncontrolledActiveMenu(next);
    }
    const path = keyToPath[next];
    if (path) navigate(path);
  };

  const { topLevelItems, sectionToItems } = useMemo(() => {
    const topLevel = items.filter((i: MenuItem) => !i.section);
    const sectionMap = new Map<string, MenuItem[]>();
    items.forEach((i: MenuItem) => {
      if (!i.section) return;
      const arr = sectionMap.get(i.section) ?? [];
      arr.push(i);
      sectionMap.set(i.section, arr);
    });
    return { topLevelItems: topLevel, sectionToItems: sectionMap };
  }, [items]);

  return (
    <aside className="w-64 h-full min-h-full flex-shrink-0 border-r border-gray-200 bg-white/100">
      <div className="px-4 py-5">
        <div className="mb-4 text-sm font-semibold text-gray-800">{title}</div>
        <nav className="space-y-1 text-[13px] font-medium text-gray-700">
          {topLevelItems.map((item: MenuItem) => (
            <button
              key={item.key}
              onClick={() => handleChange(item.key)}
              className={`block w-full rounded-md px-3 py-2 text-left ${
                activeMenu === item.key
                  ? "bg-[#2563eb] text-white shadow-sm"
                  : "hover:bg-gray-50"
              }`}
            >
              {item.label}
            </button>
          ))}

          {[...sectionToItems.entries()].map(
            ([section, sectionItems]: [string, MenuItem[]]) => (
              <div className="pt-3" key={section}>
                <div className="mb-1 px-3 text-[12px] font-semibold uppercase tracking-wide text-gray-500">
                  {section}
                </div>
                <div className="ml-2 space-y-1">
                  {sectionItems.map((item: MenuItem) => (
                    <button
                      key={item.key}
                      onClick={() => handleChange(item.key)}
                      className={`block w-full rounded-md px-3 py-2 text-left ${
                        activeMenu === item.key
                          ? "bg-[#2563eb] text-white shadow-sm"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          )}
        </nav>
      </div>
    </aside>
  );
}
