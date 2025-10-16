import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { defaultMenuItems } from "@/components/layout/sidebarMenu.ts";
import type { MenuItem } from "@/components/layout/sidebarMenu.ts";
import {
  Drawer,
  Box,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Typography,
} from "@mui/material";

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
  const location = useLocation();

  // Map menu keys to routes
  const keyToPath: Record<string, string> = {
    tournaments: "/manage/tournaments",
    tournamentForm: "/manage/tournament-forms",
    weightClassPage: "/manage/weight-class",
    athletes: "/manage/athletes",
    fighting: "/manage/athletes/fighting",
    forms: "/manage/fist-content",
    music: "/manage/music-content",
    formList: "/manage/forms",
    submittedForms: "/manage/submitted-forms",
  };

  const isControlled =
    controlledActiveMenu !== undefined && typeof onChange === "function";
  const [uncontrolledActiveMenu, setUncontrolledActiveMenu] =
    useState<ActiveMenu>(items[0]?.key ?? "");

  // derive active from location if uncontrolled
  const path = location.pathname;
  const derivedKey = Object.entries(keyToPath).find(([, p]) =>
    path.startsWith(p)
  )?.[0];
  const activeMenu = isControlled
    ? (controlledActiveMenu as ActiveMenu)
    : derivedKey ?? uncontrolledActiveMenu;

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
    <Drawer
      variant="permanent"
      PaperProps={{
        sx: { width: 256, borderRight: 1, borderColor: "divider" },
      }}
    >
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <List dense>
          {topLevelItems.map((item: MenuItem) => (
            <ListItemButton
              key={item.key}
              selected={activeMenu === item.key}
              onClick={() => handleChange(item.key)}
            >
              <ListItemText
                primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }}
                primary={item.label}
              />
            </ListItemButton>
          ))}
        </List>
        {[...sectionToItems.entries()].map(
          ([section, sectionItems]: [string, MenuItem[]]) => (
            <Box key={section} sx={{ pt: 1 }}>
              <Divider sx={{ mb: 1 }} />
              <Typography variant="overline" sx={{ px: 1 }}>
                {section}
              </Typography>
              <List dense sx={{ ml: 1 }}>
                {sectionItems.map((item: MenuItem) => (
                  <ListItemButton
                    key={item.key}
                    selected={activeMenu === item.key}
                    onClick={() => handleChange(item.key)}
                  >
                    <ListItemText
                      primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }}
                      primary={item.label}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          )
        )}
      </Box>
    </Drawer>
  );
}
