import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

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

  const [showAddMenu, setShowAddMenu] = useState(false);

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

  function findFieldIndex(fieldId: string): number {
    return fields.findIndex(f => f.id === fieldId);
  }

  function handleAdd(type: FieldType) {
    setFields((prev) => [
      ...prev,
      makeField("", "", "", type, false, (prev[prev.length - 1]?.sortOrder ?? 0) + 1),
    ]);
    setShowAddMenu(false);
  }

  function handleDragEnd(result: any) {
    if (!result.destination) return;

    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sortOrder
    const updatedItems = items.map((item, index) => ({
      ...item,
      sortOrder: index + 1,
    }));

    setFields(updatedItems);
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
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="fields">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="mt-4 space-y-2">
                  {fields.map((f, i) => (
                    <Draggable key={f.id} draggableId={f.id} index={i}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`rounded-lg border border-gray-200 bg-white p-3 ${snapshot.isDragging ? 'bg-blue-50 shadow-lg' : 'hover:bg-gray-50'}`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div {...provided.dragHandleProps} className="text-gray-400 cursor-move">
                                ⋮⋮
                              </div>
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 text-xs text-gray-600">
                                  <input
                                    type="checkbox"
                                    checked={f.required}
                                    onChange={(e) => handleChangeField(findFieldIndex(f.id), { required: e.target.checked })}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  Required
                                </label>
                                <button 
                                  className="text-red-500 hover:text-red-700 text-sm"
                                  onClick={() => handleDelete(findFieldIndex(f.id))}
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <div className="mb-1 text-xs font-medium text-gray-700">Nhãn câu hỏi</div>
                                <input
                                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none"
                                  value={f.label}
                                  onChange={(e) => handleChangeField(findFieldIndex(f.id), { label: e.target.value })}
                                  placeholder="Nhập câu hỏi"
                                />
                              </div>
                              <div>
                                <div className="mb-1 text-xs font-medium text-gray-700">Ghi chú</div>
                                <input
                                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none"
                                  value={f.note ?? ""}
                                  onChange={(e) => handleChangeField(findFieldIndex(f.id), { note: e.target.value })}
                                  placeholder="Ghi chú cho câu hỏi"
                                />
                              </div>
                              <div>
                                <div className="mb-1 text-xs font-medium text-gray-700">Phần nhập thông tin vào</div>
                                <div className="rounded-md border border-gray-300 bg-gray-50 p-3">
                                  {f.fieldType === "TEXT" && (
                                    <input
                                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
                                      placeholder={f.note || "Nhập câu trả lời"}
                                      disabled
                                    />
                                  )}
                                  {f.fieldType === "DATE" && (
                                    <input
                                      type="date"
                                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
                                      disabled
                                    />
                                  )}
                                  {f.fieldType === "SELECT" && (
                                    <select className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm" disabled>
                                      <option>{f.note || "Chọn một tùy chọn"}</option>
                                    </select>
                                  )}
                                  {f.fieldType === "CHECKBOX" && (
                                    <div className="space-y-2">
                                      <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" disabled className="rounded border-gray-300" />
                                        <span className="text-gray-500">{f.note || "Tùy chọn 1"}</span>
                                      </label>
                                      <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" disabled className="rounded border-gray-300" />
                                        <span className="text-gray-500">{f.note || "Tùy chọn 2"}</span>
                                      </label>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Add question */}
          <div className="mt-4 relative">
            <button
              className="rounded-md border border-dashed border-gray-300 bg-white px-3 py-2 text-[13px] font-medium text-[#2563eb] hover:bg-blue-50"
              onClick={() => setShowAddMenu(!showAddMenu)}
            >
              + Thêm câu hỏi
            </button>
            
            {showAddMenu && (
              <div className="absolute top-full left-0 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg z-10">
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-600 mb-2">LOẠI CÂU HỎI</div>
                  <div className="space-y-1">
                    <button
                      className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-gray-100"
                      onClick={() => handleAdd("TEXT")}
                    >
                      <span>≡</span>
                      <span>Short answer</span>
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-gray-100"
                      onClick={() => handleAdd("DATE")}
                    >
                      <span>📅</span>
                      <span>Date</span>
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-gray-100"
                      onClick={() => handleAdd("SELECT")}
                    >
                      <span>☰</span>
                      <span>Multiple choice</span>
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-gray-100"
                      onClick={() => handleAdd("CHECKBOX")}
                    >
                      <span>☑</span>
                      <span>Checkboxes</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
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


