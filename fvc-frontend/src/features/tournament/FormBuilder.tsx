import React, { useEffect, useState, useMemo } from "react";
import FormPreviewModal from "./FormPreviewModal";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import type { PaginationResponse } from "../../types/api";
import { useToast } from "../../components/common/ToastContext";
import { validateLength, validateRequired } from "../../utils/validation";

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
  required?: boolean;
}

const FormBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { id: editingId } = useParams<{ id: string }>();
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
    phoneRequired: true,
    weightClass: "",
    quyenCategory: "",
    quyenContent: "",
    musicCategory: "",
  });

  const [showPreview, setShowPreview] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [competitionId, setCompetitionId] = useState<string>("");
  const [formStatus, setFormStatus] = useState<string | undefined>(undefined);
  const [publicLink, setPublicLink] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string>("");
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
  const [pendingPostpone, setPendingPostpone] = useState(false);
  const [confirmPostponeOpen, setConfirmPostponeOpen] = useState(false);
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
  const [pendingPublish, setPendingPublish] = useState(false);

  // Helpers for custom questions validation
  const cleanOptions = (opts?: string[]): string[] =>
    (opts || []).map((o) => String(o).trim()).filter((o) => o.length > 0);

  const validateQuestions = (): boolean => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const label = (q.label || "").trim();
      if (!label) {
        toast.error("Câu hỏi thêm không được để trống nội dung");
        return false;
      }

      if (
        q.type === "multiple-choice" ||
        q.type === "checkbox" ||
        q.type === "dropdown"
      ) {
        const opts = cleanOptions(q.options);
        if (opts.length === 0) {
          toast.error(`Câu hỏi #${i + 1}: vui lòng thêm ít nhất một lựa chọn`);
          return false;
        }
      }
      // For short-answer/date/file-upload: label check above is sufficient
    }
    return true;
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load competitions
        const competitionsRes = await api.get<
          PaginationResponse<{ id: string; name: string }>
        >(API_ENDPOINTS.COMPETITIONS.BASE);
        const allCompetitions = competitionsRes.data.content || [];

        // If creating new form (no editingId), filter out competitions that already have forms
        if (!editingId) {
          try {
            // Load all tournament forms to get competitionIds that already have forms
            const formsRes = await api.get<{
              content?: Array<{ competitionId?: string; formType?: string }>;
            }>(API_ENDPOINTS.TOURNAMENT_FORMS.BASE, {
              all: true,
            });

            type RawFormData = {
              competitionId?: string;
              formType?: string;
              [key: string]: unknown;
            };
            let rawFormsData: RawFormData[] = [];
            if (formsRes.success && formsRes.data) {
              if (Array.isArray(formsRes.data)) {
                rawFormsData = formsRes.data as RawFormData[];
              } else if (
                formsRes.data.content &&
                Array.isArray(formsRes.data.content)
              ) {
                rawFormsData = formsRes.data.content as RawFormData[];
              }
            }

            // Filter only COMPETITION_REGISTRATION forms
            const competitionForms = rawFormsData.filter(
              (form: RawFormData) => {
                const formType = String(form.formType || "").toUpperCase();
                return formType === "COMPETITION_REGISTRATION";
              }
            );

            // Normalize competition IDs
            const normalizeId = (id: unknown): string | null => {
              if (id === null || id === undefined) return null;
              const str = String(id).trim();
              return str.length > 0 ? str : null;
            };

            const competitionIdsWithForms = new Set(
              competitionForms
                .map((form: RawFormData) => normalizeId(form.competitionId))
                .filter(
                  (id): id is string =>
                    id !== null && id !== undefined && id.length > 0
                )
            );

            // Filter out competitions that already have forms
            const availableCompetitions = allCompetitions.filter((comp) => {
              const compIdNormalized = normalizeId(comp.id);
              if (!compIdNormalized) return false;
              return !competitionIdsWithForms.has(compIdNormalized);
            });

            setCompetitions(availableCompetitions);
            // Only set competitionId if there are available competitions and competitionId is not already set
            if (availableCompetitions.length > 0) {
              // Only set if competitionId is empty (creating new form)
              const currentCompId = competitionId;
              if (!currentCompId || currentCompId.trim() === "") {
                setCompetitionId(availableCompetitions[0].id.toString());
              }
            }
          } catch (formsError) {
            console.error("Error loading forms:", formsError);
            // If error loading forms, show all competitions
            setCompetitions(allCompetitions);
          }
        } else {
          // When editing, show all competitions
          setCompetitions(allCompetitions);
          // CompetitionId will be set from the form data
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Không thể tải dữ liệu");
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, editingId]); // editingId is needed to determine if we should filter competitions

  // Load competition-specific contents when a competition is picked
  useEffect(() => {
    const loadCompetitionDetails = async () => {
      if (!competitionId) return;
      try {
        type CompetitionDetail = {
          weightClasses?: Array<{
            id: string;
            weightClass: string;
            gender: string;
            minWeight: number;
            maxWeight: number;
          }>;
          vovinamFistConfigs?: Array<{ id: string; name: string }>;
          fistConfigItemSelections?: Record<
            string,
            Array<{ id: string; name: string }>
          >;
          musicPerformances?: Array<{ id: string; name: string }>;
        };

        const res = await api.get<
          CompetitionDetail | { data: CompetitionDetail }
        >(API_ENDPOINTS.COMPETITIONS.BY_ID(competitionId));
        const rawUnknown = (res as unknown as { data: unknown }).data;
        const isWrapped = (
          val: unknown
        ): val is { data: CompetitionDetail } => {
          return (
            typeof val === "object" &&
            val !== null &&
            "data" in (val as Record<string, unknown>)
          );
        };
        const comp: CompetitionDetail = isWrapped(rawUnknown)
          ? rawUnknown.data
          : (rawUnknown as CompetitionDetail);
        // Weight classes
        setWeightClasses(comp?.weightClasses || []);
        // Fist configs and items mapping
        let configs: Array<{ id: string; name: string }> = [];

        // Build items array with configId from mapping or item list
        const items: Array<{ id: string; name: string; configId?: string }> =
          [];
        const selections = comp?.fistConfigItemSelections || {};
        const idsFromSelections = Object.keys(selections || {});
        const idsFromConfigs = (
          comp?.vovinamFistConfigs ||
          (
            comp as unknown as {
              fistConfigs?: Array<{ id: string; name: string }>;
            }
          )?.fistConfigs ||
          (
            comp as unknown as {
              vovinamConfigs?: Array<{ id: string; name: string }>;
            }
          )?.vovinamConfigs ||
          []
        ).map((c) => c.id);
        const idsFromDirect =
          (comp as unknown as { vovinamFistConfigIds?: string[] })
            ?.vovinamFistConfigIds || [];

        const mergedIds = Array.from(
          new Set<string>([
            ...idsFromConfigs,
            ...idsFromSelections,
            ...idsFromDirect,
          ])
        );

        if (mergedIds.length > 0) {
          try {
            const fetched = await Promise.all(
              mergedIds.map(async (cfgId) => {
                try {
                  const r = await api.get<
                    | { id: string; name: string }
                    | { data: { id: string; name: string } }
                  >(API_ENDPOINTS.FIST_CONTENTS.BY_ID(cfgId));
                  const rawUnknown = (r as unknown as { data: unknown }).data;
                  const isWrapped = (
                    val: unknown
                  ): val is { data: { id: string; name: string } } =>
                    typeof val === "object" &&
                    val !== null &&
                    "data" in (val as Record<string, unknown>);
                  const rec = (
                    isWrapped(rawUnknown)
                      ? rawUnknown.data
                      : (rawUnknown as { id: string; name: string })
                  ) as { id: string; name: string };
                  return {
                    id: rec.id || cfgId,
                    name: rec.name || `Nhóm ${cfgId}`,
                  };
                } catch {
                  const arr = selections[cfgId] || [];
                  const fallbackName = (
                    arr[0] as { configName?: string } | undefined
                  )?.configName;
                  return { id: cfgId, name: fallbackName || `Nhóm ${cfgId}` };
                }
              })
            );
            configs = fetched;
          } catch {
            configs = mergedIds.map((cfgId) => {
              const arr = selections[cfgId] || [];
              const fallbackName = (
                arr[0] as { configName?: string } | undefined
              )?.configName;
              return { id: cfgId, name: fallbackName || `Nhóm ${cfgId}` };
            });
          }
        }
        console.log("FormBuilder: competition detail loaded", {
          comp,
          weightClasses: comp?.weightClasses?.length || 0,
          vovinamFistConfigs: comp?.vovinamFistConfigs?.length || 0,
          selectionsKeys: Object.keys(selections || {}),
        });
        setFistConfigs(configs);
        Object.keys(selections || {}).forEach((cfgId) => {
          const arr = selections[cfgId] || [];
          arr.forEach((it: { id: string; name: string }) =>
            items.push({ id: it.id, name: it.name, configId: cfgId })
          );
        });
        // If BE didn't return selections but we have configs, fetch items by config id
        if (items.length === 0 && configs.length > 0) {
          try {
            const itemGroups = await Promise.all(
              configs.map(async (cfg) => {
                try {
                  const resItems = await api.get<
                    | { content?: Array<{ id: string; name: string }> }
                    | {
                        data?: {
                          content?: Array<{ id: string; name: string }>;
                        };
                      }
                  >(API_ENDPOINTS.FIST_CONTENTS.ITEMS_BY_CONFIG(cfg.id));
                  const rawUnknown = (resItems as unknown as { data: unknown })
                    .data;
                  const raw = rawUnknown as
                    | { content?: Array<{ id: string; name: string }> }
                    | {
                        data?: {
                          content?: Array<{ id: string; name: string }>;
                        };
                      };
                  const content: Array<{ id: string; name: string }> =
                    (raw as { content?: Array<{ id: string; name: string }> })
                      .content ||
                    (
                      raw as {
                        data?: {
                          content?: Array<{ id: string; name: string }>;
                        };
                      }
                    ).data?.content ||
                    [];
                  return content.map((it) => ({
                    id: it.id,
                    name: it.name,
                    configId: cfg.id,
                  }));
                } catch {
                  return [] as Array<{
                    id: string;
                    name: string;
                    configId?: string;
                  }>;
                }
              })
            );
            itemGroups.flat().forEach((it) => items.push(it));
          } catch {
            // ignore fetch
          }
        }
        // fallback: flat list of items
        if (items.length === 0) {
          const flatItems =
            (
              comp as unknown as {
                fistItems?: Array<{
                  id: string;
                  name: string;
                  configId?: string;
                }>;
              }
            )?.fistItems ||
            (
              comp as unknown as {
                vovinamFistItems?: Array<{
                  id: string;
                  name: string;
                  configId?: string;
                }>;
              }
            )?.vovinamFistItems ||
            [];
          flatItems.forEach((it) =>
            items.push({ id: it.id, name: it.name, configId: it.configId })
          );
        }
        // If nothing from competition, fallback to all configs/items (temporary)
        if (configs.length === 0 && items.length === 0) {
          console.warn(
            "FormBuilder: Competition has no mapped Quyền (configs/items empty)"
          );
          toast.warning("Giải này chưa cấu hình Quyền (Đơn/Đa luyện)");
        }

        console.log("FormBuilder: derived Quyền", {
          configCount: configs.length,
          itemCount: items.length,
          sampleConfigs: configs.slice(0, 5),
          sampleItems: items.slice(0, 5),
        });
        setFistItems(items);

        // Music contents
        setMusicContents(comp?.musicPerformances || []);
      } catch (e) {
        console.warn("Không thể tải nội dung theo giải", e);
        setWeightClasses([]);
        setFistConfigs([]);
        setFistItems([]);
        setMusicContents([]);
      }
    };
    loadCompetitionDetails();
  }, [competitionId, toast]);

  // Load form data when editing
  useEffect(() => {
    if (editingId) {
      const loadFormData = async () => {
        try {
          const response = await api.get<{
            id: string;
            name: string;
            description: string;
            competitionId?: string;
            fields?: Array<{
              id: string;
              fieldType: string;
              label: string;
              options?: string;
              required?: boolean;
            }>;
            status?: string; // Added status to response
            publicSlug?: string; // Added publicSlug to response
            publicLink?: string; // Added publicLink to response
          }>(API_ENDPOINTS.TOURNAMENT_FORMS.BY_ID(editingId));

          if (response.data) {
            setFormData((prev) => ({
              ...prev,
              title: response.data.name || "",
              description: response.data.description || "",
            }));

            if (response.data.competitionId) {
              setCompetitionId(response.data.competitionId);
            }

            if (response.data.status) {
              setFormStatus(response.data.status);
            }
            // Load publicLink if available
            // For tournament forms, use /published-form/{id}
            if (response.data.publicLink) {
              setPublicLink(response.data.publicLink);
            } else if (response.data.id) {
              setPublicLink(`/published-form/${response.data.id}`);
            } else if (response.data.publicSlug) {
              // Fallback to slug-based link
              setPublicLink(`/public/forms/${response.data.publicSlug}`);
            }
            // Nếu backend có trả endDate, bind vào state (không có cũng không sao)
            try {
              const anyRes = response.data as unknown as { endDate?: string };
              if (anyRes.endDate) {
                const iso = new Date(anyRes.endDate).toISOString();
                setEndDate(iso.slice(0, 16));
              }
            } catch {
              /* ignore */
            }

            // Clear existing questions first, then load form fields
            setQuestions([]);

            if (response.data.fields && response.data.fields.length > 0) {
              // Filter out default fields that are always included in the form
              const defaultFieldLabels = [
                "Họ và tên",
                "Email",
                "MSSV",
                "Số điện thoại",
                "Giới tính",
                "Câu lạc bộ",
                "Nội dung thi đấu",
              ];

              const customFields = response.data.fields.filter(
                (field) => !defaultFieldLabels.includes(field.label)
              );

              const formFields: QuestionItem[] = customFields.map((field) => {
                let questionType: QuestionType = "short-answer";
                const fieldType = field.fieldType?.toLowerCase();

                if (fieldType === "dropdown" || fieldType === "select") {
                  questionType = "dropdown";
                } else if (
                  fieldType === "multiple-choice" ||
                  fieldType === "radio"
                ) {
                  questionType = "multiple-choice";
                } else if (fieldType === "checkbox") {
                  questionType = "checkbox";
                } else if (fieldType === "date") {
                  questionType = "date";
                } else if (fieldType === "file-upload") {
                  questionType = "file-upload";
                }

                return {
                  id: field.id || crypto.randomUUID(),
                  type: questionType,
                  label: field.label || "",
                  options: field.options
                    ? (() => {
                        try {
                          // Try to parse as JSON first
                          const parsed = JSON.parse(field.options);
                          if (Array.isArray(parsed)) {
                            return parsed.map((opt) =>
                              String(opt)
                                .replace(/[[\]"]/g, "")
                                .trim()
                            );
                          }
                        } catch {
                          // If JSON parsing fails, fall back to comma splitting
                          return field.options
                            .split(",")
                            .map((opt: string) =>
                              opt.replace(/[[\]"]/g, "").trim()
                            );
                        }
                        return [];
                      })()
                    : [],
                  required: field.required || false,
                };
              });
              setQuestions(formFields);
            }
          }
        } catch (error) {
          console.error("Error loading form data:", error);
          toast.error("Không thể tải dữ liệu form");
        }
      };

      loadFormData();
    }
  }, [editingId, toast, navigate]);

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

  // Merge: Keep validation logic from HEAD (more comprehensive with competitionType check)
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
    value: string | string[] | boolean
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
      required: false,
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
      // Allow saving for DRAFT, PUBLISH, and POSTPONE status
      // Only block if status is ARCHIVED or other invalid states
      if (editingId && formStatus && formStatus === "ARCHIVED") {
        toast.error("Form đã lưu trữ, không thể chỉnh sửa");
        return;
      }
      // Validate custom questions before proceeding
      if (!validateQuestions()) {
        return;
      }
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

      // Build fields - always include standard fields + custom questions
      let fields: Array<{
        id?: string;
        label: string;
        name: string;
        fieldType: string;
        required: boolean;
        options: string | null;
        sortOrder: number;
      }> = [];

      if (editingId) {
        // When editing, we need to merge existing standard fields with current custom questions
        try {
          const existingFormResponse = await api.get<{
            fields?: Array<{
              id: string;
              label: string;
              fieldType: string;
              sortOrder: number;
              name?: string;
              options?: string;
              required?: boolean;
            }>;
          }>(API_ENDPOINTS.TOURNAMENT_FORMS.BY_ID(editingId));

          if (existingFormResponse.data?.fields) {
            // Get standard fields from database
            const standardFieldLabels = [
              "Họ và tên",
              "Email",
              "MSSV",
              "Số điện thoại",
              "Giới tính",
              "Câu lạc bộ",
              "Nội dung thi đấu",
            ];

            const standardFields = existingFormResponse.data.fields
              .filter((field) => standardFieldLabels.includes(field.label))
              .map((field) => ({
                id: field.id,
                label: field.label,
                name: field.name || field.id,
                fieldType: field.fieldType,
                required: field.required ?? true,
                options: field.options || null,
                sortOrder: field.sortOrder,
              }))
              .sort((a, b) => a.sortOrder - b.sortOrder);

            // Get custom fields from current questions state (this handles deletions)
            const customFields = questions.map((q, index) => ({
              id: q.id,
              label: q.label,
              name: q.id,
              fieldType: q.type.toUpperCase(),
              required: q.required ?? false,
              options: (() => {
                const opts = cleanOptions(q.options);
                return opts.length > 0 ? JSON.stringify(opts) : null;
              })(),
              sortOrder: 7 + index,
            }));

            fields = [...standardFields, ...customFields];
          } else {
            // Fallback: use hardcoded sortOrder
            const standardFields = [
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
                required: true,
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
            ];

            const customFields = questions.map((q, index) => ({
              id: q.id,
              label: q.label,
              name: q.id,
              fieldType: q.type.toUpperCase(),
              required: q.required ?? false,
              options: (() => {
                const opts = cleanOptions(q.options);
                return opts.length > 0 ? JSON.stringify(opts) : null;
              })(),
              sortOrder: 7 + index,
            }));

            fields = [
              ...standardFields,
              ...customFields,
              {
                label: "Nội dung thi đấu",
                fieldType: "RADIO",
                required: true,
                name: "competitionType",
                options: JSON.stringify(["Đối kháng", "Quyền", "Võ nhạc"]),
                sortOrder: 7 + questions.length,
              },
            ];
          }
        } catch (error) {
          console.error("Error loading existing form fields:", error);
          // Fallback to hardcoded sortOrder
          const standardFields = [
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
              required: true,
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
          ];

          const customFields = questions.map((q, index) => ({
            id: q.id,
            label: q.label,
            name: q.id,
            fieldType: q.type.toUpperCase(),
            required: q.required ?? false,
            options: (() => {
              const opts = cleanOptions(q.options);
              return opts.length > 0 ? JSON.stringify(opts) : null;
            })(),
            sortOrder: 7 + index,
          }));

          fields = [
            ...standardFields,
            ...customFields,
            {
              label: "Nội dung thi đấu",
              fieldType: "RADIO",
              required: true,
              name: "competitionType",
              options: JSON.stringify(["Đối kháng", "Quyền", "Võ nhạc"]),
              sortOrder: 7 + questions.length,
            },
          ];
        }
      } else {
        // When creating new, use standard fields + custom questions
        fields = [
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
            required: true,
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
            required: q.required ?? false,
            options: (() => {
              const opts = cleanOptions(q.options);
              return opts.length > 0 ? JSON.stringify(opts) : null;
            })(),
            sortOrder: 7 + index,
          })),
          {
            label: "Nội dung thi đấu",
            fieldType: "RADIO",
            required: true,
            name: "competitionType",
            options: JSON.stringify(["Đối kháng", "Quyền", "Võ nhạc"]),
            sortOrder: 6 + questions.length,
          },
        ];
      }

      // Keep current status if form is already published or postponed, otherwise set to DRAFT
      const saveStatus =
        editingId &&
        formStatus &&
        (formStatus === "PUBLISH" || formStatus === "POSTPONE")
          ? undefined // Don't change status, just save
          : "DRAFT";

      const payload = {
        name: formData.title,
        description: formData.description,
        formType: "COMPETITION_REGISTRATION",
        competitionId: competitionId,
        ...(saveStatus ? { status: saveStatus } : {}), // Only include status if we want to change it
        fields: fields,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      };

      console.log("Questions state (draft):", questions);
      console.log("Questions length (draft):", questions.length);
      console.log(
        "Custom questions in payload (draft):",
        payload.fields.filter((f) => f.sortOrder > 6)
      );
      console.log(
        "All fields with sortOrder (draft):",
        payload.fields.map((f) => ({
          label: f.label,
          sortOrder: f.sortOrder,
        }))
      );
      console.log("Saving draft with payload:", payload);

      if (editingId) {
        // Update existing form
        await api.put(API_ENDPOINTS.TOURNAMENT_FORMS.BY_ID(editingId), payload);
        toast.success("Đã cập nhật form thành công");
      } else {
        // Create new form
        await api.post(API_ENDPOINTS.TOURNAMENT_FORMS.BASE, payload);
        toast.success("Đã lưu nháp thành công");
      }
      navigate(-1);
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Không thể lưu nháp");
    } finally {
      setSubmitting(false);
    }
  };

  const requestPublish = () => {
    setConfirmPublishOpen(true);
  };

  const confirmPublish = async () => {
    try {
      setPendingPublish(true);
      await handleSaveAndPublish();
    } finally {
      setPendingPublish(false);
      setConfirmPublishOpen(false);
    }
  };

  const handleSaveAndPublish = async () => {
    setSubmitting(true);
    try {
      // Allow publishing if status is DRAFT or POSTPONE
      if (
        editingId &&
        formStatus &&
        formStatus !== "DRAFT" &&
        formStatus !== "POSTPONE"
      ) {
        toast.error("Chỉ form ở trạng thái Nháp hoặc Hoãn mới có thể publish");
        return;
      }
      // Validate custom questions before proceeding
      if (!validateQuestions()) {
        return;
      }
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

      // Build fields based on whether we're editing or creating
      let fields: Array<{
        id?: string;
        label: string;
        name: string;
        fieldType: string;
        required: boolean;
        options: string | null;
        sortOrder: number;
      }> = [];

      if (editingId) {
        // When editing, we need to merge existing standard fields with current custom questions
        try {
          const existingFormResponse = await api.get<{
            fields?: Array<{
              id: string;
              label: string;
              fieldType: string;
              sortOrder: number;
              name?: string;
              options?: string;
              required?: boolean;
            }>;
          }>(API_ENDPOINTS.TOURNAMENT_FORMS.BY_ID(editingId));

          if (existingFormResponse.data?.fields) {
            // Get standard fields from database
            const standardFieldLabels = [
              "Họ và tên",
              "Email",
              "MSSV",
              "Số điện thoại",
              "Giới tính",
              "Câu lạc bộ",
              "Nội dung thi đấu",
            ];

            const standardFields = existingFormResponse.data.fields
              .filter((field) => standardFieldLabels.includes(field.label))
              .map((field) => ({
                id: field.id,
                label: field.label,
                name: field.name || field.id,
                fieldType: field.fieldType,
                required: field.required ?? true,
                options: field.options || null,
                sortOrder: field.sortOrder,
              }))
              .sort((a, b) => a.sortOrder - b.sortOrder);

            // Get custom fields from current questions state (this handles deletions)
            const customFields = questions.map((q, index) => ({
              id: q.id,
              label: q.label,
              name: q.id,
              fieldType: q.type.toUpperCase(),
              required: q.required ?? false,
              options: (() => {
                const opts = cleanOptions(q.options);
                return opts.length > 0 ? JSON.stringify(opts) : null;
              })(),
              sortOrder: 7 + index,
            }));

            fields = [...standardFields, ...customFields];
          } else {
            // Fallback: use hardcoded sortOrder
            const standardFields = [
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
                required: true,
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
            ];

            const customFields = questions.map((q, index) => ({
              id: q.id,
              label: q.label,
              name: q.id,
              fieldType: q.type.toUpperCase(),
              required: q.required ?? false,
              options: (() => {
                const opts = cleanOptions(q.options);
                return opts.length > 0 ? JSON.stringify(opts) : null;
              })(),
              sortOrder: 7 + index,
            }));

            fields = [
              ...standardFields,
              ...customFields,
              {
                label: "Nội dung thi đấu",
                fieldType: "RADIO",
                required: true,
                name: "competitionType",
                options: JSON.stringify(["Đối kháng", "Quyền", "Võ nhạc"]),
                sortOrder: 7 + questions.length,
              },
            ];
          }
        } catch (error) {
          console.error("Error loading existing form fields:", error);
          // Fallback to hardcoded sortOrder
          const standardFields = [
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
              required: true,
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
          ];

          const customFields = questions.map((q, index) => ({
            id: q.id,
            label: q.label,
            name: q.id,
            fieldType: q.type.toUpperCase(),
            required: q.required ?? false,
            options: (() => {
              const opts = cleanOptions(q.options);
              return opts.length > 0 ? JSON.stringify(opts) : null;
            })(),
            sortOrder: 7 + index,
          }));

          fields = [
            ...standardFields,
            ...customFields,
            {
              label: "Nội dung thi đấu",
              fieldType: "RADIO",
              required: true,
              name: "competitionType",
              options: JSON.stringify(["Đối kháng", "Quyền", "Võ nhạc"]),
              sortOrder: 7 + questions.length,
            },
          ];
        }
      } else {
        // When creating new, use standard fields + custom questions
        fields = [
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
            required: true,
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
            required: q.required ?? false,
            options: (() => {
              const opts = cleanOptions(q.options);
              return opts.length > 0 ? JSON.stringify(opts) : null;
            })(),
            sortOrder: 7 + index,
          })),
          {
            label: "Nội dung thi đấu",
            fieldType: "RADIO",
            required: true,
            name: "competitionType",
            options: JSON.stringify(["Đối kháng", "Quyền", "Võ nhạc"]),
            sortOrder: 6 + questions.length,
          },
        ];
      }

      const payload = {
        name: formData.title,
        description: formData.description,
        formType: "COMPETITION_REGISTRATION",
        competitionId: competitionId,
        status: "PUBLISH",
        fields: fields,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      };

      console.log("Questions state:", questions);

      const isRepublishing = formStatus === "POSTPONE";
      console.log("Questions length:", questions.length);
      console.log(
        "Custom questions in payload:",
        payload.fields.filter((f) => f.sortOrder > 6)
      );
      console.log("Saving and publishing with payload:", payload);

      if (editingId) {
        // Update existing form
        await api.put(API_ENDPOINTS.TOURNAMENT_FORMS.BY_ID(editingId), payload);
        const message = isRepublishing
          ? "Đã công khai lại thành công!"
          : "Đã cập nhật và xuất bản thành công";
        toast.success(message);
        setFormStatus("PUBLISH");
        // Fetch form again to get publicLink/publicSlug
        try {
          const formResponse = await api.get<{
            publicLink?: string;
            publicSlug?: string;
            id?: string;
            [key: string]: unknown;
          }>(API_ENDPOINTS.TOURNAMENT_FORMS.BY_ID(editingId));
          const formData = formResponse.data as {
            publicLink?: string;
            publicSlug?: string;
            id?: string;
          };
          if (formData?.publicLink) {
            setPublicLink(formData.publicLink);
          } else if (formData?.id) {
            // For tournament forms, use /published-form/{id}
            setPublicLink(`/published-form/${formData.id}`);
          } else if (formData?.publicSlug) {
            // Fallback to slug-based link
            setPublicLink(`/public/forms/${formData.publicSlug}`);
          }
        } catch {
          // Ignore if fetch fails
        }
      } else {
        // Create new form
        const response = await api.post<{
          id?: string;
          publicLink?: string;
          publicSlug?: string;
          [key: string]: unknown;
        }>(API_ENDPOINTS.TOURNAMENT_FORMS.BASE, payload);
        toast.success("Đã lưu và xuất bản thành công");
        // Update publicLink if available
        // api.post returns data directly, not wrapped in BaseResponse
        if (response?.publicLink) {
          setPublicLink(response.publicLink);
        } else if (response?.id) {
          // For tournament forms, use /published-form/{id}
          setPublicLink(`/published-form/${response.id}`);
        } else if (response?.publicSlug) {
          // Fallback to slug-based link if id is not available
          setPublicLink(`/public/forms/${response.publicSlug}`);
        }
      }
      // Don't navigate immediately if we need to show the public link
      // Only navigate if form is new (no editingId)
      if (!editingId) {
        navigate(-1);
      }
    } catch (error) {
      console.error("Error saving and publishing:", error);
      toast.error("Không thể lưu và xuất bản");
    } finally {
      setSubmitting(false);
    }
  };

  const requestPostpone = () => {
    setConfirmPostponeOpen(true);
  };

  const confirmPostpone = async () => {
    try {
      setPendingPostpone(true);
      if (!editingId) {
        toast.error("Không thể hoãn form chưa được lưu");
        return;
      }
      await api.patch(API_ENDPOINTS.TOURNAMENT_FORMS.STATUS(editingId), {
        status: "POSTPONE",
      });
      setFormStatus("POSTPONE");
      setPublicLink(null); // Clear public link when postponed
      toast.success("Form đã được hoãn thành công");
    } catch (err: unknown) {
      console.error("Error postponing form:", err);
      const errorMessage =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Network error";
      toast.error("Lỗi khi hoãn form: " + errorMessage);
    } finally {
      setPendingPostpone(false);
      setConfirmPostponeOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <>
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
              Tạo Form{" "}
              <span className="text-sm text-gray-500">đăng ký giải đấu</span>
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
              disabled={submitting || pendingPostpone}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {submitting ? "Đang lưu..." : "Lưu"}
            </button>
            <button
              onClick={requestPublish}
              disabled={
                submitting ||
                pendingPostpone ||
                pendingPublish ||
                formStatus === "PUBLISH"
              }
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pendingPublish
                ? "Đang publish..."
                : formStatus === "POSTPONE"
                ? "Công khai lại"
                : "Publish"}
            </button>
            {formStatus === "PUBLISH" && (
              <button
                onClick={requestPostpone}
                disabled={submitting || pendingPostpone}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {pendingPostpone ? "Đang hoãn..." : "Hoãn"}
              </button>
            )}
          </div>
        </div>

        {/* Public Link Display */}
        {formStatus && formStatus.toUpperCase() === "PUBLISH" && publicLink && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  <h3 className="text-sm font-semibold text-green-800">
                    Form đã được công khai
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${publicLink}`}
                    className="flex-1 rounded-md border border-green-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          `${window.location.origin}${publicLink}`
                        );
                        toast.success("Đã copy link công khai!");
                      } catch {
                        toast.error("Không thể copy link");
                      }
                    }}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Copy link
                  </button>
                  <a
                    href={publicLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-green-600 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Mở link
                  </a>
                </div>
                <p className="mt-2 text-xs text-green-600">
                  Link này có thể được chia sẻ với bất kỳ ai để họ đăng ký.
                  Không cần đăng nhập.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Merge: Keep HEAD implementation - more complete form builder with proper variable references */}
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
                disabled={editingId ? true : false}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Chọn giải đấu</option>
                {competitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
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
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
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

            {/* End Date (ngày kết thúc hiển thị form) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày kết thúc (tự ẩn form sau thời điểm này)
              </label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      tomorrow.setHours(23, 59, 0, 0);
                      setEndDate(tomorrow.toISOString().slice(0, 16));
                    }}
                    className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    Ngày mai 23:59
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextWeek = new Date();
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      nextWeek.setHours(23, 59, 0, 0);
                      setEndDate(nextWeek.toISOString().slice(0, 16));
                    }}
                    className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
                  >
                    Tuần sau
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextMonth = new Date();
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      nextMonth.setHours(23, 59, 0, 0);
                      setEndDate(nextMonth.toISOString().slice(0, 16));
                    }}
                    className="px-3 py-1 text-xs bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors"
                  >
                    Tháng sau
                  </button>
                </div>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={new Date().toISOString().slice(0, 16)}
                />
                {endDate && (
                  <p className="text-xs text-gray-500">
                    Hết hạn: {new Date(endDate).toLocaleString("vi-VN")}
                  </p>
                )}
              </div>
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
                      {fistConfigs.map((cfg) => (
                        <button
                          key={cfg.id}
                          type="button"
                          onClick={() =>
                            handleInputChange("quyenCategory", cfg.id)
                          }
                          className={`rounded-full border px-3 py-1.5 text-xs ${
                            formData.quyenCategory === cfg.id
                              ? "border-blue-500 text-blue-600 bg-blue-50"
                              : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                          }`}
                        >
                          {cfg.name}
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

                          const filteredItems = fistItems.filter(
                            (it) => it.configId === formData.quyenCategory
                          );
                          return (
                            filteredItems &&
                            filteredItems.length > 0 &&
                            filteredItems.map((it) => (
                              <option key={it.id} value={it.id}>
                                {it.name}
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
                            checked={question.required || false}
                            onChange={(e) =>
                              handleQuestionChange(
                                question.id,
                                "required",
                                e.target.checked
                              )
                            }
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
                              <div
                                key={idx}
                                className="flex items-center gap-2"
                              >
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

        {/* Confirm Postpone Dialog */}
        {confirmPostponeOpen && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999]">
            <div className="flex items-center gap-3 rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 shadow-lg">
              <div className="text-orange-600">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="text-[13px] text-orange-800">
                Bạn có muốn hoãn form?
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmPostponeOpen(false)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmPostpone}
                  disabled={pendingPostpone}
                  className="rounded-md bg-orange-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  {pendingPostpone ? "Đang xử lý..." : "Xác nhận hoãn"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Publish Dialog */}
        {confirmPublishOpen && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999]">
            <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 shadow-lg">
              <div className="text-amber-600">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="text-[13px] text-amber-800">
                {formStatus === "POSTPONE"
                  ? "Bạn chắc chắn muốn công khai lại form này chứ?"
                  : "Bạn chắc chắn muốn công khai form này chứ?"}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmPublishOpen(false)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmPublish}
                  disabled={pendingPublish}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {pendingPublish ? "Đang publish..." : "Đồng ý"}
                </button>
              </div>
            </div>
          </div>
        )}

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
      </>
    </div>
  );
};

export default FormBuilder;
