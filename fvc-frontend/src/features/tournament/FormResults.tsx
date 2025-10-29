import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import {
  CommonTable,
  type TableColumn,
} from "../../components/common/CommonTable";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import { useToast } from "../../components/common/ToastContext";
// import type { PaginationResponse } from "../../types/api";

type ResultRow = {
  id: string;
  submittedAt: string;
  fullName: string;
  email: string;
  gender: "Nam" | "Nữ";
  competitionType: string;
  category: string;
  studentId: string;
  club: string;
  coach: string;
  phone: string;
  status: "ĐÃ DUYỆT" | "CHỜ DUYỆT" | "TỪ CHỐI";
  formData?: string; // Add formData to store raw submission data
};

const STATUS_MAP: Record<string, ResultRow["status"]> = {
  APPROVED: "ĐÃ DUYỆT",
  PENDING: "CHỜ DUYỆT",
  REJECTED: "TỪ CHỐI",
};

export default function FormResults() {
  const navigate = useNavigate();
  const toast = useToast();
  const [page, setPage] = useState<number>(1);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [, setLoading] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const { id } = useParams<{ id: string }>();
  const location = useLocation() as { state?: { tournamentName?: string } };

  // New filter states
  const [formTypeFilter, setFormTypeFilter] = useState<
    "COMPETITION" | "CLUB" | ""
  >("");
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [availableForms, setAvailableForms] = useState<
    Array<{ id: string; name: string; formType: string }>
  >([]);

  const tournamentName = location?.state?.tournamentName ?? "";

  // Caches for resolving IDs -> display labels
  const [weightClassMap, setWeightClassMap] = useState<Record<string, string>>(
    {}
  );
  const [fistConfigMap, setFistConfigMap] = useState<Record<string, string>>(
    {}
  );
  const [fistItemMap, setFistItemMap] = useState<Record<string, string>>({});
  const [musicContentMap, setMusicContentMap] = useState<
    Record<string, string>
  >({});

  // Performance data cache for team submissions
  const [performanceCache, setPerformanceCache] = useState<
    Record<string, Record<string, unknown>>
  >({});

  // Fist content data for mapping
  const [fistConfigs, setFistConfigs] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [fistItems, setFistItems] = useState<
    Array<{ id: string; name: string; configId?: string }>
  >([]);

  // Load available forms based on form type filter
  useEffect(() => {
    const loadForms = async () => {
      if (!formTypeFilter) {
        setAvailableForms([]);
        return;
      }

      try {
        const response = await api.get<{
          content: Array<{
            id: string;
            formTitle?: string;
            name?: string;
            formType: string;
          }>;
        }>("/v1/tournament-forms", {
          params: { size: 100 },
        });

        const forms = response.data?.content || [];
        const filteredForms = forms.filter((form) => {
          if (formTypeFilter === "COMPETITION") {
            return form.formType === "COMPETITION_REGISTRATION";
          } else if (formTypeFilter === "CLUB") {
            return form.formType === "CLUB_REGISTRATION";
          }
          return false;
        });

        setAvailableForms(
          filteredForms.map((form) => ({
            id: form.id,
            name: form.formTitle || form.name || "Không có tên",
            formType: form.formType,
          }))
        );
      } catch (error) {
        console.error("Error loading forms:", error);
        toast.error("Không thể tải danh sách form");
      }
    };

    loadForms();
  }, [formTypeFilter, toast]);

  // Load weight classes once to resolve weightClassId -> readable label
  useEffect(() => {
    const loadWeightClasses = async () => {
      try {
        const res = await api.get<{
          content: Array<{
            id: string;
            weightClass?: string;
            minWeight?: number;
            maxWeight?: number;
          }>;
        }>(API_ENDPOINTS.WEIGHT_CLASSES.BASE);
        const list = res.data?.content || [];
        const map: Record<string, string> = {};
        for (const wc of list) {
          const label =
            wc.weightClass && wc.weightClass.trim()
              ? wc.weightClass
              : [wc.minWeight, wc.maxWeight].every((v) => typeof v === "number")
              ? `${wc.minWeight}-${wc.maxWeight}kg`
              : "";
          if (wc.id) map[wc.id] = label;
        }
        setWeightClassMap(map);
      } catch {
        // ignore; fallback mapping will handle
      }
    };
    loadWeightClasses();
  }, []);

  // Load fist configs/items and music contents for resolving IDs -> names
  useEffect(() => {
    const loadContentCatalogs = async () => {
      try {
        // Fist configs
        const cfgRes = await api.get<{
          content: Array<{ id: string; name: string }>;
        }>(API_ENDPOINTS.FIST_CONTENTS.BASE);
        const cfgList = cfgRes.data?.content || [];
        const cfgMap: Record<string, string> = {};
        for (const c of cfgList) if (c.id) cfgMap[c.id] = c.name || "";
        setFistConfigMap(cfgMap);

        // Fist items
        const itemRes = await api.get<{
          content: Array<{ id: string; name: string }>;
        }>(API_ENDPOINTS.FIST_CONTENTS.ITEMS);
        const itemList = itemRes.data?.content || [];
        const itMap: Record<string, string> = {};
        for (const it of itemList) if (it.id) itMap[it.id] = it.name || "";
        setFistItemMap(itMap);

        // Music contents
        const musicRes = await api.get<{
          content: Array<{ id: string; name: string }>;
        }>(API_ENDPOINTS.MUSIC_CONTENTS.BASE);
        const musicList = musicRes.data?.content || [];
        const mcMap: Record<string, string> = {};
        for (const m of musicList) if (m.id) mcMap[m.id] = m.name || "";
        setMusicContentMap(mcMap);

        // Also store raw data for direct lookup
        setFistConfigs(cfgList);
        setFistItems(
          itemList.map(
            (item: {
              id: string;
              name: string;
              configId?: string;
              parentId?: string;
              fistConfigId?: string;
            }) => ({
              id: item.id,
              name: item.name,
              configId: item.configId || item.parentId || item.fistConfigId,
            })
          )
        );
      } catch {
        // Ignore failures; mapping code has fallbacks
      }
    };
    loadContentCatalogs();
  }, []);

  // Load performance data for team submissions
  useEffect(() => {
    const loadPerformanceData = async () => {
      const performanceIds = new Set<string>();

      // Collect all performanceIds from current rows
      rows.forEach((row) => {
        try {
          const parsed = row.formData ? JSON.parse(row.formData) : {};
          if (
            parsed.performanceId &&
            typeof parsed.performanceId === "string"
          ) {
            performanceIds.add(parsed.performanceId);
          }
        } catch {
          // Ignore parsing errors
        }
      });

      // Load performance data for each unique performanceId
      for (const perfId of performanceIds) {
        if (!performanceCache[perfId]) {
          try {
            console.log(`Loading performance data for ${perfId}`);
            const response = await api.get(`/v1/performances/${perfId}`);
            console.log(`Performance data loaded:`, response.data);
            setPerformanceCache((prev) => ({
              ...prev,
              [perfId]: response.data as Record<string, unknown>,
            }));
          } catch (error) {
            console.warn(`Failed to load performance ${perfId}:`, error);
          }
        }
      }
    };

    if (rows.length > 0) {
      loadPerformanceData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const columns: Array<TableColumn<ResultRow>> = useMemo(
    () => [
      {
        key: "index",
        title: "STT",
        className: "w-16 text-[15px]",
        sortable: false,
      },
      {
        key: "submittedAt",
        title: "Thời gian nộp",
        className: "whitespace-nowrap text-[15px]",
        render: (r: ResultRow) => r.submittedAt || "",
      },
      {
        key: "fullName",
        title: "Họ và tên",
        className: "whitespace-nowrap text-[15px]",
      },
      {
        key: "email",
        title: "Email",
        className: "text-[15px] break-words",
      },
      {
        key: "gender",
        title: "Giới tính",
        className: "whitespace-nowrap text-[15px]",
      },
      {
        key: "competitionType",
        title: "Thể thức thi đấu",
        className: "whitespace-nowrap text-[15px]",
      },
      {
        key: "category",
        title: "Nội dung",
        className: "whitespace-nowrap text-[15px]",
      },
      {
        key: "studentId",
        title: "MSSV",
        className: "whitespace-nowrap text-[15px]",
      },
      { key: "club", title: "CLB", className: "text-[15px] break-words" },
      // Removed coach column per request
      {
        key: "phone",
        title: "SDT liên lạc",
        className: "text-[15px] break-words",
      },
      {
        key: "status",
        title: "Trạng thái",
        render: (r: ResultRow) => (
          <div className="flex items-center gap-2">
            <select
              className={`rounded-md px-2 py-1 text-xs border ${
                r.status === "ĐÃ DUYỆT"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : r.status === "TỪ CHỐI"
                  ? "bg-rose-50 text-rose-600 border-rose-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
              value={r.status}
              onChange={async (e) => {
                const next = e.target.value as ResultRow["status"];
                const map: Record<ResultRow["status"], string> = {
                  "ĐÃ DUYỆT": "APPROVED",
                  "CHỜ DUYỆT": "PENDING",
                  "TỪ CHỐI": "REJECTED",
                };
                try {
                  // optimistic
                  setRows((prev) =>
                    prev.map((row) =>
                      row.id === r.id ? { ...row, status: next } : row
                    )
                  );
                  await api.patch(
                    `/v1/tournament-forms/submissions/${r.id}/status`,
                    { status: map[next] }
                  );
                  // Notify athlete list to refetch after approval
                  if (next === "ĐÃ DUYỆT") {
                    window.dispatchEvent(new Event("athletes:refetch"));
                  }
                  toast.success("Cập nhật trạng thái thành công");
                } catch (err) {
                  console.error("Update submission status failed", err);
                  toast.error("Cập nhật trạng thái thất bại");
                }
              }}
            >
              <option>ĐÃ DUYỆT</option>
              <option>CHỜ DUYỆT</option>
              <option>TỪ CHỐI</option>
            </select>
          </div>
        ),
        sortable: false,
      },
    ],
    [toast]
  );

  const [pageSize, setPageSize] = useState<number>(10);
  const [searchText, setSearchText] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<
    "ALL" | "Đối kháng" | "Quyền" | "Võ nhạc"
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ResultRow["status"]>(
    "ALL"
  );

  useEffect(() => {
    const fetchData = async () => {
      // Use selectedFormId if available, otherwise fallback to id from URL
      const formId = selectedFormId || id;
      if (!formId) return;

      try {
        setLoading(true);
        // Always request all records; backend will ignore pagination when all=true
        const resp = await api.get(
          `/v1/tournament-forms/${formId}/submissions?all=true`
        );
        const root = resp.data as Record<string, unknown>;
        const pageData = (root["data"] as Record<string, unknown>) ?? root;
        const responseTimestamp = (root["timestamp"] as string) || "";
        const content = (pageData["content"] as Array<unknown>) ?? [];
        const mapped: ResultRow[] = content.map((raw) => {
          const item = raw as {
            id: number;
            formData?: string;
            status?: string;
          };
          let parsed: Record<string, unknown> = {};
          try {
            parsed = item.formData ? JSON.parse(item.formData) : {};
          } catch {
            parsed = {};
          }
          const status = STATUS_MAP[item.status as string] || "CHỜ DUYỆT";

          // Get performance data if available
          const performanceId = parsed.performanceId as string;
          const performanceData = performanceId
            ? performanceCache[performanceId]
            : null;

          const compRaw = (
            (parsed.competitionType as string) || ""
          ).toLowerCase();
          const compVi =
            compRaw === "quyen"
              ? "Quyền"
              : compRaw === "fighting"
              ? "Đối kháng"
              : compRaw === "music"
              ? "Võ nhạc"
              : "";
          const getFirstString = (v: unknown): string => {
            if (Array.isArray(v)) {
              if (v.length === 0) return "";
              return getFirstString(v[0]);
            }
            if (v && typeof v === "object") {
              const obj = v as Record<string, unknown>;
              if (typeof obj.name === "string" && obj.name) return obj.name;
              if (typeof obj.title === "string" && obj.title) return obj.title;
              if (typeof obj.label === "string" && obj.label) return obj.label;
              for (const key of Object.keys(obj)) {
                const val = obj[key];
                if (typeof val === "string" && val) return val;
              }
              return "";
            }
            if (typeof v === "string" || typeof v === "number")
              return String(v);
            return "";
          };

          // Use performance data if available, otherwise fallback to form data
          const quyenCategory =
            performanceData?.contentType === "QUYEN" &&
            performanceData?.contentId
              ? // Try to find fistConfig first, then fistItem as fallback
                ((): string => {
                  // First try to find fistConfig by contentId
                  const foundConfig = fistConfigs.find(
                    (config: { id: string; name: string }) =>
                      config.id === performanceData.contentId
                  );
                  if (foundConfig) return foundConfig.name;

                  // If not found as fistConfig, try as fistItem and get its config
                  const foundItem = fistItems.find(
                    (item: { id: string; name: string; configId?: string }) =>
                      item.id === performanceData.contentId
                  );
                  if (foundItem && foundItem.configId) {
                    const itemConfig = fistConfigs.find(
                      (config: { id: string; name: string }) =>
                        config.id === foundItem.configId
                    );
                    if (itemConfig) return itemConfig.name;
                  }

                  return "";
                })()
              : getFirstString(parsed.quyenCategory) ||
                getFirstString(parsed.category) ||
                // fallback by fistConfigId
                ((): string => {
                  const id = (parsed as Record<string, unknown>)[
                    "fistConfigId"
                  ];
                  return typeof id === "string" ? fistConfigMap[id] || "" : "";
                })();

          const quyenContent =
            performanceData?.contentType === "QUYEN" &&
            performanceData?.contentId
              ? // Try to find fistItem first, then fistConfig as fallback
                ((): string => {
                  // First try to find fistItem by contentId
                  const foundItem = fistItems.find(
                    (item: { id: string; name: string; configId?: string }) =>
                      item.id === performanceData.contentId
                  );
                  if (foundItem) return foundItem.name;

                  // If not found as fistItem, try as fistConfig
                  const foundConfig = fistConfigs.find(
                    (config: { id: string; name: string }) =>
                      config.id === performanceData.contentId
                  );
                  if (foundConfig) return foundConfig.name;

                  return "";
                })()
              : getFirstString(parsed.quyenContent) ||
                getFirstString(
                  (parsed as Record<string, unknown>).fistContent
                ) ||
                getFirstString((parsed as Record<string, unknown>).fistItem) ||
                getFirstString(
                  (parsed as Record<string, unknown>).fistItemName
                ) ||
                getFirstString(
                  (parsed as Record<string, unknown>).quyenContentName
                ) ||
                getFirstString(
                  (parsed as Record<string, unknown>).contentName
                ) ||
                getFirstString(parsed.content) ||
                // fallback by quyenContentId or fistItemId
                ((): string => {
                  const qid = (parsed as Record<string, unknown>)[
                    "quyenContentId"
                  ];
                  if (typeof qid === "string" && qid)
                    return fistItemMap[qid] || "";
                  const fid = (parsed as Record<string, unknown>)["fistItemId"];
                  if (typeof fid === "string" && fid)
                    return fistItemMap[fid] || "";
                  return "";
                })();
          // For fighting, try to get weight class name from formData or fallback to "Đối kháng"
          let fightingCategory = "";
          if (compRaw === "fighting") {
            fightingCategory = (parsed.weightClass as string) || "";
            // If weightClass is empty but we have weightClassId, try to extract from formData
            if (!fightingCategory && parsed.weightClassId) {
              // First try: resolve via preloaded map
              const labelFromMap = weightClassMap[String(parsed.weightClassId)];
              if (labelFromMap) {
                fightingCategory = labelFromMap;
              } else {
                // Look for weight class info in the formData
                const weightClassInfo =
                  (parsed as Record<string, unknown>).weightClassInfo ||
                  (parsed as Record<string, unknown>).weightClassName ||
                  (parsed as Record<string, unknown>).weightClassDisplay;
                fightingCategory = (weightClassInfo as string) || "Đối kháng";
              }
            }
            // If still empty, try to create a readable name from weightClassId
            if (!fightingCategory && parsed.weightClassId) {
              // Extract readable info from the ID or create a generic name
              const weightClassId = parsed.weightClassId as string;
              if (weightClassId.includes("-")) {
                // If ID contains weight range info, use it
                fightingCategory = weightClassId;
              } else {
                // Otherwise, use a generic name
                fightingCategory = "Đối kháng";
              }
            }
            if (!fightingCategory) {
              fightingCategory = "Đối kháng";
            }
          }

          const categoryVi =
            compRaw === "quyen"
              ? `${quyenCategory}${quyenContent ? ` - ${quyenContent}` : ""}`
              : compRaw === "fighting"
              ? fightingCategory
              : compRaw === "music"
              ? performanceData?.contentType === "MUSIC" &&
                performanceData?.contentId
                ? musicContentMap[performanceData.contentId as string] || ""
                : (parsed.musicCategory as string) ||
                  ((): string => {
                    const id = (parsed as Record<string, unknown>)[
                      "musicContentId"
                    ];
                    return typeof id === "string"
                      ? musicContentMap[id] || ""
                      : "";
                  })()
              : (parsed.category as string) || "";

          console.log("FormResults category mapping:", {
            compRaw,
            weightClass: parsed.weightClass,
            quyenCategory,
            quyenContent,
            musicCategory: parsed.musicCategory,
            categoryVi,
            parsed: parsed,
            performanceId,
            performanceData,
            fistConfigMap: Object.keys(fistConfigMap).length,
            fistItemMap: Object.keys(fistItemMap).length,
            musicContentMap: Object.keys(musicContentMap).length,
            fistConfigs: fistConfigs.length,
            fistItems: fistItems.length,
          });
          if (compRaw === "quyen") {
            console.log("FormResults parsed quyen:", {
              raw: parsed,
              quyenCategory,
              quyenContent,
              categoryVi,
            });
          }
          // Extract submitted time if available, else fallback empty
          const it = item as unknown as Record<string, unknown>;
          const pickDate = (...keys: string[]): string | undefined => {
            for (const k of keys) {
              const v = it[k];
              if (v === undefined || v === null) continue;
              if (typeof v === "number") {
                // epoch seconds or ms
                const ms = v > 1e12 ? v : v * 1000;
                return new Date(ms).toLocaleString();
              }
              if (typeof v === "string" && v.trim()) {
                const d = new Date(v);
                if (!isNaN(d.getTime())) return d.toLocaleString();
              }
            }
            return undefined;
          };
          let submittedAt =
            pickDate(
              "submittedAt",
              "createdAt",
              "createdDate",
              "created_time",
              "created_at",
              "timestamp",
              "createdOn",
              "updatedAt",
              "submittedAtClient"
            ) || "";
          // Also check inside parsed formData (client timestamp saved there)
          if (!submittedAt) {
            const v = (parsed as Record<string, unknown>)["submittedAtClient"];
            if (typeof v === "string" && v) {
              const d = new Date(v);
              if (!isNaN(d.getTime())) submittedAt = d.toLocaleString();
            }
          }
          // Fallback to response timestamp if item lacks its own time
          if (!submittedAt && responseTimestamp) {
            const d = new Date(responseTimestamp);
            if (!isNaN(d.getTime())) submittedAt = d.toLocaleString();
          }
          return {
            id: String(item.id),
            submittedAt,
            fullName: parsed.fullName || "",
            email: parsed.email || "",
            gender: parsed.gender === "FEMALE" ? "Nữ" : "Nam",
            competitionType: compVi,
            category: categoryVi,
            studentId: parsed.studentId || "",
            club: parsed.club || "",
            coach: parsed.coach || "",
            phone: parsed.phone || parsed.phoneNumber || "",
            status,
            formData: item.formData, // Store raw form data for Performance lookup
          } as ResultRow;
        });
        // Client-side filter by name, type, and status when applied
        const filtered = mapped.filter((r) => {
          const matchesName = searchText
            ? r.fullName.toLowerCase().includes(searchText.toLowerCase())
            : true;
          const matchesType =
            typeFilter === "ALL" ? true : r.competitionType === typeFilter;
          const matchesStatus =
            statusFilter === "ALL" ? true : r.status === statusFilter;
          return matchesName && matchesType && matchesStatus;
        });

        // Client-side pagination: 10 per page
        const finalRows = filtered;
        const start = (page - 1) * 10;
        const end = start + 10;
        setRows(finalRows.slice(start, end));
        setTotal(finalRows.length);
        setPageSize(10);
      } catch (e: unknown) {
        console.error("Load submissions failed", e);
        if (typeof e === "object" && e && "message" in e) {
          const msg = (e as { message?: string }).message;
          if (msg) console.error("API message:", msg);
        }
        setRows([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    id,
    selectedFormId,
    page,
    reloadKey,
    searchText,
    typeFilter,
    statusFilter,
    weightClassMap,
    fistConfigMap,
    fistItemMap,
    musicContentMap,
  ]);

  // Listen for form submissions elsewhere to refresh results
  useEffect(() => {
    const handler = () => setReloadKey((k) => k + 1);
    window.addEventListener("forms:changed", handler);
    return () => window.removeEventListener("forms:changed", handler);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F6FF] to-[#E0EAFF] flex flex-col">
      <div className="flex-1">
        <div className="px-6 pb-10 w-full">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
              >
                Quay lại
              </button>
              <div className="text-lg font-semibold text-gray-800">
                Kết quả -{" "}
                {formTypeFilter === "COMPETITION"
                  ? "Đăng ký giải đấu"
                  : formTypeFilter === "CLUB"
                  ? "Đăng ký CLB"
                  : "Đăng ký tham gia"}
              </div>
              <span className="text-lg font-semibold text-[#2563eb]">
                {tournamentName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-md bg-emerald-500 px-3 py-2 text-white text-sm shadow hover:bg-emerald-600">
                Xuất Excel
              </button>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            {/* Form Type Filter */}
            <select
              value={formTypeFilter}
              onChange={(e) => {
                setFormTypeFilter(
                  e.target.value as "COMPETITION" | "CLUB" | ""
                );
                setSelectedFormId("");
                setPage(1);
              }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
            >
              <option value="">Chọn loại form</option>
              <option value="COMPETITION">Form đăng ký giải</option>
              <option value="CLUB">Form đăng ký CLB</option>
            </select>

            {/* Specific Form Filter */}
            {formTypeFilter && (
              <select
                value={selectedFormId}
                onChange={(e) => {
                  setSelectedFormId(e.target.value);
                  setPage(1);
                }}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">Chọn form cụ thể</option>
                {availableForms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.name}
                  </option>
                ))}
              </select>
            )}

            <input
              value={searchText}
              onChange={(e) => {
                setPage(1);
                setSearchText(e.target.value);
              }}
              placeholder="Tìm theo Họ và tên"
              className="w-[20rem] max-w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <select
              value={typeFilter}
              onChange={(e) => {
                setPage(1);
                setTypeFilter(
                  e.target.value as "ALL" | "Đối kháng" | "Quyền" | "Võ nhạc"
                );
              }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
            >
              <option value="ALL">Tất cả thể thức</option>
              <option value="Đối kháng">Đối kháng</option>
              <option value="Quyền">Quyền</option>
              <option value="Võ nhạc">Võ nhạc</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value as "ALL" | ResultRow["status"]);
              }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ĐÃ DUYỆT">Đã duyệt</option>
              <option value="CHỜ DUYỆT">Chờ duyệt</option>
              <option value="TỪ CHỐI">Từ chối</option>
            </select>
          </div>

          <CommonTable<ResultRow>
            columns={columns}
            data={rows.map((r, idx) => ({
              ...r,
              index: (page - 1) * pageSize + idx + 1,
            }))}
            keyField="id"
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
}
