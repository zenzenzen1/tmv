// Mapping các trường phổ biến sang tên hiển thị tiếng Việt
export const FIELD_DISPLAY_NAMES: Record<string, string> = {
  // Số điện thoại
  "phone": "Số điện thoại",
  "sdt": "Số điện thoại", 
  "mobile": "Số điện thoại",
  "phoneNumber": "Số điện thoại",
  "contactPhone": "Số điện thoại liên lạc",
  "emergencyPhone": "Số điện thoại khẩn cấp",
  
  // Lý do tham gia
  "reason": "Lý do tham gia",
  "lydo": "Lý do tham gia",
  "motivation": "Động lực tham gia",
  
  // Tên (để hiển thị khi không có user_id)
  "ten": "Tên",
  "name": "Tên",
  "fullName": "Họ và tên",
  "hovaten": "Họ và tên",
};

// Danh sách các trường tên
export const NAME_FIELDS = ["fullName", "name", "hovaten", "ten", "hoTen", "full_name"];

// Các trường cần loại bỏ khi extract thông tin
export const EXCLUDED_FIELDS = [
  'fullName', 'name', 'hovaten', 'hoTen', 'email', 'mail', 
  'studentCode', 'mssv', 'msv', 'phone', 'sdt', 'so_dien_thoai', 'mobile',
  'reason', 'mo_ta', 'mota', 'description', 'bio', 'club'
];

// Options cho page size selector
export const PAGE_SIZE_OPTIONS = [5, 10, 15];

// Form type constants
export const FORM_TYPE_CLUB_REGISTRATION = "CLUB_REGISTRATION";


