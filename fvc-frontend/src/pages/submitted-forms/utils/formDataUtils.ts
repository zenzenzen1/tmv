import { FIELD_DISPLAY_NAMES, NAME_FIELDS, EXCLUDED_FIELDS } from "../constants";

/**
 * Extract tất cả các trường từ form data
 */
export function extractFormDataFields(formData: any): Record<string, string> {
  if (!formData) return {};
  try {
    const obj = typeof formData === "string" ? JSON.parse(formData) : formData;
    const fields: Record<string, string> = {};
    
    function walk(o: any, path: string[] = []) {
      if (o == null) return;
      if (typeof o !== "object") {
        const key = path.join(".");
        const value = String(o);
        if (value.trim()) {
          fields[key] = value;
        }
        return;
      }
      if (Array.isArray(o)) {
        o.forEach((v, i) => walk(v, [...path, String(i)]));
        return;
      }
      Object.entries(o).forEach(([kk, vv]) => walk(vv, [...path, kk]));
    }
    
    walk(obj);
    return fields;
  } catch {
    return {};
  }
}

/**
 * Extract tên từ form data một cách chính xác
 */
export function extractNameFromFormData(formData: any): string {
  if (!formData) return "";
  try {
    const obj = typeof formData === "string" ? JSON.parse(formData) : formData;
    
    // Tìm exact match trước
    for (const field of NAME_FIELDS) {
      if (obj[field] && typeof obj[field] === "string" && obj[field].trim()) {
        return obj[field].trim();
      }
    }
    
    // Tìm case-insensitive match
    for (const field of NAME_FIELDS) {
      const foundKey = Object.keys(obj).find(key => 
        key.toLowerCase() === field.toLowerCase()
      );
      if (foundKey && obj[foundKey] && typeof obj[foundKey] === "string" && obj[foundKey].trim()) {
        return obj[foundKey].trim();
      }
    }
    
    // Loại bỏ các trường không phải tên
    const excludeFields = ["club", "clb", "team", "competition", "reason", "lydo", "phone", "sdt", "mobile", "email", "mail", "studentCode", "mssv", "msv"];
    
    // Tìm trường có vẻ giống tên (có khoảng trắng, độ dài hợp lý, không phải email/phone)
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string" && value.trim()) {
        const lowerKey = key.toLowerCase();
        const lowerValue = value.trim().toLowerCase();
        
        // Loại bỏ các trường không phải tên
        if (excludeFields.some(exclude => lowerKey.includes(exclude) || lowerValue.includes(exclude))) {
          continue;
        }
        
        // Kiểm tra nếu có vẻ giống tên (có khoảng trắng, độ dài 5-50 ký tự, không phải email/phone)
        if (/\s/.test(value.trim()) && 
            value.trim().length >= 5 && 
            value.trim().length <= 50 &&
            !/\b[\w.+-]+@\w+\.[\w.-]+\b/.test(value.trim()) &&
            !/\b(0|\+84)?[\d\s.-]{8,14}\b/.test(value.trim())) {
          return value.trim();
        }
      }
    }
    
    return "";
  } catch {
    return "";
  }
}

/**
 * Lấy tên hiển thị cho một trường
 */
