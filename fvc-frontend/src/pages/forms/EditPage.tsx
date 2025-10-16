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
  const [savingDraft, setSavingDraft] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const openPreview = () => {
    setShowPreview(true);
    // Trigger animation sau khi DOM đã render
    setTimeout(() => {
      setIsAnimating(true);
    }, 10);
  };

  const closePreview = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setShowPreview(false);
    }, 300); // Đợi animation hoàn thành
  };

  function handleChangeField(fieldId: string, patch: Partial<FormField>) {
    setFields((prev) => {
      const copy = [...prev];
      const idx = copy.findIndex(f => f.id === fieldId);
      if (idx !== -1) {
        const updatedField = { ...copy[idx], ...patch } as FormField;
        
        // Tự động tạo tên trường từ nhãn câu hỏi nếu chưa có tên hoặc tên là mặc định
        if (patch.label && (copy[idx].name.startsWith('cau_hoi_') || copy[idx].name.startsWith('field_'))) {
          const autoName = patch.label
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
            .replace(/[^a-z0-9\s]/g, '') // Chỉ giữ chữ cái, số và khoảng trắng
            .replace(/\s+/g, '_') // Thay khoảng trắng bằng underscore
            .substring(0, 30); // Giới hạn độ dài
          
          if (autoName.length > 0) {
            updatedField.name = autoName;
          }
        }
        
        copy[idx] = updatedField;
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
    const fieldCount = fields.length + 1;
    const defaultName = `cau_hoi_${fieldCount}`;
    const newField = makeField("", defaultName, "", type, false, (fields[fields.length - 1]?.sortOrder ?? 0) + 1, "");
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
    // Tạo form hoàn toàn mới với các trường mặc định
    setTitle("Form đăng ký câu lạc bộ");
    setDescription("Điền thông tin để đăng ký tham gia câu lạc bộ");
    setEndDate("");
    
    const defaultFields = [
      makeField("Họ và tên", "ho_ten", "", "TEXT", true, 1, ""),
      makeField("Email", "email", "", "EMAIL", true, 2, ""),
      makeField("MSSV", "mssv", "", "TEXT", true, 3, ""),
      makeField("Số điện thoại", "so_dien_thoai", "", "TEXT", false, 4, ""),
      makeField("Mô tả ngắn về bản thân", "mo_ta_ban_than", "", "TEXTAREA", false, 5, ""),
    ];
    
    setFields(defaultFields);
  };

  const renderFieldPreview = (field: FormField) => {
    const baseClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none";
    
    switch (field.fieldType) {
      case 'TEXT':
        return (
          <input
            type="text"
            className={baseClasses}
            placeholder={`Nhập ${field.label.toLowerCase()}`}
            disabled
            style={{ backgroundColor: '#f9fafb', color: '#6b7280' }}
          />
        );
      case 'EMAIL':
        return (
          <input
            type="email"
            className={baseClasses}
            placeholder="example@email.com"
            disabled
            style={{ backgroundColor: '#f9fafb', color: '#6b7280' }}
          />
        );
      case 'TEXTAREA':
        return (
          <textarea
            className={`${baseClasses} h-20 resize-none`}
            placeholder={`Nhập ${field.label.toLowerCase()}`}
            disabled
            style={{ backgroundColor: '#f9fafb', color: '#6b7280' }}
          />
        );
      case 'SELECT':
        const options = field.options ? field.options.split(',').map(opt => opt.trim()) : [];
        return (
          <select 
            className={`${baseClasses} bg-gray-50 text-gray-500`} 
            disabled
            style={{ backgroundColor: '#f9fafb', color: '#6b7280' }}
          >
            <option value="">Chọn {field.label.toLowerCase()}</option>
            {options.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'RADIO':
        const radioOptions = field.options ? field.options.split(',').map(opt => opt.trim()) : [];
        return (
          <div className="space-y-2">
            {radioOptions.map((option, index) => (
              <label key={index} className="flex items-center text-gray-500">
                <input
                  type="radio"
                  name={field.name}
                  className="mr-2"
                  disabled
                />
                {option}
              </label>
            ))}
          </div>
        );
      case 'CHECKBOX':
        const checkboxOptions = field.options ? field.options.split(',').map(opt => opt.trim()) : [];
        return (
          <div className="space-y-2">
            {checkboxOptions.map((option, index) => (
              <label key={index} className="flex items-center text-gray-500">
                <input
                  type="checkbox"
                  className="mr-2"
                  disabled
                />
                {option}
              </label>
            ))}
          </div>
        );
      default:
        return (
          <input
            type="text"
            className={baseClasses}
            placeholder={`Nhập ${field.label.toLowerCase()}`}
            disabled
            style={{ backgroundColor: '#f9fafb', color: '#6b7280' }}
          />
        );
    }
  };

  const handleSave = async (status: 'PUBLISH' | 'DRAFT' = 'PUBLISH') => {
    try {
      if (status === 'PUBLISH') {
        setSaving(true);
      } else {
        setSavingDraft(true);
      }
      
      // Validate that all fields have names
      const fieldsWithoutNames = fields.filter(field => !field.name || field.name.trim() === '');
      if (fieldsWithoutNames.length > 0) {
        alert("Tất cả các trường phải có tên. Vui lòng kiểm tra lại các câu hỏi.");
        if (status === 'PUBLISH') {
          setSaving(false);
        } else {
          setSavingDraft(false);
        }
        return;
      }
      
      const requestData = {
        name: title,
        description: description,
        formType: "CLUB_REGISTRATION",
        status: status,
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

      let response;
      if (id === 'new') {
        // Tạo form mới
        response = await apiService.post<any>(API_ENDPOINTS.APPLICATION_FORMS.CREATE, requestData);
      } else {
        // Cập nhật form cũ
        response = await apiService.put<any>(API_ENDPOINTS.APPLICATION_FORMS.BY_TYPE('CLUB_REGISTRATION'), requestData);
      }
      
      if (response.success) {
        const message = status === 'PUBLISH' ? "Đã lưu và publish thành công!" : "Đã lưu bản nháp thành công!";
        alert(message);
      } else {
        alert("Lỗi khi lưu: " + (response.message || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Error saving form:", error);
      alert("Lỗi khi lưu: " + (error?.message || "Network error"));
    } finally {
      if (status === 'PUBLISH') {
        setSaving(false);
      } else {
        setSavingDraft(false);
      }
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
            <button 
              onClick={openPreview}
              className="rounded-md border px-3 py-2 text-[13px] text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Xem trước
            </button>
            <button 
              onClick={() => handleSave('DRAFT')} 
              disabled={savingDraft || saving}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-[13px] font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {savingDraft ? "Đang lưu..." : "Save Draft"}
            </button>
            <button 
              onClick={() => handleSave('PUBLISH')} 
              disabled={saving || savingDraft}
              className="rounded-md bg-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white shadow hover:bg-[#1f4ec3] disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : (id === 'new' ? "TẠO & PUBLISH" : "SỬA & PUBLISH")}
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
                                <div className="mb-1 text-xs font-medium text-gray-700">Tên trường (Field Name)</div>
                                <input
                                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none"
                                  value={f.name}
                                  onChange={(e) => handleChangeField(f.id, { name: e.target.value })}
                                  placeholder="Tên trường sẽ tự động tạo từ câu hỏi"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                  Tên trường dùng để lưu dữ liệu (ví dụ: ho_ten, email, so_dien_thoai)
                                </p>
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

      {/* Preview Modal */}
      {showPreview && (
        <div 
          className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${
            isAnimating 
              ? 'bg-black bg-opacity-50' 
              : 'bg-black bg-opacity-0'
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closePreview();
            }
          }}
        >
          <div 
            className={`w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden mx-4 transition-all duration-300 transform ${
              isAnimating 
                ? 'translate-y-0 opacity-100 scale-100' 
                : 'translate-y-8 opacity-0 scale-95'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">Xem trước form</h2>
              <button
                onClick={closePreview}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-white">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{title || "Form đăng ký câu lạc bộ"}</h3>
                {description && (
                  <p className="text-gray-600 mb-4">{description}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Đăng ký câu lạc bộ
                  </span>
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                    Bản nháp (Draft)
                  </span>
                  {endDate && (
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      Hết hạn: {new Date(endDate).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
              </div>

              <form className="space-y-6">
                {fields
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((field, index) => (
                    <div key={field.id} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {index + 1}. {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {renderFieldPreview(field)}
                      {field.required && (
                        <p className="text-xs text-red-500">Trường bắt buộc</p>
                      )}
                    </div>
                  ))}

                {/* Submit Button Preview */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled
                  >
                    Gửi đăng ký
                  </button>
                  <p className="mt-2 text-sm text-gray-500">
                    Nút này sẽ hoạt động khi form được publish
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
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


