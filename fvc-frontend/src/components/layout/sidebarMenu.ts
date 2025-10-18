export type MenuItem = {
  key: string;
  label: string;
  section?: string;
};

export const defaultMenuItems: MenuItem[] = [
  { key: "tournaments", label: "Danh sách giải đấu" },
  {
    section: "Quản lí form",
    key: "tournamentForm",
    label: "Form đăng ký giải đấu",
  },
  { key: "weightClassPage", label: "Quản lí hạng cân" },
  { key: "athletes", label: "Quản lí VĐV" },
  { key: "brackets", label: "Chia Bracket" },
  { section: "Quản lí nội dung", key: "forms", label: "Quyền" },
  { section: "Quản lí nội dung", key: "music", label: "Võ nhạc" },
  { section: "Quản lí form", key: "formList", label: "Form đăng ký CLB" },
  { section: "Quản lí form", key: "submittedForms", label: "Kết quả đăng ký" },
];