export function getFieldDisplayName(fieldKey: string): string {
  const lowerKey = fieldKey.toLowerCase();
  
  // Tìm exact match trước
  if (FIELD_DISPLAY_NAMES[lowerKey]) {
    return FIELD_DISPLAY_NAMES[lowerKey];
  }
  
  // Tìm partial match
  for (const [key, displayName] of Object.entries(FIELD_DISPLAY_NAMES)) {
    if (lowerKey.includes(key) || key.includes(lowerKey)) {
      return displayName;
    }
  }
  
  // Nếu không tìm thấy, format key thành tên hiển thị
  return fieldKey
    .split(/[._-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Safe pick value từ JSON object với nhiều key variants
 */
export function safePick(jsonString: string, keys: string[]): string {
  try {
    const obj =
      typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
    for (const k of keys) {
      // try exact
      if (obj && obj[k] != null) return String(obj[k]);
      // try case-insensitive
      const found = Object.keys(obj ?? {}).find(
        (kk) => kk.toLowerCase() === k.toLowerCase()
      );
      if (found && obj[found] != null) return String(obj[found]);
    }
    // try deep/heuristic extraction
    const entries: Array<{ key: string; value: any }> = [];
    function walk(o: any, path: string[] = []) {
      if (o == null) return;
      if (typeof o !== "object") {
        entries.push({ key: path.join("."), value: o });
        return;
      }
      if (Array.isArray(o)) {
        o.forEach((v, i) => walk(v, [...path, String(i)]));
        return;
      }
      Object.entries(o).forEach(([kk, vv]) => walk(vv, [...path, kk]));
    }
    walk(obj);

    const emailRegex = /\b[\w.+-]+@\w+\.[\w.-]+\b/i;
    const phoneRegex = /\b(0|\+84)?[\d\s.-]{8,14}\b/;
    const mssvRegex = /\b(HE|SE|SS|SP)?\d{6,8}\b/i;

    const findBy = (pred: (s: string) => boolean, keyHint?: RegExp) => {
      // prioritize keys that hint
      const prioritized = keyHint
        ? entries.filter((e) => keyHint.test(e.key.toLowerCase()))
        : entries;
      const arr = [...prioritized, ...entries];
      for (const e of arr) {
        const s = String(e.value ?? "");
        if (pred(s)) return s;
      }
      return "";
    };

    const email = findBy((s) => emailRegex.test(s), /(email|mail)/i);
    const phone = findBy(
      (s) => phoneRegex.test(s),
      /(phone|sdt|mobile|contact)/i
    );
    const mssv = findBy((s) => mssvRegex.test(s), /(mssv|student|code|msv)/i);
    const name = findBy(
      (s) => /\s/.test(s) && s.length >= 5 && !emailRegex.test(s),
      /(name|hovaten|full|ho|ten)/i
    );

    const map: Record<string, string> = {
      fullName: name,
      email: email,
      studentCode: mssv,
      phone: phone,
    };

    for (const k of keys) {
      if (map[k] && map[k].length > 0) return map[k];
    }
  } catch (_) {}
  return "";
}

/**
 * Parse form data object từ string hoặc object
 */
export function parseFormData(formData: any): any {
  if (!formData) return {};
  try {
    return typeof formData === 'string' 
      ? JSON.parse(formData) 
      : formData;
  } catch {
    return {};
  }
}

/**
 * Extract thông tin người đăng ký từ form data
 */
export function extractApplicantInfo(formData: any): Array<{ key: string; label: string; value: string }> {
  const formDataObj = parseFormData(formData);
  const infoFields: Array<{ key: string; label: string; value: string }> = [];
  
  // Họ và tên
  const fullName = formDataObj.fullName || formDataObj.name || formDataObj.hovaten || formDataObj.hoTen || '';
  if (fullName) {
    infoFields.push({ key: 'fullName', label: 'Họ và tên', value: fullName });
  }

  // Email
  const email = formDataObj.email || formDataObj.mail || '';
  if (email) {
    infoFields.push({ key: 'email', label: 'Email', value: email });
  }

  // MSSV
  const studentCode = formDataObj.studentCode || formDataObj.mssv || formDataObj.msv || '';
  if (studentCode) {
    infoFields.push({ key: 'studentCode', label: 'MSSV', value: studentCode });
  }

  // Số điện thoại
  const phone = formDataObj.phone || formDataObj.sdt || formDataObj.so_dien_thoai || formDataObj.mobile || '';
  if (phone) {
    infoFields.push({ key: 'phone', label: 'Số điện thoại', value: phone });
  }

  // Mô tả / Lý do
  const reason = formDataObj.reason || formDataObj.mo_ta || formDataObj.mota || formDataObj.description || formDataObj.bio || '';
  if (reason) {
    infoFields.push({ key: 'reason', label: 'Mô tả ngắn về bản thân', value: reason });
  }

  // Các trường khác (loại bỏ null, empty, và các trường đã hiển thị)
  Object.entries(formDataObj).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    if (!EXCLUDED_FIELDS.includes(lowerKey) && 
        value !== null && 
        value !== undefined && 
        value !== '' &&
        typeof value === 'string') {
      infoFields.push({ 
        key, 
        label: getFieldDisplayName(key), 
        value: String(value) 
      });
    }
  });

  return infoFields;
}


