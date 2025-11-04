import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
// Footer removed per request
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
  teamName?: string; // Team name for team submissions
  teamMembers?: Array<{
    fullName: string;
    studentId: string;
    email?: string;
    gender?: string;
  }>; // Team members
};

const STATUS_MAP: Record<string, ResultRow["status"]> = {
  APPROVED: "ĐÃ DUYỆT",
  PENDING: "CHỜ DUYỆT",
  REJECTED: "TỪ CHỐI",
};

export default function FormResults() {
  // navigate removed with header
  const toast = useToast();
  const [page, setPage] = useState<number>(1);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [, setLoading] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const { id } = useParams<{ id: string }>();
  // location not used in simplified layout

  // New filter states
  // Participant mode controls which competition types are available in the next dropdown
  const [participantMode, setParticipantMode] = useState<"INDIVIDUAL" | "TEAM">(
    "INDIVIDUAL"
  );

  // tournamentName not displayed in simplified layout

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

  // Form fields mapping (name/id -> label) from published form
  const [formFieldsMap, setFormFieldsMap] = useState<Record<string, string>>(
    {}
  );

  // Removed: loading list of forms; results are tied to the URL form id

  // Load form definition to get field labels
  useEffect(() => {
    const loadFormDefinition = async () => {
      if (!id) return;
      try {
        const res = await api.get<{
          fields?: Array<{ id?: string; name?: string; label?: string }>;
        }>(API_ENDPOINTS.TOURNAMENT_FORMS.BY_ID(id));
        const fields = res.data?.fields || [];
        const map: Record<string, string> = {};
        for (const field of fields) {
          // Map by both id and name to handle different cases
          // Also map by lowercase name for case-insensitive matching
          if (field.id && field.label) {
            map[field.id] = field.label;
          }
          if (field.name && field.label) {
            map[field.name] = field.label;
            // Also map lowercase version
            map[field.name.toLowerCase()] = field.label;
          }
        }
        console.log("Form fields map:", map);
        setFormFieldsMap(map);
      } catch {
        // Ignore failures; fallback mapping will handle
      }
    };
    loadFormDefinition();
  }, [id]);

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
            const response = await api.get(`/v1/performances/${perfId}`);
            if (response.success && response.data) {
              setPerformanceCache((prev) => ({
                ...prev,
                [perfId]: response.data as Record<string, unknown>,
              }));
            }
          } catch (error) {
            // Silently fail - performance data might not exist for all submissions
            // This is expected for some team submissions that haven't been processed yet
            console.debug(`Performance ${perfId} not available`);
          }
        }
      }
    };

    if (rows.length > 0) {
      loadPerformanceData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const columns: Array<TableColumn<ResultRow>> = useMemo(() => {
    const isTeamMode = participantMode === "TEAM";
    const cols: Array<TableColumn<ResultRow>> = [
      {
        key: "index",
        title: "STT",
        className: "w-16",
        sortable: false,
      },
      {
        key: "submittedAt",
        title: "Thời gian nộp",
        className: "whitespace-nowrap",
        render: (r: ResultRow) => r.submittedAt || "",
      },
      {
        key: "fullName",
        title: isTeamMode ? "Tên đội" : "Họ và tên",
        className: "whitespace-nowrap",
        render: (r: ResultRow) =>
          isTeamMode && r.teamName ? r.teamName : r.fullName,
      },
      {
        key: "email",
        title: isTeamMode ? "Email người đăng ký" : "Email",
        className: "break-words",
      },
    ];

    // Show competition type and category for both modes
    cols.push({
      key: "competitionType",
      title: "Thể thức thi đấu",
      className: "whitespace-nowrap",
    });
    cols.push({
      key: "category",
      title: "Nội dung",
      className: "whitespace-nowrap",
    });

    // For individual mode: show "Xem chi tiết" button
    if (!isTeamMode) {
      cols.push({
        key: "actions",
        title: "Thao tác",
        className: "whitespace-nowrap",
        render: (r: ResultRow) => (
          <button
            onClick={() => {
              setSelectedIndividual(r);
              setShowIndividualModal(true);
            }}
            className="rounded-md bg-[#377CFB] px-3 py-1.5 text-white text-xs hover:bg-[#2e6de0]"
          >
            Xem chi tiết
          </button>
        ),
        sortable: false,
      });
    }

    // Add "Chi tiết" button for team mode
    if (isTeamMode) {
      cols.push({
        key: "actions",
        title: "Thao tác",
        className: "whitespace-nowrap",
        render: (r: ResultRow) => (
          <button
            onClick={() => {
              setSelectedTeam(r);
              setShowTeamModal(true);
            }}
            className="rounded-md bg-[#377CFB] px-3 py-1.5 text-white text-xs hover:bg-[#2e6de0]"
          >
            Chi tiết
          </button>
        ),
        sortable: false,
      });
    }

    // Status column - always at the end for both modes
    cols.push({
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
    });

    return cols;
  }, [toast, participantMode]);

  const [pageSize, setPageSize] = useState<number>(10);
  const [searchText, setSearchText] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<
    "ALL" | "Đối kháng" | "Quyền" | "Võ nhạc"
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ResultRow["status"]>(
    "ALL"
  );
  // Modal state for team details
  const [showTeamModal, setShowTeamModal] = useState<boolean>(false);
  const [selectedTeam, setSelectedTeam] = useState<ResultRow | null>(null);
  // Modal state for individual details
  const [showIndividualModal, setShowIndividualModal] =
    useState<boolean>(false);
  const [selectedIndividual, setSelectedIndividual] =
    useState<ResultRow | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Use id from URL
      const formId = id;
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
        const mapped: ResultRow[] = await Promise.all(
          content.map(async (raw) => {
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
                if (typeof obj.title === "string" && obj.title)
                  return obj.title;
                if (typeof obj.label === "string" && obj.label)
                  return obj.label;
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
            // For Quyen, we need both config name and item name
            let quyenCategory = "";
            let quyenContent = "";

            if (performanceData?.contentType === "QUYEN") {
              // Priority 1: Use fistItemId and fistConfigId from performanceData if available
              if (performanceData.fistItemId) {
                const foundItem = fistItems.find(
                  (item: { id: string; name: string; configId?: string }) =>
                    item.id === performanceData.fistItemId
                );
                if (foundItem) {
                  quyenContent = foundItem.name || "";
                } else {
                  // Fallback to map if not found in array
                  const itemId = String(performanceData.fistItemId);
                  quyenContent = fistItemMap[itemId] || "";
                }
              }

              if (performanceData.fistConfigId) {
                const foundConfig = fistConfigs.find(
                  (config: { id: string; name: string }) =>
                    config.id === performanceData.fistConfigId
                );
                if (foundConfig) {
                  quyenCategory = foundConfig.name || "";
                } else {
                  // Fallback to map if not found in array
                  const configId = String(performanceData.fistConfigId);
                  quyenCategory = fistConfigMap[configId] || "";
                }
              }

              // Priority 2: If not found, try to get from contentId
              if (
                (!quyenCategory || !quyenContent) &&
                performanceData.contentId
              ) {
                // Try to find fistItem first (most common case)
                const foundItem = fistItems.find(
                  (item: { id: string; name: string; configId?: string }) =>
                    item.id === performanceData.contentId
                );

                if (foundItem) {
                  // Found as item, get item name
                  if (!quyenContent) {
                    quyenContent = foundItem.name || "";
                  }
                  // Get config name from item's configId
                  if (!quyenCategory && foundItem.configId) {
                    const itemConfig = fistConfigs.find(
                      (config: { id: string; name: string }) =>
                        config.id === foundItem.configId
                    );
                    if (itemConfig) {
                      quyenCategory = itemConfig.name || "";
                    }
                  }
                } else {
                  // Not found as item, try as config
                  if (!quyenCategory) {
                    const foundConfig = fistConfigs.find(
                      (config: { id: string; name: string }) =>
                        config.id === performanceData.contentId
                    );
                    if (foundConfig) {
                      quyenCategory = foundConfig.name || "";
                    }
                  }
                }
              }
            } else {
              // Fallback to formData - prioritize map lookups first
              // Get quyenCategory: prioritize fistConfigMap, then getFirstString
              const fistConfigId = (parsed as Record<string, unknown>)[
                "fistConfigId"
              ];
              if (typeof fistConfigId === "string" && fistConfigId) {
                quyenCategory = fistConfigMap[fistConfigId] || "";
              }
              if (!quyenCategory) {
                quyenCategory =
                  getFirstString(parsed.quyenCategory) ||
                  getFirstString(parsed.category) ||
                  "";
              }

              // Get quyenContent: prioritize fistItemMap, then getFirstString
              const quyenContentId = (parsed as Record<string, unknown>)[
                "quyenContentId"
              ];
              const fistItemId = (parsed as Record<string, unknown>)[
                "fistItemId"
              ];

              if (typeof quyenContentId === "string" && quyenContentId) {
                quyenContent = fistItemMap[quyenContentId] || "";
              } else if (typeof fistItemId === "string" && fistItemId) {
                quyenContent = fistItemMap[fistItemId] || "";
              }

              if (!quyenContent) {
                quyenContent =
                  getFirstString(parsed.quyenContent) ||
                  getFirstString(
                    (parsed as Record<string, unknown>).fistContent
                  ) ||
                  getFirstString(
                    (parsed as Record<string, unknown>).fistItem
                  ) ||
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
                  "";
              }
            }
            // For fighting, try to get weight class name from formData or fallback to "Đối kháng"
            let fightingCategory = "";
            if (compRaw === "fighting") {
              fightingCategory = (parsed.weightClass as string) || "";
              // If weightClass is empty but we have weightClassId, try to extract from formData
              if (!fightingCategory && parsed.weightClassId) {
                // First try: resolve via preloaded map
                const labelFromMap =
                  weightClassMap[String(parsed.weightClassId)];
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

            // Helper function to remove UUID/ID from string (format: "uuid - name" -> "name")
            const removeIdFromString = (str: string): string => {
              if (!str) return "";
              const trimmed = str.trim();

              // Check if entire string is a UUID
              const fullUuidPattern =
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
              if (fullUuidPattern.test(trimmed)) {
                // If entire string is UUID, return empty (don't show ID)
                return "";
              }

              // Pattern to match UUID followed by " - " and then text
              // Match: UUID at start, followed by optional whitespace, " - ", and optional whitespace
              const uuidWithSeparatorPattern =
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\s*-\s*/i;
              let cleaned = trimmed
                .replace(uuidWithSeparatorPattern, "")
                .trim();

              // Also try to match UUID anywhere in the string if it's followed by " - "
              const uuidAnywherePattern =
                /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\s*-\s*/gi;
              cleaned = cleaned.replace(uuidAnywherePattern, "").trim();

              // If after removing UUID pattern, string is empty, return empty
              if (!cleaned || cleaned.length === 0) {
                return "";
              }

              return cleaned;
            };

            // Clean quyenCategory and quyenContent to ensure no IDs
            quyenCategory = removeIdFromString(quyenCategory);
            quyenContent = removeIdFromString(quyenContent);

            const categoryVi =
              compRaw === "quyen"
                ? // Format: "configidname - itemidname"
                  quyenCategory && quyenContent
                  ? `${removeIdFromString(
                      quyenCategory
                    )} - ${removeIdFromString(quyenContent)}`
                  : quyenCategory || quyenContent
                  ? removeIdFromString(quyenCategory || quyenContent)
                  : ""
                : compRaw === "fighting"
                ? removeIdFromString(fightingCategory)
                : compRaw === "music"
                ? performanceData?.contentType === "MUSIC" &&
                  performanceData?.contentId
                  ? removeIdFromString(
                      musicContentMap[performanceData.contentId as string] || ""
                    )
                  : removeIdFromString(
                      (parsed.musicCategory as string) ||
                        ((): string => {
                          const id = (parsed as Record<string, unknown>)[
                            "musicContentId"
                          ];
                          return typeof id === "string"
                            ? musicContentMap[id] || ""
                            : "";
                        })()
                    )
                : removeIdFromString((parsed.category as string) || "");

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
              const v = (parsed as Record<string, unknown>)[
                "submittedAtClient"
              ];
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
            // Extract team info from performance data
            let teamName: string | undefined = undefined;
            let teamMembers:
              | Array<{
                  fullName: string;
                  studentId: string;
                  email?: string;
                  gender?: string;
                }>
              | undefined = undefined;

            if (performanceData && performanceData.teamName) {
              teamName = String(performanceData.teamName);

              // Get team members from performance data
              if (
                performanceData.athletes &&
                Array.isArray(performanceData.athletes)
              ) {
                // Helper function to fetch athlete details
                const fetchAthleteDetails = async (athlete: any) => {
                  let studentId = "";
                  let gender = "";

                  // Try to fetch athlete details if we have athlete.id
                  if (athlete.id && athlete.approved) {
                    try {
                      const athleteResp = await api.get(
                        `/v1/athletes/${athlete.id}`
                      );
                      const athleteData = athleteResp.data as {
                        studentId?: string;
                        gender?: string;
                      };
                      studentId = athleteData.studentId || "";
                      gender =
                        athleteData.gender === "FEMALE"
                          ? "Nữ"
                          : athleteData.gender === "MALE"
                          ? "Nam"
                          : "";
                    } catch (err) {
                      console.error("Failed to fetch athlete details", err);
                    }
                  }

                  return {
                    fullName: athlete.fullName || "",
                    studentId: studentId || athlete.id || "",
                    email: athlete.email || "",
                    gender: gender || "",
                  };
                };

                // Map athletes and fetch full details if needed
                teamMembers = await Promise.all(
                  performanceData.athletes.map(fetchAthleteDetails)
                );
              }
            }

            // Fallback to formData if performance data not available
            if (!teamName && parsed.teamName) {
              teamName = String(parsed.teamName);
            }

            // Also check formData for team members if not already loaded
            if (
              !teamMembers &&
              parsed.teamMembers &&
              Array.isArray(parsed.teamMembers)
            ) {
              teamMembers = parsed.teamMembers.map((member: any) => ({
                fullName: member.fullName || member.name || "",
                studentId: member.studentId || member.mssv || "",
                email: member.email || "",
                gender:
                  member.gender === "FEMALE" || member.gender === "Nữ"
                    ? "Nữ"
                    : member.gender === "MALE" || member.gender === "Nam"
                    ? "Nam"
                    : "",
              }));
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
              teamName,
              teamMembers,
            } as ResultRow;
          })
        );
        // Client-side filter by name, type, and status when applied
        const filtered = mapped.filter((r) => {
          const matchesName = searchText
            ? participantMode === "TEAM" && r.teamName
              ? r.teamName.toLowerCase().includes(searchText.toLowerCase())
              : r.fullName.toLowerCase().includes(searchText.toLowerCase())
            : true;

          // Determine if row is team (has performanceId) or individual
          let isTeamSubmission = false;
          try {
            const parsed = r.formData ? JSON.parse(r.formData) : {};
            if (
              parsed.performanceId &&
              typeof parsed.performanceId === "string" &&
              parsed.performanceId.trim()
            ) {
              isTeamSubmission = true;
            }
          } catch {
            // Ignore parsing errors
          }

          // Participant mode filter: match actual team/individual status
          const matchesMode =
            participantMode === "TEAM"
              ? isTeamSubmission
              : participantMode === "INDIVIDUAL"
              ? !isTeamSubmission
              : true;

          const matchesType =
            typeFilter === "ALL" ? true : r.competitionType === typeFilter;
          const matchesStatus =
            statusFilter === "ALL" ? true : r.status === statusFilter;
          return matchesName && matchesMode && matchesType && matchesStatus;
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
    page,
    reloadKey,
    searchText,
    typeFilter,
    statusFilter,
    participantMode,
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

  // Extract all fields from formData excluding category-related fields
  const extractFormFields = (
    formData: string | undefined
  ): Record<string, string> => {
    if (!formData) return {};
    try {
      const parsed =
        typeof formData === "string" ? JSON.parse(formData) : formData;
      const fields: Record<string, string> = {};

      // Fields to exclude (category-related and internal fields)
      const excludeFields = new Set([
        "category",
        "noidung",
        "quyenCategory",
        "quyenContent",
        "fistConfigId",
        "fistItemId",
        "musicContentId",
        "weightClassId",
        "competitionType",
        "performanceId",
        "submittedAt",
        "submittedAtClient",
        "teamName",
        "teamMembers",
        "participantsPerEntry",
      ]);

      // First, extract top-level fields directly (these are the actual form fields)
      Object.entries(parsed as Record<string, unknown>).forEach(([k, v]) => {
        const lowerKey = k.toLowerCase();
        // Skip if it's an exclude field or category-related
        if (
          excludeFields.has(k) ||
          excludeFields.has(lowerKey) ||
          lowerKey.includes("category") ||
          lowerKey.includes("noidung") ||
          lowerKey.includes("fistconfig") ||
          lowerKey.includes("fistitem") ||
          lowerKey.includes("musiccontent") ||
          lowerKey.includes("weightclass") ||
          lowerKey.includes("competitiontype") ||
          lowerKey.includes("performanceid")
        ) {
          return;
        }

        // Extract value if it's a simple type
        if (typeof v === "string" && v.trim()) {
          fields[k] = v.trim();
        } else if (typeof v === "number") {
          fields[k] = String(v);
        } else if (typeof v === "boolean") {
          fields[k] = v ? "Có" : "Không";
        } else if (Array.isArray(v) && v.length > 0) {
          // For arrays, join with comma
          fields[k] = v
            .map((item) => (typeof item === "string" ? item : String(item)))
            .filter((item) => item.trim())
            .join(", ");
        } else if (v && typeof v === "object") {
          // For nested objects, try to extract meaningful value
          const obj = v as Record<string, unknown>;
          if (typeof obj.name === "string" && obj.name) {
            fields[k] = obj.name;
          } else if (typeof obj.label === "string" && obj.label) {
            fields[k] = obj.label;
          } else if (typeof obj.value === "string" && obj.value) {
            fields[k] = obj.value;
          }
        }
      });

      console.log("Extracted form fields:", fields);
      return fields;
    } catch (error) {
      console.error("Error extracting form fields:", error);
      return {};
    }
  };

  // Format field key to readable label
  const formatFieldLabel = (key: string): string => {
    // First, check if we have label from form definition (published form)
    // Check exact match first
    if (formFieldsMap[key]) {
      return formFieldsMap[key];
    }

    // Check lowercase version for case-insensitive matching
    if (formFieldsMap[key.toLowerCase()]) {
      return formFieldsMap[key.toLowerCase()];
    }

    // Mapping common field names
    const fieldMap: Record<string, string> = {
      fullName: "Họ và tên",
      name: "Tên",
      email: "Email",
      studentId: "MSSV",
      mssv: "MSSV",
      phone: "Số điện thoại",
      phoneNumber: "Số điện thoại",
      sdt: "Số điện thoại",
      gender: "Giới tính",
      club: "Câu lạc bộ",
      clb: "Câu lạc bộ",
      coach: "Huấn luyện viên",
      submittedAt: "Thời gian nộp",
      submittedAtClient: "Thời gian nộp",
    };

    // Check exact match
    if (fieldMap[key]) return fieldMap[key];

    // Check lowercase match
    if (fieldMap[key.toLowerCase()]) return fieldMap[key.toLowerCase()];

    // Check if key is purely numeric (like "1762098545347")
    // Try to find in formFieldsMap first, if not found, return generic label
    if (/^\d+$/.test(key)) {
      // This should have been caught above, but just in case
      return formFieldsMap[key] || "Trường tùy chỉnh";
    }

    // Convert camelCase/snake_case to readable format
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Compute all team members including the submitter
  const allTeamMembers = useMemo(() => {
    if (!selectedTeam) return [];

    const members = [...(selectedTeam.teamMembers || [])];

    // Check if submitter is already in teamMembers
    const submitterEmail = selectedTeam.email?.toLowerCase();
    const submitterName = selectedTeam.fullName;
    const submitterStudentId = selectedTeam.studentId;

    const isSubmitterInList = members.some(
      (member) =>
        member.email?.toLowerCase() === submitterEmail ||
        (member.fullName === submitterName &&
          member.studentId === submitterStudentId)
    );

    // Add submitter if not already in the list
    if (!isSubmitterInList && submitterName) {
      members.unshift({
        fullName: submitterName,
        studentId: submitterStudentId || "",
        email: selectedTeam.email || "",
        gender: selectedTeam.gender === "Nữ" ? "Nữ" : "Nam",
      });
    }

    return members;
  }, [selectedTeam]);

  // Extract form fields for individual detail modal
  const individualFormFields = useMemo(() => {
    if (!selectedIndividual?.formData) return {};
    return extractFormFields(selectedIndividual.formData);
  }, [selectedIndividual]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <div className="flex-1">
        <div className="px-6 pb-10 w-full">
          {/* Header removed as per request: keep only filters and table */}

          <div className="mb-3 flex flex-wrap items-center gap-2">
            {/* Search first (leftmost) */}
            <input
              value={searchText}
              onChange={(e) => {
                const newValue = e.target.value;
                setPage(1);
                setSearchText(newValue);
                // Reset child filters when search is cleared
                if (newValue.trim() === "") {
                  setTypeFilter("ALL");
                  setStatusFilter("ALL");
                  setParticipantMode("INDIVIDUAL");
                }
              }}
              placeholder="Tìm theo Họ và tên"
              className="w-[20rem] max-w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {/* Participant mode: Individual / Team */}
            <select
              value={participantMode}
              onChange={(e) => {
                const v = e.target.value as "INDIVIDUAL" | "TEAM";
                setParticipantMode(v);
                // Reset type filter when switching modes
                if (v === "TEAM") {
                  // TEAM mode: only Quyền and Võ nhạc available
                  if (typeFilter === "Đối kháng" || typeFilter === "ALL") {
                    setTypeFilter("Quyền");
                  }
                } else {
                  // INDIVIDUAL mode: reset to ALL to show all types
                  setTypeFilter("ALL");
                }
                setPage(1);
              }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
            >
              <option value="INDIVIDUAL">Cá nhân</option>
              <option value="TEAM">Đồng đội</option>
            </select>
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
              {participantMode === "INDIVIDUAL" ? (
                <>
                  <option value="ALL">Tất cả thể thức</option>
                  <option value="Đối kháng">Đối kháng</option>
                  <option value="Quyền">Quyền</option>
                  <option value="Võ nhạc">Võ nhạc</option>
                </>
              ) : (
                <>
                  <option value="Quyền">Quyền</option>
                  <option value="Võ nhạc">Võ nhạc</option>
                </>
              )}
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
      {/* Footer removed */}

      {/* Team Details Modal */}
      {showTeamModal && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Chi tiết đội: {selectedTeam.teamName || "Không có tên"}
              </h3>
              <button
                onClick={() => {
                  setShowTeamModal(false);
                  setSelectedTeam(null);
                }}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Danh sách thành viên ({allTeamMembers.length})
                  </h4>
                  {allTeamMembers.length > 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-[#F6F9FF] text-gray-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                STT
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Tên
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                MSSV
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Giới tính
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {allTeamMembers.map((member, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                                  {idx + 1}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-900 font-medium">
                                  {member.fullName || "Không có tên"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                  {member.studentId || "N/A"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                  {member.gender || "N/A"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      Chưa có thông tin thành viên
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end border-t px-6 py-4">
              <button
                onClick={() => {
                  setShowTeamModal(false);
                  setSelectedTeam(null);
                }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Details Modal */}
      {showIndividualModal && selectedIndividual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Chi tiết đăng ký:{" "}
                {selectedIndividual.fullName || "Không có tên"}
              </h3>
              <button
                onClick={() => {
                  setShowIndividualModal(false);
                  setSelectedIndividual(null);
                }}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Thông tin đăng ký
                  </h4>
                  {Object.keys(individualFormFields).length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {Object.entries(individualFormFields)
                        .sort(([keyA], [keyB]) => {
                          const lowerA = keyA.toLowerCase();
                          const lowerB = keyB.toLowerCase();
                          // Put clb/club at the end
                          const isAClub = lowerA === "clb" || lowerA === "club";
                          const isBClub = lowerB === "clb" || lowerB === "club";
                          if (isAClub && !isBClub) return 1;
                          if (!isAClub && isBClub) return -1;
                          return 0;
                        })
                        .map(([key, value]) => (
                          <div key={key} className="rounded-md bg-gray-50 p-3">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              {formatFieldLabel(key)}
                            </div>
                            <div className="mt-1 text-sm text-gray-900 break-words">
                              {value || "-"}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      Chưa có thông tin chi tiết
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end border-t px-6 py-4">
              <button
                onClick={() => {
                  setShowIndividualModal(false);
                  setSelectedIndividual(null);
                }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
