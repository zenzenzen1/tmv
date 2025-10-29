import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { fistContentService } from "../../services/fistContent";
import { API_ENDPOINTS } from "../../config/endpoints";
import { useToast } from "../../components/common/ToastContext";

type FormField = {
  id: string;
  label: string;
  name: string;
  fieldType: string;
  required?: boolean;
  options?: string;
  sortOrder?: number;
};

type FormMeta = {
  id: string;
  name: string;
  description?: string;
  status?: string;
  formType?: string;
  fields?: FormField[];
};

export default function PublishedForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meta, setMeta] = useState<FormMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dynamicValues, setDynamicValues] = useState<
    Record<string, string | string[]>
  >({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Standard fields state (always rendered)
  const [competitionType, setCompetitionType] = useState<
    "fighting" | "quyen" | "music" | ""
  >("");
  const [weightClass, setWeightClass] = useState("");
  const [weightClassId, setWeightClassId] = useState<string>("");
  const [quyenCategory, setQuyenCategory] = useState("");
  const [quyenContent, setQuyenContent] = useState("");
  const [musicCategory, setMusicCategory] = useState("");
  const [fistConfigId, setFistConfigId] = useState<string>("");
  const [musicContentId, setMusicContentId] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<string>("");

  // Team registration helpers
  const [teamName, setTeamName] = useState<string>("");
  const [participantsPerEntry, setParticipantsPerEntry] = useState<
    number | undefined
  >(undefined);
  const [teamMembers, setTeamMembers] = useState<
    Array<{ fullName: string; studentId: string }>
  >([]);

  // API data states
  const [weightClasses, setWeightClasses] = useState<
    Array<{
      id: string;
      weightClass: string;
      gender: string;
      minWeight: number;
      maxWeight: number;
    }>
  >([]);
  const [musicContents, setMusicContents] = useState<
    Array<{
      id: string;
      name: string;
      performersPerEntry?: number;
    }>
  >([]);

  // Fist content data for quyen filtering
  const [fistConfigs, setFistConfigs] = useState<
    Array<{
      id: string;
      name: string;
      description?: string | null;
      level?: number;
      configId?: string;
      configName?: string;
      participantsPerEntry?: number;
    }>
  >([]);

  const [fistItems, setFistItems] = useState<
    Array<{
      id: string;
      name: string;
      description?: string | null;
      level?: number;
      configId?: string;
      configName?: string;
      participantsPerEntry?: number;
    }>
  >([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get<FormMeta>(
          API_ENDPOINTS.TOURNAMENT_FORMS.BY_ID(id as string)
        );
        // Check if form is published
        if (res.data.status !== "PUBLISH") {
          setError("Form này chưa được xuất bản hoặc đã bị lưu trữ");
          return;
        }

        setMeta(res.data);
        console.log("PublishedForm - Loaded form data:", res.data);
        console.log(
          "PublishedForm - Fields count:",
          res.data.fields?.length || 0
        );
        console.log("PublishedForm - All fields:", res.data.fields);
        console.log("PublishedForm - Fields count:", res.data.fields?.length);
        console.log(
          "PublishedForm - Fields with sortOrder > 6:",
          res.data.fields?.filter((f) => f.sortOrder && f.sortOrder > 6)
        );
        console.log(
          "PublishedForm - Custom fields (sortOrder > 6):",
          res.data.fields?.filter((f) => f.sortOrder && f.sortOrder > 6)
        );
        console.log(
          "PublishedForm - All fields with sortOrder:",
          res.data.fields?.map((f) => ({
            label: f.label,
            sortOrder: f.sortOrder,
            fieldType: f.fieldType,
          }))
        );

        const initial: Record<string, string | string[]> = {};
        (res.data.fields || []).forEach((f) => {
          console.log(
            "Initializing field:",
            f.label,
            f.name,
            f.fieldType,
            f.sortOrder
          );
          const fieldName =
            f.name || f.id || f.label.toLowerCase().replace(/\s+/g, "_");
          if (f.fieldType === "CHECKBOX") initial[fieldName] = [];
          else initial[fieldName] = "";
        });
        console.log("Initial dynamic values:", initial);
        setDynamicValues(initial);

        // Set selectedGender from initial values
        const genderField = res.data.fields?.find(
          (field) => field.label === "Giới tính"
        );
        if (genderField) {
          const genderFieldName =
            genderField.name ||
            genderField.id ||
            genderField.label.toLowerCase().replace(/\s+/g, "_");
          const initialGender = initial[genderFieldName] as string;
          if (initialGender) {
            setSelectedGender(initialGender);
          }
        }

        // Load weight classes
        try {
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
        } catch (weightError) {
          console.warn("Failed to load weight classes:", weightError);
          setWeightClasses([]);
        }

        // Load music contents
        try {
          const musicContentsRes = await api.get<{
            content: Array<{ id: string; name: string }>;
            totalElements: number;
          }>(API_ENDPOINTS.MUSIC_CONTENTS.BASE);
          setMusicContents(musicContentsRes.data?.content || []);
        } catch (musicError) {
          console.warn("Failed to load music contents:", musicError);
          setMusicContents([]);
        }

        // Only load competition-related data for COMPETITION_REGISTRATION forms
        if (res.data.formType === "COMPETITION_REGISTRATION") {
          // Load fist configs (Đa luyện, Đơn luyện)
          try {
            const fistConfigsRes = await fistContentService.list({ size: 100 });
            console.log("PublishedForm - Fist configs loaded:", fistConfigsRes);
            // Swap: Use configs as items for dropdown
            setFistItems(fistConfigsRes.content || []);
          } catch (configError) {
            console.warn("Failed to load fist configs:", configError);
            setFistItems([]);
          }

          // Load fist items (Đơn luyện 1, Đơn luyện 2, etc.)
          try {
            const fistItemsRes = await fistContentService.listItems({
              size: 100,
            });
            console.log("PublishedForm - Fist items loaded:", fistItemsRes);
            // Swap: Use items as configs for buttons
            setFistConfigs(fistItemsRes.content || []);
          } catch (itemError) {
            console.warn("Failed to load fist items:", itemError);
            setFistConfigs([]);
          }
        } else {
          // Not a competition form, show error
          setError("Form này không phải là form đăng ký giải");
          return;
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Detect required participants for the selected content (Quyền or Võ nhạc)
  useEffect(() => {
    let required: number | undefined = undefined;
    if (competitionType === "quyen") {
      // Determine by selected fist item id (fistConfigId variable holds the selected item id in current UI)
      if (fistConfigId) {
        const byIdInItems = fistItems.find((i) => i.id === fistConfigId);
        const byIdInConfigs = fistConfigs.find((i) => i.id === fistConfigId);
        const candidate = byIdInItems || byIdInConfigs;
        if (candidate && typeof candidate.participantsPerEntry === "number") {
          required = candidate.participantsPerEntry;
        }
      }
      // If still unknown, do not guess; leave as undefined (treated as individual)
    }
    if (competitionType === "music") {
      if (musicContentId) {
        const perf = musicContents.find((m) => m.id === musicContentId);
        if (perf && typeof perf.performersPerEntry === "number") {
          required = perf.performersPerEntry;
        }
      }
      // No default; if not specified, keep as undefined (treated as individual)
    }
    setParticipantsPerEntry(required);

    // Keep teamMembers length = max(required - 1, 0). We already have one main registrant in standard fields
    const extras = required && required > 1 ? required - 1 : 0;
    setTeamMembers((prev) => {
      const next = [...prev];
      if (next.length < extras) {
        for (let i = next.length; i < extras; i++) {
          next.push({ fullName: "", studentId: "" });
        }
      } else if (next.length > extras) {
        next.length = extras;
      }
      return next;
    });
  }, [
    competitionType,
    fistConfigId,
    musicContentId,
    fistItems,
    fistConfigs,
    musicContents,
    quyenCategory,
    quyenContent,
  ]);

  // Field validations

  const parseOptions = (opts?: string): string[] => {
    if (!opts) return [];
    try {
      const parsed = JSON.parse(opts);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const buildFormDataJson = (): string => {
    const formData: Record<string, unknown> = {
      competitionType,
      submittedAtClient: new Date().toISOString(), // Add client timestamp
    };

    // Add competition-specific data
    if (competitionType === "fighting") {
      formData.weightClass = weightClass;
      formData.weightClassId = weightClassId;
    } else if (competitionType === "quyen") {
      formData.quyenCategory = quyenCategory;
      formData.quyenContent = quyenContent;
      formData.fistConfigId = fistConfigId;
      // Also persist item id for backend approval flow
      formData.quyenContentId = fistConfigId;
      formData.fistItemId = fistConfigId;
    } else if (competitionType === "music") {
      formData.musicCategory = musicCategory;
      formData.musicContentId = musicContentId;
    }

    // Team infos (for multi-performer entries)
    if (participantsPerEntry && participantsPerEntry > 1) {
      formData.participantsPerEntry = participantsPerEntry;
      if (competitionType === "quyen" || competitionType === "music") {
        formData.teamName = teamName;
      }
      formData.teamMembers = teamMembers.map((m) => ({
        fullName: m.fullName,
        studentId: m.studentId,
        gender: selectedGender || "",
      }));
    }

    // Add dynamic field values
    Object.entries(dynamicValues).forEach(([key, value]) => {
      formData[key] = value;
    });

    return JSON.stringify(formData);
  };

  const { show } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields from dynamic fields
    const errors: Record<string, string> = {};

    // Check required dynamic fields (only for fields that are actually rendered)
    if (meta && meta.fields) {
      console.log("Meta fields:", meta.fields);
      meta.fields.forEach((field) => {
        // Skip validation for "Nội dung thi đấu" field as it's handled separately
        const isCompetitionTypeField = field.label === "Nội dung thi đấu";

        // Only validate fields that are actually rendered
        const willShow = !isCompetitionTypeField; // Same logic as rendering

        if (field.required && !isCompetitionTypeField && willShow) {
          const fieldName =
            field.name ||
            field.id ||
            field.label.toLowerCase().replace(/\s+/g, "_");
          const value = dynamicValues[fieldName];
          console.log(`Field ${field.label} (${fieldName}):`, value);
          if (!value || (typeof value === "string" && value.trim() === "")) {
            errors[fieldName] = `${field.label} là bắt buộc`;
          }
        }
      });
    }

    // Competition-specific validation
    if (competitionType === "fighting") {
      if (!selectedGender) {
        console.log("Fighting validation failed - no gender selected");
        errors.gender = "Vui lòng chọn giới tính";
      }
      if (!weightClassId) {
        console.log("Fighting validation failed - no weight class selected");
        errors.weightClass = "Vui lòng chọn hạng cân";
      }
    }

    if (competitionType === "quyen" && !fistConfigId) {
      console.log("Quyen validation failed - no fist config selected");
      errors.quyenContent = "Vui lòng chọn nội dung thi đấu";
    }

    if (competitionType === "music" && !musicContentId) {
      console.log("Music validation failed - no music content selected");
      errors.musicContent = "Vui lòng chọn nội dung thi đấu";
    }

    // Check if competition type is selected
    console.log("Validation - competitionType:", competitionType);
    if (!competitionType) {
      console.log("Validation failed - no competition type selected");
      errors.competitionType = "Vui lòng chọn nội dung thi đấu";
    }

    // If this content requires multiple performers, validate additional members
    if (participantsPerEntry && participantsPerEntry > 1) {
      const expected = participantsPerEntry - 1;
      if (teamMembers.length !== expected) {
        errors.teamMembers = `Vui lòng nhập thông tin ${expected} thành viên bổ sung`;
      } else {
        teamMembers.forEach((m, idx) => {
          if (!m.fullName || !m.fullName.trim()) {
            errors[`teamMember_${idx}_fullName`] = `Thành viên ${
              idx + 2
            }: thiếu họ tên`;
          }
          if (!m.studentId || !m.studentId.trim()) {
            errors[`teamMember_${idx}_studentId`] = `Thành viên ${
              idx + 2
            }: thiếu MSSV`;
          }
        });
      }
      if (
        (competitionType === "quyen" || competitionType === "music") &&
        !teamName.trim()
      ) {
        errors.teamName = "Vui lòng nhập tên đội";
      }
    }

    // Competition type validation is handled above, no need to check meta.fields again

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      console.log("Validation errors:", errors);
      console.log("Dynamic values:", dynamicValues);
      console.log("Competition type:", competitionType);
      console.log("Weight class ID:", weightClassId);
      console.log("Fist config ID:", fistConfigId);
      console.log("Music content ID:", musicContentId);
      console.log("Selected gender:", selectedGender);
      console.log("Team members:", teamMembers);
      console.log("Participants per entry:", participantsPerEntry);
      show("Vui lòng kiểm tra lại thông tin", "error");
      return;
    }

    try {
      const formDataJson = buildFormDataJson();

      const submissionData = {
        fullName: dynamicValues.fullName || "",
        email: dynamicValues.email || "",
        studentId: dynamicValues.studentId || "",
        club: dynamicValues.club || "Không có",
        gender: dynamicValues.gender || "",
        formDataJson,
        weightClassId:
          competitionType === "fighting" ? weightClassId : undefined,
        fistConfigId: competitionType === "quyen" ? fistConfigId : undefined,
        fistItemId: competitionType === "quyen" ? fistConfigId : undefined,
        musicContentId:
          competitionType === "music" ? musicContentId : undefined,
      };

      console.log("Submission payload:", submissionData);
      console.log("Form data JSON:", formDataJson);
      console.log("Competition type:", competitionType);
      console.log("Weight class:", weightClass);
      console.log("Weight class ID:", weightClassId);
      console.log("Form data parsed:", JSON.parse(formDataJson));

      await api.post(
        API_ENDPOINTS.TOURNAMENT_FORMS.SUBMISSIONS(id as string),
        submissionData
      );

      show("Đăng ký thành công!", "success");
      navigate("/");
    } catch (error) {
      console.error("Submission error:", error);
      show("Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => navigate("/")}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Không tìm thấy form
          </h1>
          <p className="text-gray-600 mb-4">
            Form bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{meta.name}</h1>
          {meta.description && (
            <p className="text-gray-600 mb-6">{meta.description}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dynamic Fields */}
            {meta.fields && meta.fields.length > 0 && (
              <div className="space-y-4">
                {meta.fields
                  .filter((field) => {
                    console.log(
                      "Filtering field:",
                      field.label,
                      field.name,
                      field.fieldType,
                      field.sortOrder
                    );
                    const isCompetitionType =
                      field.label === "Nội dung thi đấu";

                    console.log("Field filter result:", {
                      isCompetitionType,
                      willShow: !isCompetitionType,
                    });
                    return !isCompetitionType;
                  })
                  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                  .map((field) => {
                    console.log(
                      "Rendering field:",
                      field.label,
                      field.fieldType,
                      field.sortOrder
                    );
                    const fieldName =
                      field.name ||
                      field.id ||
                      field.label.toLowerCase().replace(/\s+/g, "_");
                    return (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label}
                          {field.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>
                        {(field.fieldType === "TEXT" ||
                          field.fieldType === "SHORT-ANSWER") && (
                          <input
                            type="text"
                            value={(dynamicValues[fieldName] as string) || ""}
                            onChange={(e) =>
                              setDynamicValues((prev) => ({
                                ...prev,
                                [fieldName]: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`Nhập ${field.label.toLowerCase()}`}
                          />
                        )}
                        {field.fieldType === "EMAIL" && (
                          <input
                            type="email"
                            value={(dynamicValues[fieldName] as string) || ""}
                            onChange={(e) =>
                              setDynamicValues((prev) => ({
                                ...prev,
                                [fieldName]: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`Nhập ${field.label.toLowerCase()}`}
                          />
                        )}
                        {field.fieldType === "DATE" && (
                          <input
                            type="date"
                            value={(dynamicValues[fieldName] as string) || ""}
                            onChange={(e) =>
                              setDynamicValues((prev) => ({
                                ...prev,
                                [fieldName]: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                        {field.fieldType === "TEXTAREA" && (
                          <textarea
                            value={(dynamicValues[fieldName] as string) || ""}
                            onChange={(e) =>
                              setDynamicValues((prev) => ({
                                ...prev,
                                [fieldName]: e.target.value,
                              }))
                            }
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`Nhập ${field.label.toLowerCase()}`}
                          />
                        )}
                        {(field.fieldType === "SELECT" ||
                          field.fieldType === "DROPDOWN" ||
                          field.fieldType === "MULTIPLE-CHOICE") && (
                          <select
                            value={(dynamicValues[fieldName] as string) || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              setDynamicValues((prev) => ({
                                ...prev,
                                [fieldName]: value,
                              }));

                              // If this is gender field, update selectedGender and reset weight class
                              if (field.label === "Giới tính") {
                                setSelectedGender(value);
                                if (competitionType === "fighting") {
                                  setWeightClassId("");
                                  setWeightClass("");
                                }
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">
                              Chọn {field.label.toLowerCase()}
                            </option>
                            {field.label === "Giới tính" ? (
                              <>
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                              </>
                            ) : (
                              parseOptions(field.options).map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))
                            )}
                          </select>
                        )}
                        {field.label === "Giới tính" && fieldErrors.gender && (
                          <p className="text-red-500 text-xs mt-1">
                            {fieldErrors.gender}
                          </p>
                        )}
                        {field.fieldType === "CHECKBOX" && (
                          <div className="space-y-2">
                            {parseOptions(field.options).map((option) => (
                              <label key={option} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={(
                                    (dynamicValues[fieldName] as string[]) || []
                                  ).includes(option)}
                                  onChange={(e) => {
                                    const currentValues =
                                      (dynamicValues[fieldName] as string[]) ||
                                      [];
                                    const newValues = e.target.checked
                                      ? [...currentValues, option]
                                      : currentValues.filter(
                                          (v) => v !== option
                                        );
                                    setDynamicValues((prev) => ({
                                      ...prev,
                                      [fieldName]: newValues,
                                    }));
                                  }}
                                  className="mr-2"
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        )}
                        {field.fieldType === "FILE-UPLOAD" && (
                          <input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setDynamicValues((prev) => ({
                                  ...prev,
                                  [fieldName]: file.name,
                                }));
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Competition Type Selection - Move to bottom */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
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
                      checked={competitionType === "fighting"}
                      onChange={(e) => {
                        console.log(
                          "Setting competition type to:",
                          e.target.value
                        );
                        setCompetitionType(
                          e.target.value as "fighting" | "quyen" | "music"
                        );
                        // Also update dynamic values if there's a competition field
                        if (meta && meta.fields) {
                          const competitionField = meta.fields.find(
                            (field) => field.label === "Nội dung thi đấu"
                          );
                          if (competitionField) {
                            setDynamicValues((prev) => ({
                              ...prev,
                              [competitionField.name]: e.target.value,
                            }));
                          }
                        }
                      }}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium">Đối kháng</span>
                  </label>
                  <div className="ml-6 mt-2">
                    <label className="block text-sm text-gray-600 mb-1">
                      Hạng cân
                    </label>
                    <select
                      value={weightClassId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setWeightClassId(id);
                        const wc = weightClasses.find((w) => w.id === id);
                        const weightDisplay =
                          wc?.weightClass ||
                          `${wc?.minWeight}-${wc?.maxWeight}kg`;
                        console.log("Setting weight class:", {
                          wc,
                          weightDisplay,
                        });
                        setWeightClass(weightDisplay || "");
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!selectedGender}
                    >
                      <option value="">
                        {selectedGender
                          ? "Chọn hạng cân"
                          : "Vui lòng chọn giới tính trước"}
                      </option>
                      {weightClasses
                        .filter((w) => {
                          if (!selectedGender) return false;
                          // Map Vietnamese gender to English for filtering
                          const genderMap: Record<string, string> = {
                            Nam: "MALE",
                            Nữ: "FEMALE",
                          };
                          return w.gender === genderMap[selectedGender];
                        })
                        .map((w) => {
                          const weightDisplay =
                            w.weightClass || `${w.minWeight}-${w.maxWeight}kg`;
                          return (
                            <option key={w.id} value={w.id}>
                              {weightDisplay}
                            </option>
                          );
                        })}
                    </select>
                    {fieldErrors.weightClass && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.weightClass}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quyen Option */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="competitionType"
                      value="quyen"
                      checked={competitionType === "quyen"}
                      onChange={(e) => {
                        setCompetitionType(
                          e.target.value as "fighting" | "quyen" | "music"
                        );
                        // Also update dynamic values if there's a competition field
                        if (meta && meta.fields) {
                          const competitionField = meta.fields.find(
                            (field) => field.label === "Nội dung thi đấu"
                          );
                          if (competitionField) {
                            setDynamicValues((prev) => ({
                              ...prev,
                              [competitionField.name]: e.target.value,
                            }));
                          }
                        }
                      }}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium">Quyền</span>
                  </label>
                  <div className="ml-6 mt-2">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      {fistItems.map((config) => (
                        <button
                          key={config.id}
                          type="button"
                          onClick={() => {
                            setCompetitionType("quyen");
                            setQuyenCategory(config.name);
                            setQuyenContent(""); // reset selected content when category changes
                          }}
                          className={`rounded-full border px-3 py-1.5 text-xs ${
                            quyenCategory === config.name
                              ? "border-blue-500 text-blue-600 bg-blue-50"
                              : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                          }`}
                        >
                          {config.name}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2">
                      <label className="block text-sm text-gray-600 mb-1">
                        Nội dung thi đấu
                      </label>
                      <select
                        value={fistConfigId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setFistConfigId(id);
                          const item = fistConfigs.find(
                            (item) => item.id === id
                          );
                          setQuyenContent(item?.name || "");
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Chọn nội dung thi đấu</option>
                        {(() => {
                          // If no category selected, show nothing
                          if (!quyenCategory) {
                            return null;
                          }

                          // Find the selected category (VovinamFistConfig) by name
                          const selectedCategory = fistItems.find(
                            (cfg) => cfg.name === quyenCategory
                          );

                          // Show items (VovinamFistItem) that belong to this category by configId
                          const filteredItems =
                            selectedCategory && selectedCategory.id
                              ? fistConfigs.filter(
                                  (item) =>
                                    item.configId === selectedCategory.id
                                )
                              : [];

                          return (
                            filteredItems &&
                            filteredItems.length > 0 &&
                            filteredItems.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))
                          );
                        })()}
                      </select>
                      {fieldErrors.quyenContent && (
                        <p className="text-red-500 text-xs mt-1">
                          {fieldErrors.quyenContent}
                        </p>
                      )}
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
                      checked={competitionType === "music"}
                      onChange={(e) => {
                        setCompetitionType(
                          e.target.value as "fighting" | "quyen" | "music"
                        );
                        // Also update dynamic values if there's a competition field
                        if (meta && meta.fields) {
                          const competitionField = meta.fields.find(
                            (field) => field.label === "Nội dung thi đấu"
                          );
                          if (competitionField) {
                            setDynamicValues((prev) => ({
                              ...prev,
                              [competitionField.name]: e.target.value,
                            }));
                          }
                        }
                      }}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium">Võ nhạc</span>
                  </label>
                  <div className="ml-6 mt-2">
                    <label className="block text-sm text-gray-600 mb-1">
                      Nội dung thi đấu
                    </label>
                    <select
                      value={musicContentId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setMusicContentId(id);
                        const item = musicContents.find((m) => m.id === id);
                        setMusicCategory(item?.name || "");
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Chọn nội dung thi đấu</option>
                      {musicContents &&
                        musicContents.length > 0 &&
                        musicContents.map((content) => (
                          <option key={content.id} value={content.id}>
                            {content.name}
                          </option>
                        ))}
                    </select>
                    {fieldErrors.musicContent && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.musicContent}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Team fields and extra members when multi-performer is required */}
            {participantsPerEntry && participantsPerEntry > 1 && (
              <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
                {(competitionType === "quyen" ||
                  competitionType === "music") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên đội <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập tên đội"
                    />
                    {fieldErrors.teamName && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.teamName}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thành viên bổ sung ({participantsPerEntry - 1})
                  </label>
                  <div className="space-y-4">
                    {teamMembers.map((m, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 md:grid-cols-2 gap-3"
                      >
                        <input
                          type="text"
                          placeholder={`Họ và tên thành viên ${idx + 2}`}
                          value={m.fullName}
                          onChange={(e) => {
                            const next = [...teamMembers];
                            next[idx] = {
                              ...next[idx],
                              fullName: e.target.value,
                            };
                            setTeamMembers(next);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="MSSV"
                          value={m.studentId}
                          onChange={(e) => {
                            const next = [...teamMembers];
                            next[idx] = {
                              ...next[idx],
                              studentId: e.target.value,
                            };
                            setTeamMembers(next);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
              >
                Đăng ký
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
