import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import type { PaginationResponse } from "../../types/api";
import type { CompetitionType } from "../arrange/ArrangeOrderWrapper";
import { fistContentService } from "../../services/fistContent";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { fieldService } from "../../services/fieldService";
import type { FieldResponse } from "../../types";
import { useToast } from "../../components/common/ToastContext";

type AthleteApi = {
  id: string;
  fullName: string;
  email: string;
  gender: "MALE" | "FEMALE";
  competitionType: "fighting" | "quyen" | "music";
  studentId?: string | null;
  club?: string | null;
  subCompetitionType?: string | null;
  detailSubCompetitionType?: string | null;
  detailSubLabel?: string | null;
  fistItemId?: string | null;
  fistConfigId?: string | null;
  musicContentId?: string | null;
  performanceId?: string | null;
};

type AthleteRow = {
  id: string;
  name: string;
  email: string;
  gender: "Nam" | "Nữ";
  studentId: string;
  club: string;
  subCompetitionType: string;
  detailSubCompetitionType: string;
  detailSubLabel?: string | null;
  fistItemId?: string | null;
  fistConfigId?: string | null;
  musicContentId?: string | null;
  performanceId?: string | null;
};

type Match = {
  id: string;
  order: number;
  type: CompetitionType;
  contentName: string;
  participantIds: string[];
  participants: string[];
  assessors: {
    referee?: string;
    judgeA?: string;
    judgeB?: string;
    judgeC?: string;
    judgeD?: string;
  };
  judgesCount?: number;
  timerSec?: number;
  performanceId?: string; // For quyền/võ nhạc matches
  matchOrder?: number; // From PerformanceMatch
  status?: string; // From PerformanceMatch
  // Content IDs from PerformanceMatch to support filtering by ID
  fistConfigId?: string | null;
  fistItemId?: string | null;
  musicContentId?: string | null;
  gender?: "MALE" | "FEMALE";
  teamType?: "TEAM" | "PERSON";
  teamName?: string | null;
  fieldId?: string | null;
  fieldName?: string | null;
};

const COMPETITION_TYPES: Record<CompetitionType, string> = {
  quyen: "Quyền",
  music: "Võ nhạc",
};

const MATCH_TYPE_SEQUENCE: CompetitionType[] = ["quyen", "music"];

const getMatchPriorityOrder = (match: Match): number => {
  if (
    typeof match.matchOrder === "number" &&
    Number.isFinite(match.matchOrder)
  ) {
    return match.matchOrder;
  }
  if (typeof match.order === "number" && Number.isFinite(match.order)) {
    return match.order;
  }
  return Number.MAX_SAFE_INTEGER;
};

const compareMatchPosition = (a: Match, b: Match): number => {
  const diff = getMatchPriorityOrder(a) - getMatchPriorityOrder(b);
  if (diff !== 0) return diff;
  const contentA = (a.contentName || "").toLowerCase();
  const contentB = (b.contentName || "").toLowerCase();
  if (contentA !== contentB) return contentA.localeCompare(contentB);
  return (a.id || "").localeCompare(b.id || "");
};

const normalizeMatches = (input: Match[]): Match[] => {
  const grouped = new Map<CompetitionType, Match[]>();
  MATCH_TYPE_SEQUENCE.forEach((type) => grouped.set(type, []));
  const extra: Match[] = [];

  input.forEach((match) => {
    if (grouped.has(match.type)) {
      grouped.get(match.type)!.push(match);
    } else {
      extra.push(match);
    }
  });

  const applyOrdering = (items: Match[]): Match[] =>
    items.map((match, index) => {
      const hasExplicit =
        typeof match.matchOrder === "number" &&
        Number.isFinite(match.matchOrder);
      const resolvedOrder: number = hasExplicit
        ? (match.matchOrder as number)
        : index + 1;
      if (match.order === resolvedOrder) {
        return match;
      }
      return { ...match, order: resolvedOrder };
    });

  const normalized: Match[] = [];

  MATCH_TYPE_SEQUENCE.forEach((type) => {
    const items = grouped.get(type);
    if (!items || items.length === 0) return;
    const sorted = items.slice().sort(compareMatchPosition);
    normalized.push(...applyOrdering(sorted));
  });

  if (extra.length > 0) {
    const sortedExtra = extra.slice().sort(compareMatchPosition);
    normalized.push(...applyOrdering(sortedExtra));
  }

  return normalized;
};

const resolveMatchDisplayOrder = (match: Match, index: number): number => {
  if (
    typeof match.matchOrder === "number" &&
    Number.isFinite(match.matchOrder) &&
    match.matchOrder > 0
  ) {
    return match.matchOrder;
  }
  if (
    typeof match.order === "number" &&
    Number.isFinite(match.order) &&
    match.order > 0
  ) {
    return match.order;
  }
  return index + 1;
};

const getContentGroupingKey = (match: Match): string => {
  if (match.type === "quyen") {
    return [
      "quyen",
      match.fistConfigId ?? "",
      match.fistItemId ?? "",
      match.contentName ?? "",
    ].join("|");
  }
  if (match.type === "music") {
    return ["music", match.musicContentId ?? "", match.contentName ?? ""].join(
      "|"
    );
  }
  return "";
};

export default function SelectPerformanceMatchPage() {
  const { matchId: routeMatchId } = useParams<{ matchId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const normalizeTab = useCallback(
    (value: string | null): CompetitionType =>
      value === "music" ? "music" : "quyen",
    []
  );

  const [activeTab, setActiveTab] = useState<CompetitionType>(
    normalizeTab(searchParams.get("tab"))
  );

  const searchKey = searchParams.toString();

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (!tabParam) return;
    const nextTab = normalizeTab(tabParam);
    if (nextTab !== activeTab) {
      setActiveTab(nextTab);
    }
  }, [activeTab, normalizeTab, searchKey]);

  const initialTeam =
    (searchParams.get("team") as "PERSON" | "TEAM" | "") || "PERSON";
  const initialGender = searchParams.get("gender") || "MALE";
  const initialSubCompetition = searchParams.get("config") || "";
  const initialDetailCompetition = searchParams.get("detail") || "";

  const initialFilters = {
    team: initialTeam,
    gender: initialGender,
    sub: initialSubCompetition,
    detail: initialDetailCompetition,
    hasTeam: searchParams.get("team") !== null,
    hasGender: searchParams.get("gender") !== null,
    hasSub: searchParams.get("config") !== null,
    hasDetail: searchParams.get("detail") !== null,
  };

  const handleTabChange = (tab: CompetitionType) => {
    setActiveTab(tab);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", tab);
    setSearchParams(nextParams);
  };

  return (
    <ArrangeOrderPageContent
      activeTab={activeTab}
      onTabChange={handleTabChange}
      standaloneMatchId={routeMatchId || undefined}
      standaloneCompetitionId={searchParams.get("competitionId") || undefined}
      isStandalone={Boolean(routeMatchId)}
      initialFilters={initialFilters}
    />
  );
}

