import { Fragment, useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import apiService from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";

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
  options?: string;
};

export default function FormEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  function findFieldIndex(fieldId: string): number {
    return fields.findIndex(f => f.id === fieldId);
  }

  function handleAdd(type: FieldType) {
    const newField = makeField("", "", "", type, false, (fields[fields.length - 1]?.sortOrder ?? 0) + 1, "");
    setFields((prev) => [...prev, newField]);
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

  useEffect(() => {
    loadFormConfig();
  }, []);

  // Fallback: if BE không trả fields, hiển thị 5 trường bắt buộc mặc định
  useEffect(() => {
    if (!loading && fields.length === 0) {
      const base = [
        makeField("Họ và tên", "fullName", "", "TEXT", true, 1, ""),
        makeField("Email", "email", "", "TEXT", true, 2, ""),
        makeField("MSSV", "studentCode", "", "TEXT", true, 3, ""),
        makeField("SDT liên lạc", "phone", "", "TEXT", false, 4, ""),
        makeField("Mô tả ngắn về bản thân", "bio", "", "TEXT", false, 5, ""),
      ];
      setFields(base);
    }
  }, [loading]);

  const loadFormConfig = async () => {
    try {
      setLoading(true);
      
      if (id === 'new') {
        // Tạo form mới
        await createDefaultForm();
        return;
      }
      
      if (id) {
        // Load form theo ID
        const response = await apiService.get<any>(API_ENDPOINTS.APPLICATION_FORMS.BY_ID(id));
        
        if (response.success && response.data) {
          setTitle(response.data.name || "");
          setDescription(response.data.description || "");
          setEndDate(response.data.endDate ? new Date(response.data.endDate).toISOString().split('T')[0] : "");
          
          const formFields = response.data.fields?.map((field: any) => ({
            id: field.id || crypto.randomUUID(),
            label: field.label || "",
            name: field.name || "",
            fieldType: field.fieldType || "TEXT",
            required: field.required || false,
            sortOrder: field.sortOrder || 0,
            options: field.options || "",
          })) || [];
          
          setFields(formFields);
        } else {
          // Fallback: tạo form mới nếu không tìm thấy
          await createDefaultForm();
        }
      } else {
        // Fallback: load form CLB_REGISTRATION mặc định
        const response = await apiService.get<any>(API_ENDPOINTS.APPLICATION_FORMS.BY_TYPE('CLUB_REGISTRATION'));
        
        if (response.success && response.data) {
          setTitle(response.data.name || "");
          setDescription(response.data.description || "");
          setEndDate(response.data.endDate ? new Date(response.data.endDate).toISOString().split('T')[0] : "");
          
          const formFields = response.data.fields?.map((field: any) => ({
            id: field.id || crypto.randomUUID(),
            label: field.label || "",
            name: field.name || "",
            fieldType: field.fieldType || "TEXT",
            required: field.required || false,
            sortOrder: field.sortOrder || 0,
            options: field.options || "",
          })) || [];
          
          setFields(formFields);
        } else {
          // If no config exists, create default one
          await createDefaultForm();
        }
      }
    } catch (error) {
      console.error("Error loading form config:", error);
      // Try to create default form
      await createDefaultForm();
    } finally {
      setLoading(false);
    }
  };

  const createDefaultForm = async () => {
    try {
      const response = await apiService.post<any>(API_ENDPOINTS.APPLICATION_FORMS.INIT_CLUB);
      if (response.success && response.data) {
        setTitle(response.data.name || "");
        setDescription(response.data.description || "");
        
        const formFields = response.data.fields?.map((field: any) => ({
          id: field.id || crypto.randomUUID(),
          label: field.label || "",
          name: field.name || "",
          fieldType: field.fieldType || "TEXT",
          required: field.required || false,
          sortOrder: field.sortOrder || 0,
        })) || [];
        
        setFields(formFields);
      }
    } catch (error) {
      console.error("Error creating default form:", error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const requestData = {
        name: title,
        description: description,
        formType: "CLUB_REGISTRATION",
        endDate: endDate ? new Date(endDate).toISOString() : null,
        fields: fields.map(field => ({
          id: field.id,
          label: field.label,
          name: field.name,
          fieldType: field.fieldType,
          required: field.required,
          options: field.options || null,
          sortOrder: field.sortOrder,
        }))
      };

      const response = await apiService.put<any>(API_ENDPOINTS.APPLICATION_FORMS.BY_TYPE('CLUB_REGISTRATION'), requestData);
      
      if (response.success) {
        alert("Đã lưu thành công!");
      } else {
        alert("Lỗi khi lưu: " + (response.message || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Error saving form:", error);
      alert("Lỗi khi lưu: " + (error?.message || "Network error"));
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
            <h1 className="text-[15px] font-semibold text-gray-900">
              {id === 'new' ? 'Tạo Form Mới' : 'Chỉnh Sửa Form'}
            </h1>
            <span className="rounded-md border px-2 py-1 text-[11px] font-semibold text-gray-600">CLB</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-md border px-3 py-2 text-[13px] text-gray-700 shadow-sm hover:bg-gray-50">Xem trước</button>
            <button 
            onClick={handleSave} 
            disabled={saving}
            className="rounded-md bg-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white shadow hover:bg-[#1f4ec3] disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : (id === 'new' ? "TẠO" : "SỬA")}
          </button>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-600">Đang tải dữ liệu...</div>
            </div>
          ) : (
            <>
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
                <div>
                  <div className="mb-1 text-[13px] font-semibold text-gray-800">Ngày kết thúc</div>
                  <input
                    type="datetime-local"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-[#2563eb] focus:outline-none"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="Chọn ngày kết thúc"
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    Form sẽ tự động hết public khi đến ngày này
                  </div>
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
                                    onChange={(e) => handleChangeField(f.id, { required: e.target.checked })}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  Required
                                </label>
                                <button 
                                  className="text-red-500 hover:text-red-700 text-sm"
                                  onClick={() => handleDelete(f.id)}
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
                                  onChange={(e) => handleChangeField(f.id, { label: e.target.value })}
                                  placeholder="Nhập câu hỏi"
                                />
                              </div>
                              <div>
                                <div className="mb-1 text-xs font-medium text-gray-700">Phần nhập thông tin vào</div>
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
                                        <input type="checkbox" disabled className="rounded border-gray-300" />
                                        <span className="text-gray-500">Tùy chọn 1</span>
                                      </label>
                                      <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" disabled className="rounded border-gray-300" />
                                        <span className="text-gray-500">Tùy chọn 2</span>
                                      </label>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {(f.fieldType === "SELECT" || f.fieldType === "CHECKBOX") && (
                                <div>
                                  <div className="mb-1 text-xs font-medium text-gray-700">Tùy chọn (mỗi dòng một tùy chọn)</div>
                                  <textarea
                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none"
                                    value={f.options || ""}
                                    onChange={(e) => handleChangeField(f.id, { options: e.target.value })}
                                    placeholder="Tùy chọn 1&#10;Tùy chọn 2&#10;Tùy chọn 3"
                                    rows={3}
                                  />
                                </div>
                              )}
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
            </>
          )}
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
  options?: string
): FormField {
  return {
    id: crypto.randomUUID(),
    label,
    name,
    placeholder,
    fieldType,
    required,
    sortOrder,
    options: options || "",
  };
}


