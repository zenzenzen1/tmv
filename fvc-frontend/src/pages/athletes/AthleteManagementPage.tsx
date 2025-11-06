import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useLayoutEffect,
  useRef,
} from "react";
import CommonTable, {
  type TableColumn,
} from "../../components/common/CommonTable";
import api from "../../services/api";
import { fistContentService } from "../../services/fistContent";
import type { PaginationResponse } from "../../types/api";
import { API_ENDPOINTS } from "../../config/endpoints";
// Merge: Keep HEAD implementation - use validateLength for search validation
import { validateLength } from "../../utils/validation";

type AthleteRow = {
  id: string;
  stt: number;
  name: string;
  email: string;
  gender: "Nam" | "Nữ";
  competitionType: string;
  subCompetitionType: string;
  detailSubCompetitionType: string;
  studentId: string;
  club: string;
  tournament: string;
  status: "ĐÃ ĐẤU" | "HOÀN ĐẤU" | "VI PHẠM" | "CHỜ ĐẤU" | "ĐANG ĐẤU" | "-";
  isTeam?: boolean;
  performanceId?: string;
  fistConfigId?: string | null;
  fistItemId?: string | null;
  musicContentId?: string | null;
};

type AthleteApi = {
  id: string;
  fullName: string;
  email: string;
  gender: "MALE" | "FEMALE";
  competitionType: "fighting" | "quyen" | "music";
  subCompetitionType?: string | null;
  detailSubCompetitionType?: string | null; // backward compat
  detailSubId?: string | null; // new from backend DTO
  detailSubLabel?: string | null; // new from backend DTO (resolved label)
  studentId?: string | null;
  club?: string | null;
  competitionId?: string | null;
  tournamentName?: string | null; // optional if backend enriches later
  status: "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "VIOLATED" | string;
  // Content IDs for mapping
  fistConfigId?: string | null;
  fistItemId?: string | null;
  musicContentId?: string | null;
  weightClassId?: string | null;
  performanceId?: string | null;
};

type CompetitionType = "fighting" | "quyen" | "music";

const STATUS_COLORS = {
  "ĐÃ ĐẤU": "bg-green-100 text-green-800 border-green-200",
  "HOÀN ĐẤU": "bg-purple-100 text-purple-800 border-purple-200",
  "VI PHẠM": "bg-red-100 text-red-800 border-red-200",
  "CHỜ ĐẤU": "bg-orange-100 text-orange-800 border-orange-200",
  "ĐANG ĐẤU": "bg-blue-100 text-blue-800 border-blue-200",
  "-": "bg-gray-100 text-gray-600 border-gray-200",
};

const COMPETITION_TYPES = {
  fighting: "Đối kháng",
  quyen: "Quyền",
  music: "Võ nhạc",
};

// Dynamic quyền categories will be loaded from API

interface AthleteManagementPageProps {
  activeTab: CompetitionType;
  onTabChange: (tab: CompetitionType) => void;
}