function formatSeconds(seconds?: number | null): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
    return "00:00";
  }
  const safeValue = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeValue / 60);
  const secs = safeValue % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getStatusColor(status: string | undefined): string {
  switch (status) {
    case "PENDING":
    case "READY":
    case "CHỜ BẮT ĐẦU":
      return "bg-gray-100 text-gray-800";
    case "IN_PROGRESS":
    case "ĐANG ĐẤU":
      return "bg-blue-100 text-blue-800";
    case "COMPLETED":
    case "KẾT THÚC":
      return "bg-green-100 text-green-800";
    case "CANCELLED":
    case "HỦY":
      return "bg-red-100 text-red-800";
    default:
      // Default to gray for any unknown status (treated as "Chưa bắt đầu")
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusLabel(status: string | undefined): string {
  switch (status) {
    case "PENDING":
    case "READY":
    case "CHỜ BẮT ĐẦU":
      return "Chưa bắt đầu";
    case "IN_PROGRESS":
    case "ĐANG ĐẤU":
      return "Đang diễn ra";
    case "COMPLETED":
    case "KẾT THÚC":
      return "Đã kết thúc";
    case "CANCELLED":
    case "HỦY":
      return "Đã hủy";
    default:
      // For any other status or undefined, show "Chưa bắt đầu"
      return "Chưa bắt đầu";
  }
}

const ASSESSOR_ROLES: Array<{
  key: keyof Match["assessors"];
  label: string;
  subtitle: string;
  position: number;
}> = [
  { key: "referee", label: "Giám định 1", subtitle: "Giám định", position: 0 },
  { key: "judgeA", label: "Giám định 2", subtitle: "Giám định", position: 1 },
  { key: "judgeB", label: "Giám định 3", subtitle: "Giám định", position: 2 },
  { key: "judgeC", label: "Giám định 4", subtitle: "Giám định", position: 3 },
  { key: "judgeD", label: "Giám định 5", subtitle: "Giám định", position: 4 },
];

const createEmptyAssessors = () =>
  ASSESSOR_ROLES.reduce((acc, role) => {
    acc[role.key] = "";
    return acc;
  }, {} as Record<keyof Match["assessors"], string>);

type AssessorDetail = {
  id: string;
  fullName?: string;
  email?: string;
};

const createEmptyAssessorDetails = () =>
  ASSESSOR_ROLES.reduce((acc, role) => {
    acc[role.key] = null;
    return acc;
  }, {} as Record<keyof Match["assessors"], AssessorDetail | null>);

const BULK_PERFORMANCE_ASSIGNMENT_ENABLED = false;

interface ArrangeOrderPageContentProps {
  activeTab: CompetitionType;
  onTabChange: (tab: CompetitionType) => void;
  standaloneMatchId?: string;
  standaloneCompetitionId?: string;
  isStandalone?: boolean;
  initialFilters?: {
    team?: "PERSON" | "TEAM" | "";
    gender?: string;
    sub?: string;
    detail?: string;
    hasTeam?: boolean;
    hasGender?: boolean;
    hasSub?: boolean;
    hasDetail?: boolean;
  };
}

function ArrangeOrderPageContent({
  activeTab,
  onTabChange,
  standaloneMatchId,
  standaloneCompetitionId,
  isStandalone,
  initialFilters,
}: ArrangeOrderPageContentProps) {
  const navigate = useNavigate();
  const isStandaloneMode = Boolean(isStandalone && standaloneMatchId);
  const toast = useToast();

  const {
    team: initialTeamFilter = "PERSON",
    gender: initialGenderFilter = "MALE",
    sub: initialSubCompetition = "",
    detail: initialDetailCompetition = "",
    hasTeam: hasTeamParam = false,
    hasGender: hasGenderParam = false,
    hasSub: hasSubParam = false,
    hasDetail: hasDetailParam = false,
  } = initialFilters || {};

  const [tournaments, setTournaments] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedTournament, setSelectedTournament] = useState<string>(
    standaloneCompetitionId || ""
  );
  const [athletes, setAthletes] = useState<AthleteRow[]>([]);
  // Cache athletes by tab and filter combination to prevent reloading when switching tabs
  const athletesCacheRef = useRef<Record<string, AthleteRow[]>>({});
  const [matches, setMatches] = useState<Match[]>([]);
  // Quick filter labels derived from tournament configuration (dynamic)
  const [quickButtons, setQuickButtons] = useState<string[]>([]);
  // Allowed content (by current tournament). If empty => allow all
  const [allowedFistConfigIds, setAllowedFistConfigIds] = useState<Set<string>>(
    new Set()
  );
  const [allowedFistItemIds, setAllowedFistItemIds] = useState<Set<string>>(
    new Set()
  );
  const [allowedMusicContentIds, setAllowedMusicContentIds] = useState<
    Set<string>
  >(new Set());
  // Also allow constraining by names (labels from competition config)
  const [allowedFistConfigNames, setAllowedFistConfigNames] = useState<
    Set<string>
  >(new Set());
  const [allowedMusicContentNames, setAllowedMusicContentNames] = useState<
    Set<string>
  >(new Set());
  // Also allow constraining by names (when competition exposes labels instead of IDs)

  const [teamFilter, setTeamFilter] = useState<"PERSON" | "TEAM" | "">(
    initialTeamFilter
  );
  const [genderFilter, setGenderFilter] = useState<string>(initialGenderFilter);

  // Track concurrent loads for a simple loading indicator when changing tournament
  const [pendingLoads, setPendingLoads] = useState<number>(0);
  const [isTournamentLoading, setIsTournamentLoading] =
    useState<boolean>(false);

  useEffect(() => {
    if (isStandaloneMode && standaloneCompetitionId) {
      setSelectedTournament(standaloneCompetitionId);
    }
  }, [isStandaloneMode, standaloneCompetitionId]);

  const matchesForActiveType = useMemo(
    () => matches.filter((match) => match.type === activeTab),
    [matches, activeTab]
  );

  // Available assessors from API
  const [availableAssessors, setAvailableAssessors] = useState<
    Array<{ id: string; fullName: string; email: string }>
  >([]);
  const [isAssessorsLoading, setIsAssessorsLoading] = useState(false);
  const [showAssignAssessorsModal, setShowAssignAssessorsModal] =
    useState(false);
  const [assignModalAssessors, setAssignModalAssessors] = useState<
    Record<keyof Match["assessors"], string>
  >(createEmptyAssessors());
  const [assignModalAssessorDetails, setAssignModalAssessorDetails] = useState<
    Record<keyof Match["assessors"], AssessorDetail | null>
  >(createEmptyAssessorDetails());

  // Load available assessors
  useEffect(() => {
    const loadAssessors = async () => {
      setIsAssessorsLoading(true);
      try {
        const res = await api.get<
          Array<{
            id: string;
            fullName: string;
            personalMail: string;
            eduMail?: string;
            systemRole?: string;
          }>
        >(API_ENDPOINTS.MATCH_ASSESSORS.AVAILABLE);

        // BaseResponse structure or plain array
        const payload: any = res?.data as any;
        const data: Array<any> = Array.isArray(payload)
          ? payload
          : (payload?.data as Array<any>) ||
            (payload?.content as Array<any>) ||
            [];

        console.log("Loaded assessors (raw):", data);

        // Keep all assessors returned by API (API đã lọc sẵn theo vai trò chuyên môn)
        const filtered = data
          .map((a) => ({
            id: a.id,
            fullName: a.fullName || "",
            email: a.personalMail || a.eduMail || "",
          }))
          .filter((a) => a.id && a.fullName);

        console.log("Loaded assessors (filtered):", filtered);

        setAvailableAssessors(filtered);
      } catch (error) {
        console.error("Failed to load assessors:", error);
        setAvailableAssessors([]);
      } finally {
        setIsAssessorsLoading(false);
      }
    };
    loadAssessors();
  }, []);

  useEffect(() => {
    const loadFields = async () => {
      try {
        const response = await fieldService.list({ page: 0, size: 100 });
        if (response.content) {
          setFields(response.content);
        }
      } catch (error) {
        console.error("Failed to load fields:", error);
        setFields([]);
      }
    };
    loadFields();
  }, []);

  // Auto-create preset cards only when no tournament is selected
  useEffect(() => {
    if (selectedTournament) return;
    const current = matches.filter((m) => m.type === activeTab);
    if (current.length === 0) {
      const baseOrder = 0;
      const defaults: Match[] = Array.from({ length: 4 }).map((_, idx) => ({
        id: `preset-${activeTab}-${Date.now()}-${idx}`,
        order: baseOrder + idx + 1,
        type: activeTab,
        contentName:
          activeTab === "quyen" ? "Nội dung Quyền" : "Nội dung Võ nhạc",
        participantIds: [],
        participants: [],
        assessors: createEmptyAssessors(),
        fieldId: undefined,
        fieldName: undefined,
      }));
      setMatches((prev) =>
        normalizeMatches([
          ...prev.filter((m) => m.type !== activeTab),
          ...defaults,
        ])
      );
    }
  }, [activeTab, matches, selectedTournament]);

  // Start modal removed; settings handled in setupModal per match

  const createDefaultSetupState = useCallback(
    () => ({
      open: false,
      matchId: undefined as string | undefined,
      assessors: createEmptyAssessors(),
      assessorDetails: createEmptyAssessorDetails(),
      judgesCount: 5,
      defaultTimerSec: 120,
      fieldId: "" as string | undefined,
    }),
    []
  );
  const [setupModal, setSetupModal] = useState<{
    open: boolean;
    matchId?: string;
    assessors: Record<string, string>;
    assessorDetails: Record<string, AssessorDetail | null>;
    judgesCount: number;
    defaultTimerSec: number;
    fieldId?: string;
  }>(createDefaultSetupState());
  const [hasStandaloneSetupInitialized, setHasStandaloneSetupInitialized] =
    useState(false);
  const [fields, setFields] = useState<FieldResponse[]>([]);

  useEffect(() => {
    if (!setupModal.open) return;
    setSetupModal((prev) => {
      if (!prev.open) return prev;
      const updatedDetails = { ...prev.assessorDetails };
      let changed = false;
      ASSESSOR_ROLES.forEach((role) => {
        const id = prev.assessors[role.key];
        if (id) {
          const info = availableAssessors.find(
            (assessor) => assessor.id === id
          );
          if (info) {
            const prevDetail = updatedDetails[role.key];
            if (
              !prevDetail ||
              prevDetail.fullName !== info.fullName ||
              prevDetail.email !== info.email
            ) {
              updatedDetails[role.key] = {
                id,
                fullName: info.fullName,
                email: info.email,
              };
              changed = true;
            }
          }
        }
      });
      if (!changed) return prev;
      return {
        ...prev,
        assessorDetails: updatedDetails,
      };
    });
  }, [availableAssessors, setupModal.open, setSetupModal]);

  useEffect(() => {
    if (!showAssignAssessorsModal) return;
    const nextAssessors = createEmptyAssessors();
    ASSESSOR_ROLES.forEach((role) => {
      const value = (setupModal.assessors[role.key] || "").toString();
      nextAssessors[role.key] = value;
    });
    setAssignModalAssessors(nextAssessors);

    const nextDetails = createEmptyAssessorDetails();
    ASSESSOR_ROLES.forEach((role) => {
      const detail = setupModal.assessorDetails[role.key];
      nextDetails[role.key] = detail
        ? {
            id: detail.id,
            fullName: detail.fullName,
            email: detail.email,
          }
        : null;
    });
    setAssignModalAssessorDetails(nextDetails);
  }, [
    showAssignAssessorsModal,
    setupModal.assessors,
    setupModal.assessorDetails,
  ]);

  // Filter states for quyen and music
  const [subCompetitionFilter, setSubCompetitionFilter] = useState<string>(
    initialSubCompetition
  );
  const [detailCompetitionFilter, setDetailCompetitionFilter] =
    useState<string>(initialDetailCompetition);
  const [openCategory, setOpenCategory] = useState<string>("");
  const [showCompetitionFilter, setShowCompetitionFilter] = useState(false);

  // Filter states for team and gender
  const [showGenderFilter, setShowGenderFilter] = useState(false);
  const [showTeamFilter, setShowTeamFilter] = useState(false);
  // Realtime status subscriber
  const stompRef = useRef<Client | null>(null);
  useEffect(() => {
    const currentMatches = matches;
    const pids = currentMatches
      .filter((m) => m.type === activeTab && m.performanceId)
      .map((m) => m.performanceId as string);
    if (pids.length === 0) return;

    // Create stable key from performance IDs to avoid reconnecting unnecessarily
    const pidsKey = pids.sort().join(",");

    const wsUrl = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace("/api", "") + "/ws"
      : "http://localhost:8080/ws";
    const socket = new SockJS(wsUrl);
    const client = new Client({
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      onConnect: () => {
        pids.forEach((pid) => {
          client.subscribe(`/topic/performance/${pid}/status`, (msg) => {
            try {
              const payload = JSON.parse(msg.body) as {
                status?: string;
                performanceId?: string;
              };
              if (!payload?.status || !payload?.performanceId) return;
              setMatches((prev) =>
                normalizeMatches(
                  prev.map((it) =>
                    it.performanceId === payload.performanceId
                      ? { ...it, status: payload.status }
                      : it
                  )
                )
              );
            } catch {}
          });
        });
      },
    });
    client.activate();
    stompRef.current = client;
    return () => {
      if (stompRef.current?.connected) stompRef.current.deactivate();
    };
    // Only depend on activeTab and the stable key of performance IDs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    matches
      .filter((m) => m.type === activeTab && m.performanceId)
      .map((m) => m.performanceId as string)
      .sort()
      .join(","),
  ]);

  // Performance cache for team details
  const [performanceCache, setPerformanceCache] = useState<
    Record<string, Record<string, unknown>>
  >({});

  // Group current fetched athletes by performanceId to reconstruct team members
  const [athletesByPerformance, setAthletesByPerformance] = useState<
    Record<string, AthleteApi[]>
  >({});

  // Filter data states
  const [fistConfigs, setFistConfigs] = useState<
    Array<{
      id: string;
      name: string;
      description?: string | null;
      level?: number;
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
      configId?: string;
      participantsPerEntry?: number;
    }>
  >([]);

  const [musicContents, setMusicContents] = useState<
    Array<{ id: string; name: string; performersPerEntry?: number }>
  >([]);

  // If only item IDs are restricted, derive allowed config IDs from those items
  const effectiveAllowedFistConfigIds = useMemo(() => {
    if (allowedFistConfigIds.size > 0) return allowedFistConfigIds;
    if (allowedFistItemIds.size === 0) return new Set<string>();
    const s = new Set<string>();
    fistItems.forEach((it) => {
      if (allowedFistItemIds.has(it.id) && it.configId) s.add(it.configId);
    });
    return s;
  }, [allowedFistConfigIds, allowedFistItemIds, fistItems]);

  const matchPerformanceIdsKey = useMemo(() => {
    return matchesForActiveType
      .map((match) => (match.performanceId || "").trim())
      .filter((pid) => pid.length > 0)
      .sort()
      .join(",");
  }, [matchesForActiveType]);

  useEffect(() => {
    if (!matchPerformanceIdsKey) return;
    const performanceIds = matchPerformanceIdsKey.split(",").filter(Boolean);
    const missing = performanceIds.filter(
      (pid) => pid && !performanceCache[pid]
    );
    if (missing.length === 0) return;

    let cancelled = false;

    const loadMissingPerformances = async () => {
      const results = await Promise.all(
        missing.map(async (pid) => {
          try {
            const res = await api.get(`/v1/performances/${pid}`);
            const payload = res.data as
              | { data?: Record<string, unknown> }
              | Record<string, unknown>;
            const perfObj =
              (payload as any)?.data &&
              typeof (payload as any).data === "object"
                ? ((payload as any).data as Record<string, unknown>)
                : (payload as Record<string, unknown>);
            if (perfObj) {
              return { pid, perfObj };
            }
          } catch (error) {
            console.warn("Failed to load performance for match", pid, error);
          }
          return null;
        })
      );
      if (cancelled) return;
      const updates: Record<string, Record<string, unknown>> = {};
      results.forEach((entry) => {
        if (entry && entry.perfObj) {
          updates[entry.pid] = entry.perfObj;
        }
      });
      if (Object.keys(updates).length > 0) {
        setPerformanceCache((prev) => ({ ...prev, ...updates }));
      }
    };

    loadMissingPerformances();

    return () => {
      cancelled = true;
    };
  }, [matchPerformanceIdsKey, performanceCache]);

  // Load filter data
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        // Load fist configs (Đơn luyện/Đa luyện/Song luyện ...)
        const fistConfigsRes = await fistContentService.list({ size: 100 });
        setFistConfigs(fistConfigsRes.content || []);

        // Load fist items (Đơn luyện 1, Đơn luyện 2, ...)
        const fistItemsRes = await fistContentService.listItems({ size: 100 });
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

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".filter-dropdown")) {
        setShowCompetitionFilter(false);
        setShowGenderFilter(false);
        setShowTeamFilter(false);
        setOpenCategory("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter matches based on selected filters
  const filteredMatches = useMemo(() => {
    // Require both subCompetitionFilter (nội dung) and detailCompetitionFilter (nội dung chi tiết) to be selected
    // For Quyền: must select both category (e.g., "Song luyện") and detail (e.g., "Song luyện 1")
    // For Music: must select a specific musicContent (not "Tất cả")

    // If no content filter is selected, don't show any matches
    if (!subCompetitionFilter) {
      return [];
    }

    // For Quyền, also require detailCompetitionFilter
    if (activeTab === "quyen" && !detailCompetitionFilter) {
      return [];
    }

    // For Music, subCompetitionFilter must be a specific musicContent (not empty/"Tất cả")
    // This is already checked by !subCompetitionFilter above, but we ensure it's not the "Tất cả" option
    if (activeTab === "music" && subCompetitionFilter === "") {
      return [];
    }

    // Helper function
    const strip = (s: string) =>
      (s || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    const selectedCfgNameForMatch = subCompetitionFilter
      ? fistConfigs.find((c) => c.id === subCompetitionFilter)?.name || ""
      : "";
    const selectedItemNameForMatch = detailCompetitionFilter
      ? fistItems.find((i) => i.id === detailCompetitionFilter)?.name || ""
      : "";

    const filteredList = matchesForActiveType.filter((match) => {
      // For saved matches (have performanceId), filter by match-level IDs if available
      if (match.performanceId) {
        // Gender separation: use match.gender if present; else derive from participants/athletes list
        const effectiveGender = (() => {
          if (match.gender) return match.gender;
          // Try resolve by participantIds from currently loaded athletes
          for (const pid of match.participantIds || []) {
            const a = athletes.find((x) => x.id === pid);
            if (a) return a.gender === "Nữ" ? "FEMALE" : "MALE";
          }
          return undefined;
        })();
        if (
          genderFilter &&
          effectiveGender &&
          effectiveGender !== genderFilter
        ) {
          return false;
        }
        // Team separation: use teamType if present; else derive from performance cache / participants
        const effectiveTeamType = (() => {
          if (match.teamType) return match.teamType;
          const pid = match.performanceId || "";
          const perf = pid ? (performanceCache as any)[pid] : undefined;
          const teamName = perf && (perf["teamName"] as string);
          if (teamName && teamName.trim()) return "TEAM" as const;
          if (
            Array.isArray(match.participants) &&
            match.participants.length > 1
          )
            return "TEAM" as const;
          return "PERSON" as const;
        })();
        if (teamFilter && effectiveTeamType !== teamFilter) {
          return false;
        }
        if (activeTab === "quyen") {
          if (!subCompetitionFilter || !detailCompetitionFilter) return false;
          // Require both config and item to match by ID when present on match
          if (
            (match.fistConfigId &&
              match.fistConfigId !== subCompetitionFilter) ||
            (match.fistItemId && match.fistItemId !== detailCompetitionFilter)
          ) {
            return false;
          }
        } else if (activeTab === "music") {
          if (!subCompetitionFilter) return false;
          if (
            match.musicContentId &&
            match.musicContentId !== subCompetitionFilter
          ) {
            return false;
          }
        }
        return true;
      }

      // If match has no participants, only show it when its content IDs match current filter
      if (match.participantIds.length === 0) {
        if (genderFilter && match.gender && match.gender !== genderFilter) {
          return false;
        }
        if (teamFilter && match.teamType && match.teamType !== teamFilter) {
          return false;
        }
        if (activeTab === "quyen") {
          if (!subCompetitionFilter) return false;
          if (match.fistConfigId && match.fistConfigId !== subCompetitionFilter)
            return false;
          if (detailCompetitionFilter) {
            if (
              match.fistItemId &&
              match.fistItemId !== detailCompetitionFilter
            )
              return false;
          }
          return true;
        } else if (activeTab === "music") {
          if (!subCompetitionFilter) return false;
          if (
            match.musicContentId &&
            match.musicContentId !== subCompetitionFilter
          )
            return false;
          return true;
        }
        return false;
      }

      // Get athletes that are in this match
      const matchAthletes = athletes.filter((athlete) =>
        match.participantIds.includes(athlete.id)
      );

      // If we can't find the athletes in the filtered list, still show the match
      // This prevents matches from disappearing when filters don't match perfectly
      if (matchAthletes.length === 0) {
        return true; // Show matches with participants even if they don't match current filters
      }

      // Check if at least one participant matches the filters
      return matchAthletes.some((athlete) => {
        // Map AthleteRow to AthleteApi for filtering logic
        const apiAthlete: AthleteApi = {
          id: athlete.id,
          fullName: athlete.name,
          email: athlete.email,
          gender: athlete.gender === "Nam" ? "MALE" : "FEMALE",
          competitionType: activeTab,
          studentId: athlete.studentId,
          club: athlete.club,
          subCompetitionType: athlete.subCompetitionType,
          detailSubCompetitionType: athlete.detailSubCompetitionType,
          detailSubLabel: athlete.detailSubLabel,
          fistItemId: athlete.fistItemId,
          fistConfigId: athlete.fistConfigId,
          musicContentId: athlete.musicContentId,
          performanceId: athlete.performanceId,
        };

        // Check gender filter
        if (genderFilter && apiAthlete.gender !== genderFilter) {
          return false;
        }

        // Check subCompetitionType filter (fistConfig or musicContent) - REQUIRED
        // subCompetitionFilter is already checked at the top level, but verify here too
        if (activeTab === "quyen") {
          // For Quyền: check if fistConfig matches
          if (apiAthlete.fistConfigId) {
            const cfg = fistConfigs.find(
              (x) => x.id === apiAthlete.fistConfigId
            );
            if (!cfg || cfg.id !== subCompetitionFilter) {
              return false;
            }
          } else {
            // Fallback: check subCompetitionType vs resolved name
            if (apiAthlete.subCompetitionType !== selectedCfgNameForMatch) {
              return false;
            }
          }
        } else if (activeTab === "music") {
          // For Music: check if musicContent matches
          if (apiAthlete.musicContentId) {
            const mc = musicContents.find(
              (x) => x.id === apiAthlete.musicContentId
            );
            if (!mc || mc.id !== subCompetitionFilter) {
              return false;
            }
          } else if (apiAthlete.subCompetitionType) {
            // fallback by name
            const mcName =
              musicContents.find((m) => m.id === subCompetitionFilter)?.name ||
              "";
            if (apiAthlete.subCompetitionType !== mcName) {
              return false;
            }
          } else {
            return false;
          }
        }

        // Check detailCompetitionFilter (fistItem for Quyền) - REQUIRED for Quyền
        if (activeTab === "quyen") {
          if (apiAthlete.fistItemId) {
            const item = fistItems.find((x) => x.id === apiAthlete.fistItemId);
            if (!item || item.id !== detailCompetitionFilter) {
              return false;
            }
          } else {
            // Fallback: check detailSubCompetitionType or detailSubLabel vs resolved name
            const detailMatch =
              apiAthlete.detailSubCompetitionType ===
                selectedItemNameForMatch ||
              apiAthlete.detailSubLabel === selectedItemNameForMatch;
            if (!detailMatch) {
              return false;
            }
          }
        }

        // Check team filter
        if (teamFilter) {
          const isTeamEntry = (a: AthleteApi): boolean => {
            if (a.competitionType === "quyen") {
              let catName = a.subCompetitionType || "";
              const cfgId = a.fistConfigId;
              if (
                (!catName ||
                  catName === "-" ||
                  catName.toLowerCase() === "quyền") &&
                cfgId
              ) {
                const cfg = fistConfigs.find((x) => x.id === cfgId);
                if (cfg?.name) catName = cfg.name;
              }
              const itemId = a.fistItemId;
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
              if (s.includes("song luyen") || s.includes("da luyen"))
                return true;
              if (s.includes("don luyen")) return false;
              return false;
            } else if (a.competitionType === "music") {
              const mid = a.musicContentId;
              if (mid) {
                const mc = musicContents.find((x) => x.id === mid);
                if (mc && typeof mc?.performersPerEntry === "number") {
                  return mc.performersPerEntry > 1;
                }
              }
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

          const team = isTeamEntry(apiAthlete);
          if (teamFilter === "TEAM") {
            if (!(team && isTeamHeader(apiAthlete))) {
              return false;
            }
          } else if (teamFilter === "PERSON") {
            if (team) {
              return false;
            }
          }
        }

        return true;
      });
    });

    return filteredList.sort(compareMatchPosition);
  }, [
    matchesForActiveType,
    athletes,
    subCompetitionFilter,
    detailCompetitionFilter,
    genderFilter,
    teamFilter,
    activeTab,
    fistConfigs,
    fistItems,
    musicContents,
  ]);

  // Reset filters when changing tab
  // Use useLayoutEffect to reset before paint, preventing screen flicker
  useLayoutEffect(() => {
    // Reset filters synchronously before paint to prevent showing stale filtered data
    if (!hasSubParam) setSubCompetitionFilter("");
    if (!hasDetailParam) setDetailCompetitionFilter("");
    setOpenCategory("");
    setShowCompetitionFilter(false);
    if (!hasGenderParam) setGenderFilter("MALE");
    if (!hasTeamParam) setTeamFilter("PERSON");
    setShowGenderFilter(false);
    setShowTeamFilter(false);
    // Clear athletes cache when switching tabs to prevent stale data
    setAthletesByPerformance({});
  }, [activeTab, hasDetailParam, hasGenderParam, hasSubParam, hasTeamParam]);

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        type CompetitionOption = { id: string; name: string };
        const res = await api.get<CompetitionOption[]>(
          API_ENDPOINTS.TOURNAMENT_FORMS.COMPETITIONS
        );
        const list = res.data ?? [];
        setTournaments(list);
        if (list.length > 0) {
          setSelectedTournament((prev) => prev || list[0].id);
        }
      } catch (error) {
        console.error("Failed to load tournaments:", error);
      }
    };

    loadTournaments();
  }, []);

  // Load tournament-specific quick buttons whenever tournament/tab changes
  useEffect(() => {
    const loadQuickButtons = async () => {
      if (!selectedTournament) {
        setQuickButtons([]);
        setAllowedFistConfigIds(new Set());
        setAllowedFistItemIds(new Set());
        setAllowedMusicContentIds(new Set());
        setAllowedFistConfigNames(new Set());
        setAllowedMusicContentNames(new Set());
        return;
      }
      try {
        const res = await api.get<any>(
          API_ENDPOINTS.COMPETITIONS.BY_ID(selectedTournament)
        );
        const data = (res.data?.data as any) ?? res.data ?? {};

        // Extract allowed IDs from competition configuration
        // vovinamFistConfigs: List of allowed fist configs
        const vovinamFistConfigs = data?.vovinamFistConfigs || [];
        const cfgIds: string[] = vovinamFistConfigs
          .map((cfg: any) =>
            typeof cfg === "string" ? cfg : cfg?.id || String(cfg)
          )
          .filter((id: string) => id);

        // fistConfigItemSelections: Map<configId, List<FistItemResponse>>
        // Extract all allowed item IDs from all configs
        const fistConfigItemSelections = data?.fistConfigItemSelections || {};
        const itemIds: string[] = [];
        Object.values(fistConfigItemSelections).forEach((items: any) => {
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              const itemId =
                typeof item === "string" ? item : item?.id || String(item);
              if (itemId && !itemIds.includes(itemId)) {
                itemIds.push(itemId);
              }
            });
          }
        });

        // musicPerformances: List of allowed music contents
        const musicPerformances = data?.musicPerformances || [];
        const musicIds: string[] = musicPerformances
          .map((mc: any) =>
            typeof mc === "string" ? mc : mc?.id || String(mc)
          )
          .filter((id: string) => id);

        // Fallback to old format if new format not available
        if (cfgIds.length === 0) {
          const fallbackCfgIds = (
            data?.allowedFistConfigs ||
            data?.fistConfigs ||
            data?.quyenConfigs ||
            []
          ).map((x: any) => String(x));
          cfgIds.push(...fallbackCfgIds);
        }
        if (itemIds.length === 0) {
          const fallbackItemIds = (
            data?.allowedFistItems ||
            data?.fistItems ||
            data?.quyenItems ||
            []
          ).map((x: any) => String(x));
          itemIds.push(...fallbackItemIds);
        }
        if (musicIds.length === 0) {
          const fallbackMusicIds = (
            data?.allowedMusicContents ||
            data?.musicContents ||
            data?.tietMuc ||
            []
          ).map((x: any) => String(x));
          musicIds.push(...fallbackMusicIds);
        }

        setAllowedFistConfigIds(new Set(cfgIds));
        setAllowedFistItemIds(new Set(itemIds));
        setAllowedMusicContentIds(new Set(musicIds));
        let labels: string[] = [];
        if (activeTab === "quyen") {
          labels =
            data?.quyenQuickButtons ||
            data?.fistQuickButtons ||
            data?.quyenLabels ||
            [];
          // If labels provided, also constrain by name
          if (Array.isArray(labels) && labels.length > 0) {
            setAllowedFistConfigNames(
              new Set(labels.map((s: any) => String(s)))
            );
          } else {
            setAllowedFistConfigNames(new Set());
          }
          if (!Array.isArray(labels) || labels.length === 0) {
            // Fallback: derive from allowed fist configs names
            const allowedConfigNames: string[] = vovinamFistConfigs
              .map((cfg: any) =>
                typeof cfg === "object" && cfg?.name ? cfg.name : null
              )
              .filter(
                (name: string | null): name is string =>
                  typeof name === "string" && name.trim().length > 0
              );

            if (allowedConfigNames.length > 0) {
              labels = Array.from(new Set(allowedConfigNames)).slice(0, 6);
            } else {
              // Last resort: derive from allowed fist items names
              const allowedItemNames = fistItems
                .filter((i) => itemIds.length === 0 || itemIds.includes(i.id))
                .map((i) => i.name)
                .filter((n) => typeof n === "string" && n.trim().length > 0);
              labels = Array.from(new Set(allowedItemNames)).slice(0, 6);
            }
          }
        } else if (activeTab === "music") {
          labels =
            data?.musicQuickButtons ||
            data?.musicLabels ||
            data?.tietMucLabels ||
            [];
          if (Array.isArray(labels) && labels.length > 0) {
            setAllowedMusicContentNames(
              new Set(labels.map((s: any) => String(s)))
            );
          } else {
            setAllowedMusicContentNames(new Set());
          }
          if (!Array.isArray(labels) || labels.length === 0) {
            // Fallback: derive from allowed music contents names
            const allowedMusicNames = musicContents
              .filter((m) => musicIds.length === 0 || musicIds.includes(m.id))
              .map((m) => m.name)
              .filter((n) => typeof n === "string" && n.trim().length > 0);
            labels = Array.from(new Set(allowedMusicNames)).slice(0, 6);
          }
        }
        setQuickButtons(Array.isArray(labels) ? labels : []);
      } catch {
        // Fallback to local catalogs
        if (activeTab === "quyen") {
          setQuickButtons(
            Array.from(new Set(fistItems.map((i) => i.name))).slice(0, 6)
          );
          setAllowedFistConfigIds(new Set());
          setAllowedFistItemIds(new Set());
          setAllowedFistConfigNames(new Set());
        } else if (activeTab === "music") {
          setQuickButtons(
            Array.from(new Set(musicContents.map((m) => m.name))).slice(0, 6)
          );
          setAllowedMusicContentIds(new Set());
          setAllowedMusicContentNames(new Set());
        } else {
          setQuickButtons([]);
          setAllowedFistConfigIds(new Set());
          setAllowedFistItemIds(new Set());
          setAllowedMusicContentIds(new Set());
          setAllowedFistConfigNames(new Set());
          setAllowedMusicContentNames(new Set());
        }
      }
    };
    loadQuickButtons();
    // Removed fistItems, musicContents from dependencies to prevent infinite loops
    // They are only used as fallback when API fails and are accessed via closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTournament, activeTab]);

  // Load persisted performance matches for selected tournament
  // Load all matches (both quyen and music) to prevent flicker when switching tabs
  useEffect(() => {
    const loadPersistedMatches = async () => {
      if (!selectedTournament) {
        return;
      }
      try {
        setPendingLoads((n) => n + 1);
        const res = await api.get<any[]>(
          API_ENDPOINTS.PERFORMANCE_MATCHES.BY_COMPETITION(selectedTournament)
        );
        const resPayload: any = (res as any)?.data;
        const list: Array<any> = Array.isArray(resPayload)
          ? resPayload
          : Array.isArray(resPayload?.data)
          ? (resPayload?.data as Array<any>)
          : Array.isArray(resPayload?.content)
          ? (resPayload?.content as Array<any>)
          : [];
        const perfCacheUpdates: Record<string, Record<string, unknown>> = {};
        // Map to Match[] for both tabs to prevent flicker when switching
        const mapped: Match[] = list
          .filter((pm: any) => {
            const ct = String(pm.contentType || "").toUpperCase();
            if (ct !== "QUYEN" && ct !== "MUSIC") {
              return false;
            }
            // Only show matches with performanceId (must have a linked performance)
            if (
              !pm.performanceId ||
              typeof pm.performanceId !== "string" ||
              pm.performanceId.trim() === ""
            ) {
              return false;
            }
            // Only show matches with approved performances
            // A performance is approved when all selectedAthletes have an id (athlete is not null)
            const rawSelectedAthletes: Array<any> = Array.isArray(
              pm.selectedAthletes
            )
              ? pm.selectedAthletes
              : [];
            // If no athletes, don't show (not approved yet)
            if (rawSelectedAthletes.length === 0) {
              return false;
            }
            // Check if all athletes have id (approved)
            const allApproved = rawSelectedAthletes.every(
              (a: any) =>
                a?.id && typeof a.id === "string" && a.id.trim() !== ""
            );
            return allApproved;
          })
          .map((pm: any) => {
            const rawSelectedAthletes: Array<any> = Array.isArray(
              pm.selectedAthletes
            )
              ? pm.selectedAthletes
              : [];
            const participants = rawSelectedAthletes.map((a: any) => {
              const teamNameFromAthlete =
                typeof a?.teamName === "string" && a.teamName.trim().length > 0
                  ? a.teamName.trim()
                  : typeof a?.displayName === "string" &&
                    a.displayName.trim().length > 0
                  ? a.displayName.trim()
                  : undefined;
              if (teamNameFromAthlete) {
                return teamNameFromAthlete;
              }
              const email = typeof a?.email === "string" ? a.email : "";
              if (
                email.toLowerCase().endsWith("@team.local") &&
                typeof a?.fullName === "string" &&
                a.fullName.trim().length > 0
              ) {
                return a.fullName.trim();
              }
              return String(a?.fullName || "");
            });
            const participantIds = rawSelectedAthletes
              .map((a: any) => (a.id ? String(a.id) : ""))
              .filter((x: string) => !!x)
              .slice();
            // Derive gender from persisted selected athletes if available
            let matchGender: "MALE" | "FEMALE" | undefined = undefined;
            if (rawSelectedAthletes.length > 0) {
              const g = String(
                rawSelectedAthletes[0]?.gender || ""
              ).toUpperCase();
              matchGender =
                g === "FEMALE" || g === "NỮ" || g === "NU" ? "FEMALE" : "MALE";
            }
            let teamName: string | undefined;
            if (
              typeof pm?.teamName === "string" &&
              pm.teamName.trim().length > 0
            ) {
              teamName = pm.teamName.trim();
            } else if (
              pm?.performance &&
              typeof pm.performance === "object" &&
              typeof (pm.performance as any)?.teamName === "string" &&
              ((pm.performance as any)?.teamName as string).trim().length > 0
            ) {
              teamName = ((pm.performance as any)?.teamName as string).trim();
            } else {
              const candidateFromAthletes = rawSelectedAthletes
                .map((a: any) => {
                  if (
                    typeof a?.teamName === "string" &&
                    a.teamName.trim().length > 0
                  ) {
                    return a.teamName.trim();
                  }
                  const email = typeof a?.email === "string" ? a.email : "";
                  if (
                    email.toLowerCase().endsWith("@team.local") &&
                    typeof a?.fullName === "string" &&
                    a.fullName.trim().length > 0
                  ) {
                    return a.fullName.trim();
                  }
                  return undefined;
                })
                .find((val: string | undefined) => !!val);
              if (candidateFromAthletes) {
                teamName = candidateFromAthletes;
              }
            }
            if (
              pm?.performanceId &&
              typeof pm.performanceId === "string" &&
              pm.performanceId.trim().length > 0 &&
              pm?.performance &&
              typeof pm.performance === "object"
            ) {
              perfCacheUpdates[pm.performanceId.trim()] = {
                ...(pm.performance as Record<string, unknown>),
              };
            }
            const contentType = String(pm.contentType || "").toUpperCase();
            const matchType: CompetitionType =
              contentType === "QUYEN" ? "quyen" : "music";
            return {
              id: pm.id,
              order: Number(pm.matchOrder || 0) || 0,
              type: matchType,
              contentName:
                matchType === "quyen" ? "Nội dung Quyền" : "Nội dung Võ nhạc",
              participantIds,
              participants,
              assessors: createEmptyAssessors(),
              judgesCount: undefined,
              timerSec: pm.durationSeconds ?? undefined,
              performanceId: pm.performanceId,
              matchOrder: pm.matchOrder,
              status: pm.status,
              fistConfigId: pm.fistConfigId ?? null,
              fistItemId: pm.fistItemId ?? null,
              musicContentId: pm.musicContentId ?? null,
              gender: matchGender,
              teamName: teamName ?? null,
              fieldId: pm.fieldId ?? null,
              fieldName: pm.fieldLocation ?? null,
            } as Match;
          });

        // Enrich with assigned assessors from BE so reload preserves selections
        const enriched: Match[] = await Promise.all(
          mapped.map(async (m) => {
            try {
              // Use PERFORMANCE_MATCHES.ASSESSORS endpoint for performance matches
              const url = API_ENDPOINTS.PERFORMANCE_MATCHES.ASSESSORS(m.id);
              const res = await api.get(url);
              const payloadRoot: any = (res as any)?.data;
              const payload: any = Array.isArray(payloadRoot)
                ? payloadRoot
                : Array.isArray(payloadRoot?.data)
                ? payloadRoot?.data
                : Array.isArray(payloadRoot?.content)
                ? payloadRoot?.content
                : [];
              const arr: Array<any> = Array.isArray(payload)
                ? payload
                : (payload?.content as Array<any>) ||
                  (payload?.data as Array<any>) ||
                  [];
              if (arr && arr.length > 0) {
                const roleKeys = ASSESSOR_ROLES.map((r) => r.key);
                const roleByPosition = new Map(
                  ASSESSOR_ROLES.map((role) => [role.position, role.key])
                );
                const numericPositions = arr
                  .map((candidate: any) =>
                    typeof candidate?.position === "number"
                      ? candidate.position
                      : undefined
                  )
                  .filter((val): val is number => typeof val === "number");
                const isOneBasedPositions =
                  numericPositions.length > 0 &&
                  !numericPositions.some((val) => val === 0) &&
                  numericPositions.some((val) => val === ASSESSOR_ROLES.length);
                const nextAssessors: Record<string, string> =
                  createEmptyAssessors();
                arr.slice(0, 5).forEach((a: any, idx: number) => {
                  // AssessorResponse has userId field
                  const id = (a && (a.userId || a.assessorId || a.id)) || "";
                  if (!id) return;
                  const rawPosition =
                    typeof a?.position === "number" ? a.position : undefined;
                  const normalizedPosition =
                    rawPosition === undefined
                      ? undefined
                      : isOneBasedPositions
                      ? Math.max(rawPosition - 1, 0)
                      : rawPosition;
                  const roleKey =
                    (normalizedPosition !== undefined
                      ? roleByPosition.get(normalizedPosition)
                      : undefined) || roleKeys[idx];
                  if (roleKey) {
                    nextAssessors[roleKey] = id;
                  }
                });
                const assignedCount = Object.values(nextAssessors).filter(
                  (val) => typeof val === "string" && val.trim().length > 0
                ).length;
                // Only assign assessors if there are actually assigned assessors
                if (assignedCount > 0) {
                  return {
                    ...m,
                    assessors: nextAssessors,
                    judgesCount: assignedCount || 5,
                  } as Match;
                }
              }
            } catch (_) {
              // ignore
            }
            return m;
          })
        );

        // Merge: replace all matches (both tabs) to prevent flicker when switching tabs
        if (Object.keys(perfCacheUpdates).length > 0) {
          setPerformanceCache((prev) => ({ ...prev, ...perfCacheUpdates }));
        }

        // Update matches for both tabs, only keep approved matches from DB
        // Don't keep preset matches when tournament is selected - only show approved matches
        setMatches((prev) => {
          // When tournament is selected, only show approved matches from DB
          // Preset matches are only for when no tournament is selected
          if (selectedTournament) {
            return normalizeMatches(enriched);
          }
          // If no tournament, keep preset matches (temporary) but filter out unapproved ones
          const presetMatches = prev.filter(
            (m) =>
              m.id.startsWith("preset-") && !enriched.some((e) => e.id === m.id)
          );
          return normalizeMatches([...enriched, ...presetMatches]);
        });
      } catch (err) {
        // ignore load errors; keep local state
      } finally {
        setPendingLoads((n) => Math.max(0, n - 1));
        setIsTournamentLoading(false);
      }
    };
    loadPersistedMatches();
    // Removed activeTab from dependencies - we load all matches (both tabs) to prevent flicker
  }, [selectedTournament]);

  useEffect(() => {
    const loadAthletes = async () => {
      if (!selectedTournament) {
        setAthletes([]);
        athletesCacheRef.current = {};
        return;
      }

      // Create cache key based on tab and filters
      const cacheKey = `${selectedTournament}-${activeTab}-${genderFilter}-${subCompetitionFilter}-${detailCompetitionFilter}`;

      // Check cache first - if we have cached athletes for this exact combination, use cache
      const cached = athletesCacheRef.current[cacheKey];
      if (cached && cached.length > 0) {
        setAthletes(cached);
        return;
      }

      try {
        const qs = new URLSearchParams();
        qs.set("page", "0");
        qs.set("size", "200");
        qs.set("competitionType", activeTab);
        qs.set("competitionId", selectedTournament);

        console.log("[ArrangeOrderPage] Loading athletes with params:", {
          competitionId: selectedTournament,
          competitionType: activeTab,
          tournament: selectedTournament,
        });

        // Add filter parameters
        if (genderFilter) {
          qs.set("gender", genderFilter);
        }

        // Competition type filters (convert selected IDs to names for API)
        // Note: We use current state values to avoid dependency on arrays
        if (activeTab === "music" && subCompetitionFilter) {
          const currentMusicContents = musicContents;
          const contentName =
            currentMusicContents.find((m) => m.id === subCompetitionFilter)
              ?.name || "";
          qs.set("subCompetitionType", "Tiết mục");
          qs.set("detailSubCompetitionType", contentName);
        } else if (activeTab === "quyen") {
          if (subCompetitionFilter) {
            const currentFistConfigs = fistConfigs;
            const cfgName =
              currentFistConfigs.find((c) => c.id === subCompetitionFilter)
                ?.name || "";
            qs.set("subCompetitionType", cfgName);
          }
          if (detailCompetitionFilter) {
            const currentFistItems = fistItems;
            const itemName =
              currentFistItems.find((i) => i.id === detailCompetitionFilter)
                ?.name || "";
            qs.set("detailSubCompetitionType", itemName);
          }
        }

        setPendingLoads((n) => n + 1);
        const apiUrl = `${API_ENDPOINTS.ATHLETES.BASE}?${qs.toString()}`;
        console.log("[ArrangeOrderPage] API URL:", apiUrl);
        const res = await api.get<PaginationResponse<AthleteApi>>(apiUrl);

        console.log("[ArrangeOrderPage] API Response:", res.data);

        const rootAny = res.data as unknown as Record<string, unknown>;
        const outer = (rootAny?.data as Record<string, unknown>) ?? rootAny;
        const inner =
          (outer?.data as PaginationResponse<AthleteApi>) ||
          (outer as unknown as PaginationResponse<AthleteApi>);
        const content = inner?.content || [];

        console.log(
          "[ArrangeOrderPage] Parsed athletes count:",
          content.length
        );

        // Group by performanceId for team detail reconstruction
        const grouped: Record<string, AthleteApi[]> = {};
        for (const a of content) {
          const pid = (a.performanceId || "").toString().trim();
          if (!pid) continue;
          if (!grouped[pid]) grouped[pid] = [];
          grouped[pid].push(a);
        }
        setAthletesByPerformance(grouped);

        // Preload performance details for team name resolution
        const localPerfCache: Record<string, Record<string, unknown>> = {
          ...performanceCache,
        };
        const missingPerfIds = new Set<string>();
        content.forEach((a) => {
          const pid = (a.performanceId || "").toString().trim();
          if (pid && !localPerfCache[pid]) {
            missingPerfIds.add(pid);
          }
        });

        // Load missing performance data in parallel
        const loadedPerfs = await Promise.all(
          Array.from(missingPerfIds).map(async (pid) => {
            try {
              const pRes = await api.get(`/v1/performances/${pid}`);
              const root = pRes.data as unknown as {
                data?: Record<string, unknown>;
              };
              const perfObj =
                root && root.data
                  ? (root.data as Record<string, unknown>)
                  : (pRes.data as unknown as Record<string, unknown>);
              localPerfCache[pid] = perfObj;
              return { pid, perfObj };
            } catch {
              return null;
            }
          })
        );

        // Update performance cache with newly loaded data
        const newCacheEntries: Record<string, Record<string, unknown>> = {};
        loadedPerfs.forEach((result) => {
          if (result) {
            newCacheEntries[result.pid] = result.perfObj;
          }
        });
        if (Object.keys(newCacheEntries).length > 0) {
          setPerformanceCache((prev) => ({ ...prev, ...newCacheEntries }));
        }

        // Helper to determine if entry is a team
        const isTeamEntry = (a: AthleteApi): boolean => {
          if (a.competitionType === "quyen") {
            const itemId = a.fistItemId;
            if (itemId) {
              const fi = fistItems.find((x) => x.id === itemId);
              if (fi && typeof fi?.participantsPerEntry === "number") {
                return (fi.participantsPerEntry as number) > 1;
              }
            }
            let catName = a.subCompetitionType || "";
            const cfgId = a.fistConfigId;
            if (
              (!catName ||
                catName === "-" ||
                catName.toLowerCase() === "quyền") &&
              cfgId
            ) {
              const cfg = fistConfigs.find((x) => x.id === cfgId);
              if (cfg?.name) catName = cfg.name;
            }
            const s = `${catName} ${a.detailSubCompetitionType || ""} ${
              a.detailSubLabel || ""
            }`
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
              .replace(/\s+/g, " ");
            if (s.includes("song luyen") || s.includes("da luyen")) return true;
            if (s.includes("don luyen")) return false;
            return false;
          } else if (a.competitionType === "music") {
            const mid = a.musicContentId;
            if (mid) {
              const mc = musicContents.find((x) => x.id === mid);
              if (mc && typeof mc?.performersPerEntry === "number") {
                return mc.performersPerEntry > 1;
              }
            }
            const s = `${a.detailSubCompetitionType || ""} ${
              a.detailSubLabel || ""
            }`
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
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

        const mapped = content.map((athlete) => {
          const rec = athlete as unknown as Record<string, unknown>;
          const pid = (athlete.performanceId || "").toString().trim();
          const perf =
            pid && localPerfCache[pid]
              ? (localPerfCache[pid] as Record<string, unknown>)
              : undefined;

          const isTeam = isTeamEntry(athlete);

          // Get team name from multiple sources (same as AthleteManagementPage)
          let displayName = athlete.fullName;
          if (isTeam) {
            const perfTeamName = (perf?.["teamName"] as string) || "";
            const backendTeamName = (rec["teamName"] as string) || "";
            displayName = perfTeamName || backendTeamName || athlete.fullName;
          }

          return {
            id: athlete.id,
            name: displayName,
            email: athlete.email,
            gender: (athlete.gender === "FEMALE" ? "Nữ" : "Nam") as
              | "Nam"
              | "Nữ",
            studentId: (athlete.studentId || "").toString(),
            club: athlete.club || "",
            subCompetitionType: athlete.subCompetitionType || "",
            detailSubCompetitionType: athlete.detailSubCompetitionType || "",
            detailSubLabel: athlete.detailSubLabel,
            fistItemId: athlete.fistItemId,
            fistConfigId: athlete.fistConfigId,
            musicContentId: athlete.musicContentId,
            performanceId: athlete.performanceId,
          };
        });

        setAthletes(mapped);

        // Update cache with the cache key
        athletesCacheRef.current[cacheKey] = mapped;
      } catch (error) {
        console.error("Failed to load athletes:", error);
        setAthletes([]);
      } finally {
        setPendingLoads((n) => Math.max(0, n - 1));
        setIsTournamentLoading(false);
      }
    };

    loadAthletes();
    // Only depend on filter IDs, not the arrays or cache themselves
    // Removed fistConfigs, fistItems, musicContents, performanceCache to prevent infinite loops
    // They are accessed via closure and only change when filters change
    // Removed activeTab from dependencies - we'll handle tab switching via cache
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedTournament,
    genderFilter,
    subCompetitionFilter,
    detailCompetitionFilter,
  ]);

  // Update athletes from cache when switching tabs (without API call)
  useEffect(() => {
    if (!selectedTournament) {
      setAthletes([]);
      return;
    }

    const cacheKey = `${selectedTournament}-${activeTab}-${genderFilter}-${subCompetitionFilter}-${detailCompetitionFilter}`;
    const cached = athletesCacheRef.current[cacheKey];

    if (cached && cached.length > 0) {
      setAthletes(cached);
    } else {
      // If no cache, trigger load (but this should rarely happen as loadAthletes handles it)
      setAthletes([]);
    }
    // Only run when activeTab changes, not when filters change (filters trigger loadAthletes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Note: mock generator removed from UI; keep for potential dev usage

  const deleteMatch = (matchId: string) => {
    setMatches((prev) => {
      const target = prev.find((m) => m.id === matchId);
      if (!target) return prev;
      const sameType = prev
        .filter((m) => m.type === target.type && m.id !== matchId)
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((m, idx) => ({ ...m, order: idx + 1 }));
      const others = prev.filter((m) => m.type !== target.type);
      return normalizeMatches([...others, ...sameType]);
    });
  };

  const beginMatch = async (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) {
      console.warn("Match not found:", matchId);
      return;
    }

    // Check if match needs setup (no participants selected)
    if (!match.participantIds || match.participantIds.length === 0) {
      toast.warning(
        "Vui lòng setup trận đấu (chọn VĐV và gán trọng tài) trước khi bắt đầu.",
        4000
      );
      return;
    }

    const judgesCount = match.judgesCount ?? 5;
    const defaultTimerSec = match.timerSec ?? 120;

    const projectionPayload = {
      matchId: match.id,
      competitionId: selectedTournament,
      type: match.type,
      contentName: match.contentName,
      participants: match.participants.map((name, idx) => ({
        id: match.participantIds[idx] || String(idx),
        name,
      })),
      judgesCount,
      defaultTimerMs: defaultTimerSec * 1000,
      theme: "light" as const,
      fontScale: "md" as const,
      showParticipants: true,
      startedAt: Date.now(),
    };

    try {
      localStorage.setItem(
        `projection:${match.id}`,
        JSON.stringify(projectionPayload)
      );
      // Also store by performanceId if available, for projection fallback
      const pidForStorage = (match as any).performanceId as string | undefined;
      if (pidForStorage) {
        localStorage.setItem(
          `projection:${pidForStorage}`,
          JSON.stringify(projectionPayload)
        );
      }
    } catch (err) {
      console.error("Failed to save to localStorage:", err);
    }

    // Prefer performanceId for quyền/võ nhạc projection; fallback to matchId
    let pid = (match as any).performanceId as string | undefined;
    let pmId: string | undefined = undefined; // Will be set to actual PerformanceMatch ID

    // Check if match.id is already a PerformanceMatch ID (UUID format, not manual-xxx)
    // UUID format: 8-4-4-4-12 hex characters
    const isUUIDFormat =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        match.id
      );
    if (isUUIDFormat && !match.id.startsWith("manual-")) {
      // match.id is already a PerformanceMatch ID, use it directly
      pmId = match.id;
    }

    // If we have performanceId, try to get PerformanceMatch ID first (if not already set)
    if (pid && !pmId) {
      try {
        const pmRes = await api.get<{
          success?: boolean;
          message?: string;
          data?: { id?: string; matchOrder?: number; status?: string };
          id?: string;
          matchOrder?: number;
          status?: string;
        }>(API_ENDPOINTS.PERFORMANCE_MATCHES.BY_PERFORMANCE(pid));
        const pmData = pmRes.data as {
          success?: boolean;
          message?: string;
          data?: { id?: string; matchOrder?: number; status?: string };
          id?: string;
          matchOrder?: number;
          status?: string;
        };
        const pm = (pmData?.data || pmData) as {
          id?: string;
          matchOrder?: number;
          status?: string;
        };
        if (
          pm &&
          typeof pm === "object" &&
          pm.id &&
          typeof pm.id === "string"
        ) {
          pmId = pm.id;
        }
      } catch (error) {
        // PerformanceMatch might not exist yet, will create below
        console.warn(
          "PerformanceMatch not found for performanceId:",
          pid,
          error
        );
      }
    }

    // If no performanceId but match has participants, try to create/get PerformanceMatch
    if (!pid && match.participantIds.length > 0) {
      try {
        // Find the athlete to get performanceId
        const athleteId = match.participantIds[0];
        const athlete = athletes.find((a) => a.id === athleteId);
        const derivedPerformanceId = athlete?.performanceId;

        if (derivedPerformanceId) {
          // Create/save PerformanceMatch if it doesn't exist
          const body: {
            durationSeconds: number;
            fistConfigId?: string | null;
            fistItemId?: string | null;
            musicContentId?: string | null;
            fieldId?: string | null;
          } = {
            durationSeconds: defaultTimerSec,
            fieldId: match.fieldId ?? null,
          };
          if (match.type === "quyen") {
            if (match.fistConfigId) body.fistConfigId = match.fistConfigId;
            if (match.fistItemId) body.fistItemId = match.fistItemId;
          } else if (match.type === "music") {
            if (match.musicContentId)
              body.musicContentId = match.musicContentId;
          }

          const res = await api.post<{
            success?: boolean;
            message?: string;
            data?: {
              id?: string;
              matchOrder?: number;
              status?: string;
              performanceId?: string;
            };
            id?: string;
            matchOrder?: number;
            status?: string;
            performanceId?: string;
          }>(
            API_ENDPOINTS.PERFORMANCE_MATCHES.SAVE_BY_PERFORMANCE(
              derivedPerformanceId
            ),
            body
          );

          // Unwrap BaseResponse structure: { success, message, data: { id, ... } }
          // or direct PerformanceMatchResponse: { id, ... }
          const responseData = res.data as {
            success?: boolean;
            message?: string;
            data?: {
              id?: string;
              matchOrder?: number;
              status?: string;
              performanceId?: string;
            };
            id?: string;
            matchOrder?: number;
            status?: string;
            performanceId?: string;
          };

          // Try to get PerformanceMatchResponse from data.data or data directly
          const pm = (responseData?.data || responseData) as {
            id?: string;
            matchOrder?: number;
            status?: string;
            performanceId?: string;
          };

          if (
            pm &&
            typeof pm === "object" &&
            pm.id &&
            typeof pm.id === "string"
          ) {
            pmId = pm.id; // Use the actual PerformanceMatch ID from response
            pid = derivedPerformanceId;

            // Update match with new PerformanceMatch info (but keep original match.id for UI)
            setMatches((prev) =>
              normalizeMatches(
                prev.map((m) =>
                  m.id === match.id
                    ? {
                        ...m,
                        performanceId: pid,
                        matchOrder: pm.matchOrder,
                        order:
                          typeof pm.matchOrder === "number" &&
                          Number.isFinite(pm.matchOrder)
                            ? pm.matchOrder
                            : m.order,
                        status: pm.status,
                      }
                    : m
                )
              )
            );
          } else {
            console.error("Failed to get PerformanceMatch ID from response:", {
              responseData,
              pm,
              res: res.data,
            });
            toast.error(
              "Không thể tạo trận đấu. Vui lòng thử lại sau khi setup trận.",
              4000
            );
            return;
          }
        } else {
          console.error("No performanceId found for athlete:", athleteId);
          toast.error(
            "Không thể tìm thấy thông tin performance. Vui lòng thử lại sau khi setup trận.",
            4000
          );
          return;
        }
      } catch (error) {
        console.error("Failed to create PerformanceMatch:", error);
        toast.error(
          "Không thể tạo trận đấu. Vui lòng thử lại sau khi setup trận.",
          4000
        );
        return;
      }
    }

    // If we have a performance, start it on the server so judges are notified in realtime
    // PerformanceMatch status is now the source of truth, it will sync to Performance automatically
    // But we need pmId to update status - if we don't have it yet, try to get it again or create it
    if (pid) {
      // If we still don't have pmId, try to get/create it
      if (!pmId) {
        try {
          // Try to get existing PerformanceMatch
          const pmRes = await api.get<{
            success?: boolean;
            message?: string;
            data?: { id?: string; matchOrder?: number; status?: string };
            id?: string;
            matchOrder?: number;
            status?: string;
          }>(API_ENDPOINTS.PERFORMANCE_MATCHES.BY_PERFORMANCE(pid));
          const pmData = pmRes.data as {
            success?: boolean;
            message?: string;
            data?: { id?: string; matchOrder?: number; status?: string };
            id?: string;
            matchOrder?: number;
            status?: string;
          };
          const pm = (pmData?.data || pmData) as {
            id?: string;
            matchOrder?: number;
            status?: string;
          };
          if (
            pm &&
            typeof pm === "object" &&
            pm.id &&
            typeof pm.id === "string"
          ) {
            pmId = pm.id;
          }
        } catch (error) {
          // If PerformanceMatch doesn't exist, create it
          console.warn("PerformanceMatch not found, creating new one:", error);
          try {
            const body: {
              durationSeconds: number;
              fistConfigId?: string | null;
              fistItemId?: string | null;
              musicContentId?: string | null;
              fieldId?: string | null;
            } = {
              durationSeconds: defaultTimerSec,
              fieldId: match.fieldId ?? null,
            };
            if (match.type === "quyen") {
              if (match.fistConfigId) body.fistConfigId = match.fistConfigId;
              if (match.fistItemId) body.fistItemId = match.fistItemId;
            } else if (match.type === "music") {
              if (match.musicContentId)
                body.musicContentId = match.musicContentId;
            }

            const res = await api.post<{
              success?: boolean;
              message?: string;
              data?: { id?: string; matchOrder?: number; status?: string };
              id?: string;
              matchOrder?: number;
              status?: string;
            }>(
              API_ENDPOINTS.PERFORMANCE_MATCHES.SAVE_BY_PERFORMANCE(pid),
              body
            );
            const responseData = res.data as {
              success?: boolean;
              message?: string;
              data?: { id?: string; matchOrder?: number; status?: string };
              id?: string;
              matchOrder?: number;
              status?: string;
            };
            const pm = (responseData?.data || responseData) as {
              id?: string;
              matchOrder?: number;
              status?: string;
            };
            if (
              pm &&
              typeof pm === "object" &&
              pm.id &&
              typeof pm.id === "string"
            ) {
              pmId = pm.id;
            }
          } catch (createError) {
            console.error("Failed to create PerformanceMatch:", createError);
            toast.error(
              "Không thể tạo trận đấu. Vui lòng thử lại sau khi setup trận.",
              4000
            );
            return;
          }
        }
      }

      // Navigate to projection screen without starting the match
      // User will start the match manually from projection screen
      if (pmId && pid) {
        // Open projection without starting the match
        const url = `/performance/projection?performanceId=${encodeURIComponent(
          pid
        )}`;
        window.open(url, "_blank");
      } else if (pid) {
        // Fallback: use performanceId if pmId not available
        const url = `/performance/projection?performanceId=${encodeURIComponent(
          pid
        )}`;
        window.open(url, "_blank");
      } else {
        console.error("No PerformanceMatch ID or Performance ID available");
        toast.error(
          "Không thể tìm thấy thông tin trận đấu. Vui lòng thử lại.",
          4000
        );
      }
    } else {
      // Fallback: use matchId for projection (manual matches without performance)
      const url = `/performance/projection?matchId=${encodeURIComponent(
        match.id
      )}`;
      window.open(url, "_blank");
    }
  };

  // Arrow move buttons removed in favor of drag-and-drop

  // Combined setup modal (team + assessors)
  const hydrateSetupState = useCallback(
    (match: Match) => {
      if (!match) return;
      const existingAssessors = match.assessors ?? {};
      // Only keep assessors with actual values (not empty strings)
      const validAssessors = Object.entries(existingAssessors).reduce(
        (acc, [key, value]) => {
          if (value && typeof value === "string" && value.trim() !== "") {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, string>
      );
      const assignedCount = [
        validAssessors.referee,
        validAssessors.judgeA,
        validAssessors.judgeB,
        validAssessors.judgeC,
        validAssessors.judgeD,
      ].filter(Boolean).length;
      const baseJudgesCount =
        typeof match?.judgesCount === "number" && match.judgesCount > 0
          ? match.judgesCount
          : assignedCount;
      const derivedJudgesCount = Math.min(Math.max(baseJudgesCount || 5, 1), 5);

      const initialDetails = createEmptyAssessorDetails();
      Object.entries(validAssessors).forEach(([key, value]) => {
        if (value && typeof value === "string" && value.trim() !== "") {
          initialDetails[key as keyof Match["assessors"]] = {
            id: value,
          };
        }
      });

      setSetupModal({
        open: true,
        matchId: match.id,
        assessors: validAssessors,
        assessorDetails: initialDetails,
        judgesCount: derivedJudgesCount,
        defaultTimerSec: match?.timerSec ?? 120,
        fieldId: match?.fieldId || "",
      });
      // Don't reset filters - keep them so athletes are filtered correctly
      // Only close dropdowns
      setOpenCategory("");
      setShowCompetitionFilter(false);
      setShowGenderFilter(false);
      setShowTeamFilter(false);

      // Ensure field is hydrated from backend if not yet available in local state
      (async () => {
        try {
          const currentFieldId = (match?.fieldId || "").toString().trim();
          const performanceId = (match?.performanceId || "").toString().trim();
          if (!currentFieldId && performanceId) {
            const url =
              API_ENDPOINTS.PERFORMANCE_MATCHES.BY_PERFORMANCE(performanceId);
            const res = await api.get(url);
            const pm = (res as any)?.data?.data ?? (res as any)?.data ?? null;
            const fetchedFieldId = (pm?.fieldId || "").toString();
            const fetchedFieldName = (pm?.fieldLocation || "").toString();
            if (fetchedFieldId) {
              setSetupModal((prev) => ({
                ...prev,
                fieldId: fetchedFieldId,
              }));
              // Also reflect into matches list so reopening modal keeps the value
              setMatches((prev) =>
                normalizeMatches(
                  prev.map((m) =>
                    m.id === match.id
                      ? {
                          ...m,
                          fieldId: fetchedFieldId,
                          fieldName: fetchedFieldName || m.fieldName,
                        }
                      : m
                  )
                )
              );
            }
          }
        } catch (e) {
          // ignore hydration errors; modal still works with empty selection
        }
      })();

      // Prefill assigned assessors from backend (PerformanceMatch -> list assessors)
      // We map the returned list sequentially into referee, judgeA, judgeB, judgeC, judgeD
      // Only fetch if match.assessors has no valid IDs (to avoid overwriting existing data)
      const hasExistingAssessors = assignedCount > 0;
      if (match.id && !hasExistingAssessors) {
        (async () => {
          try {
            // Use PERFORMANCE_MATCHES.ASSESSORS endpoint for performance matches
            const res = await api.get(
              API_ENDPOINTS.PERFORMANCE_MATCHES.ASSESSORS(match.id)
            );
            const data = (res as any)?.data as any;
            const list: Array<{
              assessorId?: string;
              userId?: string;
              position?: number;
            }> = (
              Array.isArray(data?.content)
                ? data.content
                : Array.isArray(data)
                ? data
                : []
            ) as any[];
            const roleByPosition = new Map(
              ASSESSOR_ROLES.map((role) => [role.position, role.key])
            );
            const assignments = list
              .map((item) => {
                const userId = (item?.userId || item?.assessorId || "")
                  .toString()
                  .trim();
                if (!userId) return null;
                const position =
                  typeof item?.position === "number" ? item.position : null;
                const roleKey =
                  position !== null && roleByPosition.has(position)
                    ? roleByPosition.get(position)
                    : undefined;
                return {
                  userId,
                  roleKey,
                  fullName:
                    (item as any)?.userFullName ||
                    (item as any)?.fullName ||
                    "",
                  email: (item as any)?.userEmail || (item as any)?.email || "",
                };
              })
              .filter(
                (
                  item
                ): item is {
                  userId: string;
                  roleKey: keyof Match["assessors"] | undefined;
                  fullName: string;
                  email: string;
                } => Boolean(item && item.userId)
              );

            if (assignments.length > 0) {
              const nextAssessors = createEmptyAssessors();
              const nextDetails = createEmptyAssessorDetails();
              assignments.forEach((assignment, idx) => {
                const fallbackKey = ASSESSOR_ROLES[idx]?.key;
                const key = assignment.roleKey ?? fallbackKey;
                if (key) {
                  nextAssessors[key] = assignment.userId;
                  nextDetails[key] = {
                    id: assignment.userId,
                    fullName: assignment.fullName,
                    email: assignment.email,
                  };
                }
              });
              const assignedCount = assignments.length;
              setSetupModal((prev) => ({
                ...prev,
                assessors: { ...prev.assessors, ...nextAssessors },
                assessorDetails: {
                  ...prev.assessorDetails,
                  ...nextDetails,
                },
                judgesCount: Math.min(
                  Math.max(assignedCount || prev.judgesCount || 1, 1),
                  5
                ),
              }));
            }
          } catch (e) {
            // ignore fetch errors; keep current state
          }
        })();
      }
    },
    [
      setOpenCategory,
      setShowCompetitionFilter,
      setShowGenderFilter,
      setShowTeamFilter,
      setSetupModal,
    ]
  );

  const openSetupModal = (matchId: string) => {
    const match = matches.find((it) => it.id === matchId);
    if (!match) return;

    if (isStandaloneMode) {
      hydrateSetupState(match);
      return;
    }

    const params = new URLSearchParams();
    if (selectedTournament) params.set("competitionId", selectedTournament);
    params.set("tab", activeTab);
    if (teamFilter) params.set("team", teamFilter);
    if (genderFilter) params.set("gender", genderFilter);
    if (subCompetitionFilter) params.set("config", subCompetitionFilter);
    if (detailCompetitionFilter) params.set("detail", detailCompetitionFilter);
    const query = params.toString();
    const target = query
      ? `/manage/performance-matches/${matchId}/manage?${query}`
      : `/manage/performance-matches/${matchId}/manage`;
    navigate(target);
  };

  const buildReturnPath = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedTournament) params.set("competitionId", selectedTournament);
    params.set("tab", activeTab);
    if (teamFilter) params.set("team", teamFilter);
    if (genderFilter) params.set("gender", genderFilter);
    if (subCompetitionFilter) params.set("config", subCompetitionFilter);
    if (detailCompetitionFilter) params.set("detail", detailCompetitionFilter);
    const query = params.toString();
    return `/manage/performance-matches${query ? `?${query}` : ""}`;
  }, [
    activeTab,
    selectedTournament,
    teamFilter,
    genderFilter,
    subCompetitionFilter,
    detailCompetitionFilter,
  ]);

  useEffect(() => {
    if (!isStandaloneMode && !setupModal.open && showAssignAssessorsModal) {
      setShowAssignAssessorsModal(false);
    }
  }, [isStandaloneMode, setupModal.open, showAssignAssessorsModal]);

  const closeSetupModal = () => {
    setSetupModal(createDefaultSetupState());
    setHasStandaloneSetupInitialized(false);
    setShowAssignAssessorsModal(false);
    if (isStandaloneMode) {
      navigate(buildReturnPath());
    }
  };

  useEffect(() => {
    if (!isStandaloneMode) return;
    if (!standaloneMatchId) return;
    if (!selectedTournament) return;
    if (hasStandaloneSetupInitialized) return;
    const targetMatch = matches.find((m) => m.id === standaloneMatchId);
    if (targetMatch) {
      hydrateSetupState(targetMatch);
      setHasStandaloneSetupInitialized(true);
    }
  }, [
    hasStandaloneSetupInitialized,
    hydrateSetupState,
    isStandaloneMode,
    matches,
    selectedTournament,
    standaloneMatchId,
  ]);

  useEffect(() => {
    if (isStandaloneMode) {
      setHasStandaloneSetupInitialized(false);
    }
  }, [isStandaloneMode, standaloneMatchId]);

  useEffect(() => {
    if (!isStandaloneMode && setupModal.open) {
      setSetupModal(createDefaultSetupState());
    }
  }, [isStandaloneMode, setupModal.open, createDefaultSetupState]);

  // Open team detail modal - logic from AthleteManagementPage
  const resolveTeamName = useCallback(
    (match: Match): string => {
      const explicitName =
        typeof match.teamName === "string" && match.teamName.trim().length > 0
          ? match.teamName.trim()
          : "";
      if (explicitName) {
        return explicitName;
      }

      const performanceId = (match.performanceId || "").trim();
      if (performanceId) {
        const cachedPerf = performanceCache[performanceId];
        if (cachedPerf) {
          const perfRecord = cachedPerf as Record<string, unknown>;
          const candidateKeys = [
            "teamName",
            "team_name",
            "performanceName",
            "performance_name",
            "name",
            "displayName",
          ];
          for (const key of candidateKeys) {
            const raw = perfRecord[key];
            if (typeof raw === "string" && raw.trim().length > 0) {
              return raw.trim();
            }
          }
          const nestedTeam = perfRecord["team"];
          const nestedTeamObj =
            nestedTeam && typeof nestedTeam === "object"
              ? (nestedTeam as Record<string, unknown>)
              : null;
          if (
            nestedTeamObj &&
            typeof nestedTeamObj["name"] === "string" &&
            (nestedTeamObj["name"] as string).trim().length > 0
          ) {
            return (nestedTeamObj["name"] as string).trim();
          }
        }

        const groupedAthletes = athletesByPerformance[performanceId];
        if (Array.isArray(groupedAthletes) && groupedAthletes.length > 0) {
          const header = groupedAthletes.find((a) => {
            const email = String(a.email || "").toLowerCase();
            if (email.endsWith("@team.local")) return true;
            const record = a as Record<string, unknown>;
            if (
              typeof record?.["teamName"] === "string" &&
              (record["teamName"] as string).trim().length > 0 &&
              (record["teamName"] as string).trim() ===
                String(a.fullName || "").trim()
            ) {
              return true;
            }
            return false;
          });
          if (
            header &&
            typeof header.fullName === "string" &&
            header.fullName.trim().length > 0
          ) {
            return header.fullName.trim();
          }
          const altFromGroup = groupedAthletes
            .map((member) => {
              const record = member as Record<string, unknown>;
              if (
                typeof record?.["teamName"] === "string" &&
                (record["teamName"] as string).trim().length > 0
              ) {
                return (record["teamName"] as string).trim();
              }
              return undefined;
            })
            .find((val) => !!val);
          if (altFromGroup) {
            return altFromGroup;
          }
        }
      }

      if (
        Array.isArray(match.participantIds) &&
        match.participantIds.length > 0
      ) {
        const selectedAthlete = athletes.find(
          (athlete) => athlete.id === match.participantIds[0]
        );
        if (
          selectedAthlete &&
          typeof selectedAthlete.name === "string" &&
          selectedAthlete.name.trim().length > 0
        ) {
          return selectedAthlete.name.trim();
        }
      }

      if (Array.isArray(match.participants) && match.participants.length > 0) {
        const first = match.participants.find(
          (name) => typeof name === "string" && name.trim().length > 0
        );
        if (first) {
          return first.trim();
        }
      }

      return "";
    },
    [athletes, athletesByPerformance, performanceCache]
  );

  const updateAssignModalAssessor = (
    role: keyof Match["assessors"],
    value: string
  ) => {
    setAssignModalAssessors((prev) => ({
      ...prev,
      [role]: value,
    }));
    setAssignModalAssessorDetails((prev) => {
      const nextDetails = { ...prev };
      if (!value) {
        nextDetails[role] = null;
      } else {
        const info = availableAssessors.find(
          (assessor) => assessor.id === value
        );
        nextDetails[role] = {
          id: value,
          fullName: info?.fullName,
          email: info?.email,
        };
      }
      return nextDetails;
    });
  };

  const handleAssignModalSave = () => {
    setSetupModal((prev) => ({
      ...prev,
      assessors: { ...assignModalAssessors },
      assessorDetails: { ...assignModalAssessorDetails },
    }));
    setShowAssignAssessorsModal(false);
  };

  const activeSetupSummary = useMemo(() => {
    if (!setupModal.open) return null;
    const activeMatch = matches.find((m) => m.id === setupModal.matchId);
    if (!activeMatch) return null;

    const pid = (activeMatch.performanceId || "").trim();
    const cachedPerf = pid ? (performanceCache as any)[pid] : undefined;
    const hasCachedTeamName = (() => {
      if (!cachedPerf) return false;
      const perfRecord = cachedPerf as Record<string, unknown>;
      const candidateKeys = [
        "teamName",
        "team_name",
        "performanceName",
        "performance_name",
        "name",
        "displayName",
      ];
      if (
        candidateKeys.some((key) => {
          const raw = perfRecord[key];
          return typeof raw === "string" && raw.trim().length > 0;
        })
      ) {
        return true;
      }
      const nestedTeam = perfRecord["team"];
      const nestedTeamObj =
        nestedTeam && typeof nestedTeam === "object"
          ? (nestedTeam as Record<string, unknown>)
          : null;
      if (
        nestedTeamObj &&
        typeof nestedTeamObj["name"] === "string" &&
        (nestedTeamObj["name"] as string).trim().length > 0
      ) {
        return true;
      }
      return false;
    })();
    const hasGroupedTeam =
      pid &&
      Array.isArray(athletesByPerformance[pid]) &&
      athletesByPerformance[pid].length > 1;
    const isTeamMatch =
      activeMatch.teamType === "TEAM" ||
      (typeof activeMatch.teamName === "string" &&
        activeMatch.teamName.trim().length > 0) ||
      hasCachedTeamName ||
      hasGroupedTeam ||
      (Array.isArray(activeMatch.participants) &&
        activeMatch.participants.length > 1);
    const teamDisplay = isTeamMatch ? resolveTeamName(activeMatch) : "";
    const contentName =
      activeMatch.type === "quyen"
        ? (() => {
            const configName =
              fistConfigs.find((c) => c.id === activeMatch.fistConfigId)
                ?.name || "";
            const itemName = activeMatch.fistItemId
              ? fistItems.find((i) => i.id === activeMatch.fistItemId)?.name ||
                ""
              : "";
            if (configName && itemName) {
              return `${configName} - ${itemName}`;
            }
            if (configName) return configName;
            if (itemName) return itemName;
            return "-";
          })()
        : musicContents.find((m) => m.id === activeMatch.musicContentId)
            ?.name || "-";
    const fallbackNames = activeMatch.participantIds
      .map((id) => athletes.find((a) => a.id === id)?.name)
      .filter((name): name is string => Boolean(name));
    const participantsDisplay = isTeamMatch
      ? teamDisplay || "Chưa chọn"
      : activeMatch.participants && activeMatch.participants.length > 0
      ? activeMatch.participants.join(", ")
      : fallbackNames.length > 0
      ? fallbackNames.join(", ")
      : "Chưa chọn";

    return {
      match: activeMatch,
      contentName,
      participantsDisplay,
      teamDisplay,
      isTeamMatch,
    };
  }, [
    athletes,
    athletesByPerformance,
    fistConfigs,
    fistItems,
    matches,
    musicContents,
    performanceCache,
    resolveTeamName,
    setupModal.matchId,
    setupModal.open,
  ]);

  const saveSetup = async () => {
    if (!setupModal.matchId || !selectedTournament) return;
    if (!setupModal.fieldId || setupModal.fieldId.trim() === "") {
      toast.warning("Vui lòng chọn sân thi đấu trước khi lưu thiết lập.", 4000);
      return;
    }

    const match = matches.find((m) => m.id === setupModal.matchId);
    if (!match) return;

    const participantIds = Array.isArray(match.participantIds)
      ? match.participantIds
      : [];
    const selectedAthletes = athletes.filter((a) =>
      participantIds.includes(a.id)
    );
    const participantNames =
      Array.isArray(match.participants) && match.participants.length > 0
        ? match.participants
        : selectedAthletes.map((a) => a.name);

    const specialization =
      activeTab === "quyen"
        ? "QUYEN"
        : activeTab === "music"
        ? "MUSIC"
        : "FIGHTING";

    let derivedPerformanceId =
      match.performanceId ||
      selectedAthletes.find((a) => a.performanceId)?.performanceId ||
      undefined;

    if (
      (specialization === "QUYEN" || specialization === "MUSIC") &&
      !derivedPerformanceId &&
      selectedAthletes.length === 1
    ) {
      try {
        const athlete = selectedAthletes[0];
        const createPayload: any = {
          competitionId: selectedTournament,
          isTeam: false,
          performanceType: "INDIVIDUAL",
          contentType: specialization,
          athleteIds: [athlete.id],
        };
        if (specialization === "QUYEN") {
          if (match.fistConfigId)
            createPayload.fistConfigId = match.fistConfigId;
          if (match.fistItemId) createPayload.fistItemId = match.fistItemId;
        } else if (specialization === "MUSIC") {
          if (match.musicContentId)
            createPayload.musicContentId = match.musicContentId;
        }

        const perfResponse = await api.post(
          API_ENDPOINTS.PERFORMANCES.CREATE,
          createPayload
        );
        derivedPerformanceId =
          (perfResponse as any)?.data?.id || (perfResponse as any)?.id;
      } catch (error) {
        console.error(
          "Failed to create Performance for individual athlete:",
          error
        );
        toast.error(
          "Không thể tạo Performance cho VĐV/đội. Vui lòng kiểm tra lại thông tin.",
          4000
        );
        return;
      }
    }

    const selectedAssessorMap = {
      ...setupModal.assessors,
    } as Record<keyof Match["assessors"], string>;
    const assignments = ASSESSOR_ROLES.map((role) => ({
      key: role.key,
      position: role.position,
      userId: (selectedAssessorMap[role.key as keyof Match["assessors"]] || "")
        .toString()
        .trim(),
    }));

    const missingAssignment = assignments.find(
      (assignment) => !assignment.userId
    );
    if (missingAssignment) {
      toast.error(
        `Vui lòng chọn đủ ${ASSESSOR_ROLES.length} vị trí trước khi lưu.`,
        4000
      );
      return;
    }

    const uniqueAssessorIds = new Set(
      assignments.map((assignment) => assignment.userId)
    );
    if (uniqueAssessorIds.size !== assignments.length) {
      toast.error("Các giám định không được trùng lặp.", 4000);
      return;
    }

    const selectedField = fields.find(
      (field) => field.id === setupModal.fieldId
    );
    if (!selectedField) {
      toast.error("Không tìm thấy thông tin sân đã chọn.", 4000);
      return;
    }

    if (
      (specialization === "QUYEN" || specialization === "MUSIC") &&
      !derivedPerformanceId
    ) {
      toast.error(
        "Không thể xác định thông tin performance để lưu thiết lập.",
        4000
      );
      return;
    }

    const matchIdString = (match.id || "").toString();

    type PerformanceMatchMeta = {
      id?: string;
      matchOrder?: number;
      status?: string;
      fieldId?: string | null;
      fieldLocation?: string | null;
      durationSeconds?: number | null;
    };

    let pmData: PerformanceMatchMeta | undefined;

    if (derivedPerformanceId) {
      const pmPayload: {
        durationSeconds: number;
        fistConfigId?: string | null;
        fistItemId?: string | null;
        musicContentId?: string | null;
        fieldId?: string | null;
        fieldLocation?: string | null;
      } = {
        durationSeconds: setupModal.defaultTimerSec,
        fieldId: setupModal.fieldId ? setupModal.fieldId : null,
        fieldLocation:
          typeof selectedField?.location === "string"
            ? selectedField.location
            : null,
      };

      if (specialization === "QUYEN") {
        pmPayload.fistConfigId = match.fistConfigId ?? null;
        pmPayload.fistItemId = match.fistItemId ?? null;
      } else if (specialization === "MUSIC") {
        pmPayload.musicContentId = match.musicContentId ?? null;
      }

      try {
        const pmRes = await api.post(
          API_ENDPOINTS.PERFORMANCE_MATCHES.SAVE_BY_PERFORMANCE(
            derivedPerformanceId
          ),
          pmPayload
        );
        const rawPmData: any = (pmRes as any)?.data;
        pmData = ((rawPmData?.data ?? rawPmData) ||
          undefined) as PerformanceMatchMeta;
      } catch (error) {
        console.error("Failed to persist performance match metadata:", error);
        toast.error(
          "Không thể lưu sân thi đấu cho trận biểu diễn. Vui lòng thử lại.",
          4000
        );
        return;
      }
    }

    const resolvedMatchId = (pmData?.id || matchIdString) as string;
    let refreshedPmData: any | undefined;
    let refreshedAssessors: Array<any> | undefined;

    try {
      const assignPayload: any = {
        specialization,
        assignments: assignments.map((assignment) => ({
          userId: assignment.userId,
          position: assignment.position + 1,
        })),
      };

      if (derivedPerformanceId) {
        assignPayload.performanceId = derivedPerformanceId;
        assignPayload.performanceMatchId = resolvedMatchId;
      } else {
        assignPayload.matchId = resolvedMatchId;
      }

      let bulkAssignSucceeded = false;

      if (
        BULK_PERFORMANCE_ASSIGNMENT_ENABLED &&
        derivedPerformanceId &&
        assignPayload.performanceMatchId
      ) {
        try {
          await api.post(
            API_ENDPOINTS.MATCH_ASSESSORS.ASSIGN_BY_PERFORMANCE,
            assignPayload
          );
          bulkAssignSucceeded = true;
        } catch (bulkError) {
          console.warn(
            "Bulk assign not available, falling back to single assignment calls",
            bulkError
          );
        }
      }

      if (!bulkAssignSucceeded) {
        let existingArr: Array<any> = [];
        if (derivedPerformanceId) {
          const listRes = await api.get<any>(
            API_ENDPOINTS.PERFORMANCE_MATCHES.ASSESSORS(resolvedMatchId)
          );
          const performancePayload: any = (listRes as any)?.data;
          existingArr = Array.isArray(performancePayload)
            ? performancePayload
            : Array.isArray(performancePayload?.data)
            ? (performancePayload?.data as Array<any>)
            : Array.isArray(performancePayload?.content)
            ? (performancePayload?.content as Array<any>)
            : [];
        } else {
          const listUrl = API_ENDPOINTS.MATCH_ASSESSORS.LIST.replace(
            "{matchId}",
            resolvedMatchId
          );
          const listRes = await api.get<any>(listUrl);
          const payloadList: any = (listRes as any)?.data;
          existingArr = Array.isArray(payloadList)
            ? payloadList
            : Array.isArray((payloadList as any)?.data)
            ? ((payloadList as any)?.data as Array<any>)
            : [];
        }
        await Promise.all(
          existingArr.map((row) => {
            const assessorRecordId = (row?.id || "").toString();
            if (!assessorRecordId) return Promise.resolve();
            return api.delete(
              API_ENDPOINTS.MATCH_ASSESSORS.BY_ID(assessorRecordId)
            );
          })
        );

        await Promise.all(
          assignments.map(async (assignment) => {
            const payload: any = {
              userId: assignment.userId,
              specialization,
              position: assignment.position + 1,
            };
            if (derivedPerformanceId) {
              payload.performanceId = derivedPerformanceId;
              payload.performanceMatchId = resolvedMatchId;
            } else {
              payload.matchId = resolvedMatchId;
              payload.role = "ASSESSOR";
            }
            await api.post(
              API_ENDPOINTS.MATCH_ASSESSORS.ASSIGN_SINGLE,
              payload
            );
          })
        );
      }
      if (derivedPerformanceId) {
        try {
          const [pmRes, assessorsRes] = await Promise.all([
            api.get(
              API_ENDPOINTS.PERFORMANCE_MATCHES.BY_PERFORMANCE(
                derivedPerformanceId
              )
            ),
            api.get(
              API_ENDPOINTS.PERFORMANCE_MATCHES.ASSESSORS(resolvedMatchId)
            ),
          ]);
          const pmPayload: any = (pmRes as any)?.data;
          const pmRecord =
            (pmPayload?.data || pmPayload?.content || pmPayload) ?? null;
          if (pmRecord && typeof pmRecord === "object") {
            refreshedPmData = pmRecord;
          }
          const assessorPayload: any = (assessorsRes as any)?.data;
          if (Array.isArray(assessorPayload)) {
            refreshedAssessors = assessorPayload;
          } else if (Array.isArray(assessorPayload?.data)) {
            refreshedAssessors = assessorPayload.data;
          } else if (Array.isArray(assessorPayload?.content)) {
            refreshedAssessors = assessorPayload.content;
          }
        } catch (reloadError) {
          console.warn(
            "Failed to refresh performance match details after assignment:",
            reloadError
          );
        }
      }
    } catch (error) {
      console.error("Failed to assign assessors:", error);
      toast.error(
        "Không thể gán giám định. Vui lòng thử lại hoặc kiểm tra kết nối.",
        4000
      );
      return;
    }

    let derivedGender: "MALE" | "FEMALE" | undefined = match.gender;
    if (!derivedGender && selectedAthletes.length > 0) {
      const g = (selectedAthletes[0].gender || "").toString().toUpperCase();
      derivedGender =
        g === "FEMALE" || g === "NỮ" || g === "NU" ? "FEMALE" : "MALE";
    }

    const matchForTeamName: Match = {
      ...match,
      participantIds,
      participants: participantNames,
    };
    const derivedTeamType =
      match.teamType ||
      (participantNames.length > 1 ? "TEAM" : ("PERSON" as "TEAM" | "PERSON"));
    const resolvedTeamName =
      derivedTeamType === "TEAM"
        ? resolveTeamName(matchForTeamName) || match.teamName || null
        : null;

    const updatedContentName =
      match.type === "quyen"
        ? (() => {
            const configName =
              fistConfigs.find((c) => c.id === match.fistConfigId)?.name || "";
            const itemName = match.fistItemId
              ? fistItems.find((i) => i.id === match.fistItemId)?.name || ""
              : "";
            if (configName && itemName) return `${configName} - ${itemName}`;
            if (configName) return configName;
            if (itemName) return itemName;
            return match.contentName || "-";
          })()
        : musicContents.find((m) => m.id === match.musicContentId)?.name ||
          match.contentName ||
          "-";

    // Always update local cache so returning to list reflects latest data immediately
    setMatches((prev) =>
      normalizeMatches(
        prev.map((m) => {
          const nextId = (refreshedPmData?.id ||
            pmData?.id ||
            match.id) as string;
          if (m.id !== match.id && m.id !== nextId) return m;

          const mapAssessorsFromApi = (arr: Array<any>) => {
            const next = createEmptyAssessors();
            const roleByPosition = new Map(
              ASSESSOR_ROLES.map((role) => [role.position, role.key])
            );
            const numericPositions = arr
              .map((candidate: any) =>
                typeof candidate?.position === "number"
                  ? candidate.position
                  : undefined
              )
              .filter((val): val is number => typeof val === "number");
            const isOneBased =
              numericPositions.length > 0 &&
              !numericPositions.some((val) => val === 0) &&
              numericPositions.some((val) => val === ASSESSOR_ROLES.length);
            arr
              .slice(0, ASSESSOR_ROLES.length)
              .forEach((a: any, idx: number) => {
                const id = (a && (a.userId || a.assessorId || a.id)) || "";
                if (!id) return;
                const rawPosition =
                  typeof a?.position === "number" ? a.position : undefined;
                const normalizedPosition =
                  rawPosition === undefined
                    ? undefined
                    : isOneBased
                    ? Math.max(rawPosition - 1, 0)
                    : rawPosition;
                const roleKey =
                  (normalizedPosition !== undefined
                    ? roleByPosition.get(normalizedPosition)
                    : undefined) || ASSESSOR_ROLES[idx]?.key;
                if (roleKey) {
                  next[roleKey] = id.toString();
                }
              });
            return next;
          };

          const apiAssessors =
            refreshedAssessors && refreshedAssessors.length > 0
              ? mapAssessorsFromApi(refreshedAssessors)
              : null;
          const nextAssessors =
            apiAssessors && Object.values(apiAssessors).some((val) => val)
              ? apiAssessors
              : {
                  ...createEmptyAssessors(),
                  ...selectedAssessorMap,
                };
          const nextAssessorDetails = ASSESSOR_ROLES.reduce((acc, role) => {
            const currentId = nextAssessors[role.key];
            if (currentId) {
              const info =
                refreshedAssessors?.find(
                  (entry) =>
                    (
                      entry?.userId ||
                      entry?.assessorId ||
                      entry?.id
                    )?.toString() === currentId
                ) || availableAssessors.find((a) => a.id === currentId);
              acc[role.key] = {
                id: currentId,
                fullName: info?.fullName || info?.userFullName || "",
                email: info?.email || info?.userEmail || "",
              };
            } else {
              acc[role.key] = null;
            }
            return acc;
          }, createEmptyAssessorDetails());
          const nextJudgesCount = Object.values(nextAssessors).filter(
            (entry) =>
              typeof entry === "string" && entry.toString().trim().length > 0
          ).length;
          const pmInfo = refreshedPmData || pmData || {};
          const nextMatchOrder =
            typeof pmInfo?.matchOrder === "number" &&
            Number.isFinite(pmInfo.matchOrder)
              ? pmInfo.matchOrder
              : m.matchOrder;
          const resolvedOrderValue =
            typeof nextMatchOrder === "number" &&
            Number.isFinite(nextMatchOrder)
              ? nextMatchOrder
              : m.order;
          const finalTimerSec =
            (typeof pmInfo?.durationSeconds === "number"
              ? pmInfo.durationSeconds
              : undefined) ??
            setupModal.defaultTimerSec ??
            m.timerSec;
          const finalFieldId =
            pmInfo?.fieldId ?? (setupModal.fieldId ? setupModal.fieldId : null);
          const finalFieldName =
            pmInfo?.fieldLocation ??
            (typeof selectedField?.location === "string"
              ? selectedField.location
              : null) ??
            m.fieldName ??
            null;
          return {
            ...m,
            id: nextId || m.id,
            contentName:
              typeof pmInfo?.contentName === "string" && pmInfo.contentName
                ? pmInfo.contentName
                : updatedContentName,
            participantIds,
            participants: participantNames,
            assessors: nextAssessors,
            assessorDetails: nextAssessorDetails,
            judgesCount:
              nextJudgesCount > 0
                ? nextJudgesCount
                : Object.values(selectedAssessorMap).filter(
                    (entry) =>
                      typeof entry === "string" &&
                      entry.toString().trim().length > 0
                  ).length || ASSESSOR_ROLES.length,
            timerSec: finalTimerSec,
            performanceId: pmInfo?.performanceId ?? derivedPerformanceId,
            matchOrder: nextMatchOrder,
            status: pmInfo?.status ?? m.status,
            fistConfigId: match.fistConfigId ?? null,
            fistItemId: match.fistItemId ?? null,
            musicContentId: match.musicContentId ?? null,
            gender: derivedGender ?? m.gender,
            teamType: derivedTeamType,
            teamName: derivedTeamType === "TEAM" ? resolvedTeamName : null,
            fieldId: finalFieldId,
            fieldName: finalFieldName,
            order:
              typeof resolvedOrderValue === "number" &&
              Number.isFinite(resolvedOrderValue)
                ? resolvedOrderValue
                : m.order,
          };
        })
      )
    );

    // If standalone mode, close modal and navigate immediately to prevent flickering
    if (isStandaloneMode) {
      setSetupModal(createDefaultSetupState());
      setHasStandaloneSetupInitialized(false);
      toast.success("Đã lưu thiết lập trận biểu diễn!", 3000);
      navigate(buildReturnPath());
      return;
    }

    // For non-standalone mode, update state then close modal
    toast.success("Đã lưu thiết lập trận biểu diễn!", 3000);
    closeSetupModal();
  };

  // assessor summary hidden on cards

  const renderSetupCard = (layout: "modal" | "page") => {
    const containerClasses =
      layout === "modal"
        ? "bg-white rounded-xl shadow-lg w-full max-w-4xl p-6 md:p-8 max-h-[90vh] overflow-y-auto"
        : "bg-white rounded-xl shadow-lg p-6 md:p-8";
    const cancelLabel = layout === "modal" ? "Hủy" : "Quay lại";

    return (
      <div className={containerClasses}>
        <div className="flex items-start justify-between mb-6">
          <div>
            {layout === "modal" && (
              <p className="text-blue-600 text-sm font-medium uppercase tracking-wide">
                Quản lý tiết mục
              </p>
            )}
            <h3 className="mt-1 text-2xl font-semibold text-gray-900">
              Thiết lập trận biểu diễn
            </h3>
            {activeSetupSummary?.match && (
              <p className="mt-1 text-sm text-gray-500">
                Thứ tự thi đấu:{" "}
                <span className="font-medium text-gray-700">
                  {activeSetupSummary.match.order || "-"}
                </span>
              </p>
            )}
          </div>
          {layout === "modal" && (
            <button
              className="text-gray-400 hover:text-gray-600 transition text-2xl leading-none"
              onClick={closeSetupModal}
              aria-label="Đóng"
            >
              ×
            </button>
          )}
        </div>

        {activeSetupSummary ? (
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Thông tin tiết mục
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {COMPETITION_TYPES[activeSetupSummary.match.type]}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    activeSetupSummary.match.status
                  )}`}
                >
                  {getStatusLabel(activeSetupSummary.match.status)}
                </span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Nội dung
                  </p>
                  <p className="mt-1 text-base font-medium text-gray-900">
                    {activeSetupSummary.contentName}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {activeSetupSummary.isTeamMatch
                      ? "Đội biểu diễn"
                      : "VĐV biểu diễn"}
                  </p>
                  <p className="mt-1 text-base font-medium text-gray-900">
                    {activeSetupSummary.participantsDisplay}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
              <h4 className="text-lg font-semibold text-gray-900">
                Cài đặt biểu diễn
              </h4>
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thời gian biểu diễn (giây)
                  </label>
                  <input
                    type="number"
                    min={30}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={setupModal.defaultTimerSec}
                    onChange={(e) =>
                      setSetupModal((prev) => ({
                        ...prev,
                        defaultTimerSec: Number(e.target.value),
                      }))
                    }
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Nhập thời gian tối đa cho tiết mục. Giá trị tối thiểu 30
                    giây.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sân thi đấu
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={setupModal.fieldId || ""}
                    onChange={(e) =>
                      setSetupModal((prev) => ({
                        ...prev,
                        fieldId: e.target.value || "",
                      }))
                    }
                  >
                    <option value="">-- Chọn sân --</option>
                    {fields.map((field) => (
                      <option key={field.id} value={field.id}>
                        {field.location}
                        {field.isUsed ? " (Đang dùng)" : ""}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    Chọn sân sẽ được sử dụng cho tiết mục này.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Giám định viên
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Vị trí 1-5: Giám định.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAssignAssessorsModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition"
                >
                  Chỉ định giám định
                </button>
              </div>
              {(() => {
                const activeRoles = ASSESSOR_ROLES.filter((role) => {
                  if (role.key === "referee") return true;
                  const judgeIndex =
                    role.key === "judgeA"
                      ? 1
                      : role.key === "judgeB"
                      ? 2
                      : role.key === "judgeC"
                      ? 3
                      : role.key === "judgeD"
                      ? 4
                      : -1;
                  if (judgeIndex === -1) return false;
                  return setupModal.judgesCount >= judgeIndex + 1;
                });

                if (activeRoles.length === 0) {
                  return (
                    <div className="text-sm text-gray-500">
                      Không có vị trí giám định khả dụng cho tiết mục này.
                    </div>
                  );
                }

                const anyAssigned = activeRoles.some((role) => {
                  const currentId = setupModal.assessors[role.key] || "";
                  return currentId.trim().length > 0;
                });

                return (
                  <div>
                    {!anyAssigned ? (
                      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M9 20H4v-2a3 3 0 015.356-1.857M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <h3 className="mt-4 text-base font-medium text-gray-900">
                          Chưa có giám định viên
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          Vui lòng chỉ định giám định viên cho trận đấu này
                        </p>
                      </div>
                    ) : null}
                    {anyAssigned && (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {activeRoles.map((role) => {
                          const currentId =
                            setupModal.assessors[role.key] || "";
                          const detail = setupModal.assessorDetails[role.key];
                          const fallbackInfo = availableAssessors.find(
                            (a) => a.id === currentId
                          );
                          const displayName =
                            detail?.fullName || fallbackInfo?.fullName || "";
                          const displayEmail =
                            detail?.email || fallbackInfo?.email || "";
                          const hasAssignment = currentId.trim().length > 0;

                          const cardClasses = hasAssignment
                            ? "border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                            : "border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50";

                          return (
                            <div key={role.key} className={cardClasses}>
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                    {role.label}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {role.subtitle}
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-gray-900">
                                    {hasAssignment ? displayName : "Chưa chọn"}
                                  </p>
                                  {hasAssignment ? (
                                    displayEmail ? (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {displayEmail}
                                      </p>
                                    ) : null
                                  ) : (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Nhấn "Chỉ định giám định" để chọn người
                                      phụ trách vị trí này.
                                    </p>
                                  )}
                                </div>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                  Vị trí {role.position + 1}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            Không thể tải thông tin tiết mục. Vui lòng đóng và mở lại cửa sổ
            thiết lập.
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            onClick={closeSetupModal}
          >
            {cancelLabel}
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={saveSetup}
            disabled={!setupModal.fieldId || setupModal.fieldId.trim() === ""}
          >
            Lưu
          </button>
        </div>
      </div>
    );
  };

  const renderAssignAssessorsModal = () => {
    if (!showAssignAssessorsModal) {
      return null;
    }

    const activeRoles = ASSESSOR_ROLES.filter((role) => {
      if (role.key === "referee") return true;
      const judgeIndex =
        role.key === "judgeA"
          ? 1
          : role.key === "judgeB"
          ? 2
          : role.key === "judgeC"
          ? 3
          : role.key === "judgeD"
          ? 4
          : -1;
      if (judgeIndex === -1) return false;
      return setupModal.judgesCount >= judgeIndex + 1;
    });

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/50">
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Chỉ định giám định viên
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Vị trí 1-5: Giám định.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAssignAssessorsModal(false)}
              className="text-gray-400 hover:text-gray-600 transition text-2xl leading-none"
              aria-label="Đóng"
            >
              ×
            </button>
          </div>

          {isAssessorsLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeRoles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600">
              Không có vị trí giám định nào cần chỉ định cho tiết mục này.
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {activeRoles.map((role) => {
                const currentId = assignModalAssessors[role.key] || "";
                const assignedIds = activeRoles
                  .map((r) => assignModalAssessors[r.key])
                  .filter(
                    (id): id is string => Boolean(id) && id !== currentId
                  );
                const availableForThisRole = availableAssessors.filter(
                  (assessor) =>
                    assessor.id === currentId ||
                    !assignedIds.includes(assessor.id)
                );
                const detail = assignModalAssessorDetails[role.key];
                const fallbackInfo = availableAssessors.find(
                  (a) => a.id === currentId
                );
                const displayName =
                  detail?.fullName || fallbackInfo?.fullName || "";
                const displayEmail = detail?.email || fallbackInfo?.email || "";
                const hasAssignment = currentId.trim().length > 0;
                const roleLabel = role.subtitle;

                return (
                  <div
                    key={role.key}
                    className={`flex items-center gap-4 p-4 border rounded-lg ${"border-gray-200"}`}
                  >
                    <div className="w-24 text-sm font-medium">
                      Vị trí {role.position + 1}
                      <br />
                      <span className="text-xs text-gray-500">{roleLabel}</span>
                    </div>

                    {hasAssignment ? (
                      <div className="flex-1 flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {displayName || role.subtitle}
                          </div>
                          {displayEmail && (
                            <div className="text-xs text-gray-500 mt-1">
                              {displayEmail}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            updateAssignModalAssessor(role.key, "")
                          }
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Xóa
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <select
                          value={currentId}
                          onChange={(e) =>
                            updateAssignModalAssessor(role.key, e.target.value)
                          }
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">-- Chọn giám định --</option>
                          {availableForThisRole.length > 0 ? (
                            availableForThisRole.map((assessor) => (
                              <option key={assessor.id} value={assessor.id}>
                                {assessor.fullName}
                              </option>
                            ))
                          ) : (
                            <option disabled>
                              {availableAssessors.length === 0
                                ? "Không có giám định khả dụng"
                                : "Tất cả giám định đã được chọn"}
                            </option>
                          )}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setShowAssignAssessorsModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleAssignModalSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Lưu
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isStandaloneMode) {
    const backPath = buildReturnPath();

    if (!standaloneMatchId) {
      return (
        <div className="p-6 max-w-3xl mx-auto">
          <button
            onClick={() => navigate(backPath)}
            className="mb-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Quay lại danh sách tiết mục
          </button>
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
            Không tìm thấy thông tin tiết mục. Vui lòng quay lại danh sách và
            chọn lại.
          </div>
        </div>
      );
    }

    if (!selectedTournament) {
      return (
        <div className="p-6 max-w-3xl mx-auto">
          <button
            onClick={() => navigate(backPath)}
            className="mb-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Quay lại danh sách tiết mục
          </button>
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
            Cần thông tin giải đấu để tải tiết mục. Vui lòng truy cập từ trang
            danh sách.
          </div>
        </div>
      );
    }

    if (!setupModal.matchId || !activeSetupSummary) {
      return (
        <div className="p-6 max-w-7xl mx-auto">
          <button
            onClick={() => navigate(backPath)}
            className="mb-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Quay lại danh sách tiết mục
          </button>
          <div className="mt-10 flex justify-center">
            <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      );
    }

    const currentMatch = matches.find((m) => m.id === standaloneMatchId);

    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <button
              onClick={() => navigate(backPath)}
              className="mb-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ← Quay lại danh sách tiết mục
            </button>
          </div>

          {currentMatch && (
            <div className="flex flex-col items-start gap-2 md:items-end">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  currentMatch.status
                )}`}
              >
                {getStatusLabel(currentMatch.status)}
              </span>
            </div>
          )}
        </div>

        {renderSetupCard("page")}
        {renderAssignAssessorsModal()}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Sắp xếp nội dung & gán trọng tài
        </h1>
        <p className="text-sm text-gray-600">
          Tạo và quản lý các trận đấu biểu diễn (Quyền/Võ nhạc)
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chọn giải đấu
            </label>
            <select
              value={selectedTournament}
              onChange={(event) => {
                setIsTournamentLoading(true);
                // Reset filters when tournament changes
                setSubCompetitionFilter("");
                setDetailCompetitionFilter("");
                setGenderFilter("MALE");
                setTeamFilter("PERSON");
                setOpenCategory("");
                setShowCompetitionFilter(false);
                setShowGenderFilter(false);
                setShowTeamFilter(false);
                setSelectedTournament(event.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {tournaments.length === 0 && (
                <option value="">-- Chưa có giải --</option>
              )}
              {tournaments.map((tournament) => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại nội dung
            </label>
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {Object.entries(COMPETITION_TYPES).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => onTabChange(key as CompetitionType)}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
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
      </div>

      {/* Filters outside card - for Quyền */}
      {activeTab === "quyen" && (
        <div className="mb-4 relative">
          {isTournamentLoading && (
            <div className="absolute inset-0 bg-white/60 rounded flex items-center justify-center z-10">
              <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div className="flex items-center flex-wrap gap-2">
            {/* Hình thức filter for Quyền - placed first */}
            <div className="relative filter-dropdown">
              <button
                type="button"
                onClick={() => setShowTeamFilter(!showTeamFilter)}
                className={`px-3 py-1.5 text-xs font-medium rounded border ${
                  teamFilter === "PERSON"
                    ? "border-blue-500 text-gray-700 bg-white"
                    : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                }`}
              >
                Hình thức
              </button>
              {showTeamFilter && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-300 rounded shadow-lg z-20">
                  <div className="p-2 space-y-1">
                    {[
                      { label: "Cá nhân", value: "PERSON" },
                      { label: "Đồng đội", value: "TEAM" },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="teamFilter"
                          className="mr-2 h-3 w-3 text-blue-600"
                          checked={teamFilter === opt.value}
                          onChange={() =>
                            setTeamFilter(opt.value as "PERSON" | "TEAM")
                          }
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

            {/* Giới tính filter button - placed after Hình thức */}
            <div className="relative filter-dropdown">
              <button
                type="button"
                onClick={() => setShowGenderFilter(!showGenderFilter)}
                className={`px-3 py-1.5 text-xs font-medium rounded border ${
                  genderFilter
                    ? "border-blue-500 text-gray-700 bg-white"
                    : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                }`}
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

            {/* Fist configs buttons (Song luyện, Đồng luyện, etc.) */}
            {fistConfigs
              .filter((config) => {
                const allowById =
                  effectiveAllowedFistConfigIds.size === 0 ||
                  effectiveAllowedFistConfigIds.has(config.id);
                const allowByName =
                  typeof allowedFistConfigNames !== "undefined" &&
                  (allowedFistConfigNames as any).size > 0
                    ? (allowedFistConfigNames as any).has(config.name)
                    : true;
                // If any allowed set is provided, enforce it; else allow all
                const hasAnyConstraint =
                  effectiveAllowedFistConfigIds.size > 0 ||
                  ((allowedFistConfigNames as any)?.size || 0) > 0;
                return hasAnyConstraint ? allowById && allowByName : true;
              })
              .map((config) => (
                <div key={config.id} className="relative filter-dropdown">
                  <button
                    type="button"
                    onClick={() => {
                      if (subCompetitionFilter === config.id) {
                        setSubCompetitionFilter("");
                        setDetailCompetitionFilter("");
                        setOpenCategory("");
                      } else {
                        setSubCompetitionFilter(config.id);
                        setDetailCompetitionFilter("");
                        setOpenCategory((prev) =>
                          prev === config.name ? "" : config.name
                        );
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded border ${
                      subCompetitionFilter === config.id
                        ? "border-blue-500 text-gray-700 bg-white"
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
                          <span className="text-sm text-gray-700">Tất cả</span>
                        </label>
                        {fistItems
                          .filter((item) => {
                            const sameCfg = item.configId === config.id;
                            const allowItem =
                              allowedFistItemIds.size === 0 ||
                              allowedFistItemIds.has(item.id);
                            return sameCfg && allowItem;
                          })
                          .map((item) => (
                            <label
                              key={item.id}
                              className="flex items-center cursor-pointer"
                            >
                              <input
                                type="radio"
                                name={`detailCompetitionFilter-${config.name}`}
                                className="mr-2 h-3 w-3 text-blue-600"
                                checked={detailCompetitionFilter === item.id}
                                onChange={() =>
                                  setDetailCompetitionFilter(item.id)
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
        </div>
      )}

      {renderAssignAssessorsModal()}

      {/* Filters outside card - for Music */}
      {activeTab === "music" && (
        <div className="mb-4 relative">
          {isTournamentLoading && (
            <div className="absolute inset-0 bg-white/60 rounded flex items-center justify-center z-10">
              <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div className="flex items-center flex-wrap gap-2">
            {/* Hình thức filter for Music - placed first */}
            <div className="relative filter-dropdown">
              <button
                onClick={() => setShowTeamFilter(!showTeamFilter)}
                className={`px-3 py-1.5 text-xs font-medium rounded border ${
                  teamFilter === "PERSON"
                    ? "border-blue-500 text-gray-700 bg-white"
                    : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                }`}
              >
                Hình thức
              </button>
              {showTeamFilter && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-300 rounded shadow-lg z-20">
                  <div className="p-2 space-y-1">
                    {[
                      { label: "Cá nhân", value: "PERSON" },
                      { label: "Đồng đội", value: "TEAM" },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="teamFilter"
                          className="mr-2 h-3 w-3 text-blue-600"
                          checked={teamFilter === opt.value}
                          onChange={() =>
                            setTeamFilter(opt.value as "PERSON" | "TEAM")
                          }
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

            {/* Giới tính filter - placed after Hình thức */}
            <div className="relative filter-dropdown">
              <button
                type="button"
                onClick={() => setShowGenderFilter(!showGenderFilter)}
                className={`px-3 py-1.5 text-xs font-medium rounded border ${
                  genderFilter
                    ? "border-blue-500 text-gray-700 bg-white"
                    : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                }`}
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

            {/* Music content filter */}
            <div className="relative filter-dropdown">
              <button
                onClick={() => setShowCompetitionFilter(!showCompetitionFilter)}
                className={`px-3 py-1.5 text-xs font-medium rounded border ${
                  subCompetitionFilter
                    ? "border-blue-500 text-gray-700 bg-white"
                    : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                }`}
              >
                Tiết mục
              </button>
              {showCompetitionFilter && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-300 rounded shadow-lg z-20">
                  <div className="p-2 space-y-1">
                    {musicContents
                      .filter((content) => {
                        const allowById =
                          allowedMusicContentIds.size === 0 ||
                          allowedMusicContentIds.has(content.id);
                        const allowByName =
                          typeof allowedMusicContentNames !== "undefined" &&
                          (allowedMusicContentNames as any).size > 0
                            ? (allowedMusicContentNames as any).has(
                                content.name
                              )
                            : true;
                        const hasAnyConstraint =
                          allowedMusicContentIds.size > 0 ||
                          ((allowedMusicContentNames as any)?.size || 0) > 0;
                        return hasAnyConstraint
                          ? allowById && allowByName
                          : true;
                      })
                      .map((content) => (
                        <label
                          key={content.id}
                          className="flex items-center cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="subCompetitionFilter"
                            className="mr-2 h-3 w-3 text-blue-600"
                            checked={subCompetitionFilter === content.id}
                            onChange={() => setSubCompetitionFilter(content.id)}
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
          </div>
        </div>
      )}

      {!isStandaloneMode && setupModal.open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          {renderSetupCard("modal")}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMatches.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 col-span-full">
            {!subCompetitionFilter ||
            (activeTab === "quyen" && !detailCompetitionFilter) ? (
              <div>
                <p className="mb-2">
                  Vui lòng chọn nội dung để xem và thêm trận mới
                </p>
                <p className="text-xs text-gray-400">
                  {activeTab === "quyen"
                    ? "Cần chọn: Hình thức + Nội dung + Chi tiết nội dung"
                    : "Cần chọn: Hình thức + Tiết mục"}
                </p>
              </div>
            ) : matchesForActiveType.length === 0 ? (
              "Chưa có trận nào."
            ) : (
              "Không tìm thấy trận nào phù hợp với bộ lọc đã chọn."
            )}
          </div>
        ) : (
          (() => {
            const contentOrderMap = new Map<string, number>();
            return filteredMatches.map((match, index) => {
              const groupingKey = getContentGroupingKey(match);
              const displayOrder =
                groupingKey.length > 0
                  ? (() => {
                      const current = contentOrderMap.get(groupingKey) ?? 0;
                      const next = current + 1;
                      contentOrderMap.set(groupingKey, next);
                      return next;
                    })()
                  : resolveMatchDisplayOrder(match, index);
              const pid = (match.performanceId || "").trim();
              const cachedPerf = pid
                ? (performanceCache as any)[pid]
                : undefined;
              const hasCachedTeamName = (() => {
                if (!cachedPerf) return false;
                const perfRecord = cachedPerf as Record<string, unknown>;
                const candidateKeys = [
                  "teamName",
                  "team_name",
                  "performanceName",
                  "performance_name",
                  "name",
                  "displayName",
                ];
                if (
                  candidateKeys.some((key) => {
                    const raw = perfRecord[key];
                    return typeof raw === "string" && raw.trim().length > 0;
                  })
                ) {
                  return true;
                }
                const nestedTeam = perfRecord["team"];
                const nestedTeamObj =
                  nestedTeam && typeof nestedTeam === "object"
                    ? (nestedTeam as Record<string, unknown>)
                    : null;
                if (
                  nestedTeamObj &&
                  typeof nestedTeamObj["name"] === "string" &&
                  (nestedTeamObj["name"] as string).trim().length > 0
                ) {
                  return true;
                }
                return false;
              })();
              const hasGroupedTeam =
                pid &&
                Array.isArray(athletesByPerformance[pid]) &&
                athletesByPerformance[pid].length > 1;
              const isTeamMatch =
                match.teamType === "TEAM" ||
                (typeof match.teamName === "string" &&
                  match.teamName.trim().length > 0) ||
                hasCachedTeamName ||
                hasGroupedTeam ||
                (Array.isArray(match.participants) &&
                  match.participants.length > 1);
              const teamNameDisplay = isTeamMatch ? resolveTeamName(match) : "";
              const contentName =
                match.type === "quyen"
                  ? (() => {
                      const configName =
                        fistConfigs.find((c) => c.id === match.fistConfigId)
                          ?.name || "";
                      const itemName = match.fistItemId
                        ? fistItems.find((i) => i.id === match.fistItemId)
                            ?.name || ""
                        : "";
                      if (configName && itemName) {
                        return `${configName} - ${itemName}`;
                      } else if (configName) {
                        return configName;
                      } else if (itemName) {
                        return itemName;
                      }
                      return "-";
                    })()
                  : musicContents.find((m) => m.id === match.musicContentId)
                      ?.name || "-";

              const participantDisplay = isTeamMatch
                ? teamNameDisplay || "Chưa chọn"
                : Array.isArray(match.participants) &&
                  match.participants.length > 0
                ? match.participants.join(", ")
                : "Chưa chọn";

              return (
                <div
                  key={match.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          Trận {displayOrder}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {COMPETITION_TYPES[match.type]}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          match.status
                        )}`}
                      >
                        {getStatusLabel(match.status)}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">
                          Nội dung:
                        </span>
                        <span className="ml-1 text-gray-900">
                          {contentName}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">
                          {isTeamMatch ? "Đội biểu diễn:" : "VĐV biểu diễn:"}
                        </span>
                        <span className="ml-1 text-gray-900">
                          {participantDisplay}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>Thứ tự: {displayOrder}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openSetupModal(match.id);
                          }}
                          className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                        >
                          Thiết lập
                        </button>
                        {match.status === "IN_PROGRESS" ? (
                          <button
                            disabled
                            className="flex-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-xs font-medium cursor-not-allowed"
                          >
                            Đang diễn ra
                          </button>
                        ) : match.status === "COMPLETED" ? (
                          <button
                            disabled
                            className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded text-xs font-medium cursor-not-allowed"
                          >
                            Đã kết thúc
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              beginMatch(match.id);
                            }}
                            className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                          >
                            Chấm điểm
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMatch(match.id);
                          }}
                          className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                          title="Xóa trận"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            });
          })()
        )}
      </div>

      {/* start modal removed */}
    </div>
  );
}
