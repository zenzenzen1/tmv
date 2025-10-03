import { Fragment, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import apiService from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";

type FieldType = "TEXT" | "DATE" | "SELECT" | "CHECKBOX" | "FILE";

type FormField = {
  id: string;
  label: string;
  name: string;
  placeholder?: string;
  fieldType: FieldType;
  required: boolean;
  note?: string;
  sortOrder: number;
  options?: string;
};

export default function FormBuilderPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Base fields that are always present and not draggable/deletable
  const baseFields = useMemo(() => [
    { id: "base-fullName", label: "Họ và tên", name: "fullName", fieldType: "TEXT", required: true, sortOrder: 1, placeholder: "Nhập họ và tên" },
    { id: "base-email", label: "Email", name: "email", fieldType: "TEXT", required: true, sortOrder: 2, placeholder: "Nhập email" },
    { id: "base-studentCode", label: "MSSV", name: "studentCode", fieldType: "TEXT", required: true, sortOrder: 3, placeholder: "Nhập MSSV" },
    { id: "base-phone", label: "SĐT liên lạc", name: "phone", fieldType: "TEXT", required: false, sortOrder: 4, placeholder: "Nhập số điện thoại" },
    { id: "base-bio", label: "Mô tả ngắn về bản thân", name: "bio", fieldType: "TEXT", required: false, sortOrder: 5, placeholder: "Nhập mô tả" },
  ], []);

  // Custom fields are the ones that can be dragged and deleted
  const customFields = useMemo(() => fields.filter(f => !f.id.startsWith("base-")), [fields]);

  function handleChangeField(fieldId: string, patch: Partial<FormField>) {
    setFields((prev) => {
      const copy = [...prev];
      const idx = copy.findIndex(f => f.id === fieldId);
      if (idx !== -1) {
        copy[idx] = { ...copy[idx], ...patch } as FormField;
      }
      return copy;
    });
  }

  function handleDelete(fieldId: string) {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
  }

  function handleAdd(type: FieldType) {
    const newField = makeField("", "", "", type, false, (fields[fields.length - 1]?.sortOrder ?? 0) + 1);
    setFields((prev) => [...prev, newField]);
    setShowAddMenu(false);
  }

  function handleDragEnd(result: any) {
    if (!result.destination) return;

    const draggableId = result.draggableId;
    if (draggableId.startsWith("base-")) {
      // Prevent dragging base fields
      return;
    }

    const items = Array.from(customFields); // Only reorder custom fields
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sortOrder for custom fields
    const updatedCustomItems = items.map((item, index) => ({
      ...item,
      sortOrder: baseFields.length + index + 1, // Adjust sortOrder based on base fields count
    }));

    setFields([...baseFields, ...updatedCustomItems]); // Combine base and reordered custom fields
  }

  useEffect(() => {
    // Initialize with base fields
    setFields(baseFields);
  }, [baseFields]);

  const handleSave = async () => {
    try {
      setSaving(true);

      const requestData = {
        name: title,
        description: description,
        formType: "CLUB_REGISTRATION",
        fields: fields.map(field => ({
          id: field.id.startsWith("base-") ? null : field.id, // Don't send ID for base fields if they are new
          label: field.label,
          name: field.name,
          fieldType: field.fieldType,
          required: field.required,
          options: field.options || null,
          sortOrder: field.sortOrder,
        }))
      };

      const response = await apiService.post<any>(API_ENDPOINTS.APPLICATION_FORMS.BASE, requestData);

      if (response.success) {
        alert("Đã tạo form thành công!");
        navigate('/formList');
      } else {
        alert("Lỗi khi tạo form: " + (response.message || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Error creating form:", error);
      alert("Lỗi khi tạo form: " + (error?.message || "Network error"));
    } finally {
      setSaving(false);
    }
  };

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
            <h1 className="text-[15px] font-semibold text-gray-900">Tạo Form</h1>
            <span className="rounded-md border px-2 py-1 text-[11px] font-semibold text-gray-600">CLB</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-md border px-3 py-2 text-[13px] text-gray-700 shadow-sm hover:bg-gray-50">Lưu nháp</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white shadow hover:bg-[#1f4ec3] disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu & Publish"}
            </button>
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
                placeholder="Nhập tiêu đề form"
              />
            </div>
            <div>
              <div className="mb-1 text-[13px] font-semibold text-gray-800">Mô tả</div>
              <textarea
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-[#2563eb] focus:outline-none"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả form"
              />
            </div>
          </div>

          {/* Fields */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="fields">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="mt-4 space-y-2">
                  {fields.map((f, i) => (
                    <Draggable key={f.id} draggableId={f.id} index={i} isDragDisabled={f.id.startsWith("base-")}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`rounded-lg border border-gray-200 bg-white p-3 ${snapshot.isDragging ? 'bg-blue-50 shadow-lg' : 'hover:bg-gray-50'}`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div {...provided.dragHandleProps} className={`text-gray-400 ${f.id.startsWith("base-") ? 'cursor-not-allowed' : 'cursor-move'}`}>
                                {f.id.startsWith("base-") ? '✖' : '⋮⋮'} {/* Changed handle for base fields */}
                              </div>
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 text-xs text-gray-600">
                                  <input
                                    type="checkbox"
                                    checked={f.required}
                                    onChange={(e) => handleChangeField(f.id, { required: e.target.checked })}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    disabled={f.id.startsWith("base-")} // Disable for base fields
                                  />
                                  Required
                                </label>
                                {!f.id.startsWith("base-") && ( // Only show delete for custom fields
                                  <button
                                    className="text-red-500 hover:text-red-700 text-sm"
                                    onClick={() => handleDelete(f.id)}
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <div className="mb-1 text-xs font-medium text-gray-700">Nhãn câu hỏi</div>
                                <input
                                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none"
                                  value={f.label}
                                  onChange={(e) => handleChangeField(f.id, { label: e.target.value })}
                                  placeholder="Nhập câu hỏi"
                                />
                              </div>
                              <div>
                                <div className="mb-1 text-xs font-medium text-gray-700">Ghi chú</div>
                                <div className="rounded-md border border-gray-300 bg-gray-50 p-3">
                                  {f.fieldType === "TEXT" && (
                                    <input
                                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
                                      placeholder="Nhập câu trả lời"
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
                                      <option>Chọn một tùy chọn</option>
                                    </select>
                                  )}
                                  {f.fieldType === "CHECKBOX" && (
                                    <div className="space-y-2">
                                      <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" className="rounded border-gray-300" disabled />
                                        <span className="text-gray-500">Tùy chọn 1</span>
                                      </label>
                                      <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" className="rounded border-gray-300" disabled />
                                        <span className="text-gray-500">Tùy chọn 2</span>
                                      </label>
                                    </div>
                                  )}
                                  {f.fieldType === "FILE" && (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="file"
                                        className="text-sm text-gray-500"
                                        disabled
                                      />
                                      <span className="text-sm text-gray-500">No file chosen</span>
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
                    <button
                      className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-gray-100"
                      onClick={() => handleAdd("FILE")}
                    >
                      <span>📄</span>
                      <span>File upload</span>
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
  sortOrder: number,
  options?: string | null
): FormField {
  return {
    id: crypto.randomUUID(),
    label,
    name,
    placeholder,
    fieldType,
    required,
    sortOrder,
    options,
  };
}
