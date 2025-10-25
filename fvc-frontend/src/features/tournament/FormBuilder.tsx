import React, { useEffect, useState } from "react";
import FormPreviewModal from "./FormPreviewModal";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import type { PaginationResponse } from "../../types/api";
import { useToast } from "../../components/common/ToastContext";
<<<<<<< Updated upstream
import {
  XMarkIcon,
  PlusIcon,
  ChevronDownIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
=======
import { validateLength, validateRequired } from "../../utils/validation";
>>>>>>> Stashed changes

interface FormData {
  competitionType: string;
  competitionName: string;
  title: string;
  description: string;
  fullName: string;
  email: string;
  gender: string;
  competitionContent: string[];
  studentId: string;
  club: string;
  coachName: string;
  coachRequired: boolean;
  phoneNumber: string;
  phoneRequired: boolean;
  weightClass?: string;
  quyenCategory?: string;
  quyenContent?: string;
  musicCategory?: string;
}

type QuestionType =
  | "short-answer"
  | "dropdown"
  | "multiple-choice"
  | "checkbox"
  | "date"
  | "file-upload";

interface QuestionItem {
  id: string;
  type: QuestionType;
  label: string;
  options?: string[];
}

const FormBuilder: React.FC = () => {
  const navigate = useNavigate();
  // const { id: _editingId } = useParams<{ id: string }>();
  const toast = useToast();
  const [formData, setFormData] = useState<FormData>({
    competitionType: "competition",
    competitionName: "PVOUP 2025 - Spring",
    title: "Đăng Ký Giải Vovinam 2025",
    description:
      "Form dành cho sinh viên tham gia giải Vovinam 2025 tại FPTU Hà Nội.",
    fullName: "",
    email: "",
    gender: "male",
    competitionContent: [],
    studentId: "",
    club: "FPTU Vovinam Club",
    coachName: "Nguyễn Lan",
    coachRequired: false,
    phoneNumber: "0123456789",
    phoneRequired: false,
    weightClass: "",
    quyenCategory: "",
    quyenContent: "",
    musicCategory: "",
  });

  const [showPreview, setShowPreview] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [competitionId, setCompetitionId] = useState<string>("");
  const [competitions, setCompetitions] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const [weightClasses, setWeightClasses] = useState<
    Array<{
      id: string;
      weightClass: string;
      gender: string;
      minWeight: number;
      maxWeight: number;
    }>
  >([]);

  const [fistConfigs, setFistConfigs] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const [fistItems, setFistItems] = useState<
    Array<{ id: string; name: string; configId?: string; parentId?: string }>
  >([]);

  const [musicContents, setMusicContents] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const [submitting, setSubmitting] = useState(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load competitions
        const competitionsRes = await api.get<
          PaginationResponse<{ id: string; name: string }>
        >(API_ENDPOINTS.COMPETITIONS.BASE);
        setCompetitions(competitionsRes.data.content || []);
        if (
          competitionsRes.data.content &&
          competitionsRes.data.content.length > 0
        ) {
          setCompetitionId(competitionsRes.data.content[0].id.toString());
        }

        // Load weight classes
        const weightClassesRes = await api.get<{
          content: Array<{
            id: string;
            weightClass: string;
            gender: string;
            minWeight: number;
            maxWeight: number;
          }>;
          totalElements: number;
        }>(API_ENDPOINTS.WEIGHT_CLASSES.BASE);
        setWeightClasses(weightClassesRes.data?.content || []);

        // Load fist configs (Đa luyện, Đơn luyện)
        const fistConfigsRes = await api.get<{
          content: Array<{ id: string; name: string }>;
          totalElements: number;
        }>(API_ENDPOINTS.FIST_CONTENTS.BASE);
        setFistConfigs(fistConfigsRes.data?.content || []);

        // Load fist items (Đơn luyện 1, Đơn luyện 2, etc.)
        const fistItemsRes = await api.get<{
          content: Array<{ id: string; name: string }>;
          totalElements: number;
        }>(API_ENDPOINTS.FIST_CONTENTS.ITEMS);
        setFistItems(fistItemsRes.data?.content || []);

        // Load music contents
        const musicContentsRes = await api.get<{
          content: Array<{ id: string; name: string }>;
          totalElements: number;
        }>(API_ENDPOINTS.MUSIC_CONTENTS.BASE);
        setMusicContents(musicContentsRes.data?.content || []);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Không thể tải dữ liệu");
      }
    };

    loadData();
  }, [toast]);

  // Validation logic
  const titleValidation = useMemo(() => {
    const requiredValidation = validateRequired(formData.title, "Tiêu đề");
    if (!requiredValidation.isValid) return requiredValidation;
    return validateLength(formData.title, {
      min: 1,
      max: 200,
      fieldName: "Tiêu đề",
    });
  }, [formData.title]);

  const descriptionValidation = useMemo(() => {
    const requiredValidation = validateRequired(formData.description, "Mô tả");
    if (!requiredValidation.isValid) return requiredValidation;
    return validateLength(formData.description, {
      min: 1,
      max: 1000,
      fieldName: "Mô tả",
    });
  }, [formData.description]);

  const isFormValid =
    titleValidation.isValid &&
    descriptionValidation.isValid &&
    formData.competitionType !== "";

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleQuestionChange = (
    questionId: string,
    field: keyof QuestionItem,
    value: string | string[]
  ) => {
    console.log("Changing question:", { questionId, field, value });
    setQuestions((prev) => {
      const updated = prev.map((q) =>
        q.id === questionId ? { ...q, [field]: value } : q
      );
      console.log("Updated questions after change:", updated);
      return updated;
    });
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion: QuestionItem = {
      id: Date.now().toString(),
      type,
      label: "",
      options:
        type === "short-answer" || type === "date" || type === "file-upload"
          ? []
          : ["Tùy chọn 1"],
    };
    console.log("Adding new question:", newQuestion);
    setQuestions((prev) => {
      const updated = [...prev, newQuestion];
      console.log("Updated questions state:", updated);
      return updated;
    });
    setShowAddQuestion(false);
  };

  const removeQuestion = (questionId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    try {
      if (!competitionId) {
        toast.error("Vui lòng chọn giải đấu");
        return;
      }

      if (!isFormValid) {
        if (formData.competitionType === "") {
          toast.error("Vui lòng chọn nội dung thi đấu");
        } else {
          toast.error("Vui lòng kiểm tra lại thông tin tiêu đề và mô tả");
        }
        return;
      }

      const payload = {
        name: formData.title,
        description: formData.description,
        formType: "COMPETITION_REGISTRATION",
        competitionId: competitionId,
        status: "DRAFT",
        fields: [
          // Standard fields
          {
            label: "Họ và tên",
            fieldType: "TEXT",
            required: true,
            name: "fullName",
            options: null,
            sortOrder: 1,
          },
          {
            label: "Email",
            fieldType: "TEXT",
            required: true,
            name: "email",
            options: null,
            sortOrder: 2,
          },
          {
            label: "MSSV",
            fieldType: "TEXT",
            required: true,
            name: "studentId",
            options: null,
            sortOrder: 3,
          },
          {
            label: "Số điện thoại",
            fieldType: "TEXT",
            required: false,
            name: "phoneNumber",
            options: null,
            sortOrder: 4,
          },
          {
            label: "Giới tính",
            fieldType: "DROPDOWN",
            required: true,
            name: "gender",
            options: JSON.stringify(["Nam", "Nữ", "Khác"]),
            sortOrder: 5,
          },
          {
            label: "Câu lạc bộ",
            fieldType: "TEXT",
            required: false,
            name: "club",
            options: null,
            sortOrder: 6,
          },
          // Custom questions
          ...questions.map((q, index) => ({
            label: q.label,
            name: q.id,
            fieldType: q.type.toUpperCase(),
            required: true,
            options:
              q.options && q.options.length > 0
                ? JSON.stringify(q.options)
                : null,
            sortOrder: 7 + index,
          })),
          {
            label: "Nội dung thi đấu",
            fieldType: "RADIO",
            required: true,
            name: "competitionType",
            options: JSON.stringify(["Đối kháng", "Quyền", "Võ nhạc"]),
            sortOrder: 7 + questions.length,
          },
        ],
      };

      console.log("Questions state (draft):", questions);
      console.log("Questions length (draft):", questions.length);
      console.log(
        "Custom questions in payload (draft):",
        payload.fields.filter((f) => f.sortOrder > 6)
      );
      console.log("Saving draft with payload:", payload);
      await api.post(API_ENDPOINTS.TOURNAMENT_FORMS.BASE, payload);
      toast.success("Đã lưu nháp thành công");
      navigate(-1);
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Không thể lưu nháp");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAndPublish = async () => {
    setSubmitting(true);
    try {
      if (!competitionId) {
        toast.error("Vui lòng chọn giải đấu");
        return;
      }

      if (!isFormValid) {
        if (formData.competitionType === "") {
          toast.error("Vui lòng chọn loại thi đấu");
        } else {
          toast.error("Vui lòng kiểm tra lại thông tin tiêu đề và mô tả");
        }
        return;
      }

      const payload = {
        name: formData.title,
        description: formData.description,
        formType: "COMPETITION_REGISTRATION",
        competitionId: competitionId,
        status: "PUBLISH",
        fields: [
          // Standard fields
          {
            label: "Họ và tên",
            fieldType: "TEXT",
            required: true,
            name: "fullName",
            options: null,
            sortOrder: 1,
          },
          {
            label: "Email",
            fieldType: "TEXT",
            required: true,
            name: "email",
            options: null,
            sortOrder: 2,
          },
          {
            label: "MSSV",
            fieldType: "TEXT",
            required: true,
            name: "studentId",
            options: null,
            sortOrder: 3,
          },
          {
            label: "Số điện thoại",
            fieldType: "TEXT",
            required: false,
            name: "phoneNumber",
            options: null,
            sortOrder: 4,
          },
          {
            label: "Giới tính",
            fieldType: "DROPDOWN",
            required: true,
            name: "gender",
            options: JSON.stringify(["Nam", "Nữ", "Khác"]),
            sortOrder: 5,
          },
          {
            label: "Câu lạc bộ",
            fieldType: "TEXT",
            required: false,
            name: "club",
            options: null,
            sortOrder: 6,
          },
          // Custom questions
          ...questions.map((q, index) => ({
            label: q.label,
            name: q.id,
            fieldType: q.type.toUpperCase(),
            required: true,
            options:
              q.options && q.options.length > 0
                ? JSON.stringify(q.options)
                : null,
            sortOrder: 7 + index,
          })),
          {
            label: "Nội dung thi đấu",
            fieldType: "RADIO",
            required: true,
            name: "competitionType",
            options: JSON.stringify(["Đối kháng", "Quyền", "Võ nhạc"]),
            sortOrder: 7 + questions.length,
          },
        ],
      };

      console.log("Questions state:", questions);
      console.log("Questions length:", questions.length);
      console.log(
        "Custom questions in payload:",
        payload.fields.filter((f) => f.sortOrder > 6)
      );
      console.log("Saving and publishing with payload:", payload);
      await api.post(API_ENDPOINTS.TOURNAMENT_FORMS.BASE, payload);
      toast.success("Đã lưu và xuất bản thành công");
      navigate(-1);
    } catch (error) {
      console.error("Error saving and publishing:", error);
      toast.error("Không thể lưu và xuất bản");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Quay lại
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            Tạo Form <span className="text-sm text-gray-500">CLB</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Xem trước
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {submitting ? "Đang lưu..." : "Lưu nháp"}
          </button>
          <button
            onClick={handleSaveAndPublish}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {submitting ? "Đang lưu..." : "Lưu & Publish"}
          </button>
        </div>
      </div>

<<<<<<< Updated upstream
                  // Enforce one form per competition on client (best-effort); server also checks
                  try {
                    const check = await api.get<
                      PaginationResponse<{ id: string; competitionId: string }>
                    >(API_ENDPOINTS.TOURNAMENT_FORMS.BASE, {
                      page: 0,
                      size: 100,
                    });
                    const hasForm = check.data.content.some(
                      (f: { id: string; competitionId: string }) =>
                        f.competitionId === competitionId
                    );
                    if (!editingId && hasForm) {
                      toast.error(
                        "Giải đấu này đã có form rồi. Không thể tạo thêm form mới."
                      );
                      return;
                    }
                  } catch {
                    // ignore network error; backend will still enforce
                  }

                  // Validate custom questions: require non-empty label AND non-empty options for non short-answer
                  const invalidQuestions = questions.filter((q) => {
                    if (!q.label || !q.label.trim()) return true;
                    if (q.type === "short-answer") return false;
                    const cleaned = (q.options ?? []).map((o) =>
                      (o ?? "").trim()
                    );
                    return (
                      cleaned.length === 0 ||
                      cleaned.every((o) => o.length === 0)
                    );
                  });

                  if (invalidQuestions.length > 0) {
                    toast.error(
                      "Vui lòng điền đầy đủ nội dung cho tất cả câu hỏi tùy chỉnh."
                    );
                    return;
                  }

                  try {
                    setSubmitting(true);
                    const body = {
                      name: formData.title,
                      description: formData.description,
                      formType:
                        formData.competitionType === "competition" ||
                        formData.competitionType === "fighting" ||
                        formData.competitionType === "quyen" ||
                        formData.competitionType === "music"
                          ? "COMPETITION_REGISTRATION"
                          : "CLUB_REGISTRATION",
                      competitionId,
                      fields: questions.map((q) => ({
                        id: q.id,
                        label: q.label,
                        name: q.label,
                        fieldType:
                          q.type === "short-answer"
                            ? "TEXT"
                            : q.type === "dropdown"
                            ? "SELECT"
                            : q.type === "multiple-choice"
                            ? "RADIO"
                            : "CHECKBOX",
                        required: false, // Assuming required is handled by formData
                        options:
                          q.type === "short-answer"
                            ? undefined
                            : JSON.stringify(
                                (q.options ?? [])
                                  .map((o) => (o ?? "").trim())
                                  .filter((o) => o.length > 0)
                              ),
                        sortOrder: questions.findIndex((it) => it.id === q.id),
                      })),
                    };
                    if (editingId) {
                      await api.put(`/v1/tournament-forms/${editingId}`, {
                        ...body,
                        status: "DRAFT",
                      });
                      const snapNow = JSON.stringify(questions);
                      sessionStorage.setItem(snapshotKey, snapNow);
                      window.dispatchEvent(new Event("forms:changed"));
                    } else {
                      await api.post(`/v1/tournament-forms`, body);
                      const snapNow = JSON.stringify(questions);
                      sessionStorage.setItem(snapshotKey, snapNow);
                      window.dispatchEvent(new Event("forms:changed"));
                    }
                    toast.success("Lưu thành công");
                    navigate(-1);
                  } catch (err) {
                    console.error(err);
                    toast.error("Lưu nháp thất bại");
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 shadow-sm"
              >
                Lưu nháp
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  if (!competitionId) {
                    toast.error("Vui lòng chọn giải đấu");
                    return;
                  }

                  // Enforce one form per competition on client (best-effort); server also checks
                  try {
                    const check = await api.get<
                      PaginationResponse<{ id: string; competitionId: string }>
                    >(API_ENDPOINTS.TOURNAMENT_FORMS.BASE, {
                      page: 0,
                      size: 100,
                    });
                    const hasForm = check.data.content.some(
                      (f: { id: string; competitionId: string }) =>
                        f.competitionId === competitionId
                    );
                    if (!editingId && hasForm) {
                      toast.error(
                        "Giải đấu này đã có form rồi. Không thể tạo thêm form mới."
                      );
                      return;
                    }
                  } catch {
                    // ignore network error; backend will still enforce
                  }

                  // Validate custom questions: require non-empty label AND non-empty options for non short-answer
                  const invalidQuestions = questions.filter((q) => {
                    if (!q.label || !q.label.trim()) return true;
                    if (q.type === "short-answer") return false;
                    const cleaned = (q.options ?? []).map((o) =>
                      (o ?? "").trim()
                    );
                    return (
                      cleaned.length === 0 ||
                      cleaned.every((o) => o.length === 0)
                    );
                  });

                  if (invalidQuestions.length > 0) {
                    toast.error(
                      "Vui lòng điền đầy đủ nội dung cho tất cả câu hỏi tùy chỉnh."
                    );
                    return;
                  }

                  try {
                    setSubmitting(true);
                    const body = {
                      name: formData.title,
                      description: formData.description,
                      formType:
                        formData.competitionType === "competition" ||
                        formData.competitionType === "fighting" ||
                        formData.competitionType === "quyen" ||
                        formData.competitionType === "music"
                          ? "COMPETITION_REGISTRATION"
                          : "CLUB_REGISTRATION",
                      competitionId,
                      fields: questions.map((q) => ({
                        id: q.id,
                        label: q.label,
                        name: q.label,
                        fieldType:
                          q.type === "short-answer"
                            ? "TEXT"
                            : q.type === "dropdown"
                            ? "SELECT"
                            : q.type === "multiple-choice"
                            ? "RADIO"
                            : "CHECKBOX",
                        required: false, // Assuming required is handled by formData
                        options:
                          q.type === "short-answer"
                            ? undefined
                            : JSON.stringify(
                                (q.options ?? [])
                                  .map((o) => (o ?? "").trim())
                                  .filter((o) => o.length > 0)
                              ),
                        sortOrder: questions.findIndex((it) => it.id === q.id),
                      })),
                    };
                    if (editingId) {
                      await api.put(`/v1/tournament-forms/${editingId}`, {
                        ...body,
                        status: "PUBLISH",
                      });
                      const snapNow = JSON.stringify(questions);
                      sessionStorage.setItem(snapshotKey, snapNow);
                      window.dispatchEvent(new Event("forms:changed"));
                    } else {
                      await api.post(`/v1/tournament-forms`, body);
                      const snapNow = JSON.stringify(questions);
                      sessionStorage.setItem(snapshotKey, snapNow);
                      window.dispatchEvent(new Event("forms:changed"));
                    }
                    toast.success("Lưu thành công");
                    navigate(-1);
                  } catch (err) {
                    console.error(err);
                    toast.error("Lưu thất bại");
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="rounded-lg bg-[#377CFB] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2e6de0] disabled:opacity-60"
              >
                {submitting ? "Đang lưu..." : "Lưu & Publish"}
              </button>
            </div>
=======
      {/* Form Builder */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Competition Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn Giải
            </label>
            <select
              value={competitionId}
              onChange={(e) => setCompetitionId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Chọn giải đấu</option>
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
>>>>>>> Stashed changes
          </div>

          {/* Form Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Nhập tiêu đề form"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {!titleValidation.isValid && (
              <p className="mt-1 text-sm text-red-600">
                {titleValidation.errorMessage}
              </p>
            )}
          </div>

          {/* Form Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Nhập mô tả form"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            {!descriptionValidation.isValid && (
              <p className="mt-1 text-sm text-red-600">
                {descriptionValidation.errorMessage}
              </p>
            )}
          </div>

          {/* Standard Fields */}
          <div className="mt-4 space-y-2">
            {/* Full Name */}
            <div className="rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-gray-400 cursor-not-allowed">✖</div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={true}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled
                      />
                      Required
                    </label>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 text-xs font-medium text-gray-700">
                      Nhãn câu hỏi
                    </div>
                    <input
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none"
                      value="Họ và tên"
                      disabled
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium text-gray-700">
                      Ghi chú
                    </div>
                    <div className="rounded-md border border-gray-300 bg-gray-50 p-3">
                      <input
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
                        placeholder="Nhập câu trả lời"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

<<<<<<< Updated upstream
            <div className="bg-white rounded-lg shadow-sm border border-[#EEF2FF] p-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tiêu đề
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="w-full bg-white border border-gray-400 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#EEF2FF] p-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mô tả
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
                className="w-full bg-white border border-gray-400 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#EEF2FF] p-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Họ và tên
              </label>
              <p className="text-sm text-gray-500 mb-2">Nhập họ và tên</p>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                className="w-full bg-white border border-gray-400 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#EEF2FF] p-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <p className="text-sm text-gray-500 mb-2">Nhập email</p>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full bg-white border border-gray-400 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#EEF2FF] p-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Giới tính
              </label>
              <p className="text-sm text-gray-500 mb-2">Chọn giới tính</p>
              <div className="flex space-x-4">
                {["male", "female", "other"].map((gender) => (
                  <label key={gender} className="flex items-center">
=======
            {/* Email */}
            <div className="rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-gray-400 cursor-not-allowed">✖</div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={true}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled
                      />
                      Required
                    </label>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 text-xs font-medium text-gray-700">
                      Nhãn câu hỏi
                    </div>
>>>>>>> Stashed changes
                    <input
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none"
                      value="Email"
                      disabled
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium text-gray-700">
                      Ghi chú
                    </div>
                    <div className="rounded-md border border-gray-300 bg-gray-50 p-3">
                      <input
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
                        placeholder="Nhập câu trả lời"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Student ID */}
            <div className="rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-gray-400 cursor-not-allowed">✖</div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={true}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled
                      />
                      Required
                    </label>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 text-xs font-medium text-gray-700">
                      Nhãn câu hỏi
                    </div>
                    <input
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none"
                      value="MSSV"
                      disabled
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium text-gray-700">
                      Ghi chú
                    </div>
                    <div className="rounded-md border border-gray-300 bg-gray-50 p-3">
                      <input
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
                        placeholder="Nhập câu trả lời"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div className="rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-gray-400 cursor-not-allowed">✖</div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={false}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled
                      />
                      Required
                    </label>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 text-xs font-medium text-gray-700">
                      Nhãn câu hỏi
                    </div>
                    <input
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none"
                      value="Số điện thoại"
                      disabled
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium text-gray-700">
                      Ghi chú
                    </div>
                    <div className="rounded-md border border-gray-300 bg-gray-50 p-3">
                      <input
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
                        placeholder="Nhập câu trả lời"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gender */}
            <div className="rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-gray-400 cursor-not-allowed">✖</div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={true}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled
                      />
                      Required
                    </label>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 text-xs font-medium text-gray-700">
                      Nhãn câu hỏi
                    </div>
                    <input
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none"
                      value="Giới tính"
                      disabled
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium text-gray-700">
                      Ghi chú
                    </div>
                    <div className="rounded-md border border-gray-300 bg-gray-50 p-3">
                      <select
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
                        disabled
                      >
                        <option>Chọn giới tính</option>
                        <option>Nam</option>
                        <option>Nữ</option>
                        <option>Khác</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Club */}
            <div className="rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-gray-400 cursor-not-allowed">✖</div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={false}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled
                      />
                      Required
                    </label>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 text-xs font-medium text-gray-700">
                      Nhãn câu hỏi
                    </div>
                    <input
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none"
                      value="Câu lạc bộ"
                      disabled
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium text-gray-700">
                      Ghi chú
                    </div>
                    <div className="rounded-md border border-gray-300 bg-gray-50 p-3">
                      <input
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
                        placeholder="Nhập câu trả lời"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Competition Type Selection */}
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Nội dung thi đấu *
            </label>
            <div className="space-y-3">
              {/* Fighting Option */}
              <div>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="competitionType"
                    value="fighting"
                    checked={formData.competitionType === "fighting"}
                    onChange={(e) =>
                      handleInputChange("competitionType", e.target.value)
                    }
                    className="mr-3"
                  />
                  <span className="text-sm font-medium">Đối kháng</span>
                </label>
                <div className="ml-6 mt-2">
                  <label className="block text-sm text-gray-600 mb-1">
                    Hạng cân
                  </label>
                  <select
                    value={formData.weightClass || ""}
                    onChange={(e) =>
                      handleInputChange("weightClass", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn hạng cân</option>
                    {weightClasses.map((wc) => (
                      <option key={wc.id} value={wc.id}>
                        {wc.weightClass} ({wc.gender}) - {wc.minWeight}-
                        {wc.maxWeight}kg
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quyen Option */}
              <div>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="competitionType"
                    value="quyen"
                    checked={formData.competitionType === "quyen"}
                    onChange={(e) =>
                      handleInputChange("competitionType", e.target.value)
                    }
                    className="mr-3"
                  />
                  <span className="text-sm font-medium">Quyền</span>
                </label>
                <div className="ml-6 mt-2">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    {fistItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          handleInputChange("quyenCategory", item.id)
                        }
                        className={`rounded-full border px-3 py-1.5 text-xs ${
                          formData.quyenCategory === item.id
                            ? "border-blue-500 text-blue-600 bg-blue-50"
                            : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                        }`}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm text-gray-600 mb-1">
                      Nội dung thi đấu
                    </label>
                    <select
                      value={formData.quyenContent || ""}
                      onChange={(e) =>
                        handleInputChange("quyenContent", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Chọn nội dung thi đấu</option>
                      {(() => {
                        // If no category selected, show nothing
                        if (!formData.quyenCategory) {
                          return null;
                        }

                        // Find the selected item (fistItem)
                        const selectedItem = fistItems.find(
                          (item) => item.id === formData.quyenCategory
                        );

                        // If item selected, show fistConfigs that match item's configId
                        const filteredConfigs =
                          selectedItem && selectedItem.configId
                            ? fistConfigs.filter(
                                (config) => config.id === selectedItem.configId
                              )
                            : [];

                        return (
                          filteredConfigs &&
                          filteredConfigs.length > 0 &&
                          filteredConfigs.map((config) => (
                            <option key={config.id} value={config.id}>
                              {config.name}
                            </option>
                          ))
                        );
                      })()}
                    </select>
                  </div>
                </div>
              </div>

              {/* Music Option */}
              <div>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="competitionType"
                    value="music"
                    checked={formData.competitionType === "music"}
                    onChange={(e) =>
                      handleInputChange("competitionType", e.target.value)
                    }
                    className="mr-3"
                  />
                  <span className="text-sm font-medium">Võ nhạc</span>
                </label>
                <div className="ml-6 mt-2">
                  <label className="block text-sm text-gray-600 mb-1">
                    Nội dung thi đấu
                  </label>
                  <select
                    value={formData.musicCategory || ""}
                    onChange={(e) =>
                      handleInputChange("musicCategory", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn nội dung thi đấu</option>
                    {musicContents.map((content) => (
                      <option key={content.id} value={content.id}>
                        {content.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="mt-6 space-y-2">
            {questions.map((question) => (
              <div
                key={question.id}
                className="rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-gray-400 cursor-move">⋮⋮</div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        Required
                      </label>
                      <button
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 text-xs font-medium text-gray-700">
                        Nhãn câu hỏi
                      </div>
                      <input
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none"
                        value={question.label}
                        onChange={(e) =>
                          handleQuestionChange(
                            question.id,
                            "label",
                            e.target.value
                          )
                        }
                        placeholder="Nhập câu hỏi"
                      />
                    </div>
                    <div>
                      <div className="mb-1 text-xs font-medium text-gray-700">
                        Ghi chú
                      </div>
                      <div className="rounded-md border border-gray-300 bg-gray-50 p-3">
                        {question.type === "short-answer" && (
                          <input
                            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
                            placeholder="Nhập câu trả lời"
                          />
                        )}
                        {question.type === "date" && (
                          <input
                            type="date"
                            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
                          />
                        )}
                        {question.type === "multiple-choice" && (
                          <select className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm">
                            <option>Chọn một tùy chọn</option>
                            {question.options?.map((option, idx) => (
                              <option key={idx} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )}
                        {question.type === "checkbox" && (
                          <div className="space-y-3">
                            {question.options?.map((option, idx) => (
                              <div key={idx} className="block">
                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300"
                                  />
                                  <span className="text-gray-700">
                                    {option}
                                  </span>
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                        {question.type === "file-upload" && (
                          <div className="space-y-2">
                            <input
                              type="file"
                              className="w-full text-sm text-gray-500"
                            />
                            <span className="text-sm text-gray-500">
                              Chọn file để tải lên
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Options Editor for Multiple Choice and Checkbox */}
                    {(question.type === "multiple-choice" ||
                      question.type === "checkbox") && (
                      <div>
                        <div className="mb-1 text-xs font-medium text-gray-700">
                          Tùy chọn
                        </div>
                        <div className="space-y-2">
                          {question.options?.map((option, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [
                                    ...(question.options || []),
                                  ];
                                  newOptions[idx] = e.target.value;
                                  handleQuestionChange(
                                    question.id,
                                    "options",
                                    newOptions
                                  );
                                }}
                                className="flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none"
                                placeholder={`Tùy chọn ${idx + 1}`}
                              />
                              <button
                                onClick={() => {
                                  const newOptions =
                                    question.options?.filter(
                                      (_, i) => i !== idx
                                    ) || [];
                                  handleQuestionChange(
                                    question.id,
                                    "options",
                                    newOptions
                                  );
                                }}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newOptions = [
                                ...(question.options || []),
                                "",
                              ];
                              handleQuestionChange(
                                question.id,
                                "options",
                                newOptions
                              );
                            }}
                            className="text-blue-500 hover:text-blue-700 text-sm"
                          >
                            + Thêm tùy chọn
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add Question Button */}
            <div className="mt-4 relative">
              <button
                className="rounded-md border border-dashed border-gray-300 bg-white px-3 py-2 text-[13px] font-medium text-[#2563eb] hover:bg-blue-50"
                onClick={() => setShowAddQuestion(!showAddQuestion)}
              >
                + Thêm câu hỏi
              </button>

              {showAddQuestion && (
                <div className="absolute top-full left-0 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg z-10">
                  <div className="p-2">
                    <div className="text-xs font-semibold text-gray-600 mb-2">
                      LOẠI CÂU HỎI
                    </div>
                    <div className="space-y-1">
                      <button
                        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-gray-100"
                        onClick={() => addQuestion("short-answer")}
                      >
                        <span>≡</span>
                        <span>Short answer</span>
                      </button>
                      <button
                        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-gray-100"
                        onClick={() => addQuestion("date")}
                      >
                        <span>📅</span>
                        <span>Date</span>
                      </button>
                      <button
                        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-gray-100"
                        onClick={() => addQuestion("multiple-choice")}
                      >
                        <span>☰</span>
                        <span>Multiple choice</span>
                      </button>
                      <button
                        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-gray-100"
                        onClick={() => addQuestion("checkbox")}
                      >
                        <span>☑</span>
                        <span>Checkboxes</span>
                      </button>
                      <button
                        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-gray-100"
                        onClick={() => addQuestion("file-upload")}
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
      {/* Preview Modal */}
      {showPreview && (
        <FormPreviewModal
          open={showPreview}
          onClose={() => setShowPreview(false)}
          data={{
            title: formData.title,
            description: formData.description,
            fullName: formData.fullName,
            email: formData.email,
            studentId: formData.studentId,
            club: formData.club,
            gender: formData.gender,
            competitionType: formData.competitionType,
            weightClass: formData.weightClass,
            quyenCategory: formData.quyenCategory,
            musicCategory: formData.musicCategory,
            coachName: formData.coachName,
            phoneNumber: formData.phoneNumber,
            phoneRequired: formData.phoneRequired,
            questions: questions,
          }}
        />
      )}
    </div>
  );
};

export default FormBuilder;
