import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
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
  endDate?: string;
};

export default function PublishedForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meta, setMeta] = useState<FormMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState<boolean>(false);
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
        try {
          const ed = (res.data as unknown as { endDate?: string })?.endDate;
          if (ed) {
            const now = Date.now();
            const endTs = Date.parse(ed);
            if (!Number.isNaN(endTs) && now > endTs) setExpired(true);
          }
        } catch {
          /* ignore */
        }
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

        // Only load competition-related data for COMPETITION_REGISTRATION forms
        if (res.data.formType === "COMPETITION_REGISTRATION") {
          // Map options based on the selected competition of this form
          try {
            const compId: string | undefined = (
              res.data as unknown as { competitionId?: string }
            )?.competitionId;
            if (!compId) throw new Error("Missing competitionId in form meta");
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
            const compRes = await api.get<
              CompetitionDetail | { data: CompetitionDetail }
            >(API_ENDPOINTS.COMPETITIONS.BY_ID(compId));
            const rawUnknown = (compRes as unknown as { data: unknown }).data;
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

            setWeightClasses(comp?.weightClasses || []);
            setMusicContents(comp?.musicPerformances || []);
            const cfgs = comp?.vovinamFistConfigs || [];
            const cfgsWithMeta = (cfgs as Array<Record<string, unknown>>).map(
              (c) => ({
                id: c.id,
                name: c.name,
                description: (c as { description?: string | null }).description,
                level: (c as { level?: number }).level,
                configId: (c as { configId?: string }).configId,
                configName: (c as { configName?: string }).configName,
                participantsPerEntry:
                  typeof (c as { participantsPerEntry?: unknown })
                    .participantsPerEntry === "number"
                    ? ((c as { participantsPerEntry?: number })
                        .participantsPerEntry as number)
                    : undefined,
              })
            );
            setFistConfigs(
              cfgsWithMeta as Array<{
                id: string;
                name: string;
                description?: string | null;
                level?: number;
                configId?: string;
                configName?: string;
                participantsPerEntry?: number;
              }>
            );
            const items: Array<{
              id: string;
              name: string;
              configId?: string;
              participantsPerEntry?: number;
            }> = [];
            const selections = comp?.fistConfigItemSelections || {};
            Object.keys(selections).forEach((cfgId) => {
              (selections[cfgId] || []).forEach((it: unknown) =>
                items.push({
                  id: (it as { id: string }).id,
                  name: (it as { name: string }).name,
                  configId: cfgId,
                  participantsPerEntry:
                    typeof (it as { participantsPerEntry?: unknown })
                      .participantsPerEntry === "number"
                      ? ((it as { participantsPerEntry?: number })
                          .participantsPerEntry as number)
                      : undefined,
                })
              );
            });
            setFistItems(
              items as Array<{
                id: string;
                name: string;
                description?: string | null;
                level?: number;
                configId?: string;
                configName?: string;
                participantsPerEntry?: number;
              }>
            );
          } catch (err) {
            console.warn("Failed to load competition-mapped options:", err);
            setWeightClasses([]);
            setMusicContents([]);
            setFistConfigs([]);
            setFistItems([]);
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
      if (fistConfigId) {
        const byIdInItems = fistItems.find((i) => i.id === fistConfigId);
        const byIdInConfigs = fistConfigs.find((i) => i.id === fistConfigId);
        const candidate = byIdInItems || byIdInConfigs;
        if (candidate && typeof candidate.participantsPerEntry === "number") {
          required = candidate.participantsPerEntry;
        }
      }
      // If undefined, try fetching metadata from backend for item/config
      if (!required && fistConfigId) {
        (async () => {
          try {
            const itemRes = await api.get(
              API_ENDPOINTS.FIST_CONTENTS.ITEM_BY_ID(fistConfigId)
            );
            const itemUnknown = (itemRes as unknown as { data?: unknown }).data;
            const itemData = ((itemUnknown as { data?: unknown })?.data ??
              itemUnknown) as Record<string, unknown> | undefined;
            const itemRequired =
              (itemData?.participantsPerEntry as number) ||
              (itemData?.performersPerEntry as number);
            if (typeof itemRequired === "number") {
              setParticipantsPerEntry(itemRequired);
              return;
            }
            // Fallback: fetch config-level meta if available
            const itemConfigId =
              (itemData?.configId as string) ||
              fistItems.find((i) => i.id === fistConfigId)?.configId ||
              undefined;
            if (itemConfigId) {
              try {
                const cfgRes = await api.get(
                  API_ENDPOINTS.FIST_CONTENTS.BY_ID(itemConfigId)
                );
                const cfgUnknown = (cfgRes as unknown as { data?: unknown })
                  .data;
                const cfgData = ((cfgUnknown as { data?: unknown })?.data ??
                  cfgUnknown) as Record<string, unknown> | undefined;
                const cfgRequired =
                  (cfgData?.participantsPerEntry as number) ||
                  (cfgData?.performersPerEntry as number);
                if (typeof cfgRequired === "number") {
                  setParticipantsPerEntry(cfgRequired);
                }
              } catch {
                /* ignore */
              }
            }
          } catch {
            /* ignore */
          }
        })();
      }
      // If undefined, treat as individual (no team fields).
    }
    if (competitionType === "music") {
      if (musicContentId) {
        const perf = musicContents.find((m) => m.id === musicContentId);
        if (perf && typeof perf.performersPerEntry === "number") {
          required = perf.performersPerEntry;
        } else {
          // Try to fetch performersPerEntry from backend if not present in list
          (async () => {
            try {
              const res = await api.get(
                API_ENDPOINTS.MUSIC_CONTENTS.BY_ID(musicContentId)
              );
              const rawUnknown = (res as unknown as { data?: unknown }).data;
              const data = ((rawUnknown as { data?: unknown })?.data ||
                rawUnknown) as Record<string, unknown>;
              const performers = data?.performersPerEntry as number;
              if (typeof performers === "number") {
                setParticipantsPerEntry(performers);
                return;
              }
            } catch {
              /* ignore */
            }
          })();
        }
      }
      // No default; if not specified, keep as undefined (treated as individual)
    }
    setParticipantsPerEntry(required);
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

  // Resize team members whenever participantsPerEntry changes (including async fetch)
  useEffect(() => {
    const extras =
      participantsPerEntry && participantsPerEntry > 1
        ? participantsPerEntry - 1
        : 0;
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
  }, [participantsPerEntry]);

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
    // Derive competitionType robustly at serialization time
    const derivedType: typeof competitionType =
      competitionType && competitionType.length > 0
        ? competitionType
        : quyenCategory || fistConfigId
        ? "quyen"
        : weightClassId
        ? "fighting"
        : musicContentId
        ? "music"
        : "";

    const formData: Record<string, unknown> = {
      competitionType: derivedType,
      submittedAtClient: new Date().toISOString(), // Add client timestamp
    };

    // Add competition-specific data
    if (derivedType === "fighting") {
      formData.weightClass = weightClass;
      formData.weightClassId = weightClassId;
    } else if (derivedType === "quyen") {
      formData.quyenCategory = quyenCategory; // config (Đơn/Song/Đa luyện)
      formData.quyenContent = quyenContent; // item display name
      // IDs: config vs item
      formData.fistConfigId = quyenCategory;
      formData.quyenContentId = fistConfigId; // selected item id
      formData.fistItemId = fistConfigId;
    } else if (derivedType === "music") {
      formData.musicCategory = musicCategory;
      formData.musicContentId = musicContentId;
    }

    // Team infos (for multi-performer entries)
    if (participantsPerEntry && participantsPerEntry > 1) {
      formData.participantsPerEntry = participantsPerEntry;
      if (derivedType === "quyen" || derivedType === "music") {
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

    // Check if competition type is selected (robustly)
    const effectiveType =
      competitionType && competitionType.length > 0
        ? competitionType
        : quyenCategory || fistConfigId
        ? "quyen"
        : weightClassId
        ? "fighting"
        : musicContentId
        ? "music"
        : "";
    console.log("Validation - competitionType(effective):", effectiveType);
    if (!effectiveType) {
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

    // Team member MSSV uniqueness validation (additional members)
    try {
      const captainStudentId = String(dynamicValues.studentId || "")
        .trim()
        .toUpperCase();
      const seen: Record<string, number[]> = {};
      teamMembers.forEach((m, idx) => {
        const sid = String(m.studentId || "")
          .trim()
          .toUpperCase();
        if (!sid) return;
        if (!seen[sid]) seen[sid] = [];
        seen[sid].push(idx);
        if (captainStudentId && sid === captainStudentId) {
          errors[`teamMembers.${idx}.studentId`] = "MSSV trùng với người nộp";
        }
      });
      for (const idxs of Object.values(seen)) {
        if (idxs.length > 1) {
          idxs.forEach((i) => {
            errors[`teamMembers.${i}.studentId`] = "MSSV thành viên bị trùng";
          });
        }
      }
    } catch {
      /* ignore */
    }

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

    // Server-side duplication check against existing submissions in this form (MSSV uniqueness)
    try {
      const resp = await api.get(`/v1/tournament-forms/${id}/submissions`, {
        params: { all: true },
      });
      const rootUnknown = resp.data as unknown;
      const pageDataUnknown =
        (rootUnknown as Record<string, unknown>)?.data ?? rootUnknown;
      const contentUnknown = (pageDataUnknown as { content?: unknown })
        ?.content;
      const submitted = Array.isArray(contentUnknown)
        ? (contentUnknown as unknown[])
        : [];
      const existingIds = new Set<string>();
      const toUpper = (s?: string) => (s || "").trim().toUpperCase();
      for (const row of submitted) {
        let fdObj: Record<string, unknown> = {};
        try {
          const r = row as Record<string, unknown>;
          const fd = typeof r.formData === "string" ? r.formData : "";
          fdObj = fd ? (JSON.parse(fd) as Record<string, unknown>) : {};
        } catch {
          /* ignore */
        }
        const sid = toUpper(fdObj?.studentId as string | undefined);
        if (sid) existingIds.add(sid);
        const membersUnknown = (fdObj?.teamMembers as unknown) || [];
        const members = Array.isArray(membersUnknown)
          ? (membersUnknown as Array<Record<string, unknown>>)
          : [];
        for (const m of members) {
          const msid = toUpper(m?.studentId as string | undefined);
          if (msid) existingIds.add(msid);
        }
      }
      const captainSid = toUpper(String(dynamicValues.studentId || ""));
      if (captainSid && existingIds.has(captainSid)) {
        errors["studentId"] = "MSSV đã đăng ký trong form này";
      }
      teamMembers.forEach((m, idx) => {
        const s = toUpper(m?.studentId || "");
        if (s && existingIds.has(s)) {
          errors[`teamMembers.${idx}.studentId`] =
            "MSSV đã đăng ký trong form này";
        }
      });
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        show("MSSV đã tồn tại trong form này", "error");
        return;
      }
    } catch (dupErr) {
      // nếu gọi kiểm tra lỗi mạng, không chặn submit, nhưng log lại
      console.warn("Could not verify duplicate MSSV against DB", dupErr);
    }

    try {
      const formDataJson = buildFormDataJson();
      const effectiveType =
        competitionType && competitionType.length > 0
          ? competitionType
          : quyenCategory || fistConfigId
          ? "quyen"
          : weightClassId
          ? "fighting"
          : musicContentId
          ? "music"
          : "";

      const submissionData = {
        fullName: dynamicValues.fullName || "",
        email: dynamicValues.email || "",
        studentId: dynamicValues.studentId || "",
        club: dynamicValues.club || "Không có",
        gender: dynamicValues.gender || "",
        formDataJson,
        competitionType: effectiveType,
        weightClassId:
          competitionType === "fighting" ? weightClassId : undefined,
        // For Quyền: configId = category, itemId = selected content
        fistConfigId: competitionType === "quyen" ? quyenCategory : undefined,
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
      try {
        const respUnknown = (
          error as unknown as { response?: { data?: unknown } }
        )?.response?.data;
        const msg: string =
          (respUnknown as { message?: string })?.message ||
          (error as unknown as { message?: string })?.message ||
          "Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.";
        // Chỉ hiển thị toast theo thông điệp server, không gắn lỗi vào field
        show(msg, "error");
      } catch {
        show("Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.", "error");
      }
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
          {expired && (
            <div className="mb-6 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-yellow-800">
              Form đã hết thời hạn đăng ký.
            </div>
          )}
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
                      {fistConfigs.map((cfg) => (
                        <button
                          key={cfg.id}
                          type="button"
                          onClick={() => {
                            // Toggle only sub-competition selection; do not change competitionType
                            if (quyenCategory === cfg.id) {
                              setQuyenCategory("");
                              setQuyenContent("");
                              setFistConfigId("");
                            } else {
                              setQuyenCategory(cfg.id);
                              setQuyenContent(""); // reset selected content when category changes
                              // Auto-select competition type = quyen when picking a subcompetition
                              if (competitionType !== "quyen") {
                                setCompetitionType("quyen");
                              }
                            }
                          }}
                          className={`rounded-full border px-3 py-1.5 text-xs ${
                            quyenCategory === cfg.id
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
                        value={fistConfigId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setFistConfigId(id);
                          const item = fistItems.find((it) => it.id === id);
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

                          // Show items (VovinamFistItem) belonging to the selected category id
                          const filteredItems = fistItems.filter(
                            (item) => item.configId === quyenCategory
                          );

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
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            fieldErrors[`teamMembers.${idx}.studentId`]
                              ? "border-red-400"
                              : "border-gray-300"
                          }`}
                        />
                        {fieldErrors[`teamMembers.${idx}.studentId`] && (
                          <div className="md:col-span-2 text-xs text-red-600 -mt-2">
                            {fieldErrors[`teamMembers.${idx}.studentId`]}
                          </div>
                        )}
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
                disabled={expired}
                className={`w-full py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  expired
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                }`}
              >
                {expired ? "Đã hết hạn" : "Đăng ký"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
