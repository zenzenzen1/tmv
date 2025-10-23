import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import { useToast } from "../../components/common/ToastContext";
import { validateEmail, validatePhoneNumber, validateStudentId, validateLength } from "../../utils/validation";

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
  fields?: FormField[];
};

export default function PublishedForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [meta, setMeta] = useState<FormMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [dynamicValues, setDynamicValues] = useState<
    Record<string, string | string[]>
  >({});

  // Standard fields state (always rendered)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [club, setClub] = useState("");
  const [gender, setGender] = useState("male");
  const [competitionType, setCompetitionType] = useState<
    "fighting" | "quyen" | "music"
  >("fighting");
  const [weightClass, setWeightClass] = useState("");
  const [weightClassId, setWeightClassId] = useState<string>("");
  const [quyenCategory, setQuyenCategory] = useState("");
  const [quyenContent, setQuyenContent] = useState("");
  const [musicCategory, setMusicCategory] = useState("");
  const [fistConfigId, setFistConfigId] = useState<string>("");
  const [musicContentId, setMusicContentId] = useState<string>("");
  const [coachName, setCoachName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  // const [studentCardFile, setStudentCardFile] = useState<File | null>(null);

  // Field validation states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    }>
  >([]);
  // Fixed quyen categories (config cứng)
  const quyenCategories = ["Đơn luyện", "Song luyện", "Đa luyện", "Đồng đội"];

  // Dynamic quyen content from API
  const [quyenContents, setQuyenContents] = useState<
    Array<{
      id: string;
      name: string;
      category?: string;
    }>
  >([]);
  const [allQuyenContents, setAllQuyenContents] = useState<
    Array<{
      id: string;
      name: string;
      category?: string;
    }>
  >([]);

  // Helpers aligned with FormBuilder
  const getString = (obj: Record<string, unknown>, key: string): string => {
    const v = obj[key];
    return typeof v === "string" ? v : "";
  };

  const normalizeQuyenCategory = (
    rawCategory: string,
    rawName: string,
    parentName: string
  ): string => {
    const candidates: string[] = [];
    if (rawCategory) candidates.push(rawCategory);
    if (parentName) candidates.push(parentName);
    if (rawName) candidates.push(rawName);

    const stripAccents = (s: string) =>
      s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase();

    for (const c of candidates) {
      const t = stripAccents(c);
      if (t.includes("don luyen")) return "Đơn luyện";
      if (t.includes("song luyen") && !t.includes("song quyen"))
        return "Song luyện";
      if (t.includes("da luyen")) return "Đa luyện";
      if (t.includes("song quyen")) return "Đồng đội";
    }
    return "";
  };

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get<FormMeta>(
          API_ENDPOINTS.TOURNAMENT_FORMS.BY_ID(id as string)
        );
        setMeta(res.data);
        const initial: Record<string, string | string[]> = {};
        (res.data.fields || []).forEach((f) => {
          if (f.fieldType === "CHECKBOX") initial[f.name] = [];
          else initial[f.name] = "";
        });
        setDynamicValues(initial);

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

        // 1) BỎ competition-scope: luôn dùng global như FormBuilder

        // 2) Load quyền contents (global fist items)
        try {
          const quyenContentsRes = await api.get(
            API_ENDPOINTS.FIST_CONTENTS.ITEMS
          );
          console.log(
            "PublishedForm - Quyen contents API response:",
            quyenContentsRes.data
          );

          // Handle different response structures
          let quyenData: Array<{
            id: string;
            name: string;
            category?: string;
          }> = [];
          const responseData = quyenContentsRes.data as Record<string, unknown>;
          if (responseData?.content && Array.isArray(responseData.content)) {
            quyenData = responseData.content as Array<{
              id: string;
              name: string;
              category?: string;
            }>;
          } else if (
            responseData?.data &&
            typeof responseData.data === "object" &&
            responseData.data !== null
          ) {
            const dataObj = responseData.data as Record<string, unknown>;
            if (dataObj.content && Array.isArray(dataObj.content)) {
              quyenData = dataObj.content as Array<{
                id: string;
                name: string;
                category?: string;
              }>;
            }
          } else if (Array.isArray(responseData)) {
            quyenData = responseData as Array<{
              id: string;
              name: string;
              category?: string;
            }>;
          } else if (
            responseData?.data &&
            Array.isArray((responseData as { data: unknown[] }).data)
          ) {
            quyenData = (
              responseData as {
                data: Array<{ id: string; name: string; category?: string }>;
              }
            ).data as Array<{
              id: string;
              name: string;
              category?: string;
            }>;
          }

          const mapped = (quyenData || []).map((raw) => {
            const item = raw as unknown as Record<string, unknown>;
            const parent =
              (item["parent"] as Record<string, unknown> | undefined) ??
              undefined;
            const derived = normalizeQuyenCategory(
              getString(item, "category") ||
                getString(item, "categoryName") ||
                getString(item, "group") ||
                getString(item, "groupName") ||
                getString(item, "type") ||
                getString(item, "typeName"),
              getString(item, "name"),
              parent
                ? getString(parent, "name")
                : getString(item, "parentName") ||
                    getString(item, "parentTitle")
            );
            return {
              id: String(item["id"] ?? ""),
              name: getString(item, "name"),
              category: derived || getString(item, "category"),
            };
          });
          console.log(
            "PublishedForm - Setting quyen contents state (mapped):",
            mapped
          );
          console.log("PublishedForm - Quyen contents count:", mapped.length);
          // If empty, fallback to using config names as contents
          if (mapped.length === 0) {
            try {
              const cfgRes = await api.get(
                `${API_ENDPOINTS.FIST_CONTENTS.BASE}?page=0&size=100`
              );
              const root = cfgRes.data as Record<string, unknown>;
              const pageObj = (root["data"] as Record<string, unknown>) ?? root;
              const cfgs = (pageObj["content"] as Array<unknown>) ?? [];
              const mappedFromConfigs = cfgs.map((raw) => {
                const it = raw as Record<string, unknown>;
                const name =
                  typeof it["name"] === "string" ? (it["name"] as string) : "";
                return {
                  id: String(it["id"] ?? ""),
                  name,
                  category: normalizeQuyenCategory("", name, ""),
                };
              });
              setAllQuyenContents(mappedFromConfigs);
              setQuyenContents(
                quyenCategory
                  ? mappedFromConfigs.filter(
                      (m) => m.category === quyenCategory
                    )
                  : mappedFromConfigs
              );
            } catch (fallbackErr) {
              console.warn(
                "PublishedForm - Fallback load configs failed",
                fallbackErr
              );
              setAllQuyenContents([]);
              setQuyenContents([]);
            }
          } else {
            // Use items when available
            setAllQuyenContents(mapped);
            setQuyenContents(mapped);
          }
        } catch (quyenError) {
          console.warn("Failed to load quyen contents:", quyenError);
          setQuyenContents([]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Filter quyen contents based on selected category
  useEffect(() => {
    console.log(
      "PublishedForm - Filter effect triggered - quyenCategory:",
      quyenCategory,
      "allQuyenContents length:",
      allQuyenContents.length
    );
    if (!quyenCategory) {
      setQuyenContents([]);
      return;
    }
    if (allQuyenContents.length > 0) {
      const filtered = allQuyenContents.filter(
        (content) => content.category === quyenCategory
      );
      console.log("PublishedForm - Filtered quyen contents:", filtered);
      setQuyenContents(filtered);
    }
  }, [quyenCategory, allQuyenContents]);

  // Field validations
  const emailValidation = useMemo(() => {
    return validateEmail(email, { required: true });
  }, [email]);

  const phoneValidation = useMemo(() => {
    return validatePhoneNumber(phoneNumber, { required: false });
  }, [phoneNumber]);

  const studentIdValidation = useMemo(() => {
    return validateStudentId(studentId, { required: true });
  }, [studentId]);

  const fullNameValidation = useMemo(() => {
    return validateLength(fullName, { min: 1, max: 100, fieldName: 'Họ và tên' });
  }, [fullName]);

  const clubValidation = useMemo(() => {
    return validateLength(club, { min: 1, max: 100, fieldName: 'CLB' });
  }, [club]);

  const coachNameValidation = useMemo(() => {
    if (!coachName || coachName.trim() === '') {
      return { isValid: true }; // Coach name is optional
    }
    return validateLength(coachName, { min: 1, max: 100, fieldName: 'Huấn luyện viên' });
  }, [coachName]);

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
    const payload: Record<string, unknown> = {
      fullName,
      email,
      studentId,
      club,
      gender: gender.toUpperCase(),
      competitionType,
      weightClass,
      // Embed IDs for tight backend linking
      weightClassId: weightClassId || undefined,
      quyenCategory,
      quyenContent,
      fistConfigId: fistConfigId || undefined,
      musicCategory,
      musicContentId: musicContentId || undefined,
      coachName,
      phoneNumber,
      // client-side submission timestamp fallback when backend doesn't persist createdAt
      submittedAtClient: new Date().toISOString(),
    };
    Object.assign(payload, dynamicValues);
    return JSON.stringify(payload);
  };

  const validate = (): string | null => {
    // Validate required fields
    if (!fullNameValidation.isValid) return fullNameValidation.errorMessage || "Họ và tên không hợp lệ";
    if (!emailValidation.isValid) return emailValidation.errorMessage || "Email không hợp lệ";
    if (!studentIdValidation.isValid) return studentIdValidation.errorMessage || "MSSV không hợp lệ";
    if (!clubValidation.isValid) return clubValidation.errorMessage || "CLB không hợp lệ";
    if (!gender?.trim()) return "Vui lòng chọn Giới tính";

    // Validate optional fields if they have values
    if (!phoneValidation.isValid) return phoneValidation.errorMessage || "Số điện thoại không hợp lệ";
    if (!coachNameValidation.isValid) return coachNameValidation.errorMessage || "Tên huấn luyện viên không hợp lệ";

    // Competition-specific required selections
    if (competitionType === "fighting") {
      if (!weightClass?.trim()) return "Vui lòng chọn Hạng cân";
    } else if (competitionType === "quyen") {
      if (!quyenCategory?.trim()) return "Vui lòng chọn Loại quyền";
      if (!quyenContent?.trim()) return "Vui lòng chọn Nội dung quyền";
    } else if (competitionType === "music") {
      if (!musicCategory?.trim()) return "Vui lòng chọn Nội dung Võ nhạc";
    }

    return null;
  };

  const handleSubmit = async (): Promise<void> => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    if (!id) return;
    try {
      const formDataJson = buildFormDataJson();
      await api.post(
        `${API_ENDPOINTS.TOURNAMENT_FORMS.BASE}/${id}/submissions`,
        {
          fullName,
          email,
          studentId,
          club,
          gender: gender.toUpperCase(),
          formDataJson,
          // Preferred ID fields for tight linking
          weightClassId: weightClassId || undefined,
          fistConfigId: fistConfigId || undefined,
          musicContentId: musicContentId || undefined,
        }
      );
      window.dispatchEvent(new Event("forms:changed"));
      toast.success("Đăng ký thành công!");
      navigate(-1);
    } catch (e: unknown) {
      console.error(e);
      const err = e as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };
      const status = err?.response?.status;
      const serverMsg = (err?.response?.data as { message?: string })?.message;
      if (
        status === 409 ||
        (typeof serverMsg === "string" &&
          serverMsg.toLowerCase().includes("email"))
      ) {
        toast.error(
          "Email này đã đăng ký cho form này. Mỗi email chỉ được đăng ký một lần."
        );
        return;
      }
      if (
        status === 409 ||
        (typeof serverMsg === "string" &&
          serverMsg.toLowerCase().includes("mssv"))
      ) {
        toast.error(
          "MSSV này đã được đăng ký cho form này. Mỗi MSSV chỉ được đăng ký một lần."
        );
        return;
      }
      const msg = err?.message;
      toast.error(serverMsg || msg || "Gửi đăng ký thất bại");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F6FF] to-[#E0EAFF]">
      <div className="max-w-3xl mx-auto p-5">
        <div className="bg-white border border-[#E6ECFF] rounded-xl shadow-md p-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-gray-900">
                {meta?.name || "Form đăng ký"}
              </h2>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Quay lại
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            {meta?.description || "Vui lòng điền thông tin phía dưới."}
          </p>

          {loading ? (
            <div className="text-sm text-gray-600">Đang tải...</div>
          ) : (
            <div className="space-y-4">
              {/* Standard base fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên *
                </label>
                <input
                  className={`w-full rounded border px-3 py-2 text-sm ${
                    !fullNameValidation.isValid && fullName !== '' 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  maxLength={100}
                />
                {!fullNameValidation.isValid && fullName !== '' && (
                  <p className="text-red-500 text-xs mt-1">{fullNameValidation.errorMessage}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  className={`w-full rounded border px-3 py-2 text-sm ${
                    !emailValidation.isValid && email !== '' 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {!emailValidation.isValid && email !== '' && (
                  <p className="text-red-500 text-xs mt-1">{emailValidation.errorMessage}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MSSV *
                </label>
                <input
                  className={`w-full rounded border px-3 py-2 text-sm ${
                    !studentIdValidation.isValid && studentId !== '' 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  maxLength={10}
                />
                {!studentIdValidation.isValid && studentId !== '' && (
                  <p className="text-red-500 text-xs mt-1">{studentIdValidation.errorMessage}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CLB *
                </label>
                <input
                  className={`w-full rounded border px-3 py-2 text-sm ${
                    !clubValidation.isValid && club !== '' 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  maxLength={100}
                />
                {!clubValidation.isValid && club !== '' && (
                  <p className="text-red-500 text-xs mt-1">{clubValidation.errorMessage}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giới tính
                </label>
                <div className="flex items-center gap-6 text-sm">
                  {[
                    { value: "male", label: "Nam" },
                    { value: "female", label: "Nữ" },
                    { value: "other", label: "Khác" },
                  ].map((g) => (
                    <label
                      key={g.value}
                      className="inline-flex items-center gap-2"
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={g.value}
                        checked={gender === g.value}
                        onChange={(e) => {
                          setGender(e.target.value);
                          setWeightClass(""); // reset weight when gender changes
                        }}
                      />
                      <span>{g.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Nội dung thi đấu
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="flex items-center mb-2">
                      <input
                        type="radio"
                        name="competitionType"
                        value="fighting"
                        checked={competitionType === "fighting"}
                        onChange={(e) =>
                          setCompetitionType(
                            e.target.value as "fighting" | "quyen" | "music"
                          )
                        }
                        className="mr-2"
                      />
                      Đối kháng
                    </label>
                    <div className="relative mb-3">
                      <select
                        value={weightClassId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setWeightClassId(id);
                          const wc = weightClasses.find((w) => w.id === id);
                          const display = wc
                            ? wc.weightClass ||
                              `${wc.minWeight}-${wc.maxWeight}kg`
                            : "";
                          setWeightClass(display);
                        }}
                        className="w-full appearance-none bg-white border border-gray-400 rounded-full px-4 h-9 text-sm text-gray-700"
                      >
                        <option value="">Chọn hạng cân của bạn</option>
                        {weightClasses &&
                          weightClasses.length > 0 &&
                          weightClasses
                            .filter((w) => {
                              if (gender === "male") return w.gender === "MALE";
                              if (gender === "female")
                                return w.gender === "FEMALE";
                              return true; // 'other' shows all
                            })
                            .map((w) => {
                              const weightDisplay =
                                w.weightClass ||
                                `${w.minWeight}-${w.maxWeight}kg`;
                              return (
                                <option key={w.id} value={w.id}>
                                  {weightDisplay}
                                </option>
                              );
                            })}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      <span className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          name="competitionType"
                          value="quyen"
                          checked={competitionType === "quyen"}
                          onChange={(e) =>
                            setCompetitionType(
                              e.target.value as "fighting" | "quyen" | "music"
                            )
                          }
                          className="mr-2"
                        />
                        Quyền
                      </span>
                    </label>
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      {quyenCategories.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setCompetitionType("quyen");
                            setQuyenCategory(c);
                            setQuyenContent(""); // reset selected content when category changes
                          }}
                          className={`rounded-full border px-3 py-1.5 text-xs ${
                            quyenCategory === c
                              ? "border-blue-500 text-blue-600 bg-blue-50"
                              : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>

                    {/* Quyen Contents Dropdown - Always visible */}
                    <div className="mt-3">
                      <label className="block text-sm text-gray-700 mb-1">
                        Nội dung thi đấu
                      </label>
                      <select
                        value={fistConfigId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setFistConfigId(id);
                          const item = quyenContents.find((q) => q.id === id);
                          setQuyenContent(item?.name || "");
                        }}
                        className="w-full bg-white border border-gray-400 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="">Chọn nội dung thi đấu</option>
                        {(() => {
                          console.log(
                            "PublishedForm - Rendering quyen contents dropdown, quyenContents:",
                            quyenContents
                          );
                          return (
                            quyenContents &&
                            quyenContents.length > 0 &&
                            quyenContents.map((content) => (
                              <option key={content.id} value={content.id}>
                                {content.name}
                              </option>
                            ))
                          );
                        })()}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Nội dung Võ nhạc
                    </label>
                    <div className="mb-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="competitionType"
                          value="music"
                          checked={competitionType === "music"}
                          onChange={(e) =>
                            setCompetitionType(
                              e.target.value as "fighting" | "quyen" | "music"
                            )
                          }
                          className="mr-2"
                        />
                        Võ nhạc
                      </label>
                    </div>
                    <select
                      value={musicContentId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setMusicContentId(id);
                        const item = musicContents.find((m) => m.id === id);
                        setMusicCategory(item?.name || "");
                      }}
                      className="w-full bg-white border border-gray-400 rounded-md px-3 py-2 text-sm"
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
                  </div>
                </div>
              </div>

              {/* Bỏ upload thẻ sinh viên tạm thời */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SDT liên lạc
                </label>
                <input
                  className={`w-full rounded border px-3 py-2 text-sm ${
                    !phoneValidation.isValid && phoneNumber !== '' 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                {!phoneValidation.isValid && phoneNumber !== '' && (
                  <p className="text-red-500 text-xs mt-1">{phoneValidation.errorMessage}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Huấn luyện viên quản lý
                </label>
                <input
                  className={`w-full rounded border px-3 py-2 text-sm ${
                    !coachNameValidation.isValid && coachName !== '' 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                  maxLength={100}
                />
                {!coachNameValidation.isValid && coachName !== '' && (
                  <p className="text-red-500 text-xs mt-1">{coachNameValidation.errorMessage}</p>
                )}
              </div>
              {meta?.fields && meta.fields.length > 0 && (
                <div className="space-y-4">
                  {meta.fields
                    .filter(f => f.fieldType !== 'TEXT' || !['fullName', 'email', 'studentId', 'club', 'gender', 'phoneNumber', 'coachName'].includes(f.name))
                    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                    .map((f) => {
                    const options = parseOptions(f.options);
                    return (
                      <div key={f.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {f.label}
                          {f.required ? " *" : ""}
                        </label>
                        {f.fieldType === "TEXT" && (
                          <input
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                            value={(dynamicValues[f.name] as string) ?? ""}
                            onChange={(e) =>
                              setDynamicValues((prev) => ({
                                ...prev,
                                [f.name]: e.target.value,
                              }))
                            }
                          />
                        )}
                        {f.fieldType === "SELECT" && (
                          <select
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                            value={(dynamicValues[f.name] as string) ?? ""}
                            onChange={(e) =>
                              setDynamicValues((prev) => ({
                                ...prev,
                                [f.name]: e.target.value,
                              }))
                            }
                          >
                            <option value="">Chọn</option>
                            {options.map((o, i) => (
                              <option key={i} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        )}
                        {f.fieldType === "RADIO" && (
                          <div className="space-y-1 border border-gray-300 rounded-md p-3">
                            {options.map((o, i) => (
                              <label
                                key={i}
                                className="flex items-center gap-2 text-sm text-gray-700"
                              >
                                <input
                                  type="radio"
                                  name={f.name}
                                  checked={
                                    (dynamicValues[f.name] as string) === o
                                  }
                                  onChange={() =>
                                    setDynamicValues((prev) => ({
                                      ...prev,
                                      [f.name]: o,
                                    }))
                                  }
                                />
                                {o}
                              </label>
                            ))}
                          </div>
                        )}
                        {f.fieldType === "CHECKBOX" && (
                          <div className="space-y-1 border border-gray-300 rounded-md p-3">
                            {options.map((o, i) => {
                              const val = dynamicValues[f.name];
                              const arr: string[] = Array.isArray(val)
                                ? (val as string[])
                                : [];
                              const checked =
                                Array.isArray(arr) && arr.includes(o);
                              return (
                                <label
                                  key={i}
                                  className="flex items-center gap-2 text-sm text-gray-700"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      setDynamicValues((prev) => {
                                        const current: string[] = Array.isArray(
                                          prev[f.name]
                                        )
                                          ? (prev[f.name] as string[])
                                          : [];
                                        let next: string[];
                                        if (current.includes(o)) {
                                          next = current.filter(
                                            (it) => it !== o
                                          );
                                        } else {
                                          next = [...current, o];
                                        }
                                        return { ...prev, [f.name]: next };
                                      });
                                    }}
                                  />
                                  {o}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={handleSubmit}
                  className="rounded bg-[#377CFB] px-4 py-2 text-sm text-white shadow hover:bg-[#2f6ae0]"
                >
                  Gửi đăng ký
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
