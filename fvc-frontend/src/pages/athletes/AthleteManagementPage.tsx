import { useEffect, useState, useMemo } from "react";
import CommonTable, {
  type TableColumn,
} from "../../components/common/CommonTable";
import api from "../../services/api";
import type { PaginationResponse } from "../../types/api";
import { API_ENDPOINTS } from "../../config/endpoints";

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
  tournamentId?: string | null;
  tournamentName?: string | null; // optional if backend enriches later
  status: "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "VIOLATED" | string;
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

// Fixed quyền categories like in PublishedForm
const FIXED_QUYEN_CATEGORIES = [
  "Đơn luyện",
  "Song luyện",
  "Đa luyện",
  "Đồng đội",
];

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
  const [nameQuery, setNameQuery] = useState("");
  const [debouncedName, setDebouncedName] = useState("");
  // Debounce name search to reduce request volume
  useEffect(() => {
    const t = setTimeout(() => setDebouncedName(nameQuery.trim()), 300);
    return () => clearTimeout(t);
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

  const [selectedTournament, setSelectedTournament] = useState<string>(""); // tournamentId
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
  // Derived categories no longer needed for fixed buttons UI
  // Keeping state removed to avoid unused warnings
  const [quyenContents, setQuyenContents] = useState<
    Array<{ id: string; name: string; category?: string }>
  >([]);
  const [musicContents, setMusicContents] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Helper: derive normalized category for quyền content item
  const normalizeQuyenCategory = (
    rawCategory?: string | null,
    rawName?: string | null,
    parentName?: string | null
  ): string => {
    const candidates: string[] = [];
    if (rawCategory) candidates.push(rawCategory);
    if (parentName) candidates.push(parentName);
    if (rawName) candidates.push(rawName);
    const strip = (s: string) =>
      s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase();
    for (const c of candidates) {
      const t = strip(c);
      if (t.includes("don luyen")) return "Đơn luyện";
      if (t.includes("song luyen") && !t.includes("song quyen"))
        return "Song luyện";
      if (t.includes("da luyen")) return "Đa luyện";
      if (t.includes("song quyen")) return "Đồng đội";
    }
    return "";
  };

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

  // Fetch athletes from backend
  useEffect(() => {
    (async () => {
      try {
        const qs = new URLSearchParams();
        qs.set("page", String(page - 1));
        qs.set("size", String(pageSize));
        qs.set("competitionType", activeTab);
        if (selectedTournament) qs.set("tournamentId", selectedTournament);
        if (debouncedName) qs.set("name", debouncedName);
        if (genderFilter) qs.set("gender", genderFilter);
        if (statusFilter) qs.set("status", statusFilter);
        // Standard handling by type
        if (activeTab === "fighting") {
          // Do NOT send weight to backend; fetch all then filter client-side
        } else if (activeTab === "music") {
          // Music: send selected content as detail, and optionally label the sub type
          if (subCompetitionFilter) {
            qs.set("subCompetitionType", "Tiết mục");
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
        // Client-side safety filter in case backend ignores filters
        // Client-side filtering (fallback when backend doesn't support)
        const strip = (s: string) =>
          (s || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
        const normalizeWeight = (s: string) =>
          (s || "").replace(/[^0-9]+/g, "");
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
          let okSubDetail = true;
          if (activeTab === "fighting") {
            if (subCompetitionFilter) {
              const want = normalizeWeight(subCompetitionFilter);
              okSubDetail =
                normalizeWeight(rawDetail) === want ||
                normalizeWeight(rawSub) === want;
            }
          } else if (activeTab === "music") {
            // Match by selected content name in detail
            const okDetail = subCompetitionFilter
              ? strip(rawDetail) === strip(subCompetitionFilter)
              : true;
            okSubDetail = okDetail;
          } else {
            const okSub = subCompetitionFilter
              ? strip(rawSub) === strip(subCompetitionFilter)
              : true;
            const okDetail = detailCompetitionFilter
              ? strip(rawDetail) === strip(detailCompetitionFilter)
              : true;
            okSubDetail = okSub && okDetail;
          }

          return okName && okGender && okStatus && okSubDetail;
        });
        const totalElements: number =
          pageData?.totalElements ?? filteredRaw.length;
        const mapped: AthleteRow[] = filteredRaw.map(
          (a: AthleteApi, idx: number) => ({
            id: a.id,
            stt: (page - 1) * pageSize + idx + 1,
            name: a.fullName,
            email: a.email,
            gender: a.gender === "FEMALE" ? "Nữ" : "Nam",
            competitionType:
              a.competitionType === "fighting"
                ? "Đối kháng"
                : a.competitionType === "quyen"
                ? "Quyền"
                : a.competitionType === "music"
                ? "Võ nhạc"
                : "-",
            subCompetitionType: a.subCompetitionType || "-",
            // Always show detailed item if available; do not fallback to category like "Đơn luyện"
            detailSubCompetitionType:
              a.detailSubLabel || a.detailSubCompetitionType || "-",
            studentId: a.studentId ?? "",
            club: a.club ?? "",
            tournament:
              a.tournamentName ??
              (tournaments.find((t) => t.id === a.tournamentId)?.name || ""),
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
          })
        );
        setRows(mapped);
        setTotal(totalElements);
      } catch (e) {
        console.error("Failed to load athletes", e);
        setRows([]);
        setTotal(0);
      }
    })();
  }, [
    page,
    pageSize,
    debouncedName,
    selectedTournament,
    genderFilter,
    activeTab,
    statusFilter,
    tournaments,
    reloadKey,
    subCompetitionFilter,
    detailCompetitionFilter,
  ]);

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
  ]);

  // Reset competition filters when competition type changes
  useEffect(() => {
    setSubCompetitionFilter("");
    setDetailCompetitionFilter("");
    setShowCompetitionFilter(false);
  }, [activeTab]);

  const columns: TableColumn<AthleteRow>[] = useMemo(
    () => [
      {
        key: "stt",
        title: "STT",
        className: "w-16 text-center",
        sortable: false,
      },
      {
        key: "name",
        title: "Tên",
        className: "whitespace-nowrap",
        sortable: true,
      },
      {
        key: "email",
        title: "Email",
        className: "whitespace-nowrap",
        sortable: true,
      },
      {
        key: "gender",
        title: "Giới tính",
        className: "whitespace-nowrap text-center",
        sortable: true,
      },
      {
        key: "competitionType",
        title: "Thể thức thi đấu",
        className: "whitespace-nowrap",
        sortable: true,
      },
      ...(activeTab === "fighting"
        ? [
            {
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
            } as TableColumn<AthleteRow>,
          ]
        : [
            {
              key: "detailSubCompetitionType",
              title: "Nội dung",
              className: "whitespace-nowrap",
              render: (row: AthleteRow) =>
                String(row.detailSubCompetitionType || "-"),
              sortable: true,
            } as TableColumn<AthleteRow>,
          ]),
      {
        key: "studentId",
        title: "MSSV",
        className: "whitespace-nowrap",
        sortable: true,
      },
      // Remove tournament column per request
      {
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
      },
    ],
    [activeTab]
  );

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
        // Do not auto-select a tournament; default to no filter so data can load
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

        // Load quyền contents and derive categories
        const quyenContentsRes = await api.get(
          API_ENDPOINTS.FIST_CONTENTS.ITEMS
        );
        type FistItem = {
          id: string | number;
          name?: string;
          category?: string | null;
          categoryName?: string | null;
          parent?: { name?: string } | null;
        };
        let rawItems: FistItem[] = [];
        const responseData = quyenContentsRes.data as {
          content?: FistItem[];
          data?: { content?: FistItem[] };
        };
        if (responseData && Array.isArray(responseData.content)) {
          rawItems = responseData.content as FistItem[];
        } else if (
          responseData?.data?.content &&
          Array.isArray(responseData.data.content)
        ) {
          rawItems = (responseData.data.content ?? []) as FistItem[];
        }

        const mapped = rawItems.map((it) => {
          const id = String(it.id ?? "");
          const name = typeof it.name === "string" ? it.name : "";
          const parent = it.parent ?? undefined;
          const category = normalizeQuyenCategory(
            (it.category as string | undefined) ??
              (it.categoryName as string | undefined),
            name,
            parent && typeof parent.name === "string" ? parent.name : undefined
          );
          return { id, name, category } as {
            id: string;
            name: string;
            category?: string;
          };
        });
        setQuyenContents(mapped);

        // Fallback: if no items returned, try loading from fist-configs (like PublishedForm)
        if (!mapped || mapped.length === 0) {
          try {
            const cfgRes = await api.get(
              `${API_ENDPOINTS.FIST_CONTENTS.BASE}?page=0&size=100`
            );
            const root = cfgRes.data as Record<string, unknown>;
            const pageObj = ((root["data"] as Record<string, unknown>) ??
              root) as Record<string, unknown>;
            const cfgs = (pageObj["content"] as Array<unknown>) ?? [];
            const mappedFromConfigs = cfgs.map((raw) => {
              const it = raw as Record<string, unknown>;
              const name =
                typeof it["name"] === "string" ? (it["name"] as string) : "";
              return {
                id: String(it["id"] ?? ""),
                name,
                category: normalizeQuyenCategory("", name, ""),
              } as { id: string; name: string; category?: string };
            });
            setQuyenContents(mappedFromConfigs);
          } catch (fallbackErr) {
            console.warn("Failed to load fallback fist-configs", fallbackErr);
          }
        }

        // Load music contents
        const musicContentsRes = await api.get<{
          content: Array<{ id: string; name: string }>;
          totalElements: number;
        }>(API_ENDPOINTS.MUSIC_CONTENTS.BASE);
        setMusicContents(musicContentsRes.data?.content || []);
      } catch (error) {
        console.error("Failed to load filter data:", error);
      }
    };

    loadFilterData();
  }, []);

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
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
            />
          </div>

          {/* Filter Buttons (removed CLB, Sân đấu) */}
          <div className="flex gap-1">
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
                      {weightClasses.map((wc) => {
                        const weightDisplay =
                          wc.weightClass || `${wc.minWeight}-${wc.maxWeight}kg`;
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
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "quyen" && (
              <div className="flex items-center flex-wrap gap-2">
                {FIXED_QUYEN_CATEGORIES.map((c) => (
                  <div key={c} className="relative filter-dropdown">
                    <button
                      type="button"
                      onClick={() => {
                        if (subCompetitionFilter === c) {
                          // Toggle off current category filter
                          setSubCompetitionFilter("");
                          setDetailCompetitionFilter("");
                          setOpenCategory("");
                        } else {
                          setSubCompetitionFilter(c);
                          setDetailCompetitionFilter("");
                          setOpenCategory((prev) => (prev === c ? "" : c));
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded border ${
                        subCompetitionFilter === c
                          ? "border-blue-500 text-blue-600 bg-blue-50"
                          : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                      }`}
                    >
                      {c}
                    </button>
                    {openCategory === c && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-300 rounded shadow-lg z-20">
                        <div className="p-2 space-y-1 max-h-64 overflow-auto">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name={`detailCompetitionFilter-${c}`}
                              className="mr-2 h-3 w-3 text-blue-600"
                              checked={detailCompetitionFilter === ""}
                              onChange={() => setDetailCompetitionFilter("")}
                            />
                            <span className="text-sm text-gray-700">
                              Tất cả
                            </span>
                          </label>
                          {quyenContents
                            .filter((content) => content.category === c)
                            .map((content) => (
                              <label
                                key={content.id}
                                className="flex items-center cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name={`detailCompetitionFilter-${c}`}
                                  className="mr-2 h-3 w-3 text-blue-600"
                                  checked={
                                    detailCompetitionFilter === content.name
                                  }
                                  onChange={() =>
                                    setDetailCompetitionFilter(content.name)
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
      <div className="bg-white rounded-lg shadow pb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {COMPETITION_TYPES[activeTab]}
          </h2>
        </div>

        <CommonTable
          data={rows.map((row, index) => ({
            ...row,
            stt: (page - 1) * pageSize + index + 1,
          }))}
          columns={columns}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
