import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import { useToast } from "../../components/common/ToastContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import {
  CommonTable,
  type TableColumn,
} from "../../components/common/CommonTable";

type FormConfig = {
  id: string;
  formTitle: string;
  tournament?: string;
  description?: string;
  status: string;
  formType?: string;
  numberOfParticipants?: number;
};

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
  formData?: string;
  teamName?: string;
  teamMembers?: Array<{
    fullName: string;
    studentId: string;
    email?: string;
    gender?: string;
  }>;
};

const STATUS_MAP: Record<string, ResultRow["status"]> = {
  APPROVED: "ĐÃ DUYỆT",
  PENDING: "CHỜ DUYỆT",
  REJECTED: "TỪ CHỐI",
};

export default function ResultsListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [availableForms, setAvailableForms] = useState<FormConfig[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [participantMode, setParticipantMode] = useState<"INDIVIDUAL" | "TEAM">(
    "INDIVIDUAL"
  );
  const [typeFilter, setTypeFilter] = useState<
    "ALL" | "Đối kháng" | "Quyền" | "Võ nhạc"
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ResultRow["status"]>(
    "CHỜ DUYỆT"
  );
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: "APPROVED" | "REJECTED" | null;
    count: number;
  }>({ isOpen: false, action: null, count: 0 });

  // Modal state for team details
  const [showTeamModal, setShowTeamModal] = useState<boolean>(false);
  const [selectedTeam, setSelectedTeam] = useState<ResultRow | null>(null);
  // Modal state for individual details
  const [showIndividualModal, setShowIndividualModal] =
    useState<boolean>(false);
  const [selectedIndividual, setSelectedIndividual] =
    useState<ResultRow | null>(null);

  // Form fields mapping (name/id -> label) from published form
  const [formFieldsMap, setFormFieldsMap] = useState<Record<string, string>>(
    {}
  );

  // Performance data cache for team submissions
  const [performanceCache, setPerformanceCache] = useState<
    Record<string, Record<string, unknown>>
  >({});

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
      } catch {
        // Ignore failures; mapping code has fallbacks
      }
    };
    loadContentCatalogs();
  }, []);

  // Load form definition to get field labels
  useEffect(() => {
    const loadFormDefinition = async () => {
      if (!selectedFormId) return;
      try {
        const res = await api.get<{
          fields?: Array<{ id?: string; name?: string; label?: string }>;
        }>(API_ENDPOINTS.TOURNAMENT_FORMS.BY_ID(selectedFormId));
        const fields = res.data?.fields || [];
        const map: Record<string, string> = {};
        for (const field of fields) {
          if (field.id && field.label) {
            map[field.id] = field.label;
          }
          if (field.name && field.label) {
            map[field.name] = field.label;
            map[field.name.toLowerCase()] = field.label;
          }
        }
        setFormFieldsMap(map);
      } catch {
        // Ignore failures; fallback mapping will handle
      }
    };
    loadFormDefinition();
  }, [selectedFormId]);

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
          } catch {
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

  // Load available forms for dropdown
  const loadAvailableForms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<{
        content: FormConfig[];
        totalElements: number;
      }>(API_ENDPOINTS.TOURNAMENT_FORMS.BASE, {
        page: 0,
        size: 100,
      });

      if (response.success && response.data) {
        const allForms = response.data.content || [];
        const competitionForms = allForms.filter(
          (f) => f.formType === "COMPETITION_REGISTRATION"
        );
        setAvailableForms(competitionForms);

        // Auto-select first form if available
        setSelectedFormId((prev) => {
          if (!prev && competitionForms.length > 0) {
            return competitionForms[0].id;
          }
          return prev;
        });
      }
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Không tải được danh sách form";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAvailableForms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load submissions when form is selected
  const loadSubmissions = useCallback(async () => {
    if (!selectedFormId) {
      setRows([]);
      return;
    }

    try {
      setLoadingSubmissions(true);
      setError(null);

      const resp = await api.get(
        `/v1/tournament-forms/${selectedFormId}/submissions?all=true`
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

          // Helper function to get first string value from various formats
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

          // Helper function to remove UUID/ID from string
          const removeIdFromString = (str: string): string => {
            if (!str) return "";
            const trimmed = str.trim();
            const fullUuidPattern =
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (fullUuidPattern.test(trimmed)) return "";
            const uuidWithSeparatorPattern =
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\s*-\s*/i;
            let cleaned = trimmed.replace(uuidWithSeparatorPattern, "").trim();
            const uuidAnywherePattern =
              /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\s*-\s*/gi;
            cleaned = cleaned.replace(uuidAnywherePattern, "").trim();
            return cleaned || "";
          };

          // Use performance data if available, otherwise fallback to form data
          // For Quyen, we need both config name and item name
          let quyenCategory = "";
          let quyenContent = "";

          if (performanceData?.contentType === "QUYEN") {
            // Priority 1: Use fistItemId and fistConfigId from performanceData if available
            if (performanceData.fistItemId) {
              const itemId = String(performanceData.fistItemId);
              quyenContent = fistItemMap[itemId] || "";
            }

            if (performanceData.fistConfigId) {
              const configId = String(performanceData.fistConfigId);
              quyenCategory = fistConfigMap[configId] || "";
            }

            // Priority 2: If not found, try to get from contentId
            if (
              (!quyenCategory || !quyenContent) &&
              performanceData.contentId
            ) {
              const contentId = String(performanceData.contentId);
              // Try as item first
              if (!quyenContent) {
                quyenContent = fistItemMap[contentId] || "";
              }
              // Try as config
              if (!quyenCategory) {
                quyenCategory = fistConfigMap[contentId] || "";
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
                "";
            }
          }
          // Clean quyenCategory and quyenContent to ensure no IDs
          quyenCategory = removeIdFromString(quyenCategory);
          quyenContent = removeIdFromString(quyenContent);

          // Map category based on competition type
          let categoryVi = "";
          if (compRaw === "quyen") {
            categoryVi =
              quyenCategory && quyenContent
                ? `${removeIdFromString(quyenCategory)} - ${removeIdFromString(
                    quyenContent
                  )}`
                : quyenCategory || quyenContent
                ? removeIdFromString(quyenCategory || quyenContent)
                : "";
          } else if (compRaw === "fighting") {
            // For Fighting, try to get weight class
            let fightingCategory = (parsed.weightClass as string) || "";
            if (!fightingCategory && parsed.weightClassId) {
              const labelFromMap = weightClassMap[String(parsed.weightClassId)];
              if (labelFromMap) {
                fightingCategory = labelFromMap;
              } else {
                const weightClassInfo =
                  (parsed as Record<string, unknown>).weightClassInfo ||
                  (parsed as Record<string, unknown>).weightClassName ||
                  (parsed as Record<string, unknown>).weightClassDisplay;
                fightingCategory = (weightClassInfo as string) || "Đối kháng";
              }
            }
            if (!fightingCategory) {
              fightingCategory = "Đối kháng";
            }
            categoryVi = removeIdFromString(fightingCategory);
          } else if (compRaw === "music") {
            categoryVi =
              performanceData?.contentType === "MUSIC" &&
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
                  );
          } else {
            categoryVi = removeIdFromString(
              getFirstString(parsed.category) || ""
            );
          }

          const pickDate = (...keys: string[]): string | undefined => {
            for (const k of keys) {
              const v = (item as Record<string, unknown>)[k];
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
              const fetchAthleteDetails = async (athlete: {
                id?: string;
                approved?: boolean;
                fullName?: string;
                email?: string;
              }) => {
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
            teamMembers = parsed.teamMembers.map(
              (member: {
                fullName?: string;
                name?: string;
                studentId?: string;
                mssv?: string;
                email?: string;
                gender?: string;
              }) => ({
                fullName: member.fullName || member.name || "",
                studentId: member.studentId || member.mssv || "",
                email: member.email || "",
                gender:
                  member.gender === "FEMALE" || member.gender === "Nữ"
                    ? "Nữ"
                    : member.gender === "MALE" || member.gender === "Nam"
                    ? "Nam"
                    : "",
              })
            );
          }

          return {
            id: String(item.id),
            submittedAt,
            fullName: (parsed.fullName as string) || "",
            email: (parsed.email as string) || "",
            gender: parsed.gender === "FEMALE" ? "Nữ" : "Nam",
            competitionType: compVi,
            category: categoryVi,
            studentId: (parsed.studentId as string) || "",
            club: (parsed.club as string) || "",
            coach: (parsed.coach as string) || "",
            phone:
              (parsed.phone as string) || (parsed.phoneNumber as string) || "",
            status,
            formData: item.formData, // Store raw form data for Performance lookup
            teamName,
            teamMembers,
          } as ResultRow;
        })
      );

      // Client-side filtering
      const filtered = mapped.filter((r) => {
        const matchesName = query
          ? r.fullName.toLowerCase().includes(query.toLowerCase()) ||
            r.email.toLowerCase().includes(query.toLowerCase()) ||
            r.studentId.toLowerCase().includes(query.toLowerCase())
          : true;

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

        // Date filter
        let matchesDate = true;
        if (dateFrom || dateTo) {
          try {
            const submittedDate = new Date(r.submittedAt);
            if (!isNaN(submittedDate.getTime())) {
              if (dateFrom) {
                const fromDate = new Date(dateFrom);
                fromDate.setHours(0, 0, 0, 0);
                if (submittedDate < fromDate) {
                  matchesDate = false;
                }
              }
              if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                if (submittedDate > toDate) {
                  matchesDate = false;
                }
              }
            } else {
              // If submittedAt is invalid, exclude if date filter is set
              matchesDate = false;
            }
          } catch {
            matchesDate = false;
          }
        }

        return (
          matchesName &&
          matchesMode &&
          matchesType &&
          matchesStatus &&
          matchesDate
        );
      });

      // Client-side pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedRows = filtered.slice(startIndex, endIndex);
      // Add index property to each row for STT display
      setRows(
        paginatedRows.map((r, idx) => ({
          ...r,
          index: startIndex + idx + 1,
        }))
      );
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Không tải được kết quả đăng ký";
      setError(errorMessage);
      toast.error(errorMessage);
      setRows([]);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [
    selectedFormId,
    page,
    pageSize,
    query,
    participantMode,
    typeFilter,
    statusFilter,
    dateFrom,
    dateTo,
    toast,
    weightClassMap,
    fistConfigMap,
    fistItemMap,
    musicContentMap,
    performanceCache,
  ]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  // Reset typeFilter when switching to TEAM mode if current value is not valid
  useEffect(() => {
    if (
      participantMode === "TEAM" &&
      (typeFilter === "ALL" || typeFilter === "Đối kháng")
    ) {
      setTypeFilter("Quyền");
    }
  }, [participantMode, typeFilter]);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => {
      const searchableValues = [
        r.fullName,
        r.email,
        r.studentId,
        r.teamName,
        r.competitionType,
        r.category,
      ];
      return searchableValues
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, query]);

  const allFilteredIds = useMemo(() => filtered.map((r) => r.id), [filtered]);
  const isAllSelected =
    allFilteredIds.length > 0 &&
    allFilteredIds.every((id) => selectedIds.has(id));
  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isAllSelected) {
        allFilteredIds.forEach((id) => next.delete(id));
      } else {
        allFilteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [isAllSelected, allFilteredIds]);
  const toggleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkUpdateStatus = async (newStatus: "APPROVED" | "REJECTED") => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;

    try {
      setActionLoading(true);

      const statusMap: Record<"APPROVED" | "REJECTED", string> = {
        APPROVED: "APPROVED",
        REJECTED: "REJECTED",
      };

      // Update each submission
      await Promise.all(
        ids.map((id) =>
          api.patch(`/v1/tournament-forms/submissions/${id}/status`, {
            status: statusMap[newStatus],
          })
        )
      );

      toast.success(
        `${newStatus === "APPROVED" ? "Đã duyệt" : "Đã từ chối"} ${
          ids.length
        } đăng ký`
      );
      setSelectedIds(new Set());
      setConfirmDialog({ isOpen: false, action: null, count: 0 });
      // Notify athlete list to refetch after approval
      if (newStatus === "APPROVED") {
        window.dispatchEvent(new Event("athletes:refetch"));
      }
      await loadSubmissions();
    } catch (e: unknown) {
      const errorMessage =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: string }).message)
          : "Không thể cập nhật hàng loạt";
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const openConfirmDialog = (action: "APPROVED" | "REJECTED") => {
    setConfirmDialog({
      isOpen: true,
      action,
      count: selectedIds.size,
    });
  };

  const columns: TableColumn<ResultRow>[] = useMemo(() => {
    const isTeamMode = participantMode === "TEAM";
    const showCheckbox = statusFilter === "CHỜ DUYỆT";
    const cols: TableColumn<ResultRow>[] = [];

    // Add checkbox column only when status is "CHỜ DUYỆT"
    if (showCheckbox) {
      cols.push({
        key: "_select",
        title: (
          <input
            type="checkbox"
            aria-label="Chọn tất cả"
            checked={isAllSelected}
            onChange={toggleSelectAll}
          />
        ) as unknown as string,
        sortable: false,
        className: "w-10",
        render: (row: ResultRow) => (
          <input
            type="checkbox"
            aria-label={`Chọn đăng ký #${row.id}`}
            checked={selectedIds.has(row.id)}
            onChange={() => toggleSelectOne(row.id)}
          />
        ),
      });
    }

    cols.push({
      key: "index",
      title: "STT",
      className: "w-16 text-center",
      sortable: false,
      render: (r: ResultRow) => {
        const rowIndex = (r as unknown as { index?: number }).index;
        return rowIndex ?? "";
      },
    });
    cols.push({
      key: "submittedAt",
      title: "Thời gian nộp",
      className: "whitespace-nowrap",
      render: (r: ResultRow) => r.submittedAt || "",
    });
    cols.push({
      key: "fullName",
      title: isTeamMode ? "Tên đội" : "Họ và tên",
      className: "whitespace-nowrap",
      render: (r: ResultRow) =>
        isTeamMode && r.teamName ? r.teamName : r.fullName,
    });
    cols.push({
      key: "email",
      title: isTeamMode ? "Email người đăng ký" : "Email",
      className: "break-words",
    });
    cols.push({
      key: "competitionType",
      title: "Thể thức thi đấu",
      className: "whitespace-nowrap",
      render: (r: ResultRow) => r.competitionType || "-",
    });
    cols.push({
      key: "category",
      title: "Nội dung",
      className: "whitespace-nowrap",
      render: (r: ResultRow) => r.category || "-",
    });
    // Add "Xem chi tiết" button for both modes
    cols.push({
      key: "actions",
      title: "Thao tác",
      className: "whitespace-nowrap",
      render: (r: ResultRow) => (
        <button
          onClick={() => {
            if (isTeamMode) {
              setSelectedTeam(r);
              setShowTeamModal(true);
            } else {
              setSelectedIndividual(r);
              setShowIndividualModal(true);
            }
          }}
          className="rounded-md bg-[#377CFB] px-3 py-1.5 text-white text-xs hover:bg-[#2e6de0]"
        >
          {isTeamMode ? "Chi tiết" : "Xem chi tiết"}
        </button>
      ),
      sortable: false,
    });

    return cols;
  }, [
    participantMode,
    statusFilter,
    isAllSelected,
    selectedIds,
    toggleSelectAll,
    toggleSelectOne,
  ]);

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
        "quyenContentId",
        "quyenContentName",
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
          lowerKey.includes("performanceid") ||
          lowerKey.includes("quyencontent") ||
          lowerKey.includes("contentid")
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

      return fields;
    } catch (error) {
      console.error("Error extracting form fields:", error);
      return {};
    }
  };

  // Format field key to readable label
  const formatFieldLabel = (key: string): string => {
    // First, check if we have label from form definition (published form)
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
    if (/^\d+$/.test(key)) {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          ⟵ Quay lại
        </button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Kết quả đăng ký giải đấu
        </h2>
        <p className="text-gray-600">Chọn form để xem kết quả đăng ký</p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Bộ lọc</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => openConfirmDialog("APPROVED")}
              disabled={selectedIds.size === 0 || actionLoading}
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-[13px] font-medium text-white shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
              {actionLoading ? "Đang xử lý..." : `Duyệt (${selectedIds.size})`}
            </button>
            <button
              onClick={() => openConfirmDialog("REJECTED")}
              disabled={selectedIds.size === 0 || actionLoading}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-[13px] font-medium text-white shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
              {actionLoading
                ? "Đang xử lý..."
                : `Từ chối (${selectedIds.size})`}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chọn form
            </label>
            <select
              value={selectedFormId}
              onChange={(e) => {
                setSelectedFormId(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none"
            >
              <option value="">-- Chọn form --</option>
              {availableForms.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.formTitle}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại thí sinh
            </label>
            <select
              value={participantMode}
              onChange={(e) => {
                const newMode = e.target.value as "INDIVIDUAL" | "TEAM";
                setParticipantMode(newMode);
                // Reset typeFilter when switching to TEAM if current value is not valid for TEAM
                if (
                  newMode === "TEAM" &&
                  (typeFilter === "ALL" || typeFilter === "Đối kháng")
                ) {
                  setTypeFilter("Quyền");
                }
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none"
            >
              <option value="INDIVIDUAL">Cá nhân</option>
              <option value="TEAM">Đồng đội</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thể thức thi đấu
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(
                  e.target.value as "ALL" | "Đối kháng" | "Quyền" | "Võ nhạc"
                );
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none"
            >
              {participantMode === "TEAM" ? (
                <>
                  <option value="Quyền">Quyền</option>
                  <option value="Võ nhạc">Võ nhạc</option>
                </>
              ) : (
                <>
                  <option value="ALL">Tất cả thể thức</option>
                  <option value="Đối kháng">Đối kháng</option>
                  <option value="Quyền">Quyền</option>
                  <option value="Võ nhạc">Võ nhạc</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "ALL" | ResultRow["status"]);
                setSelectedIds(new Set()); // Reset selection when filter changes
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ĐÃ DUYỆT">Đã duyệt</option>
              <option value="CHỜ DUYỆT">Chờ duyệt</option>
              <option value="TỪ CHỐI">Từ chối</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setPage(1);
                setDateFrom(e.target.value);
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setPage(1);
                setDateTo(e.target.value);
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <input
              placeholder="Tên, email, MSSV..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none"
            />
          </div>
        </div>

        {error && <ErrorMessage error={error} />}

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : !selectedFormId ? (
          <div className="flex justify-center py-8 text-gray-500">
            Vui lòng chọn form để xem kết quả
          </div>
        ) : loadingSubmissions ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <CommonTable<ResultRow>
            columns={columns}
            data={filtered.map((r, idx) => ({
              ...r,
              index: (page - 1) * pageSize + idx + 1,
            }))}
            keyField="id"
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Confirm Dialog */}
      {confirmDialog.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          style={{ left: "256px" }}
        >
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Xác nhận{" "}
                {confirmDialog.action === "APPROVED" ? "duyệt" : "từ chối"}
              </h3>
              <button
                onClick={() =>
                  setConfirmDialog({ isOpen: false, action: null, count: 0 })
                }
                disabled={actionLoading}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
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

            <div className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 rounded-full p-3 ${
                    confirmDialog.action === "APPROVED"
                      ? "bg-green-100"
                      : "bg-red-100"
                  }`}
                >
                  {confirmDialog.action === "APPROVED" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-6 w-6 text-green-600"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-6 w-6 text-red-600"
                    >
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    Bạn có chắc chắn muốn{" "}
                    <strong
                      className={
                        confirmDialog.action === "APPROVED"
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {confirmDialog.action === "APPROVED"
                        ? "duyệt"
                        : "từ chối"}
                    </strong>{" "}
                    <strong>{confirmDialog.count}</strong> đăng ký đã chọn?
                  </p>
                  {confirmDialog.action === "REJECTED" && (
                    <p className="mt-2 text-xs text-gray-500">
                      Hành động này không thể hoàn tác.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <button
                onClick={() =>
                  setConfirmDialog({ isOpen: false, action: null, count: 0 })
                }
                disabled={actionLoading}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                onClick={() =>
                  confirmDialog.action &&
                  handleBulkUpdateStatus(confirmDialog.action)
                }
                disabled={actionLoading}
                className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  confirmDialog.action === "APPROVED"
                    ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                    : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                }`}
              >
                {actionLoading ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Details Modal */}
      {showTeamModal && selectedTeam && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          style={{ left: "256px" }}
        >
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          style={{ left: "256px" }}
        >
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
