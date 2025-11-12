import { useEffect, useMemo, useState, Fragment, useRef } from "react";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import type { PaginationResponse } from "../../types/api";
import type { CompetitionType } from "./ArrangeOrderWrapper";
import { fistContentService } from "../../services/fistContent";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
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
};

const COMPETITION_TYPES: Record<CompetitionType, string> = {
  quyen: "Quyền",
  music: "Võ nhạc",
};

const ASSESSOR_ROLES: Array<{
  key: keyof Match["assessors"];
  label: string;
  subtitle?: string;
}> = [
  { key: "referee", label: "Giám định 1", subtitle: "(Trưởng ban)" },
  { key: "judgeA", label: "Giám định 2" },
  { key: "judgeB", label: "Giám định 3" },
  { key: "judgeC", label: "Giám định 4" },
  { key: "judgeD", label: "Giám định 5" },
];

interface ArrangeOrderPageProps {
  activeTab: CompetitionType;
  onTabChange: (tab: CompetitionType) => void;
}

export default function ArrangeOrderPage({
  activeTab,
  onTabChange,
}: ArrangeOrderPageProps) {
  const toast = useToast();
  const [tournaments, setTournaments] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [athletes, setAthletes] = useState<AthleteRow[]>([]);
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

  // Track concurrent loads for a simple loading indicator when changing tournament
  const [pendingLoads, setPendingLoads] = useState<number>(0);
  const [isTournamentLoading, setIsTournamentLoading] =
    useState<boolean>(false);

  const matchesForActiveType = useMemo(
    () => matches.filter((match) => match.type === activeTab),
    [matches, activeTab]
  );

  // Available assessors from API
  const [availableAssessors, setAvailableAssessors] = useState<
    Array<{ id: string; fullName: string; email: string }>
  >([]);

  // Load available assessors
  useEffect(() => {
    const loadAssessors = async () => {
      try {
        const res = await api.get<
          Array<{
            id: string;
            fullName: string;
            personalMail: string;
            eduMail?: string;
            systemRole?: string;
          }>
        >(API_ENDPOINTS.ASSESSORS.AVAILABLE);

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
      }
    };
    loadAssessors();
  }, []);

  // Auto-create 4 empty matches for the active type if none exist (Jira-like preset cards)
  useEffect(() => {
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
        assessors: {},
      }));
      setMatches((prev) => [
        ...prev.filter((m) => m.type !== activeTab),
        ...defaults,
      ]);
    }
  }, [activeTab, matches]);

  // Start modal removed; settings handled in setupModal per match

  const [teamSearch, setTeamSearch] = useState<string>("");
  const [setupModal, setSetupModal] = useState<{
    open: boolean;
    step: number; // 1: Chọn VĐV, 2: Gán Trọng Tài & Cấu Hình
    matchId?: string;
    selectedIds: string[];
    assessors: Record<string, string>;
    judgesCount: number;
    defaultTimerSec: number;
    performanceId?: string;
  }>({
    open: false,
    step: 1,
    selectedIds: [],
    assessors: {},
    judgesCount: 5,
    defaultTimerSec: 120,
  });

  // Filter states for quyen and music
  const [subCompetitionFilter, setSubCompetitionFilter] = useState<string>("");
  const [detailCompetitionFilter, setDetailCompetitionFilter] =
    useState<string>("");
  const [openCategory, setOpenCategory] = useState<string>("");
  const [showCompetitionFilter, setShowCompetitionFilter] = useState(false);

  // Filter states for team and gender
  const [teamFilter, setTeamFilter] = useState<"PERSON" | "TEAM" | "">(
    "PERSON"
  );
  const [genderFilter, setGenderFilter] = useState<string>("MALE"); // default MALE
  const [showGenderFilter, setShowGenderFilter] = useState(false);
  const [showTeamFilter, setShowTeamFilter] = useState(false);
  // Realtime status subscriber
  const stompRef = useRef<Client | null>(null);
  const bulkSelectAllRef = useRef<HTMLInputElement | null>(null);
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
                prev.map((it) =>
                  it.performanceId === payload.performanceId
                    ? { ...it, status: payload.status }
                    : it
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

  // Debounced search for API calls
  const [debouncedName, setDebouncedName] = useState<string>("");

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

  // Performance cache for team details
  const [performanceCache, setPerformanceCache] = useState<
    Record<string, Record<string, unknown>>
  >({});

  // Group current fetched athletes by performanceId to reconstruct team members
  const [athletesByPerformance, setAthletesByPerformance] = useState<
    Record<string, AthleteApi[]>
  >({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(teamSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [teamSearch]);

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
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(
    new Set()
  );
  const [addingMatches, setAddingMatches] = useState(false);

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

  // Maps and sets to prevent selecting the same athlete/team in multiple matches
  const athleteIdToPerformanceId = useMemo(() => {
    const map: Record<string, string> = {};
    athletes.forEach((a) => {
      map[a.id] = a.performanceId || "";
    });
    return map;
  }, [athletes]);

  const athleteById = useMemo(() => {
    const map = new Map<string, AthleteRow>();
    athletes.forEach((a) => map.set(a.id, a));
    return map;
  }, [athletes]);

  const usedAthleteIds = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => {
      if (m.id !== setupModal.matchId) {
        m.participantIds.forEach((id) => set.add(id));
      }
    });
    return set;
  }, [matches, setupModal.matchId]);

  const usedPerformanceIds = useMemo(() => {
    const set = new Set<string>();
    usedAthleteIds.forEach((id) => {
      const pid = athleteIdToPerformanceId[id];
      if (pid) set.add(pid);
    });
    return set;
  }, [usedAthleteIds, athleteIdToPerformanceId]);

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

  const filteredAthletes = useMemo(() => {
    let filtered = athletes;

    // Helper functions from AthleteManagementPage
    const strip = (s: string) =>
      (s || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    const isTeamEntry = (a: AthleteApi): boolean => {
      if (a.competitionType === "quyen") {
        // 1) Prefer participantsPerEntry from item
        const itemId = a.fistItemId;
        if (itemId) {
          const fi = fistItems.find((x) => x.id === itemId);
          if (fi && typeof fi?.participantsPerEntry === "number") {
            return (fi.participantsPerEntry as number) > 1;
          }
          // Derive by item name keywords when participants not available
          if (fi?.name) {
            const n = strip(fi.name).replace(/\s+/g, " ");
            if (n.includes("song luyen") || n.includes("da luyen")) return true;
            if (n.includes("don luyen")) return false;
          }
        }
        // 2) Derive category name robustly
        let catName = a.subCompetitionType || "";
        const cfgId = a.fistConfigId;
        if (
          (!catName || catName === "-" || catName.toLowerCase() === "quyền") &&
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
        const mid = a.musicContentId;
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

    const isTeamHeader = (athlete: AthleteRow): boolean => {
      const email = String(athlete.email || "").toLowerCase();
      if (email.endsWith("@team.local")) return true;

      // Check performance cache for teamName
      if (athlete.performanceId) {
        const pid = String(athlete.performanceId).trim();
        const perf = performanceCache[pid];
        if (perf) {
          const perfTeamName = (perf["teamName"] as string) || "";
          const fullName = (athlete.name || "").trim();
          if (perfTeamName && perfTeamName.trim().length > 0) {
            return perfTeamName.trim() === fullName;
          }
        }
      }

      // Fallback: for team entries, assume first entry per performanceId is header
      return false;
    };

    // Resolve selected names from IDs for fallback comparisons
    const selectedCfgName = subCompetitionFilter
      ? fistConfigs.find((c) => c.id === subCompetitionFilter)?.name || ""
      : "";
    const selectedItemName = detailCompetitionFilter
      ? fistItems.find((i) => i.id === detailCompetitionFilter)?.name || ""
      : "";

    // Filter by subCompetitionFilter and detailCompetitionFilter
    if (subCompetitionFilter || detailCompetitionFilter) {
      filtered = filtered.filter((athlete) => {
        // For Quyền: check both subCompetitionFilter (category) and detailCompetitionFilter (item)
        if (activeTab === "quyen") {
          // Check category (subCompetitionFilter)
          if (subCompetitionFilter) {
            if (athlete.fistConfigId) {
              const cfg = fistConfigs.find(
                (c) => c.id === athlete.fistConfigId
              );
              if (!cfg || cfg.id !== subCompetitionFilter) {
                return false;
              }
            } else {
              // Fallback: check subCompetitionType (compare with resolved name)
              if (athlete.subCompetitionType !== selectedCfgName) {
                return false;
              }
            }
          }
          // Check detail (detailCompetitionFilter)
          if (detailCompetitionFilter) {
            if (athlete.fistItemId) {
              const item = fistItems.find((i) => i.id === athlete.fistItemId);
              if (!item || item.id !== detailCompetitionFilter) {
                return false;
              }
            } else {
              // Fallback: check detailSubCompetitionType or detailSubLabel
              const detailMatch =
                athlete.detailSubCompetitionType === selectedItemName ||
                athlete.detailSubLabel === selectedItemName;
              if (!detailMatch) {
                return false;
              }
            }
          }
        } else if (activeTab === "music") {
          // For Music: check subCompetitionFilter (musicContent)
          if (subCompetitionFilter) {
            if (athlete.musicContentId) {
              const mc = musicContents.find(
                (m) => m.id === athlete.musicContentId
              );
              if (!mc || mc.id !== subCompetitionFilter) {
                return false;
              }
            } else {
              // Fallback by name
              const mcName =
                musicContents.find((m) => m.id === subCompetitionFilter)
                  ?.name || "";
              if (!mcName || athlete.subCompetitionType !== mcName) {
                return false;
              }
            }
          }
        }
        return true;
      });
    }

    // Team filter (only for quyen and music) - client-side filter
    filtered = filtered.filter((athlete) => {
      // Map AthleteRow to AthleteApi for isTeamEntry check
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
      const team = isTeamEntry(apiAthlete);
      if (teamFilter === "TEAM") {
        return team && isTeamHeader(athlete);
      } else if (teamFilter === "PERSON") {
        return !team;
      }
      // teamFilter always has a value (default "PERSON")
      return !team;
    });

    // Deduplicate teams by performanceId when teamFilter is TEAM
    // Keep only the first entry per performanceId (which should be the team header)
    if (teamFilter === "TEAM") {
      const seenPerformanceIds = new Set<string>();
      filtered = filtered.filter((athlete) => {
        if (!athlete.performanceId) return true;
        const pid = String(athlete.performanceId).trim();
        if (!pid) return true;
        if (seenPerformanceIds.has(pid)) {
          return false; // Skip duplicate - only keep first entry per team
        }
        seenPerformanceIds.add(pid);
        return true;
      });
    }

    // Remove athletes/teams that have already been added to matches
    filtered = filtered.filter((athlete) => {
      if (teamFilter === "TEAM") {
        return !(
          athlete.performanceId && usedPerformanceIds.has(athlete.performanceId)
        );
      }
      return !usedAthleteIds.has(athlete.id);
    });

    return filtered;
  }, [
    athletes,
    activeTab,
    teamFilter,
    subCompetitionFilter,
    detailCompetitionFilter,
    fistConfigs,
    fistItems,
    musicContents,
    performanceCache,
    usedAthleteIds,
    usedPerformanceIds,
  ]);

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

    return matchesForActiveType.filter((match) => {
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

  const selectableBulkIds = useMemo(() => {
    return filteredAthletes
      .filter((athlete) => {
        if (teamFilter === "TEAM") {
          return !(
            athlete.performanceId &&
            usedPerformanceIds.has(athlete.performanceId)
          );
        }
        return !usedAthleteIds.has(athlete.id);
      })
      .map((athlete) => athlete.id);
  }, [filteredAthletes, teamFilter, usedAthleteIds, usedPerformanceIds]);

  useEffect(() => {
    if (bulkSelectAllRef.current) {
      bulkSelectAllRef.current.indeterminate =
        bulkSelectedIds.size > 0 &&
        bulkSelectedIds.size < selectableBulkIds.length;
    }
  }, [bulkSelectedIds, selectableBulkIds]);

  useEffect(() => {
    setBulkSelectedIds((prev) => {
      const validIds = new Set(selectableBulkIds);
      let changed = false;
      const next = new Set<string>();
      prev.forEach((id) => {
        if (validIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [selectableBulkIds]);

  const resolveContentName = (athlete: AthleteRow): string => {
    if (activeTab === "quyen") {
      const configName = athlete.fistConfigId
        ? fistConfigs.find((c) => c.id === athlete.fistConfigId)?.name || ""
        : "";
      const itemName = athlete.fistItemId
        ? fistItems.find((i) => i.id === athlete.fistItemId)?.name || ""
        : "";
      if (configName && itemName) return `${configName} - ${itemName}`;
      return configName || itemName || "-";
    }
    if (activeTab === "music") {
      if (athlete.musicContentId) {
        return (
          musicContents.find((m) => m.id === athlete.musicContentId)?.name ||
          "-"
        );
      }
      return "-";
    }
    return "-";
  };

  const handleToggleBulkSelect = (athlete: AthleteRow) => {
    setBulkSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(athlete.id)) {
        next.delete(athlete.id);
      } else {
        next.add(athlete.id);
      }
      return next;
    });
  };

  const handleSelectAllBulk = () => {
    if (selectableBulkIds.length === 0) {
      setBulkSelectedIds(new Set());
      return;
    }
    const allSelected = selectableBulkIds.every((id) =>
      bulkSelectedIds.has(id)
    );
    if (allSelected) {
      setBulkSelectedIds(new Set());
    } else {
      setBulkSelectedIds(new Set(selectableBulkIds));
    }
  };

  const addBulkToPerformanceMatches = async () => {
    if (!selectedTournament) {
      toast.error("Vui lòng chọn giải đấu trước");
      return;
    }
    if (bulkSelectedIds.size === 0) {
      toast.error("Chưa chọn VĐV/đội nào");
      return;
    }
    if (!subCompetitionFilter) {
      toast.error("Vui lòng chọn nội dung trước khi thêm vào danh sách");
      return;
    }
    if (activeTab === "quyen" && !detailCompetitionFilter) {
      toast.error(
        "Vui lòng chọn chi tiết nội dung trước khi thêm vào danh sách"
      );
      return;
    }

    const specialization =
      activeTab === "quyen"
        ? "QUYEN"
        : activeTab === "music"
        ? "MUSIC"
        : "FIGHTING";
    const selectedAthletes = Array.from(bulkSelectedIds)
      .map((id) => athleteById.get(id))
      .filter((a): a is AthleteRow => Boolean(a));

    if (selectedAthletes.length === 0) {
      toast.error("Không tìm thấy dữ liệu VĐV/đội đã chọn");
      return;
    }

    setAddingMatches(true);
    const createdMatches: Match[] = [];
    let successCount = 0;

    try {
      for (const athlete of selectedAthletes) {
        const isTeamSelection = teamFilter === "TEAM";
        let performanceId = athlete.performanceId || undefined;

        if (!performanceId) {
          if (isTeamSelection) {
            console.warn("Thiếu performanceId cho đội, bỏ qua:", athlete);
            continue;
          }
          const createPerformanceRequest: Record<string, unknown> = {
            competitionId: selectedTournament,
            isTeam: false,
            performanceType: "INDIVIDUAL",
            contentType: specialization,
            athleteIds: [athlete.id],
          };
          if (specialization === "QUYEN") {
            if (athlete.fistConfigId || subCompetitionFilter) {
              createPerformanceRequest.fistConfigId =
                athlete.fistConfigId || subCompetitionFilter;
            }
            if (athlete.fistItemId || detailCompetitionFilter) {
              createPerformanceRequest.fistItemId =
                athlete.fistItemId || detailCompetitionFilter;
            }
          } else if (specialization === "MUSIC") {
            if (athlete.musicContentId || subCompetitionFilter) {
              createPerformanceRequest.musicContentId =
                athlete.musicContentId || subCompetitionFilter;
            }
          }

          try {
            const perfRes = await api.post(
              API_ENDPOINTS.PERFORMANCES.CREATE,
              createPerformanceRequest
            );
            performanceId =
              (perfRes as any)?.data?.id ||
              (perfRes as any)?.id ||
              (perfRes as any)?.data?.data?.id;
          } catch (error) {
            console.error("Failed to create performance:", error);
            continue;
          }
        }

        if (!performanceId) {
          console.warn("Không xác định được performanceId, bỏ qua:", athlete);
          continue;
        }

        const pmBody: {
          durationSeconds: number;
          fistConfigId?: string | null;
          fistItemId?: string | null;
          musicContentId?: string | null;
        } = { durationSeconds: 120 };

        if (specialization === "QUYEN") {
          pmBody.fistConfigId =
            (athlete.fistConfigId || subCompetitionFilter) ?? null;
          pmBody.fistItemId =
            (athlete.fistItemId || detailCompetitionFilter) ?? null;
        } else if (specialization === "MUSIC") {
          pmBody.musicContentId =
            (athlete.musicContentId || subCompetitionFilter) ?? null;
        }

        try {
          await api.post(
            API_ENDPOINTS.PERFORMANCE_MATCHES.SAVE_BY_PERFORMANCE(
              performanceId
            ),
            pmBody
          );
          successCount += 1;

          const participants =
            isTeamSelection && performanceId
              ? (athletesByPerformance[performanceId] || []).map(
                  (member) => member.fullName || member.id
                )
              : [athlete.name];

          createdMatches.push({
            id: `bulk-${performanceId}-${Date.now()}-${successCount}`,
            order:
              matchesForActiveType.filter((m) => m.type === activeTab).length +
              createdMatches.length +
              1,
            type: activeTab,
            contentName: resolveContentName(athlete),
            participantIds: [athlete.id],
            participants,
            assessors: {},
            performanceId,
            matchOrder: undefined,
            status: "PENDING",
            fistConfigId: athlete.fistConfigId,
            fistItemId: athlete.fistItemId,
            musicContentId: athlete.musicContentId,
            gender: athlete.gender === "Nữ" ? "FEMALE" : "MALE",
            teamType: isTeamSelection ? "TEAM" : "PERSON",
          });
        } catch (error) {
          console.error("Failed to create PerformanceMatch:", error);
        }
      }

      if (createdMatches.length > 0) {
        setMatches((prev) => [...prev, ...createdMatches]);
      }

      if (successCount > 0) {
        toast.success(`Đã thêm ${successCount} trận đấu mới`);
        setBulkSelectedIds(new Set());
      } else {
        toast.error("Chưa thêm được trận nào. Vui lòng kiểm tra lại.");
      }
    } finally {
      setAddingMatches(false);
    }
  };

  // Reset filters when changing tab
  useEffect(() => {
    setSubCompetitionFilter("");
    setDetailCompetitionFilter("");
    setOpenCategory("");
    setShowCompetitionFilter(false);
    setGenderFilter("MALE");
    setTeamFilter("PERSON");
    setShowGenderFilter(false);
    setShowTeamFilter(false);
  }, [activeTab]);

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
        const list = (res.data || []) as Array<any>;
        // Map to Match[] only for current tab (quyen/music)
        const mapped: Match[] = list
          .filter((pm: any) => {
            const ct = String(pm.contentType || "").toUpperCase();
            return (
              (activeTab === "quyen" && ct === "QUYEN") ||
              (activeTab === "music" && ct === "MUSIC")
            );
          })
          .map((pm: any) => {
            const participants = Array.isArray(pm.selectedAthletes)
              ? pm.selectedAthletes.map((a: any) => String(a.fullName || ""))
              : [];
            const participantIds = Array.isArray(pm.selectedAthletes)
              ? pm.selectedAthletes
                  .map((a: any) => (a.id ? String(a.id) : ""))
                  .filter((x: string) => !!x)
              : [];
            // Derive gender from persisted selected athletes if available
            let matchGender: "MALE" | "FEMALE" | undefined = undefined;
            if (
              Array.isArray(pm.selectedAthletes) &&
              pm.selectedAthletes.length > 0
            ) {
              const g = String(
                pm.selectedAthletes[0]?.gender || ""
              ).toUpperCase();
              matchGender =
                g === "FEMALE" || g === "NỮ" || g === "NU" ? "FEMALE" : "MALE";
            }
            return {
              id: pm.id,
              order: Number(pm.matchOrder || 0) || 0,
              type: activeTab,
              contentName:
                activeTab === "quyen" ? "Nội dung Quyền" : "Nội dung Võ nhạc",
              participantIds,
              participants,
              assessors: {},
              judgesCount: undefined,
              timerSec: pm.durationSeconds ?? undefined,
              performanceId: pm.performanceId,
              matchOrder: pm.matchOrder,
              status: pm.status,
              fistConfigId: pm.fistConfigId ?? null,
              fistItemId: pm.fistItemId ?? null,
              musicContentId: pm.musicContentId ?? null,
              gender: matchGender,
            } as Match;
          });

        // Enrich with assigned assessors from BE so reload preserves selections
        const enriched: Match[] = await Promise.all(
          mapped.map(async (m) => {
            try {
              const url = API_ENDPOINTS.MATCH_ASSESSORS.LIST.replace(
                "{matchId}",
                m.id
              );
              const res = await api.get(url);
              const payload: any = (res as any)?.data;
              const arr: Array<any> = Array.isArray(payload)
                ? payload
                : (payload?.content as Array<any>) ||
                  (payload?.data as Array<any>) ||
                  [];
              if (arr && arr.length > 0) {
                const roleKeys = ASSESSOR_ROLES.map((r) => r.key);
                const nextAssessors: Record<string, string> = {};
                arr.slice(0, 5).forEach((a: any, idx: number) => {
                  const id = (a && (a.assessorId || a.userId || a.id)) || "";
                  if (id && roleKeys[idx]) nextAssessors[roleKeys[idx]] = id;
                });
                return {
                  ...m,
                  assessors: nextAssessors,
                  judgesCount: 5,
                } as Match;
              }
            } catch (_) {
              // ignore
            }
            return m;
          })
        );

        // Merge: replace matches for current tab with persisted ones
        setMatches((prev) => {
          const others = prev.filter((m) => m.type !== activeTab);
          return [...others, ...enriched];
        });
      } catch (err) {
        // ignore load errors; keep local state
      } finally {
        setPendingLoads((n) => Math.max(0, n - 1));
        setIsTournamentLoading(false);
      }
    };
    loadPersistedMatches();
  }, [selectedTournament, activeTab]);

  useEffect(() => {
    const loadAthletes = async () => {
      if (!selectedTournament) {
        setAthletes([]);
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
        if (debouncedName) {
          qs.set("name", debouncedName);
        }
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

        setAthletes(
          content.map((athlete) => {
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
              gender: athlete.gender === "FEMALE" ? "Nữ" : "Nam",
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
          })
        );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    selectedTournament,
    debouncedName,
    genderFilter,
    subCompetitionFilter,
    detailCompetitionFilter,
  ]);

  // Note: mock generator removed from UI; keep for potential dev usage

  // Legacy manual match management helpers (add/delete/start) have been removed from the UI.

  const openSetupModal = (matchId: string) => {
    const m = matches.find((it) => it.id === matchId);
    const existingAssessors = m?.assessors ?? {};
    // Derive judges count from existing assessors if available
    const presentKeys = [
      existingAssessors.referee,
      existingAssessors.judgeA,
      existingAssessors.judgeB,
      existingAssessors.judgeC,
      existingAssessors.judgeD,
    ].filter(Boolean).length;
    const derivedJudges = presentKeys > 0 ? presentKeys : undefined;

    setSetupModal({
      open: true,
      step: 1, // luôn mở ở bước 1, nhưng vẫn prefill thông tin bước 2
      matchId,
      selectedIds: m?.participantIds ?? [],
      assessors: { ...existingAssessors },
      judgesCount: 5,
      defaultTimerSec: m?.timerSec ?? 120,
      performanceId: (m as any)?.performanceId,
    });
    setTeamSearch("");
    // Don't reset filters - keep them so athletes are filtered correctly
    // Only close dropdowns
    setOpenCategory("");
    setShowCompetitionFilter(false);
    setShowGenderFilter(false);
    setShowTeamFilter(false);

    // Prefill assigned assessors from backend (PerformanceMatch -> list assessors)
    // We map the returned list sequentially into referee, judgeA, judgeB, judgeC, judgeD
    if (matchId) {
      (async () => {
        try {
          const res = await api.get(
            API_ENDPOINTS.MATCH_ASSESSORS.LIST.replace("{matchId}", matchId)
          );
          const data = (res as any)?.data as any;
          const list: Array<{ assessorId?: string; userId?: string }> = (
            Array.isArray(data?.content)
              ? data.content
              : Array.isArray(data)
              ? data
              : []
          ) as any[];
          const ids = list
            .map((it) => (it.assessorId || it.userId || "").toString())
            .filter((s) => !!s);

          if (ids.length > 0) {
            const roleKeys = ASSESSOR_ROLES.map((r) => r.key);
            const nextAssessors: Record<string, string> = {};
            ids.slice(0, 5).forEach((id, idx) => {
              const key = roleKeys[idx];
              if (key) nextAssessors[key] = id;
            });
            setSetupModal((prev) => ({
              ...prev,
              assessors: { ...prev.assessors, ...nextAssessors },
              judgesCount: 5,
            }));
          }
        } catch (e) {
          // ignore fetch errors; keep current state
        }
      })();
    }
  };
  const closeSetupModal = () =>
    setSetupModal({
      open: false,
      step: 1,
      selectedIds: [],
      assessors: {},
      judgesCount: 5,
      defaultTimerSec: 120,
    });

  // Open team detail modal - logic from AthleteManagementPage
  const openTeamDetail = async (athlete: AthleteRow) => {
    setTeamModalOpen(true);
    setTeamModalLoading(true);
    try {
      const pid = athlete.performanceId;

      // First, try grouping current fetched athletes by performanceId
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
        setTeamModalData({ teamName: athlete.name, members });
        setTeamModalLoading(false);
        return;
      }

      if (!pid) {
        setTeamModalData({ teamName: athlete.name, members: [] });
        setTeamModalLoading(false);
        return;
      }

      // Next, try loading from performance API
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
        athlete.name ||
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
      setTeamModalData({ teamName: athlete.name, members: [] });
    } finally {
      setTeamModalLoading(false);
    }
  };

  const closeTeamDetail = () => {
    setTeamModalOpen(false);
    setTeamModalData(null);
    setTeamModalLoading(false);
  };

  const goToNextStep = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (setupModal.step === 1) {
      // Validation temporarily removed for testing
      setSetupModal((prev) => ({ ...prev, step: 2 }));
    }
  };

  const goToPrevStep = () => {
    if (setupModal.step === 2) {
      setSetupModal((prev) => ({ ...prev, step: 1 }));
    }
  };

  const toggleTeamMember = (athleteId: string) => {
    setSetupModal((prev) => {
      const exists = prev.selectedIds.includes(athleteId);
      return {
        ...prev,
        // Enforce single selection: pick exactly one team or one athlete
        selectedIds: exists ? [] : [athleteId],
      };
    });
  };

  const updateSetupAssessor = (
    role: keyof Match["assessors"],
    value: string
  ) => {
    setSetupModal((prev) => ({
      ...prev,
      assessors: { ...prev.assessors, [role]: value },
    }));
  };

  const saveSetup = async () => {
    if (!setupModal.matchId || !selectedTournament) return;
    const selected = athletes.filter((a) =>
      setupModal.selectedIds.includes(a.id)
    );
    const names = selected.map((a) => a.name);

    // Determine specialization from tab
    const specialization =
      activeTab === "quyen"
        ? "QUYEN"
        : activeTab === "music"
        ? "MUSIC"
        : "FIGHTING";

    try {
      // Enforce exactly one selection (1 VĐV hoặc 1 đội)
      if (setupModal.selectedIds.length !== 1) {
        console.error("Vui lòng chọn đúng 1 VĐV hoặc 1 đội");
        return;
      }

      // Prevent selecting the same athlete/team in multiple matches
      const selectedId = setupModal.selectedIds[0];
      if (usedAthleteIds.has(selectedId)) {
        console.error("VĐV này đã được chọn ở trận khác");
        return;
      }
      const selectedPid = athleteIdToPerformanceId[selectedId];
      if (selectedPid && usedPerformanceIds.has(selectedPid)) {
        console.error("Đội này đã được chọn ở trận khác");
        return;
      }
      // Derive performanceId for quyền/võ nhạc if missing
      let derivedPerformanceId: string | undefined = setupModal.performanceId;
      if (
        (specialization === "QUYEN" || specialization === "MUSIC") &&
        !derivedPerformanceId
      ) {
        // Use selectedPid if available (non-empty string), otherwise try to find from selected array
        // Check if selectedPid exists and is not empty (handle both undefined and empty string)
        const validSelectedPid =
          selectedPid !== undefined &&
          selectedPid !== null &&
          typeof selectedPid === "string" &&
          selectedPid.trim() !== ""
            ? selectedPid.trim()
            : undefined;

        // Try to get from selected array if selectedPid is not valid
        const fromSelected =
          selected.length > 0
            ? selected
                .find(
                  (s) =>
                    s.performanceId &&
                    typeof s.performanceId === "string" &&
                    s.performanceId.trim() !== ""
                )
                ?.performanceId?.trim()
            : undefined;

        derivedPerformanceId = validSelectedPid || fromSelected || undefined;

        // If no performanceId found, create a new Performance for individual athlete
        if (!derivedPerformanceId && selected.length === 1) {
          const athlete = selected[0];
          try {
            // Determine content IDs from athlete or filters
            const fistConfigId =
              athlete.fistConfigId || subCompetitionFilter || undefined;
            const fistItemId =
              athlete.fistItemId || detailCompetitionFilter || undefined;
            const musicContentId =
              athlete.musicContentId || subCompetitionFilter || undefined;

            const createPerformanceRequest: any = {
              competitionId: selectedTournament,
              isTeam: false,
              performanceType: "INDIVIDUAL",
              contentType: specialization,
              athleteIds: [athlete.id],
            };

            // Add content IDs based on specialization
            if (specialization === "QUYEN") {
              if (fistConfigId)
                createPerformanceRequest.fistConfigId = fistConfigId;
              if (fistItemId) createPerformanceRequest.fistItemId = fistItemId;
            } else if (specialization === "MUSIC") {
              if (musicContentId)
                createPerformanceRequest.musicContentId = musicContentId;
            }

            const perfResponse = await api.post(
              API_ENDPOINTS.PERFORMANCES.CREATE,
              createPerformanceRequest
            );
            derivedPerformanceId =
              (perfResponse as any)?.data?.id || (perfResponse as any)?.id;

            if (!derivedPerformanceId) {
              throw new Error("Failed to create performance: no ID returned");
            }

            console.log("Created new Performance for individual athlete:", {
              athleteId: athlete.id,
              performanceId: derivedPerformanceId,
              specialization,
            });

            // Note: athleteIdToPerformanceId will be updated automatically when athletes state is reloaded
          } catch (error) {
            console.error(
              "Failed to create Performance for individual athlete:",
              error
            );
            alert(
              "Không thể tạo Performance cho VĐV cá nhân. Vui lòng thử lại hoặc chọn một đội."
            );
            return;
          }
        }

        if (!derivedPerformanceId) {
          console.error(
            "Missing performanceId: select exactly 1 team or 1 athlete to proceed",
            {
              selectedId,
              selectedPid,
              selectedPidType: typeof selectedPid,
              selectedCount: selected.length,
              selectedAthletes: selected.map((s) => ({
                id: s.id,
                name: s.name,
                performanceId: s.performanceId,
                performanceIdType: typeof s.performanceId,
              })),
              athleteIdToPerformanceIdMap: Object.keys(athleteIdToPerformanceId)
                .slice(0, 5)
                .reduce((acc, key) => {
                  acc[key] = athleteIdToPerformanceId[key];
                  return acc;
                }, {} as Record<string, string>),
            }
          );
          alert(
            "Không thể xác định performanceId. Vui lòng chọn một VĐV hoặc đội hợp lệ."
          );
          return;
        }
      }

      // Determine assessor roles to include based on judgesCount (max 5)
      const maxJudges = Math.min(
        Math.max(Number(setupModal.judgesCount || 1), 1),
        5
      );
      const rolesToInclude = ASSESSOR_ROLES.slice(0, maxJudges).map(
        (r) => r.key
      );
      const selectedAssessorIds = rolesToInclude
        .map(
          (roleKey) => setupModal.assessors[roleKey as keyof Match["assessors"]]
        )
        .filter((v) => typeof v === "string" && v.length > 0) as string[];
      // Unique and validate count
      const uniqueAssessorIds = Array.from(new Set(selectedAssessorIds));
      if (uniqueAssessorIds.length > 5) {
        console.error("Tối đa 5 giám định");
        return;
      }

      // Replace assignments rather than append new ones
      try {
        const listUrl = API_ENDPOINTS.MATCH_ASSESSORS.LIST.replace(
          "{matchId}",
          setupModal.matchId
        );
        const listRes = await api.get(listUrl);
        const payloadList: any = (listRes as any)?.data;
        const existingArr: Array<{
          id?: string;
          assessorId?: string;
          userId?: string;
        }> = Array.isArray(payloadList)
          ? payloadList
          : (payloadList?.content as Array<any>) ||
            (payloadList?.data as Array<any>) ||
            [];
        const existingByPerson = new Map<string, string>();
        existingArr.forEach((row) => {
          const pid = (row.assessorId || row.userId || "").toString();
          const rid = (row.id || "").toString();
          if (pid && rid) existingByPerson.set(pid, rid);
        });
        // Remove those not selected
        for (const [personId, assignId] of existingByPerson.entries()) {
          if (!uniqueAssessorIds.includes(personId) && assignId) {
            try {
              await api.delete(API_ENDPOINTS.MATCH_ASSESSORS.BY_ID(assignId));
            } catch {}
          }
        }
      } catch {}

      // Add missing ones
      for (const assessorId of uniqueAssessorIds) {
        if (!assessorId) continue;
        const payload: any = { userId: assessorId, specialization };
        if (specialization === "QUYEN" || specialization === "MUSIC") {
          payload.performanceId = derivedPerformanceId;
        } else {
          // fighting flow (legacy)
          payload.matchId = setupModal.matchId;
          payload.role = "ASSESSOR";
          payload.position = 1;
        }
        try {
          await api.post(API_ENDPOINTS.ASSESSORS.ASSIGN, payload);
        } catch {}
      }

      // Save/link PerformanceMatch only for quyền/võ nhạc
      let pm: any = null;
      if (
        (specialization === "QUYEN" || specialization === "MUSIC") &&
        derivedPerformanceId
      ) {
        const body: any = {
          durationSeconds: setupModal.defaultTimerSec,
        };
        if (specialization === "QUYEN") {
          if (subCompetitionFilter) body.fistConfigId = subCompetitionFilter;
          if (detailCompetitionFilter)
            body.fistItemId = detailCompetitionFilter;
        } else if (specialization === "MUSIC") {
          if (subCompetitionFilter) body.musicContentId = subCompetitionFilter;
        }
        const res = await api.post(
          API_ENDPOINTS.PERFORMANCE_MATCHES.SAVE_BY_PERFORMANCE(
            derivedPerformanceId
          ),
          body
        );
        pm = res.data; // Get the PerformanceMatchResponse from BaseResponse
      }

      setMatches((prev) =>
        prev.map((m) => {
          if (m.id === setupModal.matchId) {
            // Determine content name from filters
            let contentName =
              m.contentName ||
              (activeTab === "quyen" ? "Nội dung Quyền" : "Nội dung Võ nhạc");
            if (activeTab === "quyen" && detailCompetitionFilter) {
              contentName =
                fistItems.find((i) => i.id === detailCompetitionFilter)?.name ||
                contentName;
            } else if (activeTab === "music" && subCompetitionFilter) {
              contentName =
                musicContents.find((mc) => mc.id === subCompetitionFilter)
                  ?.name || contentName;
            }

            // Derive match gender: from selected athlete if available, else current filter
            let derivedGender: "MALE" | "FEMALE" | undefined;
            if (selected && selected.length > 0) {
              const g = (selected[0].gender || "").toString().toUpperCase();
              derivedGender =
                g === "FEMALE" || g === "NỮ" || g === "NU" ? "FEMALE" : "MALE";
            } else if (genderFilter) {
              derivedGender = genderFilter === "FEMALE" ? "FEMALE" : "MALE";
            }

            return {
              ...m,
              contentName,
              participantIds: setupModal.selectedIds,
              participants: names,
              assessors: rolesToInclude.reduce((acc, key) => {
                const id =
                  setupModal.assessors[key as keyof Match["assessors"]];
                if (id) (acc as any)[key] = id;
                return acc;
              }, {} as Match["assessors"]),
              judgesCount: maxJudges,
              timerSec: setupModal.defaultTimerSec,
              performanceId: derivedPerformanceId,
              matchOrder: pm?.matchOrder ?? m.matchOrder,
              status: pm?.status ?? m.status,
              fistConfigId:
                activeTab === "quyen" ? subCompetitionFilter : m.fistConfigId,
              fistItemId:
                activeTab === "quyen" ? detailCompetitionFilter : m.fistItemId,
              musicContentId:
                activeTab === "music" ? subCompetitionFilter : m.musicContentId,
              gender: derivedGender ?? m.gender,
              teamType: teamFilter === "TEAM" ? "TEAM" : "PERSON",
            };
          }
          return m;
        })
      );
    } catch (error) {
      console.error("Failed to save setup:", error);
    }

    closeSetupModal();
  };

  // assessor summary hidden on cards

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
                  teamFilter
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
                  teamFilter
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

      {setupModal.open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {setupModal.step === 1
                  ? "Bước 1/2: Chọn Vận Động Viên (hoặc Đội)"
                  : "Bước 2/2: Gán Trọng Tài & Cấu Hình"}
              </h3>
              <button
                className="text-gray-600 hover:text-gray-900 text-2xl"
                onClick={closeSetupModal}
              >
                ×
              </button>
            </div>

            {/* Step 1: Select Athletes */}
            {setupModal.step === 1 && (
              <div>
                {/* Search Bar */}
                <div className="mb-3">
                  <input
                    value={teamSearch}
                    onChange={(event) => setTeamSearch(event.target.value)}
                    placeholder="Tìm theo tên, MSSV, CLB..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Athletes Table */}
                <div className="max-h-96 overflow-auto rounded-md mb-3 shadow-sm">
                  <table className="min-w-full text-sm border-collapse">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-3 py-2 text-left">Chọn</th>
                        {teamFilter !== "TEAM" ? (
                          <>
                            <th className="px-3 py-2 text-left">Họ tên</th>
                            <th className="px-3 py-2 text-left">MSSV</th>
                            <th className="px-3 py-2 text-left">
                              Thể thức thi đấu
                            </th>
                            <th className="px-3 py-2 text-left">Nội dung</th>
                          </>
                        ) : (
                          <>
                            <th className="px-3 py-2 text-left">Tên đội</th>
                            <th className="px-3 py-2 text-left">
                              Thể thức thi đấu
                            </th>
                            <th className="px-3 py-2 text-left">Nội dung</th>
                            <th className="px-3 py-2 text-left">
                              Xem chi tiết đội
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAthletes.map((athlete, index) => {
                        const checked = setupModal.selectedIds.includes(
                          athlete.id
                        );
                        const isSelected = bulkSelectedIds.has(athlete.id);
                        const contentName = resolveContentName(athlete);
                        return (
                          <Fragment key={athlete.id}>
                            <tr className="bg-white">
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    handleToggleBulkSelect(athlete)
                                  }
                                />
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-700">
                                {index + 1}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                {athlete.name}
                              </td>
                              {teamFilter === "TEAM" ? (
                                <td className="px-3 py-2 text-sm text-gray-700">
                                  {COMPETITION_TYPES[activeTab] || "-"}
                                </td>
                              ) : (
                                <>
                                  <td className="px-3 py-2 text-sm text-gray-700">
                                    {athlete.studentId || "-"}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-700">
                                    {athlete.club || "-"}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-700">
                                    {athlete.gender || "-"}
                                  </td>
                                </>
                              )}
                              <td className="px-3 py-2 text-sm text-gray-700">
                                {contentName}
                              </td>
                              {teamFilter === "TEAM" && (
                                <td className="px-3 py-2">
                                  <button
                                    type="button"
                                    className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                    onClick={() => openTeamDetail(athlete)}
                                  >
                                    Xem chi tiết đội
                                  </button>
                                </td>
                              )}
                            </tr>
                          </Fragment>
                        );
                      })}
                      {filteredAthletes.length === 0 && (
                        <tr>
                          <td
                            className="px-3 py-4 text-center text-sm text-gray-500"
                            colSpan={teamFilter === "TEAM" ? 5 : 6}
                          >
                            Không tìm thấy vận động viên phù hợp.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mb-4 text-sm text-gray-600">
                  Đã chọn: <strong>{setupModal.selectedIds.length}</strong>{" "}
                  VĐV/đội
                </div>

                {/* Step 1 Buttons */}
                <div className="flex justify-end gap-2">
                  <button
                    className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    onClick={closeSetupModal}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer transition-colors"
                    onClick={goToNextStep}
                  >
                    Tiếp theo
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Assign Referees & Configure */}
            {setupModal.step === 2 && (
              <div>
                {/* Configuration Inputs */}
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời gian (giây)
                    </label>
                    <input
                      type="number"
                      min={30}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={setupModal.defaultTimerSec}
                      onChange={(e) =>
                        setSetupModal((p) => ({
                          ...p,
                          defaultTimerSec: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Assign Referees */}
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-3">
                    Gán Giám định
                  </div>
                  <div className="space-y-3">
                    {ASSESSOR_ROLES.filter((role) => {
                      // referee (Giám định 1) always shown
                      if (role.key === "referee") return true;
                      // Other judges (judgeA, judgeB, judgeC, judgeD) shown based on judgesCount
                      // judgesCount is the total number of assessors (referee + additional judges)
                      // If judgesCount = 3: referee + judgeA + judgeB (3 total)
                      // If judgesCount = 4: referee + judgeA + judgeB + judgeC (4 total)
                      // If judgesCount = 5: referee + judgeA + judgeB + judgeC + judgeD (5 total)
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
                      // Show judge if judgesCount >= judgeIndex + 1 (since referee is index 0)
                      // judgeA (index 1) shown when judgesCount >= 2
                      // judgeB (index 2) shown when judgesCount >= 3
                      // judgeC (index 3) shown when judgesCount >= 4
                      // judgeD (index 4) shown when judgesCount >= 5
                      return setupModal.judgesCount >= judgeIndex + 1;
                    }).map((role) => {
                      // Filter out already selected assessors from other roles
                      const selectedAssessorIds = Object.values(
                        setupModal.assessors
                      )
                        .filter((id): id is string => Boolean(id))
                        .filter((id) => id !== setupModal.assessors[role.key]);

                      const availableForThisRole = availableAssessors.filter(
                        (assessor) => !selectedAssessorIds.includes(assessor.id)
                      );

                      // Ensure the currently pre-assigned assessor (from BE) is selectable
                      const currentId =
                        (setupModal.assessors[
                          role.key as keyof typeof setupModal.assessors
                        ] as string) || "";
                      const hasCurrent = currentId
                        ? availableForThisRole.some((a) => a.id === currentId)
                        : true;

                      return (
                        <div key={role.key} className="space-y-1">
                          <label className="block text-sm text-gray-700">
                            {role.label}
                            {role.subtitle && (
                              <span className="text-gray-500">
                                {" "}
                                {role.subtitle}
                              </span>
                            )}
                            :
                          </label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={
                              setupModal.assessors[role.key as string] || ""
                            }
                            onChange={(e) =>
                              updateSetupAssessor(role.key, e.target.value)
                            }
                          >
                            <option value="">Chọn người chấm</option>
                            {!hasCurrent && currentId && (
                              <option value={currentId}>
                                (Đã gán) {currentId}
                              </option>
                            )}
                            {availableForThisRole.length > 0 ? (
                              availableForThisRole.map((assessor) => (
                                <option key={assessor.id} value={assessor.id}>
                                  {assessor.fullName}
                                </option>
                              ))
                            ) : (
                              <option disabled>
                                {availableAssessors.length === 0
                                  ? "Đang tải danh sách giám định..."
                                  : "Tất cả giám định đã được chọn"}
                              </option>
                            )}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2 Buttons */}
                <div className="flex justify-end gap-2">
                  <button
                    className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    onClick={goToPrevStep}
                  >
                    Quay lại
                  </button>
                  <button
                    className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    onClick={closeSetupModal}
                  >
                    Hủy
                  </button>
                  <button
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={saveSetup}
                  >
                    Lưu
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
        {!subCompetitionFilter ||
        (activeTab === "quyen" && !detailCompetitionFilter) ? (
          <div className="text-sm text-gray-600">
            {activeTab === "quyen"
              ? "Vui lòng chọn: Hình thức + Nội dung + Chi tiết nội dung"
              : "Vui lòng chọn: Hình thức + Tiết mục"}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="text-sm text-gray-700">
                Đã chọn: {bulkSelectedIds.size}
              </div>
              <button
                className={`px-4 py-2 text-sm rounded ${
                  bulkSelectedIds.size === 0 || addingMatches
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                disabled={bulkSelectedIds.size === 0 || addingMatches}
                onClick={addBulkToPerformanceMatches}
              >
                {addingMatches
                  ? "Đang thêm..."
                  : `Thêm vào danh sách thi đấu (${bulkSelectedIds.size})`}
              </button>
            </div>
            <div className="overflow-auto border border-gray-200 rounded-md">
              <table className="w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left w-12">
                      <input
                        ref={bulkSelectAllRef}
                        type="checkbox"
                        checked={
                          selectableBulkIds.length > 0 &&
                          bulkSelectedIds.size === selectableBulkIds.length
                        }
                        disabled={selectableBulkIds.length === 0}
                        onChange={handleSelectAllBulk}
                      />
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-12">
                      STT
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                      {teamFilter === "TEAM" ? "Đội" : "Họ và tên"}
                    </th>
                    {teamFilter === "TEAM" ? (
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                        Thể thức thi đấu
                      </th>
                    ) : (
                      <>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                          MSSV
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                          Câu lạc bộ
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                          Giới tính
                        </th>
                      </>
                    )}
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                      Nội dung
                    </th>
                    {teamFilter === "TEAM" && (
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                        Chi tiết đội
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAthletes.map((athlete, index) => {
                    const isSelected = bulkSelectedIds.has(athlete.id);
                    const contentName = resolveContentName(athlete);
                    return (
                      <tr key={athlete.id}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleBulkSelect(athlete)}
                          />
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {athlete.name}
                        </td>
                        {teamFilter === "TEAM" ? (
                          <td className="px-3 py-2 text-sm text-gray-700">
                            {COMPETITION_TYPES[activeTab] || "-"}
                          </td>
                        ) : (
                          <>
                            <td className="px-3 py-2 text-sm text-gray-700">
                              {athlete.studentId || "-"}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-700">
                              {athlete.club || "-"}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-700">
                              {athlete.gender || "-"}
                            </td>
                          </>
                        )}
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {contentName}
                        </td>
                        {teamFilter === "TEAM" && (
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                              onClick={() => openTeamDetail(athlete)}
                            >
                              Xem chi tiết đội
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {filteredAthletes.length === 0 && (
                    <tr>
                      <td
                        className="px-3 py-4 text-center text-sm text-gray-500"
                        colSpan={teamFilter === "TEAM" ? 5 : 6}
                      >
                        Không tìm thấy vận động viên phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* start modal removed */}

      {/* Team Detail Modal */}
      {teamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
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
