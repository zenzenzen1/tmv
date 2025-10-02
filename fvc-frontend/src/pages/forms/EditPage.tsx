import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type FieldType = "TEXT" | "DATE" | "SELECT" | "CHECKBOX";

type FormField = {
  id: string;
  label: string;
  name: string;
  placeholder?: string;
  fieldType: FieldType;
  required: boolean;
  note?: string;
  sortOrder: number;
};

export default function FormEditPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("Đăng kí tham gia FPTU Vovinam Club FALL 2025");
  const [description, setDescription] = useState(
    "Form đăng ký tham gia Câu lạc bộ giúp bạn trở thành thành viên chính thức, kết nối với cộng đồng, tham gia các hoạt động và nhận thông tin mới nhất từ CLB. Vui lòng điền đầy đủ thông tin để Ban Tổ Chức xác nhận và sắp xếp phù hợp."
  );

  const [fields, setFields] = useState<FormField[]>([
    makeField("Họ và tên", "fullName", "Ghi chú", "TEXT", true, 1),
    makeField("Email", "email", "Vd: abc@gmail.com", "TEXT", true, 2),
    makeField("MSSV", "studentCode", "Ghi chú", "TEXT", true, 3),
    makeField("SDT liên lạc", "phone", "0123456789", "TEXT", false, 4),
    makeField("Mô tả ngắn về bản thân", "bio", "Nhập đoạn trả lời", "TEXT", false, 5),
  ]);

  const ordered = useMemo(
    () => [...fields].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [fields]
  );

  function handleChangeField(idx: number, patch: Partial<FormField>) {
    setFields((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch } as FormField;
      return copy;
    });
  }

  function handleDelete(idx: number) {
    setFields((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleAdd(type: FieldType) {
    setFields((prev) => [
      ...prev,
      makeField("", "", "", type, false, (prev[prev.length - 1]?.sortOrder ?? 0) + 1),
    ]);
  }

  function handleSave() {
    // FE-only mock: you can wire to BE later
    console.log("save form config", { title, description, fields });
    alert("Đã lưu (FE mock)\nSẽ nối API khi bạn sẵn sàng.");
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-5xl space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              ⟵ Quay lại
            </button>
            <h1 className="text-[15px] font-semibold text-gray-900">Chỉnh Sửa Form</h1>
            <span className="rounded-md border px-2 py-1 text-[11px] font-semibold text-gray-600">CLB</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-md border px-3 py-2 text-[13px] text-gray-700 shadow-sm hover:bg-gray-50">Xem trước</button>
            <button onClick={handleSave} className="rounded-md bg-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white shadow hover:bg-[#1f4ec3]">SỬA</button>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          {/* Title/Description */}
          <div className="space-y-3">
            <div>
              <div className="mb-1 text-[13px] font-semibold text-gray-800">Tiêu đề</div>
              <input
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-[#2563eb] focus:outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <div className="mb-1 text-[13px] font-semibold text-gray-800">Mô tả</div>
              <textarea
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-[#2563eb] focus:outline-none"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Fields */}
          <div className="mt-4 divide-y divide-gray-200">
            {ordered.map((f, i) => (
              <div key={f.id} className="py-4">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] text-gray-700">=</div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-[12px] text-gray-700">
                      <input
                        type="checkbox"
                        checked={f.required}
                        onChange={(e) => handleChangeField(i, { required: e.target.checked })}
                      />
                      Required
                    </label>
                    <button className="text-red-500" onClick={() => handleDelete(i)}>x</button>
                  </div>
                </div>

                <div className="mt-3 space-y-3">
                  <div>
                    <div className="mb-1 text-[12px] font-medium text-gray-700">{f.label || "Họ và tên"}</div>
                    <input
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-[#2563eb] focus:outline-none"
                      placeholder={f.placeholder || "Ghi chú"}
                      value={f.note ?? ""}
                      onChange={(e) => handleChangeField(i, { note: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-[#2563eb] focus:outline-none"
                      placeholder="Nhãn (label)"
                      value={f.label}
                      onChange={(e) => handleChangeField(i, { label: e.target.value })}
                    />
                    <input
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-[#2563eb] focus:outline-none"
                      placeholder="Name (key)"
                      value={f.name}
                      onChange={(e) => handleChangeField(i, { name: e.target.value })}
                    />
                  </div>
                  <div className="max-w-xs">
                    <select
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-[#2563eb] focus:outline-none"
                      value={f.fieldType}
                      onChange={(e) => handleChangeField(i, { fieldType: e.target.value as FieldType })}
                    >
                      <option value="TEXT">Short answer</option>
                      <option value="DATE">Date</option>
                      <option value="SELECT">Multiple choice</option>
                      <option value="CHECKBOX">Checkboxes</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add question */}
          <div className="mt-4">
            <button
              className="rounded-md border border-dashed border-gray-300 bg-white px-3 py-2 text-[13px] font-medium text-[#2563eb] hover:bg-blue-50"
              onClick={() => handleAdd("TEXT")}
            >
              + Thêm câu hỏi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function makeField(
  label: string,
  name: string,
  placeholder: string,
  fieldType: FieldType,
  required: boolean,
  sortOrder: number
): FormField {
  return {
    id: crypto.randomUUID(),
    label,
    name,
    placeholder,
    fieldType,
    required,
    sortOrder,
  };
}


