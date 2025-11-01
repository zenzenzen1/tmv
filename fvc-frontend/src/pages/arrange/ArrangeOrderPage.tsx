import { useEffect, useMemo, useState, Fragment } from "react";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import type { PaginationResponse } from "../../types/api";
import type { CompetitionType } from "./ArrangeOrderWrapper";
import { fistContentService } from "../../services/fistContent";

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
  const [tournaments, setTournaments] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [athletes, setAthletes] = useState<AthleteRow[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const matchesForActiveType = useMemo(
    () =>
      matches
        .filter((match) => match.type === activeTab)
        .slice()
        .sort((a, b) => a.order - b.order),
    [matches, activeTab]
  );

  const mockAssessors = useMemo(
    () => [
      "Nguyễn Văn A",
      "Trần Thị B",
      "Lê Văn C",
      "Phạm Thị D",
      "Hoàng Văn E",
      "Vũ Thị F",
      "Đỗ Văn G",
    ],
    []
  );

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
  const [genderFilter, setGenderFilter] = useState<string>(""); // MALE/FEMALE/''
  const [showGenderFilter, setShowGenderFilter] = useState(false);
  const [showTeamFilter, setShowTeamFilter] = useState(false);

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
              if (!cfg || cfg.name !== subCompetitionFilter) {
                return false;
              }
            } else {
              // Fallback: check subCompetitionType
              if (athlete.subCompetitionType !== subCompetitionFilter) {
                return false;
              }
            }
          }
          // Check detail (detailCompetitionFilter)
          if (detailCompetitionFilter) {
            if (athlete.fistItemId) {
              const item = fistItems.find((i) => i.id === athlete.fistItemId);
              if (!item || item.name !== detailCompetitionFilter) {
                return false;
              }
            } else {
              // Fallback: check detailSubCompetitionType or detailSubLabel
              const detailMatch =
                athlete.detailSubCompetitionType === detailCompetitionFilter ||
                athlete.detailSubLabel === detailCompetitionFilter;
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
              if (!mc || mc.name !== subCompetitionFilter) {
                return false;
              }
            } else {
              return false;
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

    return matchesForActiveType.filter((match) => {
      // If match has no participants, show it only if filters are set (user can add participants)
      // This allows empty matches to be visible when filters are selected
      if (match.participantIds.length === 0) {
        return true; // Show empty matches when filters are set
      }

      // Get athletes that are in this match
      const matchAthletes = athletes.filter((athlete) =>
        match.participantIds.includes(athlete.id)
      );

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
            if (!cfg || cfg.name !== subCompetitionFilter) {
              return false;
            }
          } else {
            // Fallback: check subCompetitionType
            if (apiAthlete.subCompetitionType !== subCompetitionFilter) {
              return false;
            }
          }
        } else if (activeTab === "music") {
          // For Music: check if musicContent matches
          if (apiAthlete.musicContentId) {
            const mc = musicContents.find(
              (x) => x.id === apiAthlete.musicContentId
            );
            if (!mc || mc.name !== subCompetitionFilter) {
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
            if (!item || item.name !== detailCompetitionFilter) {
              return false;
            }
          } else {
            // Fallback: check detailSubCompetitionType or detailSubLabel
            const detailMatch =
              apiAthlete.detailSubCompetitionType === detailCompetitionFilter ||
              apiAthlete.detailSubLabel === detailCompetitionFilter;
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

  // Reset filters when changing tab
  useEffect(() => {
    setSubCompetitionFilter("");
    setDetailCompetitionFilter("");
    setOpenCategory("");
    setShowCompetitionFilter(false);
    setGenderFilter("");
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
        qs.set("tournamentId", selectedTournament);

        // Add filter parameters
        if (debouncedName) {
          qs.set("name", debouncedName);
        }
        if (genderFilter) {
          qs.set("gender", genderFilter);
        }

        // Competition type filters
        if (activeTab === "music" && subCompetitionFilter) {
          qs.set("subCompetitionType", "Tiết mục");
          qs.set("detailSubCompetitionType", subCompetitionFilter);
        } else if (activeTab === "quyen") {
          if (subCompetitionFilter) {
            qs.set("subCompetitionType", subCompetitionFilter);
          }
          if (detailCompetitionFilter) {
            qs.set("detailSubCompetitionType", detailCompetitionFilter);
          }
        }

        const res = await api.get<PaginationResponse<AthleteApi>>(
          `${API_ENDPOINTS.ATHLETES.BASE}?${qs.toString()}`
        );

        const rootAny = res.data as unknown as Record<string, unknown>;
        const outer = (rootAny?.data as Record<string, unknown>) ?? rootAny;
        const inner =
          (outer?.data as PaginationResponse<AthleteApi>) ??
          (outer as unknown as PaginationResponse<AthleteApi>);
        const content = inner?.content ?? [];

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
      }
    };

    loadAthletes();
  }, [
    activeTab,
    selectedTournament,
    debouncedName,
    genderFilter,
    subCompetitionFilter,
    detailCompetitionFilter,
    fistConfigs,
    fistItems,
    musicContents,
    performanceCache,
  ]);

  // Note: mock generator removed from UI; keep for potential dev usage

  const addManualMatch = () => {
    setMatches((prev) => {
      const sameType = prev.filter((match) => match.type === activeTab);
      const newMatch: Match = {
        id: `manual-${activeTab}-${Date.now()}`,
        order: sameType.length + 1,
        type: activeTab,
        contentName:
          activeTab === "quyen" ? "Nội dung Quyền" : "Nội dung Võ nhạc",
        participantIds: [],
        participants: [],
        assessors: {},
      };
      return [...prev, newMatch];
    });
  };

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
      return [...others, ...sameType];
    });
  };

  const beginMatch = (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const judgesCount = match.judgesCount ?? 5;
    const defaultTimerSec = match.timerSec ?? 120;

    const projectionPayload = {
      matchId: match.id,
      tournamentId: selectedTournament,
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
    } catch {
      // ignore storage errors
    }

    const url = `/performance/projection?matchId=${encodeURIComponent(
      match.id
    )}`;
    window.open(url, "_blank");
  };

  // Arrow move buttons removed in favor of drag-and-drop

  // Combined setup modal (team + assessors)
  const openSetupModal = (matchId: string) => {
    const m = matches.find((it) => it.id === matchId);
    setSetupModal({
      open: true,
      step: 1,
      matchId,
      selectedIds: m?.participantIds ?? [],
      assessors: { ...(m?.assessors ?? {}) },
      judgesCount: m?.judgesCount ?? 5,
      defaultTimerSec: m?.timerSec ?? 120,
    });
    setTeamSearch("");
    // Don't reset filters - keep them so athletes are filtered correctly
    // Only close dropdowns
    setOpenCategory("");
    setShowCompetitionFilter(false);
    setShowGenderFilter(false);
    setShowTeamFilter(false);
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
        selectedIds: exists
          ? prev.selectedIds.filter((id) => id !== athleteId)
          : [...prev.selectedIds, athleteId],
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

  const saveSetup = () => {
    if (!setupModal.matchId) return;
    const selected = athletes.filter((a) =>
      setupModal.selectedIds.includes(a.id)
    );
    const names = selected.map((a) => a.name);
    setMatches((prev) =>
      prev.map((m) =>
        m.id === setupModal.matchId
          ? {
              ...m,
              participantIds: setupModal.selectedIds,
              participants: names,
              assessors: { ...m.assessors, ...setupModal.assessors },
              judgesCount: setupModal.judgesCount,
              timerSec: setupModal.defaultTimerSec,
            }
          : m
      )
    );
    closeSetupModal();
  };

  // assessor summary hidden on cards

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">
          Sắp xếp nội dung & gán trọng tài
        </h1>

        <div className="flex items-center gap-2 mb-4">
          <label className="text-sm font-medium text-gray-700">
            Chọn giải:
          </label>
          <select
            value={selectedTournament}
            onChange={(event) => setSelectedTournament(event.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            Loại nội dung:
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

      {/* Filters outside card - for Quyền */}
      {activeTab === "quyen" && (
        <div className="mb-4">
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
            {fistConfigs.map((config) => (
              <div key={config.id} className="relative filter-dropdown">
                <button
                  type="button"
                  onClick={() => {
                    if (subCompetitionFilter === config.name) {
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
                              checked={detailCompetitionFilter === item.name}
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
        </div>
      )}

      {/* Filters outside card - for Music */}
      {activeTab === "music" && (
        <div className="mb-4">
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
                          onChange={() => setSubCompetitionFilter(content.name)}
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
                      {filteredAthletes.map((athlete) => {
                        const checked = setupModal.selectedIds.includes(
                          athlete.id
                        );

                        return (
                          <Fragment key={athlete.id}>
                            <tr className="border-t">
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 text-blue-600"
                                  checked={checked}
                                  onChange={() => toggleTeamMember(athlete.id)}
                                />
                              </td>
                              {teamFilter !== "TEAM" ? (
                                <>
                                  <td className="px-3 py-2">
                                    <div className="font-medium text-gray-900">
                                      {athlete.name}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-gray-700">
                                    {athlete.studentId || "-"}
                                  </td>
                                  <td className="px-3 py-2 text-gray-700">
                                    {COMPETITION_TYPES[activeTab] || "-"}
                                  </td>
                                  <td className="px-3 py-2 text-gray-700">
                                    {activeTab === "quyen"
                                      ? (() => {
                                          const configName =
                                            athlete.fistConfigId
                                              ? fistConfigs.find(
                                                  (c) =>
                                                    c.id ===
                                                    athlete.fistConfigId
                                                )?.name || ""
                                              : "";
                                          const itemName = athlete.fistItemId
                                            ? fistItems.find(
                                                (i) =>
                                                  i.id === athlete.fistItemId
                                              )?.name || ""
                                            : "";
                                          if (configName && itemName) {
                                            return `${configName} - ${itemName}`;
                                          }
                                          return configName || itemName || "-";
                                        })()
                                      : athlete.musicContentId
                                      ? musicContents.find(
                                          (m) => m.id === athlete.musicContentId
                                        )?.name || athlete.musicContentId
                                      : "-"}
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="px-3 py-2">
                                    <div className="font-medium text-gray-900">
                                      {athlete.name}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-gray-700">
                                    {COMPETITION_TYPES[activeTab] || "-"}
                                  </td>
                                  <td className="px-3 py-2 text-gray-700">
                                    {activeTab === "quyen"
                                      ? (() => {
                                          const configName =
                                            athlete.fistConfigId
                                              ? fistConfigs.find(
                                                  (c) =>
                                                    c.id ===
                                                    athlete.fistConfigId
                                                )?.name || ""
                                              : "";
                                          const itemName = athlete.fistItemId
                                            ? fistItems.find(
                                                (i) =>
                                                  i.id === athlete.fistItemId
                                              )?.name || ""
                                            : "";
                                          if (configName && itemName) {
                                            return `${configName} - ${itemName}`;
                                          }
                                          return configName || itemName || "-";
                                        })()
                                      : athlete.musicContentId
                                      ? musicContents.find(
                                          (m) => m.id === athlete.musicContentId
                                        )?.name || athlete.musicContentId
                                      : "-"}
                                  </td>
                                  <td className="px-3 py-2">
                                    <button
                                      type="button"
                                      className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                      onClick={() => openTeamDetail(athlete)}
                                    >
                                      Xem chi tiết đội
                                    </button>
                                  </td>
                                </>
                              )}
                            </tr>
                          </Fragment>
                        );
                      })}
                      {filteredAthletes.length === 0 && (
                        <tr>
                          <td
                            className="px-3 py-4 text-center text-sm text-gray-500"
                            colSpan={teamFilter !== "TEAM" ? 5 : 5}
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
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số assessor
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={setupModal.judgesCount}
                      onChange={(e) =>
                        setSetupModal((p) => ({
                          ...p,
                          judgesCount: Number(e.target.value),
                        }))
                      }
                    >
                      {[3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
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
                    }).map((role) => (
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
                          value={setupModal.assessors[role.key as string] || ""}
                          onChange={(e) =>
                            updateSetupAssessor(role.key, e.target.value)
                          }
                        >
                          <option value="">Chọn người chấm</option>
                          {mockAssessors.map((assessor) => (
                            <option key={assessor} value={assessor}>
                              {assessor}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
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
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={addManualMatch}
          disabled={
            !subCompetitionFilter ||
            (activeTab === "quyen" && !detailCompetitionFilter)
          }
          className={`rounded-md px-3 py-2 text-white text-sm shadow ${
            !subCompetitionFilter ||
            (activeTab === "quyen" && !detailCompetitionFilter)
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-emerald-500 hover:bg-emerald-600"
          }`}
        >
          Thêm trận trống
        </button>
        {(!subCompetitionFilter ||
          (activeTab === "quyen" && !detailCompetitionFilter)) && (
          <span className="text-sm text-orange-600">
            Vui lòng chọn nội dung để thêm trận mới
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
          filteredMatches.map((match) => (
            <div
              key={match.id}
              className={`rounded-lg border border-gray-200 p-3 shadow transition-colors outline-none`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-gray-900">
                      Trận {match.order}
                    </h2>
                    <span className="text-sm text-gray-500">
                      {COMPETITION_TYPES[match.type]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 mt-1">
                    <span className="font-medium">Nội dung:</span>{" "}
                    {match.contentName}
                  </p>
                  <p className="text-xs text-gray-700 mt-1">
                    <span className="font-medium">Đội/VDV biểu diễn:</span>{" "}
                    {match.participants.length > 0
                      ? match.participants.join(", ")
                      : "Chưa chọn"}
                  </p>
                  {/* Hidden assessor summary per request */}
                </div>

                <div className="flex flex-col items-end gap-1 w-28">
                  <button
                    onClick={() => openSetupModal(match.id)}
                    className="w-full px-2.5 py-1 text-xs bg-white border border-blue-500 text-blue-600 rounded hover:bg-blue-50"
                  >
                    Thiết lập
                  </button>
                  <button
                    onClick={() => beginMatch(match.id)}
                    className="w-full px-2.5 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700"
                  >
                    Bắt đầu trận
                  </button>
                  <button
                    onClick={() => deleteMatch(match.id)}
                    className="mt-1 h-7 w-7 text-xs bg-white border border-red-300 text-red-500 rounded hover:bg-red-50"
                    title="Xóa trận"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))
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
