import { useEffect, useState, useMemo } from "react";
import CommonTable, {
  type TableColumn,
} from "../../components/common/CommonTable";
import api from "../../services/api";
import { fistContentService } from "../../services/fistContent";
import type { PaginationResponse } from "../../types/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import type { CompetitionType } from "./ArrangeOrderWrapper";
import {
  competitionOrderService,
  type CreateCompetitionOrderRequest,
} from "../../services/competitionOrderService";

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
  detailSubCompetitionType?: string | null;
  studentId?: string | null;
  club?: string | null;
  tournamentId?: string | null;
  tournamentName?: string | null; // optional if backend enriches later
  status: "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "VIOLATED" | string;
};

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

interface ArrangeOrderPageProps {
  activeTab: CompetitionType;
  onTabChange: (tab: CompetitionType) => void;
}

export default function ArrangeOrderPage({
  activeTab,
  onTabChange,
}: ArrangeOrderPageProps) {
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
  // Fist content data for quyen filtering
  const [fistConfigs, setFistConfigs] = useState<
    Array<{
      id: string;
      name: string;
      description?: string | null;
      status?: boolean;
    }>
  >([]);

  const [fistItems, setFistItems] = useState<
    Array<{
      id: string;
      name: string;
      description?: string;
      level?: number;
      configId?: string;
      configName?: string;
    }>
  >([]);
  const [musicContents, setMusicContents] = useState<
    Array<{ id: string; name: string }>
  >([]);

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
        // if (activeTab === "fighting") {
        //   // Do NOT send weight to backend; fetch all then filter client-side
        // } else
        if (activeTab === "music") {
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
        // Unwrap BaseResponse (handles data, or data.data)
        const rootAny = res.data as unknown as Record<string, unknown>;
        const outer = (rootAny?.data as Record<string, unknown>) ?? rootAny;
        const inner =
          (outer?.data as PaginationResponse<AthleteApi>) ??
          (outer as unknown as PaginationResponse<AthleteApi>);
        const pageData: PaginationResponse<AthleteApi> = inner;
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
            // For Quyền/Võ nhạc, prefer detail; if missing, fallback to subCompetitionType
            detailSubCompetitionType:
              a.detailSubCompetitionType || a.subCompetitionType || "-",
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
      // ...(activeTab === "fighting"
      //   ? [
      //       {
      //         key: "detailSubCompetitionType",
      //         title: "Hạng cân",
      //         className: "whitespace-nowrap",
      //         render: (row: AthleteRow) => {
      //           const value =
      //             row.detailSubCompetitionType || row.subCompetitionType || "-";
      //           return String(value)
      //             .replace(/^Nam\s+/i, "")
      //             .replace(/^Nữ\s+/i, "");
      //         },
      //         sortable: true,
      //       } as TableColumn<AthleteRow>,
      //     ]
      //   :
      ...[
        {
          key: "detailSubCompetitionType",
          title: "Nội dung",
          className: "whitespace-nowrap",
          render: (row: AthleteRow) =>
            row.detailSubCompetitionType || row.subCompetitionType || "-",
          sortable: true,
        } as TableColumn<AthleteRow>,
      ],
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

        // Load fist configs (Đa luyện, Đơn luyện)
        const fistConfigsRes = await fistContentService.list({ size: 100 });
        setFistConfigs(fistConfigsRes.content || []);

        // Load fist items (Đơn luyện 1, Đơn luyện 2, etc.)
        const fistItemsRes = await fistContentService.listItems({ size: 100 });
        setFistItems(fistItemsRes.content || []);

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

  const handleArrangeOrderClick = async () => {
    if (!selectedTournament) {
      alert("Vui lòng chọn giải đấu trước khi sắp xếp thứ tự");
      return;
    }

    if (rows.length === 0) {
      alert("Không có vận động viên nào để sắp xếp");
      return;
    }

    setIsArranging(true);
    try {
      // Group athletes by competition type and content for proper ordering
      const groupedAthletes = new Map<string, AthleteRow[]>();

      rows.forEach((athlete) => {
        const key = `${athlete.competitionType}-${athlete.subCompetitionType}-${athlete.detailSubCompetitionType}`;
        if (!groupedAthletes.has(key)) {
          groupedAthletes.set(key, []);
        }
        groupedAthletes.get(key)!.push(athlete);
      });

      // Create competition order requests
      const orderRequests: CreateCompetitionOrderRequest[] = [];
      let orderIndex = 1;

      for (const [, athletes] of groupedAthletes) {
        // For now, we'll create one order per group
        // In a more sophisticated implementation, you might want to create separate orders for each athlete
        const firstAthlete = athletes[0];

        // Find the content selection ID if it's a quyền competition
        let contentSelectionId: string | undefined;
        if (
          activeTab === "quyen" &&
          firstAthlete.detailSubCompetitionType !== "-"
        ) {
          // Try to find the content selection ID from the fist items
          const matchingItem = fistItems.find(
            (item) => item.name === firstAthlete.detailSubCompetitionType
          );
          contentSelectionId = matchingItem?.id;
        } else if (
          activeTab === "music" &&
          firstAthlete.detailSubCompetitionType !== "-"
        ) {
          // Try to find the content selection ID from the music contents
          const matchingContent = musicContents.find(
            (content) => content.name === firstAthlete.detailSubCompetitionType
          );
          contentSelectionId = matchingContent?.id;
        }

        orderRequests.push({
          competitionId: selectedTournament,
          orderIndex: orderIndex++,
          contentSelectionId: contentSelectionId,
        });
      }

      if (orderRequests.length === 0) {
        alert(
          "Không thể tạo thứ tự thi đấu. Vui lòng kiểm tra dữ liệu vận động viên."
        );
        return;
      }

      // Call the API to create competition orders
      await competitionOrderService.createBulkOrders(orderRequests);

      alert(
        `Đã sắp xếp thứ tự thi đấu thành công cho ${orderRequests.length} nhóm vận động viên`
      );

      // Optionally refresh the data
      setReloadKey((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to arrange order:", error);
      alert("Có lỗi xảy ra khi sắp xếp thứ tự thi đấu. Vui lòng thử lại.");
    } finally {
      setIsArranging(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Tournament Selection */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">
          Sắp xếp vận động viên
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

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleArrangeOrderClick}
            disabled={isArranging}
            className={`rounded-md px-3 py-2 text-white text-sm shadow ${
              isArranging
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Sắp xếp
          </button>
          <button
            onClick={handleExportExcel}
            className="rounded-md bg-emerald-500 px-3 py-2 text-white text-sm shadow hover:bg-emerald-600"
          >
            Xuất Excel
          </button>
        </div>
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
