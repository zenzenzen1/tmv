import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import type { IStompSocket } from "@stomp/stompjs";
import api from "../../services/api";
import apiClient from "../../config/axios";
import Sidebar from "../../components/layout/Sidebar";
import type { MenuItem } from "../../components/layout/sidebarMenu";
import { API_ENDPOINTS } from "../../config/endpoints";
import { scoringService } from "../../services/scoringService";
import { fistContentService } from "../../services/fistContent";
import competitionService from "../../services/competition";
import { weightClassService } from "../../services/weightClass";

type MyAssignedMatch = {
  assessorId: string;
  matchId?: string;
  performanceMatchId?: string;
  performanceId?: string;
  role?: string;
  match?: {
    id: string;
    competitionId: string;
    competitionName?: string;
    redAthleteName: string;
    blueAthleteName: string;
    status: string;
  };
  performanceMatch?: {
    id: string;
    competitionId: string;
    competitionName?: string;
    performanceId: string;
    contentName?: string;
    contentType: string;
    matchOrder?: number;
    status: string;
    participants?: string;
    // Denormalized filter fields from PerformanceMatch
    fistConfigId?: string;
    fistItemId?: string;
    musicContentId?: string;
  };
};

type DisplayMatch = {
  id: string;
  source: "match" | "performance";
  order: number;
  matchOrder?: number;
  type: "fighting" | "quyen" | "music";
  subCategory?: string;
  contentName: string;
  participants: string[];
  role: string;
  tournamentName: string;
  competitionId?: string;
  fistConfigId?: string;
  fistItemId?: string;
  musicContentId?: string;
  status: "pending" | "ongoing" | "completed";
  rawStatus?: string;
  performanceId?: string;
  performanceMatchId?: string;
  assessorId?: string;
  matchId?: string;
};

type StatusSummary = {
  total: number;
  completed: number;
  pending: number;
  ongoing: number;
};

type CompetitionDetail = {
  id: string;
  fistConfigs: Array<{ id: string; name: string }>;
  fistItems: Array<{ id: string; name: string; configId: string }>;
  weightClasses: Array<{ id: string; label: string }>;
  musicPerformances: Array<{ id: string; name: string }>;
};

const ROLE_LABELS: Record<string, string> = {
  ASSESSOR: "Trọng tài chấm điểm",
  JUDGER: "Trọng tài chính",
};

const TYPE_LABELS: Record<DisplayMatch["type"], string> = {
  fighting: "Đối kháng",
  quyen: "Quyền",
  music: "Võ nhạc",
};

const STATUS_LABELS: Record<DisplayMatch["status"], string> = {
  pending: "Sắp diễn ra",
  ongoing: "Đang diễn ra",
  completed: "Hoàn thành",
};

const STATUS_BADGE_STYLES: Record<
  DisplayMatch["status"],
  { backgroundColor: string; color: string; borderColor: string }
> = {
  ongoing: {
    backgroundColor: "#FFEFD5",
    color: "#C05621",
    borderColor: "#FBD38D",
  },
  completed: {
    backgroundColor: "#E6F6ED",
    color: "#2F855A",
    borderColor: "#C6F6D5",
  },
  pending: {
    backgroundColor: "#EAF2FF",
    color: "#2B6CB0",
    borderColor: "#C3DAFE",
  },
};

const TYPE_PRIORITY: Record<DisplayMatch["type"], number> = {
  fighting: 0,
  quyen: 1,
  music: 2,
};

const STATUS_PRIORITY: Record<DisplayMatch["status"], number> = {
  ongoing: 0,
  pending: 1,
  completed: 2,
};

const SIDEBAR_ITEMS: Array<{
  id: "fighting" | "quyen" | "music";
  label: string;
  description: string;
}> = [
  {
    id: "fighting",
    label: "Đối kháng",
    description: "Danh sách trận đối kháng",
  },
  { id: "quyen", label: "Quyền", description: "Danh sách trận quyền" },
  { id: "music", label: "Võ nhạc", description: "Danh sách trận võ nhạc" },
];

const JUDGE_MENU_ITEMS: MenuItem[] = SIDEBAR_ITEMS.map(({ id, label }) => ({
  key: id,
  label,
}));

const SORT_OPTIONS = [
  { value: "time", label: "Thời gian" },
  { value: "status", label: "Trạng thái" },
];

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
};

const toStringWithFallback = (value: unknown, fallback: string): string =>
  toOptionalString(value) ?? fallback;

const normalizeText = (value?: string): string =>
  value
    ? value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim()
    : "";

const JudgeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<DisplayMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<
    "fighting" | "quyen" | "music"
  >("fighting");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "ongoing" | "completed"
  >("all");
  const [tournamentFilter, setTournamentFilter] = useState<string>("all");
  const [tournaments, setTournaments] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [contentFilter, setContentFilter] = useState<string>("all");
  const [allFistConfigs, setAllFistConfigs] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [allFistItems, setAllFistItems] = useState<
    Array<{ id: string; name: string; configId: string }>
  >([]);
  const [allMusicPerformances, setAllMusicPerformances] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [fistConfigs, setFistConfigs] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [fistItems, setFistItems] = useState<
    Array<{ id: string; name: string; configId: string }>
  >([]);
  const [weightClasses, setWeightClasses] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [musicPerformances, setMusicPerformances] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [currentCompetitionId, setCurrentCompetitionId] = useState<
    string | null
  >(null);
  const [sortOption, setSortOption] = useState<"time" | "status">("time");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 3;
  const stompRef = useRef<Client | null>(null);
  const competitionCacheRef = useRef<Record<string, CompetitionDetail>>({});

  const combinedFistConfigs = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    [...allFistConfigs, ...fistConfigs].forEach((config) => {
      if (config?.id) {
        map.set(config.id, config);
      }
    });
    const result = Array.from(map.values());
    console.log("[JudgeDashboard] Combined fist configs:", {
      allFistConfigs: allFistConfigs.length,
      fistConfigs: fistConfigs.length,
      combined: result.length,
      combinedData: result,
    });
    return result;
  }, [allFistConfigs, fistConfigs]);

  const combinedFistItems = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; configId: string }
    >();
    [...allFistItems, ...fistItems].forEach((item) => {
      if (item?.id) {
        map.set(item.id, item);
      }
    });
    const result = Array.from(map.values());
    console.log("[JudgeDashboard] Combined fist items:", {
      allFistItems: allFistItems.length,
      fistItems: fistItems.length,
      combined: result.length,
      combinedData: result.slice(0, 5), // Log first 5
    });
    return result;
  }, [allFistItems, fistItems]);

  const combinedMusicPerformances = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    [...allMusicPerformances, ...musicPerformances].forEach((item, index) => {
      const key = item?.id || `music-${index}`;
      if (key) {
        map.set(key, {
          id: item?.id || key,
          name: item?.name ?? "",
        });
      }
    });
    const result = Array.from(map.values());
    console.log("[JudgeDashboard] Combined music performances:", {
      allMusicPerformances: allMusicPerformances.length,
      musicPerformances: musicPerformances.length,
      combined: result.length,
      combinedData: result.slice(0, 5), // Log first 5
    });
    return result;
  }, [allMusicPerformances, musicPerformances]);

  useEffect(() => {
    const loadGlobalContentCatalog = async () => {
      try {
        const [configsRes, itemsRes, musicRes] = await Promise.all([
          fistContentService.list({ size: 100 }),
          fistContentService.listItems({ size: 100 }),
          api.get<{ content?: Array<Record<string, unknown>> }>(
            API_ENDPOINTS.MUSIC_CONTENTS.BASE
          ),
        ]);

        const configsRaw = (configsRes?.content ?? []) as unknown as Array<
          Record<string, unknown>
        >;
        const itemsRaw = (itemsRes?.content ?? []) as unknown as Array<
          Record<string, unknown>
        >;
        const musicRaw = (musicRes?.data?.content ?? []) as Array<
          Record<string, unknown>
        >;

        const mappedConfigs = configsRaw
          .map((cfg, index) => ({
            id: toStringWithFallback(
              cfg["id"] ?? cfg["configId"],
              `cfg-${index}`
            ),
            name: toStringWithFallback(
              cfg["name"] ?? cfg["configName"],
              `Nội dung ${index + 1}`
            ),
          }))
          .filter((cfg) => cfg.id && cfg.name);

        const mappedItems = itemsRaw
          .map((item, index) => {
            const configObj = item["config"];
            const nestedConfigId =
              configObj && typeof configObj === "object"
                ? (configObj as Record<string, unknown>)["id"]
                : undefined;

            const configId =
              toOptionalString(item["configId"]) ??
              toOptionalString(item["parentId"]) ??
              toOptionalString(item["fistConfigId"]) ??
              toOptionalString(nestedConfigId) ??
              "";

            return {
              id: toStringWithFallback(
                item["id"] ?? item["itemId"],
                `item-${index}`
              ),
              name: toStringWithFallback(
                item["name"] ?? item["itemName"],
                `Nội dung ${index + 1}`
              ),
              configId,
            };
          })
          .filter((item) => item.id && item.name && item.configId);

        const mappedMusic = musicRaw
          .map((entry, index) => ({
            id: toStringWithFallback(entry["id"], `music-${index}`),
            name: toStringWithFallback(entry["name"], `Tiết mục ${index + 1}`),
          }))
          .filter((mp) => mp.id && mp.name);

        const uniqueConfigs = mappedConfigs.filter(
          (cfg, index, self) =>
            self.findIndex((item) => item.id === cfg.id) === index
        );
        const uniqueItems = mappedItems.filter(
          (item, index, self) =>
            self.findIndex((it) => it.id === item.id) === index
        );
        const uniqueMusic = mappedMusic.filter(
          (item, index, self) =>
            self.findIndex((it) => it.id === item.id) === index
        );

        console.log("[JudgeDashboard] Loaded global catalogs:", {
          configs: uniqueConfigs.length,
          items: uniqueItems.length,
          music: uniqueMusic.length,
          configsData: uniqueConfigs,
          itemsData: uniqueItems.slice(0, 5), // Log first 5 items
          musicData: uniqueMusic.slice(0, 5), // Log first 5 music
        });
        setAllFistConfigs(uniqueConfigs);
        setAllFistItems(uniqueItems);
        setAllMusicPerformances(uniqueMusic);
      } catch (error) {
        console.error("Failed to load global content catalogs", error);
      }
    };

    loadGlobalContentCatalog();
  }, []);

  const mapStatus = (status?: string): DisplayMatch["status"] => {
    if (!status) return "pending";
    const upper = status.toUpperCase();
    if (upper === "IN_PROGRESS" || upper === "ONGOING") return "ongoing";
    if (upper === "COMPLETED" || upper === "FINISHED") return "completed";
    return "pending";
  };

  useEffect(() => {
    const loadMatches = async () => {
      setLoading(true);
      try {
        const response = await api.get<MyAssignedMatch[]>(
          API_ENDPOINTS.MATCH_ASSESSORS.MY_ASSIGNMENTS
        );
        const data = response.data || [];

        const competitionCache = new Map<string, string>();
        const fetchCompetitionName = async (
          competitionId?: string | null,
          fallback?: string | null
        ): Promise<string> => {
          if (fallback) {
            if (competitionId) competitionCache.set(competitionId, fallback);
            return fallback;
          }
          if (!competitionId) return "Giải đấu chưa đặt tên";
          if (competitionCache.has(competitionId)) {
            return competitionCache.get(competitionId)!;
          }
          try {
            const res = await apiClient.get<unknown>(
              API_ENDPOINTS.COMPETITIONS.BY_ID(competitionId)
            );
            const payload = (res as { data?: unknown })?.data as
              | { data?: { name?: string } }
              | { name?: string }
              | undefined;
            const name =
              (payload as { data?: { name?: string } })?.data?.name ||
              (payload as { name?: string })?.name ||
              `Giải đấu ${competitionId}`;
            competitionCache.set(competitionId, name);
            return name;
          } catch (err) {
            console.error("Failed to fetch competition name", err);
            const fallbackName = `Giải đấu ${competitionId}`;
            competitionCache.set(competitionId, fallbackName);
            return fallbackName;
          }
        };

        const displayMatchPromises = data.map(async (assignment, index) => {
          const mapped: DisplayMatch[] = [];

          if (assignment.match) {
            const match = assignment.match;
            const participants = [
              match.redAthleteName,
              match.blueAthleteName,
            ].filter((name): name is string => Boolean(name));

            const tournamentName = await fetchCompetitionName(
              match.competitionId,
              match.competitionName
            );

            mapped.push({
              id: `${match.id}-fighting`,
              source: "match",
              order: index + 1,
              matchOrder: index + 1,
              type: "fighting",
              subCategory: "Nam",
              contentName: "Đối kháng",
              participants,
              role: assignment.role || "ASSESSOR",
              tournamentName,
              competitionId: match.competitionId,
              status: mapStatus(match.status),
              rawStatus: match.status,
              assessorId: assignment.assessorId,
              matchId: match.id,
            });
          }

          if (assignment.performanceMatch) {
            const pm = assignment.performanceMatch;
            const type = pm.contentType === "QUYEN" ? "quyen" : "music";
            const participants = pm.participants
              ? pm.participants
                  .split(", ")
                  .map((item) => item.trim())
                  .filter(Boolean)
              : [];

            let contentName = pm.contentName || "";
            // Priority: get from PerformanceMatch (denormalized fields) first, fallback to Performance
            let fistConfigId: string | undefined = pm.fistConfigId || undefined;
            let fistItemId: string | undefined = pm.fistItemId || undefined;
            let musicContentId: string | undefined =
              pm.musicContentId || undefined;

            // If not available from PerformanceMatch, try to get from Performance
            if (
              pm.performanceId &&
              !fistConfigId &&
              !fistItemId &&
              !musicContentId
            ) {
              try {
                const perf = await scoringService.getPerformance(
                  pm.performanceId
                );
                fistConfigId = fistConfigId || perf.fistConfigId || undefined;
                fistItemId = fistItemId || perf.fistItemId || undefined;
                musicContentId =
                  musicContentId || perf.musicContentId || undefined;
                if (!contentName && perf.contentType) {
                  contentName =
                    perf.fistItemId ||
                    perf.musicContentId ||
                    perf.performanceType;
                }
              } catch (err) {
                console.error("Failed to load performance", err);
              }
            }

            const tournamentName = await fetchCompetitionName(
              pm.competitionId,
              pm.competitionName
            );

            mapped.push({
              id: `${pm.id}-${type}`,
              source: "performance",
              order: index + 1,
              matchOrder: pm.matchOrder || index + 1,
              type,
              subCategory: contentName || TYPE_LABELS[type],
              contentName: contentName || TYPE_LABELS[type],
              participants,
              role: assignment.role || "ASSESSOR",
              tournamentName,
              competitionId: pm.competitionId,
              status: mapStatus(pm.status),
              rawStatus: pm.status,
              performanceId: pm.performanceId,
              performanceMatchId: pm.id,
              assessorId: assignment.assessorId,
              fistConfigId,
              fistItemId,
              musicContentId,
            });
          }

          return mapped;
        });

        let normalized = (await Promise.all(displayMatchPromises)).flat();

        // Resolve missing IDs from competition details
        const competitionIds = Array.from(
          new Set(
            normalized
              .map((m) => m.competitionId)
              .filter((id): id is string => Boolean(id))
          )
        );

        // Load competition details and resolve IDs
        const competitionDetailsMap = new Map<string, CompetitionDetail>();
        for (const compId of competitionIds) {
          try {
            const cached = competitionCacheRef.current[compId];
            if (cached) {
              competitionDetailsMap.set(compId, cached);
              continue;
            }

            // Use competitionService to get competition detail (already parses response correctly)
            const competition = await competitionService.getCompetitionById(
              compId
            );

            const configs = competition.vovinamFistConfigs || [];
            const itemsMap = competition.fistConfigItemSelections || {};
            const musicPayload = competition.musicPerformances || [];

            const allItems: Array<{
              id: string;
              name: string;
              configId: string;
            }> = [];
            Object.entries(itemsMap).forEach(([configId, items]) => {
              items.forEach((item, index) => {
                allItems.push({
                  id: item.id || `${configId}-item-${index}`,
                  name: item.name,
                  configId,
                });
              });
            });

            const detail: CompetitionDetail = {
              id: compId,
              fistConfigs: configs,
              fistItems: allItems,
              weightClasses: [],
              musicPerformances: musicPayload.map((mp, index) => ({
                id: mp.id || `music-${index}`,
                name: mp.name || `Tiết mục ${index + 1}`,
              })),
            };

            competitionCacheRef.current[compId] = detail;
            competitionDetailsMap.set(compId, detail);
          } catch (err) {
            console.error(
              `Failed to load competition detail for ${compId}:`,
              err
            );
          }
        }

        // Resolve IDs from competition details based on contentName
        normalized = normalized.map((match) => {
          if (!match.competitionId) return match;

          const detail = competitionDetailsMap.get(match.competitionId);
          if (!detail) return match;

          // If match already has IDs, keep them
          if (
            (match.fistConfigId && match.fistItemId) ||
            match.musicContentId
          ) {
            return match;
          }

          // Try to resolve IDs from contentName
          if (match.type === "quyen" && match.contentName) {
            // Try to find matching fistItem by name
            const matchingItem = detail.fistItems.find((item) => {
              const itemName = normalizeText(item.name);
              const contentName = normalizeText(match.contentName);
              return itemName === contentName || contentName.includes(itemName);
            });

            if (matchingItem) {
              return {
                ...match,
                fistItemId: matchingItem.id,
                fistConfigId: matchingItem.configId || match.fistConfigId,
              };
            }

            // Try to find matching fistConfig by name
            const matchingConfig = detail.fistConfigs.find((config) => {
              const configName = normalizeText(config.name);
              const contentName = normalizeText(match.contentName);
              return (
                configName === contentName || contentName.includes(configName)
              );
            });

            if (matchingConfig) {
              return {
                ...match,
                fistConfigId: matchingConfig.id,
              };
            }
          } else if (match.type === "music" && match.contentName) {
            // Try to find matching music performance by name
            const matchingMusic = detail.musicPerformances.find((music) => {
              const musicName = normalizeText(music.name);
              const contentName = normalizeText(match.contentName);
              return (
                musicName === contentName || contentName.includes(musicName)
              );
            });

            if (matchingMusic) {
              return {
                ...match,
                musicContentId: matchingMusic.id,
              };
            }
          }

          return match;
        });

        normalized.sort((a, b) => {
          const statusDiff =
            STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
          if (statusDiff !== 0) return statusDiff;
          const typeDiff = TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type];
          if (typeDiff !== 0) return typeDiff;
          const orderA = a.matchOrder ?? a.order;
          const orderB = b.matchOrder ?? b.order;
          return orderA - orderB;
        });

        setMatches(normalized);
      } catch (error) {
        console.error("Failed to load assigned matches:", error);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, []);

  useEffect(() => {
    if (matches.length === 0) return;
    console.log("[JudgeDashboard] Loaded matches", matches);
  }, [matches]);

  useEffect(() => {
    console.log("[JudgeDashboard] Current filters", {
      activeCategory,
      categoryFilter,
      statusFilter,
      tournamentFilter,
      contentFilter,
      sortOption,
    });
  }, [
    activeCategory,
    categoryFilter,
    statusFilter,
    tournamentFilter,
    contentFilter,
    sortOption,
  ]);

  useEffect(() => {
    console.log("[JudgeDashboard] Catalog state", {
      combinedFistConfigs,
      combinedFistItems,
      combinedMusicPerformances,
    });
  }, [combinedFistConfigs, combinedFistItems, combinedMusicPerformances]);

  useEffect(() => {
    console.log("[JudgeDashboard] Competition-specific state:", {
      fistConfigs: fistConfigs.length,
      fistItems: fistItems.length,
      weightClasses: weightClasses.length,
      musicPerformances: musicPerformances.length,
      currentCompetitionId,
      tournamentFilter,
      activeCategory,
      fistConfigsData: fistConfigs,
      fistItemsData: fistItems.slice(0, 5),
      weightClassesData: weightClasses,
      musicPerformancesData: musicPerformances,
    });
  }, [
    fistConfigs,
    fistItems,
    weightClasses,
    musicPerformances,
    currentCompetitionId,
    tournamentFilter,
    activeCategory,
  ]);

  useEffect(() => {
    const ids = matches
      .map((m) => m.performanceId)
      .filter((id): id is string => Boolean(id));
    if (ids.length === 0) return;

    const wsUrl = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace("/api", "") + "/ws"
      : "http://localhost:8080/ws";

    const socket = new SockJS(wsUrl);
    const client = new Client({
      webSocketFactory: () => socket as unknown as IStompSocket,
      reconnectDelay: 5000,
      onConnect: () => {
        ids.forEach((pid) => {
          client.subscribe(`/topic/performance/${pid}/status`, (msg) => {
            try {
              const payload = JSON.parse(msg.body) as {
                status?: string;
                performanceId?: string;
              };
              if (!payload?.performanceId || !payload.status) return;
              setMatches((prev) =>
                prev.map((match) =>
                  match.performanceId === payload.performanceId
                    ? {
                        ...match,
                        status:
                          payload.status === "IN_PROGRESS"
                            ? "ongoing"
                            : payload.status === "COMPLETED"
                            ? "completed"
                            : match.status,
                      }
                    : match
                )
              );
            } catch (err) {
              console.error("Error parsing WebSocket message", err);
            }
          });
        });
      },
    });

    client.activate();
    stompRef.current = client;
    return () => {
      if (stompRef.current?.connected) stompRef.current.deactivate();
    };
  }, [matches]);

  useEffect(() => {
    const loadCompetitionDetail = async () => {
      console.log("[JudgeDashboard] loadCompetitionDetail called:", {
        tournamentFilter,
        tournamentsLength: tournaments.length,
      });

      // tournamentFilter is now competition ID (not name)
      if (tournamentFilter === "all" || !tournamentFilter) {
        console.log(
          "[JudgeDashboard] Skipping load - tournament is all or not selected"
        );
        setFistConfigs([]);
        setFistItems([]);
        setWeightClasses([]);
        setMusicPerformances([]);
        setCurrentCompetitionId(null);
        setContentFilter("all");
        return;
      }

      // tournamentFilter is already competition ID
      const competitionId = tournamentFilter;

      console.log("[JudgeDashboard] Found competitionId:", competitionId);
      const applyDetail = (detail: CompetitionDetail, isNew: boolean) => {
        // Only use competition-specific configs, no fallback to global
        console.log("[JudgeDashboard] Applying competition detail:", {
          competitionId: detail.id,
          fistConfigsCount: detail.fistConfigs.length,
          fistItemsCount: detail.fistItems.length,
          weightClassesCount: detail.weightClasses.length,
          musicPerformancesCount: detail.musicPerformances.length,
          fistConfigs: detail.fistConfigs,
          fistItems: detail.fistItems.slice(0, 5),
        });
        setFistConfigs(detail.fistConfigs);
        setFistItems(detail.fistItems);
        setWeightClasses(detail.weightClasses);
        setMusicPerformances(detail.musicPerformances);
        if (isNew) {
          setCategoryFilter("all");
          setContentFilter("all");
        }
        setCurrentCompetitionId(detail.id);
      };

      const formatWeightClassLabel = (wc: {
        id?: string;
        minWeight?: number;
        maxWeight?: number;
        gender?: string | "MALE" | "FEMALE" | "MIXED";
        note?: string | null;
      }) => {
        const min = typeof wc.minWeight === "number" ? wc.minWeight : undefined;
        const max = typeof wc.maxWeight === "number" ? wc.maxWeight : undefined;
        const genderStr = String(wc.gender || "").toUpperCase();
        const gender =
          genderStr === "MALE"
            ? "Nam"
            : genderStr === "FEMALE"
            ? "Nữ"
            : genderStr === "MIXED"
            ? "Nam & Nữ"
            : undefined;
        let range = "";
        if (min !== undefined && max !== undefined) {
          range = `${min}-${max}kg`;
        } else if (min !== undefined) {
          range = `>= ${min}kg`;
        } else if (max !== undefined) {
          range = `<= ${max}kg`;
        }
        const note = wc.note?.trim();
        const label =
          [gender, range || note, range && note ? `(${note})` : undefined]
            .filter(Boolean)
            .join(" ") || "Hạng cân";
        return label;
      };

      const cached = competitionCacheRef.current[competitionId];
      // Only use cache if it has actual data (not empty)
      const hasValidCache =
        cached &&
        (cached.fistConfigs.length > 0 ||
          cached.fistItems.length > 0 ||
          cached.musicPerformances.length > 0 ||
          cached.weightClasses.length > 0);

      if (hasValidCache) {
        console.log("[JudgeDashboard] Using cached competition detail:", {
          competitionId,
          cached,
          fistConfigsCount: cached.fistConfigs.length,
          fistItemsCount: cached.fistItems.length,
          weightClassesCount: cached.weightClasses.length,
        });

        // If cache has no weight classes, try to load from global API as fallback
        if (cached.weightClasses.length === 0) {
          try {
            console.log(
              "[JudgeDashboard] Cached competition has no weight classes, loading from global API as fallback"
            );
            const globalWeightClassesRes = await weightClassService.list({
              size: 100,
            });
            const globalWeightClasses = globalWeightClassesRes?.content || [];
            const mappedWeightClasses = globalWeightClasses.map((wc) => ({
              id: wc.id,
              label: formatWeightClassLabel({
                id: wc.id,
                minWeight: wc.minWeight,
                maxWeight: wc.maxWeight,
                gender: wc.gender,
                note: wc.note,
              }),
            }));

            // Update cache with weight classes
            const updatedDetail = {
              ...cached,
              weightClasses: mappedWeightClasses,
            };
            competitionCacheRef.current[competitionId] = updatedDetail;

            console.log(
              "[JudgeDashboard] Loaded weight classes from global API and updated cache:",
              {
                count: mappedWeightClasses.length,
                weightClasses: mappedWeightClasses,
              }
            );

            applyDetail(updatedDetail, cached.id !== currentCompetitionId);
            return;
          } catch (fallbackError) {
            console.error(
              "[JudgeDashboard] Failed to load weight classes from global API:",
              fallbackError
            );
            // Continue with cached detail even if fallback fails
          }
        }

        applyDetail(cached, cached.id !== currentCompetitionId);
        return;
      }

      if (cached) {
        console.log(
          "[JudgeDashboard] Cache exists but is empty, reloading from API:",
          competitionId
        );
        // Clear empty cache
        delete competitionCacheRef.current[competitionId];
      } else {
        console.log(
          "[JudgeDashboard] No cache found, loading from API:",
          competitionId
        );
      }

      try {
        // Use competitionService to get competition detail (already parses response correctly)
        let competition;
        try {
          competition = await competitionService.getCompetitionById(
            competitionId
          );
        } catch (serviceError) {
          console.error(
            "[JudgeDashboard] Error calling competitionService.getCompetitionById:",
            {
              competitionId,
              error: serviceError,
            }
          );
          // Try direct API call as fallback
          const res = await apiClient.get<{
            data?: {
              data?: {
                vovinamFistConfigs?: Array<{ id: string; name: string }>;
                fistConfigItemSelections?: Record<
                  string,
                  Array<{ id: string; name: string; configId?: string }>
                >;
                musicPerformances?: Array<{ id?: string; name?: string }>;
                weightClasses?: Array<{
                  id?: string;
                  minWeight?: number;
                  maxWeight?: number;
                  gender?: string;
                  note?: string | null;
                }>;
              };
            };
            vovinamFistConfigs?: Array<{ id: string; name: string }>;
            fistConfigItemSelections?: Record<
              string,
              Array<{ id: string; name: string; configId?: string }>
            >;
            musicPerformances?: Array<{ id?: string; name?: string }>;
            weightClasses?: Array<{
              id?: string;
              minWeight?: number;
              maxWeight?: number;
              gender?: string;
              note?: string | null;
            }>;
          }>(API_ENDPOINTS.COMPETITIONS.BY_ID(competitionId));

          // Parse response structure
          const payload =
            (res as { data?: unknown })?.data ||
            (res as { data?: { data?: unknown } })?.data?.data ||
            res;
          competition = payload as typeof competition;
        }

        if (!competition) {
          console.error(
            "[JudgeDashboard] Competition not found or response is null:",
            competitionId
          );
          setFistConfigs([]);
          setFistItems([]);
          setWeightClasses([]);
          setMusicPerformances([]);
          setCurrentCompetitionId(null);
          return;
        }

        console.log("[JudgeDashboard] Loaded competition:", {
          competitionId,
          competition,
          hasVovinamFistConfigs: !!competition?.vovinamFistConfigs?.length,
          hasFistConfigItemSelections: !!(
            competition?.fistConfigItemSelections &&
            Object.keys(competition.fistConfigItemSelections).length > 0
          ),
          hasMusicPerformances: !!competition?.musicPerformances?.length,
          hasWeightClasses: !!competition?.weightClasses?.length,
          vovinamFistConfigs: competition?.vovinamFistConfigs,
          fistConfigItemSelections: competition?.fistConfigItemSelections,
          musicPerformances: competition?.musicPerformances,
          weightClasses: competition?.weightClasses,
          weightClassesRaw: competition?.weightClasses,
          weightClassesType: typeof competition?.weightClasses,
          weightClassesIsArray: Array.isArray(competition?.weightClasses),
        });

        const configs = competition?.vovinamFistConfigs || [];
        const itemsMap = competition?.fistConfigItemSelections || {};
        // Ensure weightClasses is an array
        const weightClassPayload = Array.isArray(competition?.weightClasses)
          ? competition.weightClasses
          : competition?.weightClasses
          ? [competition.weightClasses]
          : [];
        const musicPayload = competition?.musicPerformances || [];

        console.log("[JudgeDashboard] Extracted data from competition:", {
          competitionId,
          configsCount: configs.length,
          itemsMapKeys: Object.keys(itemsMap),
          itemsMapEntries: Object.entries(itemsMap).slice(0, 2),
          weightClassPayloadCount: weightClassPayload.length,
          musicPayloadCount: musicPayload.length,
        });

        // Map fistConfigItemSelections to fistItems with configId
        // Format: Record<configId, FistItemResponse[]>
        const allItems: Array<{ id: string; name: string; configId: string }> =
          [];
        Object.entries(itemsMap).forEach(([configId, items]) => {
          if (Array.isArray(items)) {
            items.forEach((item, index: number) => {
              // Handle both FistItemResponse object and string ID
              const itemId =
                typeof item === "string"
                  ? item
                  : (item as { id?: string })?.id ||
                    `${configId}-item-${index}`;
              const itemName =
                typeof item === "string"
                  ? `Item ${index + 1}`
                  : (item as { name?: string })?.name ||
                    `Nội dung ${index + 1}`;

              // Use configId from map key, or fallback to item.configId
              const finalConfigId =
                configId || (item as { configId?: string })?.configId || "";

              if (itemId && itemName && finalConfigId) {
                allItems.push({
                  id: itemId,
                  name: itemName,
                  configId: finalConfigId,
                });
              }
            });
          }
        });

        // Map weight classes - ensure we have valid data
        let mappedWeightClasses = weightClassPayload
          .filter(
            (wc) =>
              wc &&
              (wc.id ||
                wc.minWeight !== undefined ||
                wc.maxWeight !== undefined)
          )
          .map((wc, index) => ({
            id: wc.id || `weight-${index}`,
            label: formatWeightClassLabel(wc),
          }));

        // If competition doesn't have weight classes, try to load from global API as fallback
        // This can happen if competition doesn't have sparring config
        // Note: We load global weight classes regardless of activeCategory to have them ready
        if (mappedWeightClasses.length === 0) {
          try {
            console.log(
              "[JudgeDashboard] Competition has no weight classes, loading from global API as fallback"
            );
            const globalWeightClassesRes = await weightClassService.list({
              size: 100,
            });
            const globalWeightClasses = globalWeightClassesRes?.content || [];
            mappedWeightClasses = globalWeightClasses.map((wc) => ({
              id: wc.id,
              label: formatWeightClassLabel({
                id: wc.id,
                minWeight: wc.minWeight,
                maxWeight: wc.maxWeight,
                gender: wc.gender,
                note: wc.note,
              }),
            }));
            console.log(
              "[JudgeDashboard] Loaded weight classes from global API:",
              {
                count: mappedWeightClasses.length,
                weightClasses: mappedWeightClasses,
              }
            );
          } catch (fallbackError) {
            console.error(
              "[JudgeDashboard] Failed to load weight classes from global API:",
              fallbackError
            );
          }
        }

        const detail: CompetitionDetail = {
          id: competitionId,
          fistConfigs: configs,
          fistItems: allItems,
          weightClasses: mappedWeightClasses,
          musicPerformances: musicPayload.map((mp, index) => ({
            id: mp.id || `music-${index}`,
            name: mp.name || `Tiết mục ${index + 1}`,
          })),
        };

        console.log("[JudgeDashboard] Loaded competition detail:", {
          competitionId,
          configs: configs.length,
          allItems: allItems.length,
          weightClasses: detail.weightClasses.length,
          musicPerformances: detail.musicPerformances.length,
          configsData: configs,
          itemsData: allItems.slice(0, 5),
          weightClassesData: detail.weightClasses,
          weightClassPayloadRaw: weightClassPayload,
          weightClassPayloadLength: weightClassPayload.length,
          mappedWeightClassesLength: mappedWeightClasses.length,
        });

        competitionCacheRef.current[competitionId] = detail;
        applyDetail(detail, competitionId !== currentCompetitionId);
      } catch (err) {
        console.error(
          "[JudgeDashboard] Failed to fetch competition configuration:",
          {
            competitionId,
            error: err,
            errorMessage: err instanceof Error ? err.message : String(err),
            errorStack: err instanceof Error ? err.stack : undefined,
          }
        );
        // Don't fallback to global configs - only use competition-specific
        setFistConfigs([]);
        setFistItems([]);
        setWeightClasses([]);
        setMusicPerformances([]);
        setCurrentCompetitionId(null);
      }
    };

    loadCompetitionDetail();
  }, [tournamentFilter, tournaments, currentCompetitionId]);

  const statusSummary = useMemo<StatusSummary>(() => {
    const summary: StatusSummary = {
      total: 0,
      completed: 0,
      pending: 0,
      ongoing: 0,
    };

    // Only calculate summary when a tournament is selected
    if (tournamentFilter === "all") {
      return summary; // Return zeros if no tournament selected
    }

    // Filter matches by selected tournament
    const tournamentMatches = matches.filter(
      (match) => match.competitionId === tournamentFilter
    );

    summary.total = tournamentMatches.length;
    tournamentMatches.forEach((match) => {
      if (match.status === "completed") summary.completed += 1;
      if (match.status === "pending") summary.pending += 1;
      if (match.status === "ongoing") summary.ongoing += 1;
    });

    return summary;
  }, [matches, tournamentFilter]);

  // Load tournaments from API (same as ArrangeOrderPage)
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        type CompetitionOption = { id: string; name: string };
        const res = await api.get<CompetitionOption[]>(
          API_ENDPOINTS.TOURNAMENT_FORMS.COMPETITIONS
        );
        const list = res.data ?? [];
        setTournaments(list);
        console.log("[JudgeDashboard] Loaded tournaments:", list);
      } catch (error) {
        console.error("[JudgeDashboard] Failed to load tournaments:", error);
        setTournaments([]);
      }
    };

    loadTournaments();
  }, []);

  const contentOptions = useMemo(() => {
    // Only show options when tournament is selected (not "all")
    if (tournamentFilter === "all") {
      return [];
    }

    if (activeCategory === "quyen") {
      // For quyen: show fistItems only when categoryFilter (fistConfig) is selected
      if (categoryFilter === "all") return [];
      // Only use competition-specific items
      const items = fistItems.filter(
        (item) => item.configId === categoryFilter
      );
      return items.map((item) => ({ value: item.id, label: item.name }));
    }
    if (activeCategory === "fighting") {
      // For fighting: show weightClasses when tournament is selected
      const options = weightClasses.map((wc) => ({
        value: wc.label,
        label: wc.label,
      }));
      console.log("[JudgeDashboard] Fighting contentOptions:", {
        weightClassesCount: weightClasses.length,
        weightClasses,
        options,
      });
      return options;
    }
    if (activeCategory === "music") {
      // For music: show musicPerformances when tournament is selected
      // Only use competition-specific music performances
      return musicPerformances.map((mp, index) => ({
        value: mp.id || `music-${index}`,
        label: mp.name,
      }));
    }
    return [];
  }, [
    activeCategory,
    categoryFilter,
    tournamentFilter,
    fistItems,
    weightClasses,
    musicPerformances,
  ]);

  const filteredMatches = useMemo(() => {
    // Filter by tournament and type first
    // tournamentFilter is now competition ID (not name)
    const tournamentFiltered = matches.filter((match) => {
      if (match.type !== activeCategory) return false;
      if (
        tournamentFilter !== "all" &&
        match.competitionId !== tournamentFilter
      ) {
        return false;
      }
      return true;
    });

    // Filters are optional - only apply when they are set (not "all")
    // This allows users to see all matches for a tournament first, then filter by content

    const result = tournamentFiltered.filter((match) => {
      // Filter by status
      if (statusFilter !== "all" && match.status !== statusFilter) {
        return false;
      }

      // Filter by content IDs - must match exactly when filter is set
      if (activeCategory === "quyen") {
        // Filter by fistConfigId (categoryFilter)
        if (categoryFilter !== "all") {
          // Match must have fistConfigId and it must match the filter
          if (!match.fistConfigId || match.fistConfigId !== categoryFilter) {
            return false;
          }
        }
        // Filter by fistItemId (contentFilter)
        if (contentFilter !== "all") {
          // Match must have fistItemId and it must match the filter
          if (!match.fistItemId || match.fistItemId !== contentFilter) {
            return false;
          }
        }
      } else if (activeCategory === "music") {
        // Filter by musicContentId (contentFilter)
        if (contentFilter !== "all") {
          // Match must have musicContentId and it must match the filter
          if (!match.musicContentId || match.musicContentId !== contentFilter) {
            return false;
          }
        }
      } else if (activeCategory === "fighting") {
        // For fighting, filter by weight class if set
        if (contentFilter !== "all") {
          if (
            normalizeText(match.subCategory || "") !==
            normalizeText(contentFilter)
          ) {
            return false;
          }
        }
      }

      return true;
    });

    if (sortOption === "status") {
      return [...result].sort((a, b) => {
        const diff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
        if (diff !== 0) return diff;
        return (a.matchOrder ?? a.order) - (b.matchOrder ?? b.order);
      });
    }

    return [...result].sort(
      (a, b) => (a.matchOrder ?? a.order) - (b.matchOrder ?? b.order)
    );
  }, [
    matches,
    activeCategory,
    categoryFilter,
    statusFilter,
    tournamentFilter,
    contentFilter,
    sortOption,
  ]);

  // Pagination logic
  const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);
  const paginatedMatches = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredMatches.slice(startIndex, endIndex);
  }, [filteredMatches, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeCategory,
    categoryFilter,
    statusFilter,
    tournamentFilter,
    contentFilter,
    sortOption,
  ]);

  useEffect(() => {
    console.log("[JudgeDashboard] Filtered matches", filteredMatches);
    console.log("[JudgeDashboard] Catalog state", {
      combinedFistConfigs: combinedFistConfigs.length,
      combinedFistItems: combinedFistItems.length,
      combinedMusicPerformances: combinedMusicPerformances.length,
    });
    console.log("[JudgeDashboard] Filter state", {
      activeCategory,
      categoryFilter,
      contentFilter,
      tournamentFilter,
      statusFilter,
    });
    if (filteredMatches.length > 0) {
      console.log("[JudgeDashboard] First match sample:", {
        match: filteredMatches[0],
        hasFistConfigId: !!filteredMatches[0].fistConfigId,
        hasFistItemId: !!filteredMatches[0].fistItemId,
        hasMusicContentId: !!filteredMatches[0].musicContentId,
        contentName: filteredMatches[0].contentName,
        subCategory: filteredMatches[0].subCategory,
      });
    }
  }, [
    filteredMatches,
    combinedFistConfigs,
    combinedFistItems,
    combinedMusicPerformances,
    activeCategory,
    categoryFilter,
    contentFilter,
    tournamentFilter,
    statusFilter,
  ]);

  const handleJoin = (match: DisplayMatch) => {
    if (match.type === "fighting") return;
    const params = new URLSearchParams();
    if (match.performanceId) params.set("performanceId", match.performanceId);
    if (match.assessorId) params.set("assessorId", match.assessorId);
    if (match.performanceMatchId)
      params.set("performanceMatchId", match.performanceMatchId);
    params.set("role", match.role);
    navigate(`/performance/judge?${params.toString()}`);
  };

  const handleSidebarChange = (key: string) => {
    if (key !== "fighting" && key !== "quyen" && key !== "music") {
      return;
    }
    setActiveCategory(key);
    setCategoryFilter("all");
    setStatusFilter("all");
    setTournamentFilter("all");
    setContentFilter("all");
    setFistConfigs([]);
    setFistItems([]);
    setWeightClasses([]);
    setMusicPerformances([]);
    setCurrentCompetitionId(null);
  };

  const handleResetFilters = () => {
    setTournamentFilter("all");
    setCategoryFilter("all");
    setStatusFilter("all");
    setContentFilter("all");
    setFistConfigs([]);
    setFistItems([]);
    setWeightClasses([]);
    setMusicPerformances([]);
    setCurrentCompetitionId(null);
    setSortOption("time");
    setActiveCategory("fighting");
  };

  const isQuyenCategory = activeCategory === "quyen";
  const isMusicCategory = activeCategory === "music";
  const isFightingCategory = activeCategory === "fighting";

  // Disable logic:
  // - Always disable if tournament is "all"
  // - For quyen: disable if categoryFilter is "all" or no contentOptions
  // - For fighting: only disable if tournament is "all" (allow even if no weightClasses yet)
  // - For music: only disable if tournament is "all"
  const contentSelectDisabled =
    tournamentFilter === "all" ||
    (isQuyenCategory &&
      (categoryFilter === "all" || contentOptions.length === 0)) ||
    (!isQuyenCategory &&
      !isMusicCategory &&
      !isFightingCategory &&
      contentOptions.length === 0);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar
        title="Giải đấu"
        menuItems={JUDGE_MENU_ITEMS}
        activeMenu={activeCategory}
        onChange={handleSidebarChange}
        disableNavigation
      />

      <main className="ml-30 flex-1 overflow-x-hidden px-6 py-2 sm:px-8 lg:px-12">
        <div className="flex w-full flex-col gap-8">
          <header className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                <p className="text-xs font-medium uppercase text-slate-500">
                  Tổng số trận hôm nay
                </p>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {statusSummary.total}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                <p className="text-xs font-medium uppercase text-slate-500">
                  Đã hoàn thành
                </p>
                <p className="mt-3 text-3xl font-bold text-emerald-600">
                  {statusSummary.completed}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                <p className="text-xs font-medium uppercase text-slate-500">
                  Chưa diễn ra
                </p>
                <p className="mt-3 text-3xl font-bold text-amber-500">
                  {statusSummary.pending}
                </p>
              </div>
            </div>
          </header>

          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Bộ lọc trận đấu
              </h2>
              <button
                onClick={handleResetFilters}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                Đặt lại
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div className="flex min-w-[180px] flex-col">
                <label className="text-xs font-semibold uppercase text-slate-500">
                  Giải đấu
                </label>
                <select
                  value={tournamentFilter}
                  onChange={(e) => {
                    setTournamentFilter(e.target.value);
                    // Reset content filters when tournament changes
                    setCategoryFilter("all");
                    setContentFilter("all");
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả giải đấu</option>
                  {tournaments.map((tournament) => (
                    <option key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </option>
                  ))}
                </select>
              </div>
              {isQuyenCategory && (
                <div className="flex min-w-[180px] flex-col">
                  <label className="text-xs font-semibold uppercase text-slate-500">
                    Loại nội dung
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setContentFilter("all");
                    }}
                    disabled={tournamentFilter === "all"}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    <option value="all">
                      {tournamentFilter === "all" ? "Chọn giải đấu" : "Tất cả"}
                    </option>
                    {fistConfigs.map((config) => (
                      <option key={config.id} value={config.id}>
                        {config.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex min-w-[180px] flex-col">
                <label className="text-xs font-semibold uppercase text-slate-500">
                  {isQuyenCategory
                    ? "Nội dung"
                    : activeCategory === "fighting"
                    ? "Hạng cân"
                    : activeCategory === "music"
                    ? "Tiết mục"
                    : "Nội dung"}
                </label>
                <select
                  value={contentFilter}
                  onChange={(e) => setContentFilter(e.target.value)}
                  disabled={contentSelectDisabled}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">
                    {tournamentFilter === "all"
                      ? "Chọn giải đấu"
                      : isQuyenCategory
                      ? categoryFilter === "all"
                        ? "Chọn loại nội dung"
                        : "Tất cả nội dung"
                      : activeCategory === "fighting"
                      ? "Tất cả hạng cân"
                      : "Tất cả tiết mục"}
                  </option>
                  {contentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex min-w-[160px] flex-col">
                <label className="text-xs font-semibold uppercase text-slate-500">
                  Trạng thái trận
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as
                        | "all"
                        | "pending"
                        | "ongoing"
                        | "completed"
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="pending">Sắp diễn ra</option>
                  <option value="ongoing">Đang diễn ra</option>
                  <option value="completed">Hoàn thành</option>
                </select>
              </div>
            </div>
          </section>

          {/* Header section - separated from match cards */}
          <div className="flex flex-wrap items-center justify-between gap-4 ">
            <h2 className="text-lg font-semibold text-slate-900">
              Trận được phân công
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Sắp xếp theo:</span>
              <select
                value={sortOption}
                onChange={(e) =>
                  setSortOption(e.target.value as "time" | "status")
                }
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Match cards section */}
          {loading ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Đang tải danh sách trận được phân công...
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Không tìm thấy trận nào. Điều chỉnh bộ lọc để xem thêm kết quả.
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedMatches.map((match) => {
                  const matchNumber = match.matchOrder ?? match.order;
                  const subLabel =
                    match.type === "fighting"
                      ? `${match.subCategory || "Male"} - ${match.contentName}`
                      : match.subCategory || match.contentName;

                  // Get content name from fistItemId if available
                  let contentLabel = subLabel;
                  if (match.fistItemId) {
                    const fistItem = combinedFistItems.find(
                      (item) => item.id === match.fistItemId
                    );
                    contentLabel = fistItem?.name || match.fistItemId;
                  } else if (match.contentName) {
                    contentLabel = match.contentName;
                  }

                  const participantsLabel =
                    match.type === "fighting" && match.participants.length >= 2
                      ? `${match.participants[0]} vs ${match.participants[1]}`
                      : match.participants.length > 0
                      ? match.participants.join(", ")
                      : "Đang cập nhật";

                  const actionLabel =
                    match.status === "completed" ? "Xem điểm" : "Vào trận";
                  const isActionDisabled =
                    match.type === "fighting"
                      ? false
                      : match.status === "completed";

                  return (
                    <div
                      key={match.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-blue-300 hover:shadow"
                    >
                      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-base font-semibold text-slate-900">
                              Trận #{String(matchNumber).padStart(3, "0")} -{" "}
                              {subLabel}
                            </h3>
                            <span
                              className="rounded-full px-3 py-1 text-xs font-semibold uppercase"
                              style={STATUS_BADGE_STYLES[match.status]}
                            >
                              {STATUS_LABELS[match.status]}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500">
                            Nội dung: {contentLabel}
                          </p>
                          <p className="text-sm text-slate-500">
                            Vận động viên: {participantsLabel}
                          </p>
                          <p className="text-sm text-slate-500">
                            Giải đấu: {match.tournamentName}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 text-sm text-slate-500 md:text-right">
                          <span>
                            Vai trò:{" "}
                            <strong className="text-slate-700">
                              {ROLE_LABELS[match.role] || match.role}
                            </strong>
                          </span>
                          <button
                            disabled={isActionDisabled}
                            onClick={() => handleJoin(match)}
                            className={`rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                              isActionDisabled
                                ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                                : "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                            }`}
                          >
                            {actionLabel}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
                  >
                    &lt;
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                            currentPage === page
                              ? "bg-blue-600 text-white"
                              : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
                  >
                    &gt;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default JudgeDashboard;
