import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";

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
  const [quyenCategory, setQuyenCategory] = useState("");
  const [musicCategory, setMusicCategory] = useState("");
  const [coachName, setCoachName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  // const [studentCardFile, setStudentCardFile] = useState<File | null>(null);

  const weightClasses = [
    "",
    "-45 kg",
    "45 - 50 kg",
    "50 - 55 kg",
    "55 - 60 kg",
    "60 - 65 kg",
    "> 65 kg",
  ];
  const quyenCategories = ["Đơn luyện", "Đa luyện", "Song Luyện", "Đồng Đội"];
  const musicCategories = ["", "Độc tấu", "Nhóm 3-5", "Đồng diễn"];

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get<FormMeta>(
          API_ENDPOINTS.TOURNAMENT_FORMS.BY_ID(id as string)
        );
        setMeta(res.data);
        const initial: Record<string, any> = {};
        (res.data.fields || []).forEach((f) => {
          if (f.fieldType === "CHECKBOX") initial[f.name] = [];
          else initial[f.name] = "";
        });
        setDynamicValues(initial);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const sortedFields = useMemo(() => {
    return (meta?.fields || [])
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [meta]);

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
      quyenCategory,
      musicCategory,
      coachName,
      phoneNumber,
    };
    Object.assign(payload, dynamicValues);
    return JSON.stringify(payload);
  };

  const validate = (): string | null => {
    if (!fullName?.trim()) return "Vui lòng nhập Họ và tên";
    if (!email?.trim()) return "Vui lòng nhập Email";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Email không hợp lệ";
    if (!studentId?.trim()) return "Vui lòng nhập MSSV";
    if (!club?.trim()) return "Vui lòng nhập CLB";
    if (!gender?.trim()) return "Vui lòng chọn Giới tính";
    return null;
  };

  const handleSubmit = async (): Promise<void> => {
    const err = validate();
    if (err) {
      alert(err);
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
        }
      );
      window.dispatchEvent(new Event("forms:changed"));
      alert("Đăng ký thành công!");
      navigate(-1);
    } catch (e: unknown) {
      console.error(e);
      const msg = (e as { message?: string })?.message;
      alert(msg || "Gửi đăng ký thất bại");
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
                  Họ và tên
                </label>
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MSSV
                </label>
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CLB
                </label>
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                />
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
                        onChange={(e) => setGender(e.target.value)}
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
                        value={weightClass}
                        onChange={(e) => setWeightClass(e.target.value)}
                        className="w-full appearance-none bg-white border border-gray-400 rounded-full px-4 h-9 text-sm text-gray-700"
                      >
                        {weightClasses.map((w, i) => (
                          <option key={i} value={w}>
                            {w || "Chọn hạng cân của bạn"}
                          </option>
                        ))}
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
                      value={musicCategory}
                      onChange={(e) => setMusicCategory(e.target.value)}
                      className="w-full bg-white border border-gray-400 rounded-md px-3 py-2 text-sm"
                    >
                      {musicCategories.map((c, i) => (
                        <option key={i} value={c}>
                          {c || "Chọn nội dung thi đấu"}
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
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Huấn luyện viên quản lý
                </label>
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                />
              </div>
              {sortedFields.length > 0 && (
                <div className="space-y-4">
                  {sortedFields.map((f) => {
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
                                          ? prev[f.name]
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
