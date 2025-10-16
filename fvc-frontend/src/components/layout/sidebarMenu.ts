export type MenuItem = {
  key: string;
  label: string;
  section?: string;
};

export const defaultMenuItems: MenuItem[] = [
  { key: "tournaments", label: "Danh sách giải đấu" },
  { key: "tournamentForm", label: "Form đăng ký giải đấu" },
  { key: "weightClassPage", label: "Quản lí hạng cân" },
  { key: "athletes", label: "Quản lí VĐV" },
  { section: "Quản lí nội dung", key: "forms", label: "Quyền" },
  { section: "Quản lí nội dung", key: "music", label: "Võ nhạc" },
  { section: "Quản lí form", key: "formList", label: "Danh sách Form" },
  { section: "Quản lí form", key: "submittedForms", label: "Kết quả đăng ký" },
];
