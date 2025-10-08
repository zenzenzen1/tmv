import React, { useEffect, useState } from "react";
import FormPreviewModal from "./FormPreviewModal";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import type { PaginationResponse } from "../../types/api";
import {
  XMarkIcon,
  PlusIcon,
  ChevronDownIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";

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
  musicCategory?: string;
}

type QuestionType =
  | "short-answer"
  | "dropdown"
  | "multiple-choice"
  | "checkbox";

interface QuestionItem {
  id: string;
  type: QuestionType;
  label: string;
  options?: string[]; // for dropdown/multiple/checkbox
  selectedOptionIndex?: number; // for multiple-choice
  selectedOptionIndexes?: number[]; // for checkbox
}

const FormBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { id: editingId } = useParams<{ id: string }>();
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
    musicCategory: "",
  });

  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [previewFileName] = useState<string>("Chưa có tệp");
  const [competitionId, setCompetitionId] = useState<string>("");
  const [competitions, setCompetitions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const snapshotKey = `formBuilder:snapshot:${editingId ?? "new"}`;
  const discardedKey = `formBuilder:discarded:${editingId ?? "new"}`;
  // no baseline state kept; we read snapshot from sessionStorage when needed
  // Preview-only local select state
  // Removed local preview musicCategory state after extracting modal

  const handleInputChange = (
    field: keyof FormData,
    value: string | string[] | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const removeField = (field: "coachName" | "phoneNumber") => {
    if (field === "coachName") {
      setFormData((prev) => ({ ...prev, coachName: "", coachRequired: false }));
    } else {
      setFormData((prev) => ({
        ...prev,
        phoneNumber: "",
        phoneRequired: false,
      }));
    }
  };

  const questionTypes = [
    { id: "short-answer", label: "Short answer", icon: "📝" },
    { id: "dropdown", label: "Dropdown", icon: "▾" },
    { id: "multiple-choice", label: "Multiple choice", icon: "🔘" },
    { id: "checkbox", label: "Checkbox", icon: "☑️" },
  ];

  const weightClasses = [
    "Chọn hạng cân của bạn",
    "-45 kg",
    "45 - 50 kg",
    "50 - 55 kg",
    "55 - 60 kg",
    "60 - 65 kg",
    "> 65 kg",
  ];
  const quyenCategories = ["Đơn luyện", "Đa luyện", "Song Luyện", "Đồng Đội"];

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<Array<{ id: string; name: string }>>(
          `/tournament-forms/competitions`
        );
        setCompetitions(res.data);
        if (!competitionId && res.data.length > 0) {
          setCompetitionId(res.data[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    })();

    // removed duplicate-form fetch/validation per latest request
  }, [competitionId]);

  useEffect(() => {
    if (!editingId) return;
    (async () => {
      try {
        const res = await api.get<{
          id: string;
          name: string;
          description: string;
          formType: string;
          competitionId: string;
          fields?: Array<{
            id: string;
            label: string;
            name: string;
            fieldType: string;
            required: boolean;
            options?: string;
            sortOrder?: number;
          }>;
        }>(`/tournament-forms/${editingId}?_ts=${Date.now()}`);
        const d = res.data as {
          id: string;
          name: string;
          description: string;
          formType: string;
          competitionId: string;
          fields?: Array<{
            id: string;
            label: string;
            name: string;
            fieldType: string;
            required: boolean;
            options?: string;
            sortOrder?: number;
          }>;
        };
        setFormData((prev) => ({
          ...prev,
          title: d.name,
          description: d.description ?? "",
          competitionType:
            d.formType === "COMPETITION_REGISTRATION" ? "competition" : "club",
        }));
        if (d.competitionId) setCompetitionId(d.competitionId);
        if (Array.isArray(d.fields)) {
          const mapped: QuestionItem[] = d.fields
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((f) => ({
              id: f.id || `fld-${Date.now()}-${Math.random()}`,
              type:
                f.fieldType === "SELECT"
                  ? "dropdown"
                  : f.fieldType === "RADIO"
                  ? "multiple-choice"
                  : f.fieldType === "CHECKBOX"
                  ? "checkbox"
                  : "short-answer",
              label: f.label,
              options: f.options ? JSON.parse(f.options) : undefined,
            }));
          setQuestions(mapped);
          sessionStorage.setItem(snapshotKey, JSON.stringify(mapped));
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [editingId]);

  // Handle BFCache/back-forward navigation to avoid stale in-memory state
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      const anyEvt = e as unknown as { persisted?: boolean };
      const wasPersisted = !!anyEvt.persisted;
      const wasDiscarded = sessionStorage.getItem(discardedKey) === "1";
      if (wasPersisted || wasDiscarded) {
        sessionStorage.removeItem(discardedKey);
        // Force a reload to re-fetch server truth
        location.reload();
      }
    };
    window.addEventListener("pageshow", onPageShow as EventListener);
    return () =>
      window.removeEventListener("pageshow", onPageShow as EventListener);
  }, [discardedKey]);

  // Unsaved-change prompts disabled per request

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F6FF] to-[#E0EAFF]">
      <div className="max-w-3xl mx-auto p-5">
        <div className="bg-white border border-[#E6ECFF] rounded-xl shadow-md p-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-gray-900">
                Tạo Form
              </h2>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-[#CFE0FF] bg-[#F0F6FF] px-4 py-2 text-sm shadow-sm"
              >
                <Bars3Icon className="h-4 w-4 text-[#5B8DEF]" />
                <span className="text-[#2563EB] font-medium">Giải Đấu</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 shadow-sm"
              >
                Xem trước
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  if (!competitionId) {
                    alert("Vui lòng chọn giải đấu");
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
                      alert(
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
                    alert(
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
                      await api.put(`/tournament-forms/${editingId}`, {
                        ...body,
                        status: "DRAFT",
                      });
                      const snapNow = JSON.stringify(questions);
                      sessionStorage.setItem(snapshotKey, snapNow);
                      window.dispatchEvent(new Event("forms:changed"));
                    } else {
                      await api.post(`/tournament-forms`, body);
                      const snapNow = JSON.stringify(questions);
                      sessionStorage.setItem(snapshotKey, snapNow);
                      window.dispatchEvent(new Event("forms:changed"));
                    }
                    navigate(-1);
                  } catch (err) {
                    console.error(err);
                    alert("Lưu nháp thất bại");
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
                    alert("Vui lòng chọn giải đấu");
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
                      alert(
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
                    alert(
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
                      await api.put(`/tournament-forms/${editingId}`, {
                        ...body,
                        status: "PUBLISH",
                      });
                      const snapNow = JSON.stringify(questions);
                      sessionStorage.setItem(snapshotKey, snapNow);
                      window.dispatchEvent(new Event("forms:changed"));
                    } else {
                      await api.post(`/tournament-forms`, body);
                      const snapNow = JSON.stringify(questions);
                      sessionStorage.setItem(snapshotKey, snapNow);
                      window.dispatchEvent(new Event("forms:changed"));
                    }
                    navigate(-1);
                  } catch (err) {
                    console.error(err);
                    alert("Lưu thất bại");
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="rounded-lg bg-[#377CFB] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2e6de0] disabled:opacity-60"
              >
                {submitting ? "Đang lưu..." : "Lưu & Publish"}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-[#EEF2FF] p-3">
              <div className="flex items-center gap-3 rounded-2xl border border-gray-300 px-3 py-2">
                <ChevronDownIcon className="h-4 w-4 text-gray-700" />
                <span className="text-[12px] font-semibold tracking-wide text-gray-800 uppercase">
                  Chọn Giải
                </span>
                <div className="flex-1">
                  <div className="relative w-full">
                    <select
                      value={competitionId}
                      onChange={(e) => setCompetitionId(e.target.value)}
                      className="w-full appearance-none rounded-xl bg-gray-50 border border-gray-200 px-4 pr-8 py-2 text-center text-sm text-gray-700 focus:outline-none"
                    >
                      <option value="">Chọn giải đấu</option>
                      {competitions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  </div>
                </div>
              </div>
            </div>

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
                    <input
                      type="radio"
                      name="gender"
                      value={gender}
                      checked={formData.gender === gender}
                      onChange={(e) =>
                        handleInputChange("gender", e.target.value)
                      }
                      className="mr-2"
                    />
                    {gender === "male"
                      ? "Nam"
                      : gender === "female"
                      ? "Nữ"
                      : "Khác"}
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#EEF2FF] p-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nội dung thi đấu
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Vui lòng chọn và điền nội dung thi đấu bên dưới
              </p>

              <div className="mb-4">
                <label className="flex items-center mb-2">
                  <input
                    type="radio"
                    name="competitionType"
                    value="fighting"
                    checked={formData.competitionType === "fighting"}
                    onChange={(e) =>
                      handleInputChange("competitionType", e.target.value)
                    }
                    className="mr-2"
                  />
                  Đối kháng
                </label>
                <div className="relative mb-3">
                  <select
                    value={formData.weightClass}
                    onChange={(e) =>
                      handleInputChange("weightClass", e.target.value)
                    }
                    className="w-full appearance-none bg-white border border-gray-400 rounded-full px-4 pr-9 h-9 text-sm text-gray-700"
                  >
                    {weightClasses.map((w) => (
                      <option
                        key={w}
                        value={w === "Chọn hạng cân của bạn" ? "" : w}
                      >
                        {w}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center flex-wrap gap-2 mb-2">
                  <label className="flex items-center mr-2">
                    <input
                      type="radio"
                      name="competitionType"
                      value="quyen"
                      checked={formData.competitionType === "quyen"}
                      onChange={(e) =>
                        handleInputChange("competitionType", e.target.value)
                      }
                      className="mr-2"
                    />
                    Quyền
                  </label>
                  {quyenCategories.map((c) => {
                    const active = formData.quyenCategory === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleInputChange("quyenCategory", c)}
                        className={`rounded-full border px-3 py-1.5 text-xs ${
                          active
                            ? "border-blue-500 text-blue-600 bg-blue-50"
                            : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
                {/* Removed dropdown under Quyền as requested */}
              </div>

              <div>
                <label className="flex items-center mb-2">
                  <input
                    type="radio"
                    name="competitionType"
                    value="music"
                    checked={formData.competitionType === "music"}
                    onChange={(e) =>
                      handleInputChange("competitionType", e.target.value)
                    }
                    className="mr-2"
                  />
                  Võ nhạc
                </label>
                <select
                  value={formData.musicCategory ?? ""}
                  onChange={(e) =>
                    handleInputChange("musicCategory", e.target.value)
                  }
                  className="w-full bg-white border border-gray-400 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Chọn nội dung thi đấu</option>
                  <option value="doc-tau">Độc tấu</option>
                  <option value="nhom-3-5">Nhóm 3-5</option>
                  <option value="dong-dien">Đồng diễn</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#EEF2FF] p-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                MSSV
              </label>
              <p className="text-sm text-gray-500 mb-2">Nhập MSSV</p>
              <input
                type="text"
                value={formData.studentId}
                onChange={(e) => handleInputChange("studentId", e.target.value)}
                className="w-full bg-white border border-gray-400 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#EEF2FF] p-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                CLB
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Vui lòng chọn CLB của bạn
              </p>
              <select
                value={formData.club}
                onChange={(e) => handleInputChange("club", e.target.value)}
                className="w-full bg-white border border-gray-400 rounded-md px-3 py-2 text-sm"
              >
                <option value="FPTU Vovinam Club">FPTU Vovinam Club</option>
                <option value="FPTU Karate Club">FPTU Karate Club</option>
                <option value="FPTU Taekwondo Club">FPTU Taekwondo Club</option>
              </select>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#EEF2FF] p-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Huấn luyện viên quản lý
              </label>
              <p className="text-sm text-gray-500 mb-2">{formData.coachName}</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={formData.coachName}
                  onChange={(e) =>
                    handleInputChange("coachName", e.target.value)
                  }
                  className="flex-1 bg-white border border-gray-400 rounded-md px-3 py-2 text-sm"
                />
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.coachRequired}
                    onChange={(e) =>
                      handleInputChange("coachRequired", e.target.checked)
                    }
                    className="mr-1"
                  />
                  Required
                </label>
                <button
                  onClick={() => removeField("coachName")}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#EEF2FF] p-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                SĐT liên lạc
              </label>
              <p className="text-sm text-gray-500 mb-2">
                {formData.phoneNumber}
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                  className="flex-1 bg-white border border-gray-400 rounded-md px-3 py-2 text-sm"
                />
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.phoneRequired}
                    onChange={(e) =>
                      handleInputChange("phoneRequired", e.target.checked)
                    }
                    className="mr-1"
                  />
                  Required
                </label>
                <button
                  onClick={() => removeField("phoneNumber")}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {questions.length > 0 && (
            <div className="mt-4 space-y-3">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="bg-white rounded-lg shadow-sm border border-[#EEF2FF] p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <input
                      value={q.label}
                      onChange={(e) =>
                        setQuestions((prev) =>
                          prev.map((it) =>
                            it.id === q.id
                              ? { ...it, label: e.target.value }
                              : it
                          )
                        )
                      }
                      className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm mr-3"
                      placeholder={`Câu hỏi ${idx + 1}`}
                    />
                    <button
                      onClick={() =>
                        setQuestions((prev) =>
                          prev.filter((it) => it.id !== q.id)
                        )
                      }
                      className="text-red-500 hover:text-red-700"
                      title="Xóa câu hỏi"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  {q.type === "short-answer" && (
                    <input
                      disabled
                      placeholder="Short answer"
                      className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500"
                    />
                  )}
                  {q.type !== "short-answer" && (
                    <div className="space-y-2">
                      {(q.options ?? ["Tùy chọn 1"]).map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          {q.type === "multiple-choice" && (
                            <input
                              type="radio"
                              className="h-4 w-4"
                              checked={q.selectedOptionIndex === oi}
                              onChange={() =>
                                setQuestions((prev) =>
                                  prev.map((it) =>
                                    it.id === q.id
                                      ? { ...it, selectedOptionIndex: oi }
                                      : it
                                  )
                                )
                              }
                            />
                          )}
                          {q.type === "checkbox" && (
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={(q.selectedOptionIndexes ?? []).includes(
                                oi
                              )}
                              onChange={() =>
                                setQuestions((prev) =>
                                  prev.map((it) => {
                                    if (it.id !== q.id) return it;
                                    const current = new Set(
                                      it.selectedOptionIndexes ?? []
                                    );
                                    if (current.has(oi)) current.delete(oi);
                                    else current.add(oi);
                                    return {
                                      ...it,
                                      selectedOptionIndexes:
                                        Array.from(current),
                                    };
                                  })
                                )
                              }
                            />
                          )}
                          {q.type === "dropdown" && (
                            <span className="text-gray-500 text-sm">•</span>
                          )}
                          <input
                            value={opt}
                            onChange={(e) =>
                              setQuestions((prev) =>
                                prev.map((it) =>
                                  it.id === q.id
                                    ? {
                                        ...it,
                                        options: (it.options ?? []).map(
                                          (o, i) =>
                                            i === oi ? e.target.value : o
                                        ),
                                      }
                                    : it
                                )
                              )
                            }
                            className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
                          />
                          <button
                            onClick={() => {
                              // If removing last option from a non-short-answer question, mark form dirty but keep an empty placeholder to force re-entry
                              setQuestions((prev) =>
                                prev.map((it) => {
                                  if (it.id !== q.id) return it;
                                  const nextOpts = (it.options ?? []).filter(
                                    (_, i) => i !== oi
                                  );
                                  return {
                                    ...it,
                                    options:
                                      nextOpts.length > 0 ? nextOpts : [""],
                                  };
                                })
                              );
                            }}
                            className="text-red-500 hover:text-red-700"
                            title="Xóa lựa chọn"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setQuestions((prev) =>
                            prev.map((it) =>
                              it.id === q.id
                                ? {
                                    ...it,
                                    options: [
                                      ...(it.options ?? ["Tùy chọn 1"]),
                                      `Tùy chọn ${
                                        (it.options?.length ?? 1) + 1
                                      }`,
                                    ],
                                  }
                                : it
                            )
                          )
                        }
                        className="text-blue-600 text-sm hover:underline"
                      >
                        + Thêm lựa chọn
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 relative">
            <button
              onClick={() => setShowAddQuestion(!showAddQuestion)}
              className="text-blue-500 underline flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Thêm câu hỏi
            </button>
            {showAddQuestion && (
              <div className="absolute left-0 top-8 bg-white border border-gray-300 rounded-md shadow-lg p-2 z-10">
                {questionTypes.map((type) => (
                  <button
                    key={type.id}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center space-x-2"
                    onClick={() => {
                      const id = `${type.id}-${Date.now()}`;
                      const base: QuestionItem = {
                        id,
                        type: type.id as QuestionType,
                        label: "", // force user to enter label, no default
                        options: type.id === "short-answer" ? undefined : [""],
                        selectedOptionIndex: undefined,
                        selectedOptionIndexes: [],
                      };
                      setQuestions((prev) => [...prev, base]);
                      setShowAddQuestion(false);
                    }}
                  >
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <FormPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        selectedFileName={previewFileName}
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
          questions: questions.map((q) => ({
            id: q.id,
            type: q.type,
            label: q.label,
            options: q.options,
          })),
        }}
      />
    </div>
  );
};

export default FormBuilder;