export default function AthleteManagementPage({
  activeTab,
  onTabChange,
}: AthleteManagementPageProps) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [nameQuery, setNameQuery] = useState("");
  const [debouncedName, setDebouncedName] = useState("");

  // Merge: Keep HEAD implementation - use validateLength for search validation
  // Search input validation
  const searchValidation = useMemo(() => {
    return validateLength(nameQuery, {
      min: 0,
      max: 100,
      fieldName: "Tìm kiếm",
    });
  }, [nameQuery]);
  // Debounce name search to reduce request volume
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // Clear any pending debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    const t = setTimeout(() => setDebouncedName(nameQuery.trim()), 300);
    debounceTimeoutRef.current = t;
    return () => {
      if (t) clearTimeout(t);
      debounceTimeoutRef.current = null;
    };
  }, [nameQuery]);

  // Listen for refetch events from form approval
  useEffect(() => {
    const handleRefetch = () => {
      setPage(1); // Reset to first page
      // Trigger refetch by updating a dependency
      setReloadKey((prev) => prev + 1);
    };

    window.addEventListener("athletes:refetch", handleRefetch);
    return () => window.removeEventListener("athletes:refetch", handleRefetch);
  }, []);

  const [selectedTournament, setSelectedTournament] = useState<string>(""); // competitionId
  const [rows, setRows] = useState<AthleteRow[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [tournaments, setTournaments] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // API data for dynamic filters
  const [weightClasses, setWeightClasses] = useState<
    Array<{
      id: string;
      weightClass: string;
      gender: string;
      minWeight: number;
      maxWeight: number;
    }>
  >([]);

  // Fist content data for quyen filtering
  const [fistConfigs, setFistConfigs] = useState<
    Array<{
      id: string;
      name: string;
      description?: string | null;
      level?: number;
      // config has no parent; keep optional fields for compatibility
      configId?: string;
      configName?: string;
    }>
  >([]);

  const [fistItems, setFistItems] = useState<
    Array<{
      id: string;
      name: string;
      description?: string | null;
      status?: boolean;
      configId?: string; // link back to config so we can filter dropdown by config
      participantsPerEntry?: number; // 1 = cá nhân, >1 = đồng đội
    }>
  >([]);
  const [musicContents, setMusicContents] = useState<
    Array<{ id: string; name: string; performersPerEntry?: number }>
  >([]);
  const latestRequestIdRef = useRef(0);

  // Team detail modal state
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamModalLoading, setTeamModalLoading] = useState(false);
  const [teamModalData, setTeamModalData] = useState<{
    teamName: string;
    members: Array<{
      fullName: string;
      studentId?: string;
      gender?: string;
      email?: string;
    }>;
  } | null>(null);

  // Registrant map for team rows (teamName -> registrant email and canonical team name)
  const [teamRegistrantMap, setTeamRegistrantMap] = useState<
    Record<string, { teamName: string; email: string }>
  >({});

  // Map performanceId -> team detail members parsed from submissions (like ListPage)
  const [performanceMembersMap, setPerformanceMembersMap] = useState<
    Record<
      string,
      {
        teamName: string;
        members: Array<{
          fullName: string;
          studentId?: string;
          gender?: string;
          email?: string;
        }>;
      }
    >
  >({});

  // Cache performance details by id
  const [performanceCache, setPerformanceCache] = useState<
    Record<string, Record<string, unknown>>
  >({});

  // Group current fetched athletes by performanceId to reconstruct team members
  const [athletesByPerformance, setAthletesByPerformance] = useState<
    Record<string, AthleteApi[]>
  >({});

  // Filter states - closed by default
  const [showGenderFilter, setShowGenderFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showCompetitionFilter, setShowCompetitionFilter] = useState(false);
  // Detail dropdown toggle no longer used with inline detail list

  // Dynamic filter states
  const [subCompetitionFilter, setSubCompetitionFilter] = useState<string>("");
  const [detailCompetitionFilter, setDetailCompetitionFilter] =
    useState<string>("");
  // Track which quyền category dropdown is open
  const [openCategory, setOpenCategory] = useState<string>("");

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".filter-dropdown")) {
        setShowGenderFilter(false);
        setShowStatusFilter(false);
        setShowCompetitionFilter(false);
        setOpenCategory("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filters
  const [genderFilter, setGenderFilter] = useState<string>(""); // MALE/FEMALE/''
  const [statusFilter, setStatusFilter] = useState<string>("");
  // Team/Individual filter for Quyền & Võ nhạc
  const [teamFilter, setTeamFilter] = useState<"PERSON" | "TEAM" | "ALL">(
    "PERSON"
  );

  // Fetch athletes from backend
  useEffect(() => {
    (async () => {
      try {
        // Only proceed when tournament is selected
        const qs = new URLSearchParams();
        // For quyền/music with team filtering, we need to fetch more data
        // because client-side filtering removes team members (only keeps headers)
        // Then paginate after filtering to ensure correct page size
        const needsClientSideFiltering =
          activeTab === "quyen" || activeTab === "music";
        if (needsClientSideFiltering) {
          // Fetch larger size to ensure we have enough data after client-side filtering
          qs.set("page", "0");
          qs.set("size", "1000"); // Fetch more to account for client-side filtering
        } else {
          qs.set("page", String(page - 1));
          qs.set("size", String(pageSize));
        }
        qs.set("competitionType", activeTab);
        if (!selectedTournament) {
          return;
        }
        // mark fetching only when we actually send request
        setIsFetching(true);
        const requestId = ++latestRequestIdRef.current;
        qs.set("competitionId", selectedTournament);
        if (debouncedName) qs.set("name", debouncedName);
        if (genderFilter) qs.set("gender", genderFilter);
        if (statusFilter) qs.set("status", statusFilter);
        // Standard handling by type
        if (activeTab === "fighting") {
          // Do NOT send weight to backend; fetch all then filter client-side
        } else if (activeTab === "music") {
          // Music: send selected content name as detailSubCompetitionType
          if (subCompetitionFilter) {
            qs.set("detailSubCompetitionType", subCompetitionFilter);
          }
        } else {
          // Quyền: category -> subCompetitionType, detail -> detailSubCompetitionType
          if (subCompetitionFilter)
            qs.set("subCompetitionType", subCompetitionFilter);
          if (detailCompetitionFilter)
            qs.set("detailSubCompetitionType", detailCompetitionFilter);
        }

        const res = await api.get<PaginationResponse<AthleteApi>>(
          `${API_ENDPOINTS.ATHLETES.BASE}?${qs.toString()}`
        );
        // Unwrap BaseResponse: API returns { success, message, data: { content,... } }
        const pageData: PaginationResponse<AthleteApi> =
          ((res.data as unknown as { data?: PaginationResponse<AthleteApi> })
            .data as PaginationResponse<AthleteApi>) ??
          (res.data as unknown as PaginationResponse<AthleteApi>);
        const content: AthleteApi[] = pageData?.content ?? [];

        // Group by performanceId for team detail reconstruction
        const grouped: Record<string, AthleteApi[]> = {};
        for (const a of content) {
          const pid = (a.performanceId || "").toString().trim();
          if (!pid) continue;
          if (!grouped[pid]) grouped[pid] = [];
          grouped[pid].push(a);
        }
        if (requestId !== latestRequestIdRef.current) return; // stale
        setAthletesByPerformance(grouped);

        // Debug: Log raw data from API
        if (import.meta.env.DEV) {
          console.log(
            "Raw athlete data from API:",
            content.map((a) => ({
              name: a.fullName,
              competitionType: a.competitionType,
              subCompetitionType: a.subCompetitionType,
              detailSubCompetitionType: a.detailSubCompetitionType,
              detailSubId: a.detailSubId,
              detailSubLabel: a.detailSubLabel,
              // Check all properties
              allProps: Object.keys(a).reduce((acc, key) => {
                acc[key] = (a as Record<string, unknown>)[key];
                return acc;
              }, {} as Record<string, unknown>),
            }))
          );
        }

        // Debug: Check if there are any weight-related fields
        if (import.meta.env.DEV && content.length > 0) {
          const firstAthlete = content[0];
          console.log(
            "First athlete all properties:",
            Object.keys(firstAthlete)
          );
          console.log("First athlete full object:", firstAthlete);
        }

        // Client-side safety filter in case backend ignores filters
        // Client-side filtering (fallback when backend doesn't support)
        const strip = (s: string) =>
          (s || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
        const normalizeWeight = (s: string) =>
          (s || "").replace(/[^0-9]+/g, "");
        const isTeamEntry = (a: AthleteApi): boolean => {
          if (a.competitionType === "quyen") {
            // 1) Prefer participantsPerEntry from item
            const itemId = (a as unknown as Record<string, unknown>)[
              "fistItemId"
            ] as string;
            if (itemId) {
              const fi = fistItems.find((x) => x.id === itemId);
              if (fi && typeof fi?.participantsPerEntry === "number") {
                return (fi.participantsPerEntry as number) > 1;
              }
              // Derive by item name keywords when participants not available
              if (fi?.name) {
                const n = strip(fi.name).replace(/\s+/g, " ");
                if (n.includes("song luyen") || n.includes("da luyen"))
                  return true;
                if (n.includes("don luyen")) return false;
              }
            }
            // 2) Derive category name robustly
            let catName = a.subCompetitionType || "";
            const cfgId = (a as unknown as Record<string, unknown>)[
              "fistConfigId"
            ] as string;
            if (
              (!catName ||
                catName === "-" ||
                catName.toLowerCase() === "quyền") &&
              cfgId
            ) {
              const cfg = fistConfigs.find((x) => x.id === cfgId);
              if (cfg?.name) catName = cfg.name;
            }
            if ((!catName || catName === "-") && itemId) {
              const it = fistItems.find((x) => x.id === itemId);
              const parentCfg = it?.configId
                ? fistConfigs.find((x) => x.id === it.configId)
                : undefined;
              if (parentCfg?.name) catName = parentCfg.name;
            }
            const s = strip(
              `${catName} ${a.detailSubCompetitionType || ""} ${
                a.detailSubLabel || ""
              }`
            ).replace(/\s+/g, " ");
            if (s.includes("song luyen") || s.includes("da luyen")) return true;
            if (s.includes("don luyen")) return false;
            return false;
          } else if (a.competitionType === "music") {
            const mid = (a as unknown as Record<string, unknown>)[
              "musicContentId"
            ] as string;
            if (mid) {
              const mc = musicContents.find((x) => x.id === mid);
              if (mc && typeof mc?.performersPerEntry === "number") {
                return mc.performersPerEntry > 1;
              }
            }
            // fallback by detail
            const s = strip(
              `${a.detailSubCompetitionType || ""} ${a.detailSubLabel || ""}`
            )
              .replace(/\s+/g, " ")
              .trim();
            if (
              s.includes("doi nhom") ||
              s.includes("doi hinh") ||
              s.includes("tap the") ||
              s.includes("team")
            )
              return true;
            if (s.includes("ca nhan")) return false;
            return false;
          }
          return false;
        };

        // Heuristic to detect team header/owner row (not individual members)
        const isTeamHeader = (a: AthleteApi): boolean => {
          const email = String(a.email || "").toLowerCase();
          if (email.endsWith("@team.local")) return true;
          const rec = (a as unknown as Record<string, unknown>) || {};
          const teamName = (rec["teamName"] as string) || "";
          const fullName = (a.fullName || "").trim();
          if (teamName && teamName.trim().length > 0) {
            return teamName.trim() === fullName;
          }
          return false;
        };

        const filteredRaw: AthleteApi[] = content.filter((a: AthleteApi) => {
          const okName = debouncedName
            ? (a.fullName || "")
                .toLowerCase()
                .includes(debouncedName.toLowerCase())
            : true;
          const okGender = genderFilter
            ? a.gender === (genderFilter as "MALE" | "FEMALE")
            : true;
          const okStatus = statusFilter
            ? a.status ===
              (statusFilter as
                | "NOT_STARTED"
                | "IN_PROGRESS"
                | "DONE"
                | "VIOLATED")
            : true;
          // Client-side filtering for competition-specific filters
          const rawSub = a.subCompetitionType || "";
          const rawDetail = a.detailSubCompetitionType || "";
          const rawDetailLabel = a.detailSubLabel || "";
          let okSubDetail = true;
          if (activeTab === "fighting") {
            if (subCompetitionFilter) {
              const want = normalizeWeight(subCompetitionFilter);
              okSubDetail =
                normalizeWeight(rawDetail) === want ||
                normalizeWeight(rawSub) === want ||
                normalizeWeight(rawDetailLabel) === want;

              // Debug logging
              if (import.meta.env.DEV) {
                console.log("Đối kháng filtering debug:", {
                  subCompetitionFilter,
                  rawSub,
                  rawDetail,
                  rawDetailLabel,
                  want,
                  normalizedDetail: normalizeWeight(rawDetail),
                  normalizedSub: normalizeWeight(rawSub),
                  normalizedDetailLabel: normalizeWeight(rawDetailLabel),
                  okSubDetail,
                  athlete: a.fullName,
                });
              }
            }
          } else if (activeTab === "music") {
            // Match by selected content name in detail
            const okDetail = subCompetitionFilter
              ? strip(rawDetail) === strip(subCompetitionFilter) ||
                strip(rawDetailLabel) === strip(subCompetitionFilter)
              : true;

            // Debug logging
            if (import.meta.env.DEV && subCompetitionFilter) {
              console.log("Võ nhạc filtering debug:", {
                subCompetitionFilter,
                rawDetail,
                rawDetailLabel,
                okDetail,
                athlete: a.fullName,
              });
            }

            okSubDetail = okDetail;
          } else {
            // Quyền filtering
            // Backend already filters by subCompetitionType (category) and detailSubCompetitionType (item)
            // Client-side filtering should match backend logic:
            // - subCompetitionFilter matches subCompetitionType (category name) or fistConfigId
            // - detailCompetitionFilter matches detailSubCompetitionType (item name) or fistItemId
            let okSub = true;
            if (subCompetitionFilter) {
              // Match by subCompetitionType (category name) or by resolved category from fistConfigId
              const resolvedCategory = a.subCompetitionType || "";
              // Try to resolve category from fistConfigId if available
              let categoryFromConfig = "";
              if (a.fistConfigId) {
                const fc = fistConfigs.find((x) => x.id === a.fistConfigId);
                if (fc && fc.name) {
                  categoryFromConfig = fc.name;
                }
              }
              // Match filter against stored subCompetitionType or resolved category
              okSub =
                strip(resolvedCategory) === strip(subCompetitionFilter) ||
                strip(categoryFromConfig) === strip(subCompetitionFilter);
            }

            let okDetail = true;
            if (detailCompetitionFilter) {
              // Match by detailSubCompetitionType (item name) or by resolved detail from fistItemId
              const resolvedDetail = rawDetail || rawDetailLabel || "";
              // Try to resolve detail from fistItemId if available
              let detailFromItem = "";
              if (a.fistItemId) {
                const fi = fistItems.find((x) => x.id === a.fistItemId);
                if (fi && fi.name) {
                  detailFromItem = fi.name;
                }
              }
              // Match filter against stored detail or resolved detail
              okDetail =
                strip(resolvedDetail) === strip(detailCompetitionFilter) ||
                strip(detailFromItem) === strip(detailCompetitionFilter);
            }

            // Debug logging
            if (
              import.meta.env.DEV &&
              (subCompetitionFilter || detailCompetitionFilter)
            ) {
              console.log("Quyền filtering debug:", {
                subCompetitionFilter,
                detailCompetitionFilter,
                rawSub: a.subCompetitionType,
                rawDetail,
                rawDetailLabel,
                fistConfigId: a.fistConfigId,
                fistItemId: a.fistItemId,
                okSub,
                okDetail,
                athlete: a.fullName,
              });
            }

            okSubDetail = okSub && okDetail;
          }

          let okTeam = true;
          if (activeTab !== "fighting") {
            const team = isTeamEntry(a);
            if (teamFilter === "TEAM") {
              // Only show team header rows for team filter
              okTeam = team && isTeamHeader(a);
            } else if (teamFilter === "PERSON") {
              // Only show individual entries (not team members)
              okTeam = !team;
            } else {
              // No team filter: show team headers but not individual team members
              // This prevents duplicate entries for team competitions
              if (team) {
                okTeam = isTeamHeader(a);
              }
            }
          }

          return okName && okGender && okStatus && okSubDetail && okTeam;
        });

        // For team entries, deduplicate by performanceId - only keep one entry per performanceId
        // This prevents duplicate entries for team competitions
        // Group by performanceId and keep only the best entry (prefer team header)
        const teamEntriesByPerformanceId = new Map<string, AthleteApi[]>();
        const individualEntries: AthleteApi[] = [];

        filteredRaw.forEach((a) => {
          const rec = (a as unknown as Record<string, unknown>) || {};
          const pid =
            (a.performanceId as string) || (rec["performanceId"] as string);
          const isTeam = isTeamEntry(a);

          if (isTeam && pid && typeof pid === "string" && pid.trim()) {
            if (!teamEntriesByPerformanceId.has(pid)) {
              teamEntriesByPerformanceId.set(pid, []);
            }
            teamEntriesByPerformanceId.get(pid)!.push(a);
          } else {
            individualEntries.push(a);
          }
        });

        // For each performanceId, keep only the best entry (prefer team header)
        const deduplicatedTeamEntries: AthleteApi[] = [];
        teamEntriesByPerformanceId.forEach((entries) => {
          // Prefer entries that are team headers
          const headerEntry = entries.find((e) => isTeamHeader(e));
          if (headerEntry) {
            deduplicatedTeamEntries.push(headerEntry);
          } else {
            // If no header found, keep the first entry
            deduplicatedTeamEntries.push(entries[0]);
          }
        });

        // Combine individual entries with deduplicated team entries
        const deduplicatedFiltered = [
          ...individualEntries,
          ...deduplicatedTeamEntries,
        ];

        // Apply pagination to filtered results
        // Since we filter client-side (especially for team entries), we need to slice after filtering
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedFiltered = deduplicatedFiltered.slice(
          startIndex,
          endIndex
        );

        // Calculate totalElements after client-side filtering and deduplication
        // Note: This is an approximation since backend pagination happened before client-side filtering
        // Ideally, backend should handle all filtering including team header filtering
        const totalElements: number = deduplicatedFiltered.length;

        // Function to resolve content from IDs
        const resolveDetail = (a: AthleteApi): string => {
          const explicit = a.detailSubLabel || a.detailSubCompetitionType;
          if (explicit && explicit.trim()) return explicit;

          // Use content IDs directly from API response
          if (a.competitionType === "quyen") {
            if (a.fistItemId) {
              const fi = fistItems.find((x) => x.id === a.fistItemId);
              if (fi) return fi.name;
            }
            if (a.fistConfigId) {
              const fc = fistConfigs.find((x) => x.id === a.fistConfigId);
              if (fc) return fc.name;
            }
            // Fallback to subCompetitionType label (e.g., "đơn luyện")
            if (a.subCompetitionType && a.subCompetitionType.trim()) {
              return a.subCompetitionType;
            }
          } else if (a.competitionType === "music") {
            if (a.musicContentId) {
              const mc = musicContents.find((x) => x.id === a.musicContentId);
              if (mc) return mc.name;
            }
          } else if (a.competitionType === "fighting") {
            if (a.weightClassId) {
              const wc = weightClasses.find((x) => x.id === a.weightClassId);
              if (wc)
                return wc.weightClass || `${wc.minWeight}-${wc.maxWeight}kg`;
            }
          }
          return "-";
        };

        // Preload performance details for team rows if performanceId is present
        try {
          const missing = new Set<string>();
          paginatedFiltered.forEach((a) => {
            const rec = (a as unknown as Record<string, unknown>) || {};
            const pid =
              (a.performanceId as string) || (rec["performanceId"] as string);
            if (pid && typeof pid === "string" && !performanceCache[pid]) {
              missing.add(pid);
            }
          });
          for (const pid of missing) {
            try {
              const pRes = await api.get(`/v1/performances/${pid}`);
              const root = pRes.data as unknown as {
                data?: Record<string, unknown>;
              };
              const perfObj =
                root && root.data
                  ? (root.data as Record<string, unknown>)
                  : (pRes.data as unknown as Record<string, unknown>);
              setPerformanceCache((prev) => ({
                ...prev,
                [pid]: perfObj,
              }));
            } catch (err) {
              if (import.meta.env.DEV) {
                console.warn("Load performance failed", pid, err as unknown);
              }
            }
          }
        } catch {
          // ignore preload errors
        }

        const mapped: AthleteRow[] = paginatedFiltered.map(
          (a: AthleteApi, idx: number) => {
            // Resolve category similar to ListPage for Quyền
            let resolvedCategory = a.subCompetitionType || "-";
            if (a.competitionType === "quyen") {
              // Prefer category name by config id
              if (a.fistConfigId) {
                const fc = fistConfigs.find((x) => x.id === a.fistConfigId);
                if (fc && fc.name) {
                  resolvedCategory = fc.name;
                } else {
                  // Fallback: some data mistakenly stores item id into fistConfigId
                  // Try to resolve via item -> its configId -> config name
                  const itemByConfigId = fistItems.find(
                    (it) => it.id === a.fistConfigId
                  );
                  if (itemByConfigId && itemByConfigId.configId) {
                    const cfg = fistConfigs.find(
                      (x) => x.id === itemByConfigId.configId
                    );
                    if (cfg && cfg.name) resolvedCategory = cfg.name;
                  }
                }
              } else if (a.fistItemId) {
                // If only item exists, derive category from item's configId
                const it = fistItems.find((x) => x.id === a.fistItemId);
                if (it && it.configId) {
                  const cfg = fistConfigs.find((x) => x.id === it.configId);
                  if (cfg && cfg.name) resolvedCategory = cfg.name;
                }
              }
            }

            const isTeam = isTeamEntry(a);

            // Prefer team name/email from submissions map when available
            const rec = (a as unknown as Record<string, unknown>) || {};
            const rawTeamName = isTeam
              ? (rec["teamName"] as string) || a.fullName
              : a.fullName;
            const keyForLookup = (rawTeamName || "")
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
              .replace(/\s+/g, " ")
              .trim();
            const perfId =
              (a.performanceId as string) || (rec["performanceId"] as string);
            const perf =
              perfId && performanceCache[perfId]
                ? (performanceCache[perfId] as Record<string, unknown>)
                : undefined;
            const perfTeamName = (perf?.["teamName"] as string) || "";
            const perfEmail =
              (perf?.["registrantEmail"] as string) ||
              (perf?.["email"] as string) ||
              "";
            // Backend-enriched fields
            const backendTeamName = (a as unknown as Record<string, unknown>)[
              "teamName"
            ] as string;
            const backendRegistrantEmail = (
              a as unknown as Record<string, unknown>
            )["registrantEmail"] as string;
            const enriched = isTeam
              ? teamRegistrantMap[keyForLookup]
              : undefined;
            const displayName = isTeam
              ? perfTeamName ||
                backendTeamName ||
                enriched?.teamName ||
                rawTeamName ||
                a.fullName
              : a.fullName;

            return {
              id: a.id,
              stt: startIndex + idx + 1,
              name: displayName,
              email: isTeam
                ? perfEmail ||
                  backendRegistrantEmail ||
                  enriched?.email ||
                  a.email
                : a.email,
              gender: a.gender === "FEMALE" ? "Nữ" : "Nam",
              competitionType:
                a.competitionType === "fighting"
                  ? "Đối kháng"
                  : a.competitionType === "quyen"
                  ? "Quyền"
                  : a.competitionType === "music"
                  ? "Võ nhạc"
                  : "-",
              subCompetitionType: resolvedCategory,
              // Use resolveDetail function to get content from IDs
              detailSubCompetitionType: resolveDetail(a),
              studentId: a.studentId ?? "",
              club: a.club ?? "",
              tournament:
                a.tournamentName ??
                (tournaments.find((t) => t.id === a.competitionId)?.name || ""),
              status:
                a.status === "NOT_STARTED"
                  ? "CHỜ ĐẤU"
                  : a.status === "IN_PROGRESS"
                  ? "ĐANG ĐẤU"
                  : a.status === "DONE"
                  ? "ĐÃ ĐẤU"
                  : a.status === "VIOLATED"
                  ? "VI PHẠM"
                  : "-",
              isTeam,
              performanceId: perfId,
              fistConfigId: a.fistConfigId,
              fistItemId: a.fistItemId,
              musicContentId: a.musicContentId,
            };
          }
        );
        if (requestId !== latestRequestIdRef.current) return; // stale
        setRows(mapped);
        setTotal(totalElements);
      } catch (e) {
        console.error("Failed to load athletes", e);
        // setRows([]); // Removed as per new logic
        // setTotal(0); // Removed as per new logic
      } finally {
        // Only clear fetching if this is the latest request
        if (latestRequestIdRef.current === latestRequestIdRef.current) {
          setIsFetching(false);
        }
      }
    })();
    // Removed arrays/objects from dependencies to prevent infinite loops
    // They are accessed via closure and only used for data resolution, not for triggering reloads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    pageSize,
    debouncedName,
    selectedTournament,
    genderFilter,
    activeTab,
    statusFilter,
    reloadKey,
    subCompetitionFilter,
    detailCompetitionFilter,
    teamFilter,
    // Removed: tournaments, fistConfigs, fistItems, musicContents, weightClasses,
    // teamRegistrantMap, performanceCache - these are accessed via closure
  ]);

  // Stable computed table data to avoid re-mapping on every render
  const tableData = useMemo(
    () =>
      rows.map((row, index) => ({
        ...row,
        stt: (page - 1) * pageSize + index + 1,
      })),
    [rows, page, pageSize]
  );

  // Reset to first page when filters/search change
  useEffect(() => {
    setPage(1);
  }, [
    debouncedName,
    genderFilter,
    statusFilter,
    selectedTournament,
    activeTab,
    subCompetitionFilter,
    detailCompetitionFilter,
    teamFilter,
  ]);

  // Reset all filters when competition type changes
  // Use useLayoutEffect to reset before paint, preventing screen flicker
  useLayoutEffect(() => {
    // Clear any pending debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    // Clear rows immediately to prevent showing stale data during transition
    setRows([]);
    setTotal(0);
    // Reset search (clear debounced immediately)
    setNameQuery("");
    setDebouncedName("");
    // Reset competition-specific filters
    setSubCompetitionFilter("");
    setDetailCompetitionFilter("");
    setShowCompetitionFilter(false);
    // Reset general filters
    setGenderFilter("");
    setStatusFilter("");
    setShowGenderFilter(false);
    setShowStatusFilter(false);
    // Reset page to first
    setPage(1);
    // Default to Cá nhân for Quyền/Võ nhạc when switching tab
    if (activeTab === "quyen" || activeTab === "music") {
      setTeamFilter("PERSON");
    } else {
      setTeamFilter("ALL");
    }
    // Clear athletes grouping cache when switching tabs
    setAthletesByPerformance({});
  }, [activeTab]);

  // Open team detail modal and fetch members (best-effort across possible response shapes)
  const openTeamDetail = useCallback(
    async (row: AthleteRow) => {
      setTeamModalOpen(true);
      setTeamModalLoading(true);
      try {
        const pid = row.performanceId;
        // Prefer members parsed from submissions (same as ListPage)
        if (pid && performanceMembersMap[pid]) {
          const info = performanceMembersMap[pid];
          setTeamModalData({
            teamName: info.teamName || row.name,
            members: info.members || [],
          });
          setTeamModalLoading(false);
          return;
        }
        // Next, try grouping current fetched athletes by performanceId
        if (
          pid &&
          athletesByPerformance[pid] &&
          athletesByPerformance[pid].length > 0
        ) {
          const list = athletesByPerformance[pid];
          const members = list.map((a) => ({
            fullName: a.fullName,
            studentId: a.studentId || undefined,
            gender: a.gender || undefined,
            email: a.email || undefined,
          }));
          setTeamModalData({ teamName: row.name, members });
          setTeamModalLoading(false);
          return;
        }
        if (!pid) {
          setTeamModalData({ teamName: row.name, members: [] });
          setTeamModalLoading(false);
          return;
        }
        let perf: Record<string, unknown> | undefined = performanceCache[pid];
        if (!perf) {
          try {
            const pRes = await api.get(`/v1/performances/${pid}`);
            const root = pRes.data as unknown as {
              data?: Record<string, unknown>;
            };
            perf =
              root && root.data
                ? (root.data as Record<string, unknown>)
                : (pRes.data as unknown as Record<string, unknown>);
            setPerformanceCache(
              (prev: Record<string, Record<string, unknown>>) => ({
                ...prev,
                [pid]: perf as Record<string, unknown>,
              })
            );
          } catch (err) {
            console.warn("Load performance failed in modal", pid, err);
          }
        }
        const teamName = (
          (perf?.["teamName"] as string) ||
          row.name ||
          ""
        ).toString();
        type PerfAthlete = {
          fullName?: unknown;
          email?: unknown;
          studentId?: unknown;
          gender?: unknown;
        };
        const rawAthletes = Array.isArray(
          (perf as Record<string, unknown>)?.athletes
        )
          ? ((perf as Record<string, unknown>)?.athletes as unknown[]) || []
          : [];
        const athletes: Array<{
          fullName: string;
          studentId?: string;
          gender?: string;
          email?: string;
        }> = rawAthletes.map((a: unknown) => {
          const rec = (a as PerfAthlete) || {};
          return {
            fullName: String(rec.fullName ?? ""),
            studentId: rec.studentId != null ? String(rec.studentId) : "",
            gender: rec.gender != null ? String(rec.gender) : "",
            email: rec.email != null ? String(rec.email) : "",
          };
        });
        setTeamModalData({ teamName, members: athletes });
      } catch (e) {
        console.error("Open team detail failed", e);
        setTeamModalData({ teamName: row.name, members: [] });
      } finally {
        setTeamModalLoading(false);
      }
    },
    [performanceCache, performanceMembersMap, athletesByPerformance]
  );

  const columns: TableColumn<AthleteRow>[] = useMemo(() => {
    const base: TableColumn<AthleteRow>[] = [
      {
        key: "stt",
        title: "STT",
        className: "w-16 text-center",
        sortable: false,
      },
      {
        key: "name",
        title:
          teamFilter === "TEAM" && activeTab !== "fighting" ? "Tên đội" : "Tên",
        className: "whitespace-nowrap",
        sortable: true,
      },
    ];

    if (teamFilter === "TEAM" && activeTab !== "fighting") {
      base.push({
        key: "email",
        title: "Email người đăng ký",
        className: "whitespace-nowrap",
        sortable: true,
        render: (row: AthleteRow) => {
          const e = row.email || "";
          // Hide synthetic team email placeholder
          return e.endsWith("@team.local") ? "" : e;
        },
      });
    } else {
      base.push({
        key: "email",
        title: "Email",
        className: "whitespace-nowrap",
        sortable: true,
        render: (row: AthleteRow) => {
          const e = row.email || "";
          return e.endsWith("@team.local") ? "" : e;
        },
      });
    }

    if (!(teamFilter === "TEAM" && activeTab !== "fighting")) {
      base.push({
        key: "gender",
        title: "Giới tính",
        className: "whitespace-nowrap text-center",
        sortable: true,
      });
    }

    base.push({
      key: "competitionType",
      title: "Thể thức thi đấu",
      className: "whitespace-nowrap",
      sortable: true,
    });

    if (activeTab === "fighting") {
      base.push({
        key: "detailSubCompetitionType",
        title: "Hạng cân",
        className: "whitespace-nowrap",
        render: (row: AthleteRow) => {
          const value = row.detailSubCompetitionType || "-";
          return String(value)
            .replace(/^Nam\s+/i, "")
            .replace(/^Nữ\s+/i, "");
        },
        sortable: true,
      });
    } else {
      base.push({
        key: "detailSubCompetitionType",
        title: "Nội dung",
        className: "whitespace-nowrap",
        render: (row: AthleteRow) => {
          if (activeTab === "quyen") {
            // Display configName-itemName format
            const configName = row.fistConfigId
              ? fistConfigs.find((c) => c.id === row.fistConfigId)?.name || ""
              : "";
            const itemName = row.fistItemId
              ? fistItems.find((i) => i.id === row.fistItemId)?.name || ""
              : "";
            if (configName && itemName) {
              return `${configName} - ${itemName}`;
            }
            return configName || itemName || "-";
          }
          // For music, show musicContent name
          if (row.musicContentId) {
            return (
              musicContents.find((m) => m.id === row.musicContentId)?.name ||
              row.musicContentId
            );
          }
          return "-";
        },
        sortable: true,
      });
    }

    if (!(teamFilter === "TEAM" && activeTab !== "fighting")) {
      base.push({
        key: "studentId",
        title: "MSSV",
        className: "whitespace-nowrap",
        sortable: true,
      });
    }

    base.push({
      key: "status",
      title: "Trạng thái",
      className: "whitespace-nowrap text-center",
      render: (row) => (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
            STATUS_COLORS[row.status]
          }`}
        >
          {row.status}
        </span>
      ),
      sortable: true,
    });

    if (teamFilter === "TEAM" && activeTab !== "fighting") {
      base.push({
        key: "actions",
        title: "Xem chi tiết",
        className: "whitespace-nowrap text-center",
        sortable: false,
        render: (row: AthleteRow) => (
          <button
            className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
            onClick={() => openTeamDetail(row)}
          >
            Xem chi tiết
          </button>
        ),
      });
    }

    return base;
  }, [
    activeTab,
    teamFilter,
    openTeamDetail,
    fistConfigs,
    fistItems,
    musicContents,
  ]);

  // Load tournaments from database
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        type CompetitionOption = { id: string; name: string };
        const res = await api.get<CompetitionOption[]>(
          API_ENDPOINTS.TOURNAMENT_FORMS.COMPETITIONS
        );
        const list = res.data ?? [];
        setTournaments(list);
        // Auto-select default tournament (prefer name contains fvcup2025) to ensure correct initial scope
        if (list.length > 0) {
          const preferred = list.find((t) =>
            (t.name || "").toLowerCase().includes("fvcup2025")
          );
          setSelectedTournament((preferred ? preferred.id : list[0].id) || "");
        }
      } catch (error) {
        console.error("Failed to load tournaments:", error);
      }
    };

    loadTournaments();
  }, []);

  // Load data for dynamic filters
  useEffect(() => {
    const loadFilterData = async () => {
      try {
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

        // Load fist configs (Đơn luyện/Đa luyện/Song luyện ...)
        const fistConfigsRes = await fistContentService.list({ size: 100 });
        console.log("AthleteManagement - Fist configs loaded:", fistConfigsRes);
        setFistConfigs(fistConfigsRes.content || []);

        // Load fist items (Đơn luyện 1, Đơn luyện 2, ...)
        const fistItemsRes = await fistContentService.listItems({ size: 100 });
        console.log("AthleteManagement - Fist items loaded:", fistItemsRes);
        // Ensure each item carries configId for mapping to its config
        setFistItems(
          (fistItemsRes.content || []).map(
            (it: {
              id: string;
              name: string;
              description?: string | null;
              status?: boolean;
              parentId?: string;
              fistConfigId?: string;
              config?: { id?: string };
              configId?: string;
              participantsPerEntry?: number;
            }) => ({
              id: it.id,
              name: it.name,
              description: it.description,
              status: it.status,
              configId:
                it.configId ||
                it.parentId ||
                it.fistConfigId ||
                it.config?.id ||
                undefined,
              participantsPerEntry: it.participantsPerEntry,
            })
          )
        );

        // Fist content data loaded successfully

        // Load music contents
        const musicContentsRes = await api.get<{
          content: Array<{
            id: string;
            name: string;
            performersPerEntry?: number;
          }>;
          totalElements: number;
        }>(API_ENDPOINTS.MUSIC_CONTENTS.BASE);
        setMusicContents(musicContentsRes.data?.content || []);
      } catch (error) {
        console.error("Failed to load filter data:", error);
      }
    };

    loadFilterData();
  }, []);

  // Load registrant mapping for team view to resolve correct team name and email
  useEffect(() => {
    const loadRegistrants = async () => {
      try {
        if (!selectedTournament) {
          setTeamRegistrantMap({});
          return;
        }
        // For quyen/music, always build registrant map so team rows can be enriched
        if (!(activeTab === "quyen" || activeTab === "music")) {
          setTeamRegistrantMap({});
          return;
        }
        // Fetch all tournament forms then their submissions, similar to ListPage
        const formsRes = await api.get<{
          content?: Array<Record<string, unknown>>;
        }>(API_ENDPOINTS.TOURNAMENT_FORMS.BASE, { page: 0, size: 100 });
        const root1 = formsRes.data as unknown as Record<string, unknown>;
        const allForms: Array<Record<string, unknown>> = ((
          root1["data"] as unknown as {
            content?: Array<Record<string, unknown>>;
          }
        )?.content ??
          (root1["content"] as Array<Record<string, unknown>>) ??
          []) as Array<Record<string, unknown>>;
        // Prefer forms that appear to belong to selected tournament by name
        const preferredForms = allForms.filter((f: Record<string, unknown>) => {
          const name = String(
            (f["name"] as string) || (f["formTitle"] as string) || ""
          ).toLowerCase();
          const tn =
            tournaments.find((t) => t.id === selectedTournament)?.name || "";
          return name.includes(String(tn).toLowerCase());
        });
        const formsToUse =
          preferredForms.length > 0 ? preferredForms : allForms;

        const map: Record<string, { teamName: string; email: string }> = {};
        const perfMembers: Record<
          string,
          {
            teamName: string;
            members: Array<{
              fullName: string;
              studentId?: string;
              gender?: string;
              email?: string;
            }>;
          }
        > = {};

        for (const form of formsToUse) {
          const formId = String(form["id"] || "");
          if (!formId) continue;
          try {
            const subsRes = await api.get<{
              content?: Array<Record<string, unknown>>;
            }>(API_ENDPOINTS.TOURNAMENT_FORMS.SUBMISSIONS(formId), {
              // Backend enforces size<=100; with all=true it returns unpaged
              // so we avoid sending page/size to pass validation
              all: true,
            });
            const root2 = subsRes.data as unknown as Record<string, unknown>;
            const pageData =
              (root2["data"] as Record<string, unknown>) ?? root2;
            const subs: Array<Record<string, unknown>> =
              (pageData["content"] as Array<Record<string, unknown>>) ?? [];
            for (const s of subs) {
              const formDataRaw = (s["formData"] as string) || "";
              let formData: Record<string, unknown> = {};
              try {
                formData = formDataRaw
                  ? (JSON.parse(formDataRaw) as Record<string, unknown>)
                  : {};
              } catch {
                formData = {};
              }
              const comp = String(
                (formData["competitionType"] as string) || ""
              ).toLowerCase();
              if (comp && comp !== String(activeTab)) continue;
              const ppe = formData["participantsPerEntry"] as
                | number
                | undefined;
              const members = formData["teamMembers"] as unknown[] | undefined;
              const hasTeam =
                (typeof ppe === "number" && ppe > 1) ||
                (Array.isArray(members) && members.length > 0);
              if (!hasTeam) continue;
              const teamName = String(
                (formData["teamName"] as string) ||
                  (formData["fullName"] as string) ||
                  ""
              ).trim();
              const email = String((formData["email"] as string) || "").trim();
              if (!teamName) continue;
              const key = teamName
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();
              if (!map[key]) map[key] = { teamName, email };

              // Build performanceId -> members map for team detail modal
              const perfId = String(
                (formData["performanceId"] as string) || ""
              ).trim();
              if (perfId) {
                const rawMembers = Array.isArray(formData["teamMembers"])
                  ? (formData["teamMembers"] as Array<Record<string, unknown>>)
                  : [];
                const captain = {
                  fullName: String((formData["fullName"] as string) || ""),
                  studentId: (formData["studentId"] as string) || undefined,
                  gender: (formData["gender"] as string) || undefined,
                } as { fullName: string; studentId?: string; gender?: string };
                const memberList: Array<{
                  fullName: string;
                  studentId?: string;
                  gender?: string;
                  email?: string;
                }> = [
                  captain,
                  ...rawMembers.map((m) => ({
                    fullName: String((m["fullName"] as string) || ""),
                    studentId: (m["studentId"] as string) || undefined,
                    gender: (m["gender"] as string) || undefined,
                    email: (m["email"] as string) || undefined,
                  })),
                ].filter((m) => m.fullName && m.fullName.trim());
                if (!perfMembers[perfId]) {
                  perfMembers[perfId] = { teamName, members: memberList };
                }
              }
            }
          } catch (err) {
            // Silently ignore 400/404 errors for forms without submissions or invalid form IDs
            // These are expected for forms that don't have submissions yet
            const status = (err as { response?: { status?: number } })?.response
              ?.status;
            if (status === 400 || status === 404) {
              // Expected: form may not exist or have no submissions
              continue;
            }
            // Only log unexpected errors
            console.warn(`Failed to load submissions for form ${formId}:`, err);
          }
        }

        setTeamRegistrantMap(map);
        setPerformanceMembersMap(perfMembers);
      } catch (e) {
        console.error("Failed to load team registrants map", e);
        setTeamRegistrantMap({});
      }
    };

    loadRegistrants();
    // tournaments is accessed via closure and only changes once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTournament, activeTab]);

  // rows, total are driven by API fetch; no local recompute

  const handleExportExcel = async () => {
    try {
      // TODO: Uncomment when backend is ready
      // const filters: AthleteFilters = {
      //   page: 0,
      //   size: 1000, // Export all
      //   search: searchTerm,
      //   tournament: selectedTournament,
      //   competitionType: activeTab,
      // };
      // const blob = await athleteService.exportAthletes(filters);
      // const url = URL.createObjectURL(blob);
      // const a = document.createElement("a");
      // a.href = url;
      // a.download = `danh-sach-vdv-${new Date().toISOString().slice(0, 10)}.xlsx`;
      // document.body.appendChild(a);
      // a.click();
      // document.body.removeChild(a);
      // URL.revokeObjectURL(url);

      // Mock export for now
      const headers: string[] = [
        "STT",
        "Tên",
        "Email",
        "Giới tính",
        "Loại thi đấu",
        "MSSV",
        "CLB",
        "Giải đấu",
        "Trạng thái",
      ];

      const csvRows = rows.map((athlete: AthleteRow) => [
        athlete.stt,
        athlete.name,
        athlete.email,
        athlete.gender,
        athlete.competitionType,
        athlete.studentId,
        athlete.club,
        athlete.tournament,
        athlete.status,
      ]);

      const csv = [
        headers.join(","),
        ...csvRows.map((line) => line.join(",")),
      ].join("\r\n");

      // Add BOM for UTF-8 to display Vietnamese correctly in Excel
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `danh-sach-vdv-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const closeTeamDetail = () => {
    setTeamModalOpen(false);
    setTeamModalData(null);
    setTeamModalLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Tournament Selection */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">
          Danh sách vận động viên
        </h1>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            Chọn giải:
          </label>
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Competition Type Selection */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            Loại thi đấu:
          </label>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {Object.entries(COMPETITION_TYPES).map(([key, label]) => (
              <button
                key={key}
                onClick={() => onTabChange(key as CompetitionType)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === key
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Search by athlete name */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm theo tên vận động viên..."
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              className={`pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 w-80 ${
                !searchValidation.isValid && nameQuery !== ""
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            {!searchValidation.isValid && nameQuery !== "" && (
              <p className="text-red-500 text-xs mt-1">
                {searchValidation.errorMessage}
              </p>
            )}
          </div>

          {/* Filter Buttons (removed CLB, Sân đấu) */}
          <div className="flex gap-1">
            {/* Team filter for Quyền and Võ nhạc */}
            {(activeTab === "quyen" || activeTab === "music") && (
              <div className="relative filter-dropdown">
                <button
                  onClick={() =>
                    setShowCompetitionFilter(!showCompetitionFilter)
                  }
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  Hình thức
                </button>
                {showCompetitionFilter && (
                  <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-300 rounded shadow-lg z-20">
                    <div className="p-2 space-y-1">
                      {(
                        [
                          { label: "Cá nhân", value: "PERSON" },
                          { label: "Đồng đội", value: "TEAM" },
                        ] as const
                      ).map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="teamFilter"
                            className="mr-2 h-3 w-3 text-blue-600"
                            checked={teamFilter === opt.value}
                            onChange={() => setTeamFilter(opt.value)}
                          />
                          <span className="text-sm text-gray-700">
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="relative filter-dropdown">
              <button
                onClick={() => setShowGenderFilter(!showGenderFilter)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                Giới tính
              </button>
              {showGenderFilter && (
                <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-300 rounded shadow-lg z-20">
                  <div className="p-2 space-y-1">
                    {[
                      { label: "Tất cả", value: "" },
                      { label: "Nam", value: "MALE" },
                      { label: "Nữ", value: "FEMALE" },
                    ].map((g) => (
                      <label
                        key={g.value}
                        className="flex items-center cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="genderFilter"
                          className="mr-2 h-3 w-3 text-blue-600"
                          checked={genderFilter === g.value}
                          onChange={() => setGenderFilter(g.value)}
                        />
                        <span className="text-sm text-gray-700">{g.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative filter-dropdown">
              <button
                onClick={() => setShowStatusFilter(!showStatusFilter)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                Trạng thái
              </button>
              {showStatusFilter && (
                <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-300 rounded shadow-lg z-20">
                  <div className="p-2 space-y-1">
                    {[
                      { label: "Tất cả", value: "" },
                      { label: "CHỜ ĐẤU", value: "NOT_STARTED" },
                      { label: "ĐANG ĐẤU", value: "IN_PROGRESS" },
                      { label: "ĐÃ ĐẤU", value: "DONE" },
                      { label: "VI PHẠM", value: "VIOLATED" },
                    ].map((s) => (
                      <label
                        key={s.value}
                        className="flex items-center cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="statusFilter"
                          className="mr-2 h-3 w-3 text-blue-600"
                          checked={statusFilter === s.value}
                          onChange={() => setStatusFilter(s.value)}
                        />
                        <span className="text-sm text-gray-700">{s.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Competition Filter */}
            {activeTab === "fighting" && (
              <div className="relative filter-dropdown">
                <button
                  onClick={() =>
                    setShowCompetitionFilter(!showCompetitionFilter)
                  }
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  Hạng cân
                </button>
                {showCompetitionFilter && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-300 rounded shadow-lg z-20">
                    <div className="p-2 space-y-1">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="subCompetitionFilter"
                          className="mr-2 h-3 w-3 text-blue-600"
                          checked={subCompetitionFilter === ""}
                          onChange={() => setSubCompetitionFilter("")}
                        />
                        <span className="text-sm text-gray-700">Tất cả</span>
                      </label>
                      {(() => {
                        // Filter weight classes based on gender selection
                        let filteredWeightClasses = weightClasses.filter(
                          (wc) => {
                            if (!genderFilter) {
                              // No gender selected: show all weight classes
                              return true;
                            } else {
                              // Gender selected: show weight classes for that gender + common ones
                              return (
                                wc.gender === genderFilter ||
                                wc.gender === "COMMON" ||
                                !wc.gender
                              );
                            }
                          }
                        );

                        // If no gender selected, deduplicate by weight display
                        if (!genderFilter) {
                          const seen = new Set<string>();
                          filteredWeightClasses = filteredWeightClasses.filter(
                            (wc) => {
                              const weightDisplay =
                                wc.weightClass ||
                                `${wc.minWeight}-${wc.maxWeight}kg`;
                              if (seen.has(weightDisplay)) {
                                return false;
                              }
                              seen.add(weightDisplay);
                              return true;
                            }
                          );
                        }

                        return filteredWeightClasses.map((wc) => {
                          const weightDisplay =
                            wc.weightClass ||
                            `${wc.minWeight}-${wc.maxWeight}kg`;
                          return (
                            <label
                              key={wc.id}
                              className="flex items-center cursor-pointer"
                            >
                              <input
                                type="radio"
                                name="subCompetitionFilter"
                                className="mr-2 h-3 w-3 text-blue-600"
                                checked={subCompetitionFilter === weightDisplay}
                                onChange={() =>
                                  setSubCompetitionFilter(weightDisplay)
                                }
                              />
                              <span className="text-sm text-gray-700">
                                {weightDisplay}
                              </span>
                            </label>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "quyen" && (
              <div className="flex items-center flex-wrap gap-2">
                {fistConfigs.map((config) => (
                  <div key={config.id} className="relative filter-dropdown">
                    <button
                      type="button"
                      onClick={() => {
                        if (subCompetitionFilter === config.name) {
                          // Toggle off current category filter
                          setSubCompetitionFilter("");
                          setDetailCompetitionFilter("");
                          setOpenCategory("");
                        } else {
                          setSubCompetitionFilter(config.name);
                          setDetailCompetitionFilter("");
                          setOpenCategory((prev) =>
                            prev === config.name ? "" : config.name
                          );
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded border ${
                        subCompetitionFilter === config.name
                          ? "border-blue-500 text-blue-600 bg-blue-50"
                          : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                      }`}
                    >
                      {config.name}
                    </button>
                    {openCategory === config.name && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-300 rounded shadow-lg z-20">
                        <div className="p-2 space-y-1 max-h-64 overflow-auto">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name={`detailCompetitionFilter-${config.name}`}
                              className="mr-2 h-3 w-3 text-blue-600"
                              checked={detailCompetitionFilter === ""}
                              onChange={() => setDetailCompetitionFilter("")}
                            />
                            <span className="text-sm text-gray-700">
                              Tất cả
                            </span>
                          </label>
                          {fistItems
                            .filter((item) => item.configId === config.id)
                            .map((item) => (
                              <label
                                key={item.id}
                                className="flex items-center cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name={`detailCompetitionFilter-${config.name}`}
                                  className="mr-2 h-3 w-3 text-blue-600"
                                  checked={
                                    detailCompetitionFilter === item.name
                                  }
                                  onChange={() =>
                                    setDetailCompetitionFilter(item.name)
                                  }
                                />
                                <span className="text-sm text-gray-700">
                                  {item.name}
                                </span>
                              </label>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "music" && (
              <div className="relative filter-dropdown">
                <button
                  onClick={() =>
                    setShowCompetitionFilter(!showCompetitionFilter)
                  }
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  Tiết mục
                </button>
                {showCompetitionFilter && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-300 rounded shadow-lg z-20">
                    <div className="p-2 space-y-1">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="subCompetitionFilter"
                          className="mr-2 h-3 w-3 text-blue-600"
                          checked={subCompetitionFilter === ""}
                          onChange={() => setSubCompetitionFilter("")}
                        />
                        <span className="text-sm text-gray-700">Tất cả</span>
                      </label>
                      {musicContents.map((content) => (
                        <label
                          key={content.id}
                          className="flex items-center cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="subCompetitionFilter"
                            className="mr-2 h-3 w-3 text-blue-600"
                            checked={subCompetitionFilter === content.name}
                            onChange={() =>
                              setSubCompetitionFilter(content.name)
                            }
                          />
                          <span className="text-sm text-gray-700">
                            {content.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportExcel}
          className="rounded-md bg-emerald-500 px-3 py-2 text-white text-sm shadow hover:bg-emerald-600"
        >
          Xuất Excel
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow pb-6 relative">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {COMPETITION_TYPES[activeTab]}
          </h2>
        </div>

        {/* non-intrusive loading overlay to prevent flicker */}
        {isFetching && tableData.length === 0 && (
          <div className="absolute inset-0 z-10 bg-white/40 pointer-events-none animate-pulse" />
        )}

        <CommonTable
          data={tableData}
          columns={columns}
          keyField="id"
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
        />
      </div>

      {/* Team detail modal */}
      {teamModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={closeTeamDetail}
          />
          <div className="relative z-50 w-full max-w-lg rounded-lg bg-white shadow-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Chi tiết thành viên
              </h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={closeTeamDetail}
              >
                ✕
              </button>
            </div>
            {teamModalLoading ? (
              <div className="py-6 text-center text-sm text-gray-600">
                Đang tải...
              </div>
            ) : teamModalData && teamModalData.members.length > 0 ? (
              <div className="max-h-[70vh] overflow-auto">
                {/* Header section */}
                <div className="mb-6">
                  <div className="mb-2 text-sm font-medium text-gray-700">
                    Thông tin thành viên
                  </div>
                </div>

                {/* Members table */}
                <div className="mb-6">
                  <table className="w-full table-auto border border-gray-200 rounded-md overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-1/3">
                          Họ tên
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-1/3">
                          MSSV
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-1/6">
                          Giới tính
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {teamModalData.members.map((m, i) => {
                        const displayGender = (g?: string) => {
                          if (!g) return "";
                          const v = String(g).trim().toUpperCase();
                          if (["FEMALE", "NỮ", "NU", "F"].includes(v))
                            return "Nữ";
                          if (["MALE", "NAM", "M"].includes(v)) return "Nam";
                          return g;
                        };
                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-900 break-words">
                              {m.fullName || ""}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-700 break-words">
                              {m.studentId || ""}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-700">
                              {displayGender(m.gender)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-gray-600">
                Không tìm thấy chi tiết thành viên cho đội này.
              </div>
            )}
            <div className="mt-4 flex justify-end border-t pt-4">
              <button
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 text-sm font-medium border border-gray-300 hover:bg-gray-200"
                onClick={closeTeamDetail}
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
