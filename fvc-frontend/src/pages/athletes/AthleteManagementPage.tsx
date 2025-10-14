import { useEffect, useState, useMemo } from "react";
import CommonTable, {
  type TableColumn,
} from "../../components/common/CommonTable";

type AthleteRow = {
  id: string;
  stt: number;
  name: string;
  email: string;
  gender: "Nam" | "Nữ";
  content: string;
  studentId: string;
  club: string;
  tournament: string;
  status: "ĐÃ ĐẦU" | "HOÀN ĐẦU" | "VI PHẠM" | "CHỜ ĐẦU" | "ĐANG ĐẦU" | "-";
};

type CompetitionType = "fighting" | "quyen" | "music";

const STATUS_COLORS = {
  "ĐÃ ĐẦU": "bg-green-100 text-green-800 border-green-200",
  "HOÀN ĐẦU": "bg-purple-100 text-purple-800 border-purple-200",
  "VI PHẠM": "bg-red-100 text-red-800 border-red-200",
  "CHỜ ĐẦU": "bg-orange-100 text-orange-800 border-orange-200",
  "ĐANG ĐẦU": "bg-blue-100 text-blue-800 border-blue-200",
  "-": "bg-gray-100 text-gray-600 border-gray-200",
};

const COMPETITION_TYPES = {
  fighting: "Đối kháng",
  quyen: "Quyền",
  music: "Võ nhạc",
};

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTournament, setSelectedTournament] = useState(
    "FPTU Vovinam Club FALL 2025"
  );
  const [rows, setRows] = useState<AthleteRow[]>([]);
  const [tournaments, setTournaments] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Filter states - closed by default
  const [showGenderFilter, setShowGenderFilter] = useState(false);
  const [showClubFilter, setShowClubFilter] = useState(false);
  const [showArenaFilter, setShowArenaFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".filter-dropdown")) {
        setShowGenderFilter(false);
        setShowClubFilter(false);
        setShowArenaFilter(false);
        setShowStatusFilter(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Mock data - sẽ được thay thế bằng API call khi backend sẵn sàng
  const mockAthletes: AthleteRow[] = useMemo(
    () => [
      {
        id: "1",
        stt: 1,
        name: "Phạm C",
        email: "c.pham@fpt.edu.vn",
        gender: "Nam",
        content: "Võ nhạc số 1",
        studentId: "HE160003",
        club: "FPTU ĐN",
        tournament: "FPTU Vovinam Club FALL 2025",
        status: "ĐÃ ĐẦU",
      },
      {
        id: "2",
        stt: 2,
        name: "Lê E",
        email: "e.le@fpt.edu.vn",
        gender: "Nữ",
        content: "Võ nhạc số 1",
        studentId: "HE160005",
        club: "FPTU HCM",
        tournament: "FPTU Vovinam Club FALL 2025",
        status: "HOÀN ĐẦU",
      },
      {
        id: "3",
        stt: 3,
        name: "Vũ F",
        email: "f.vu@fpt.edu.vn",
        gender: "Nam",
        content: "Võ nhạc số 1",
        studentId: "HE160006",
        club: "FPTU HN",
        tournament: "FPTU Vovinam Club FALL 2025",
        status: "VI PHẠM",
      },
      {
        id: "4",
        stt: 4,
        name: "Mai O",
        email: "o.mai@fpt.edu.vn",
        gender: "Nữ",
        content: "Võ nhạc số 1",
        studentId: "HE160014",
        club: "FPTU HN",
        tournament: "FPTU Vovinam Club FALL 2025",
        status: "-",
      },
      {
        id: "5",
        stt: 5,
        name: "Đoàn P",
        email: "p.doan@fpt.edu.vn",
        gender: "Nam",
        content: "Võ nhạc sáng tạo",
        studentId: "HE160015",
        club: "FPTU HCM",
        tournament: "FPTU Vovinam Club FALL 2025",
        status: "CHỜ ĐẦU",
      },
      {
        id: "6",
        stt: 6,
        name: "La Q",
        email: "q.la@fpt.edu.vn",
        gender: "Nam",
        content: "Võ nhạc sáng tạo",
        studentId: "HE160016",
        club: "FPTU ĐN",
        tournament: "FPTU Vovinam Club FALL 2025",
        status: "ĐANG ĐẦU",
      },
    ],
    []
  );

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
        key: "content",
        title: "Nội dung",
        className: "whitespace-nowrap",
        sortable: true,
      },
      {
        key: "studentId",
        title: "MSSV",
        className: "whitespace-nowrap",
        sortable: true,
      },
      {
        key: "club",
        title: "CLB",
        className: "whitespace-nowrap",
        sortable: true,
      },
      {
        key: "tournament",
        title: "Giải đấu",
        className: "whitespace-nowrap",
        sortable: true,
      },
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
    []
  );

  // Filter athletes based on search term and active tab
  const filteredRows = useMemo(() => {
    let filtered = mockAthletes;

    // Filter by competition type (tab)
    if (activeTab === "fighting") {
      filtered = filtered.filter(
        (athlete) =>
          athlete.content.includes("Đối kháng") ||
          athlete.content.includes("Hạng cân")
      );
    } else if (activeTab === "quyen") {
      filtered = filtered.filter(
        (athlete) =>
          athlete.content.includes("Quyền") ||
          athlete.content.includes("Đơn luyện") ||
          athlete.content.includes("Đa luyện") ||
          athlete.content.includes("Song Luyện")
      );
    } else if (activeTab === "music") {
      filtered = filtered.filter((athlete) =>
        athlete.content.includes("Võ nhạc")
      );
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (athlete) =>
          athlete.name.toLowerCase().includes(term) ||
          athlete.email.toLowerCase().includes(term) ||
          athlete.studentId.toLowerCase().includes(term) ||
          athlete.club.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [mockAthletes, activeTab, searchTerm]);

  // Pagination
  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [filteredRows, page, pageSize]);

  // Load tournaments on component mount
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        // TODO: Uncomment when backend is ready
        // const tournamentsData = await athleteService.getTournaments();
        // setTournaments(tournamentsData);

        // Mock data for now
        setTournaments([
          { id: "1", name: "FPTU Vovinam Club FALL 2025" },
          { id: "2", name: "FPTU Vovinam Club SPRING 2025" },
        ]);
      } catch (error) {
        console.error("Failed to load tournaments:", error);
      }
    };

    loadTournaments();
  }, []);

  useEffect(() => {
    setTotal(filteredRows.length);
    setRows(paginatedRows);
  }, [filteredRows, paginatedRows]);

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
      const headers = [
        "STT",
        "Tên",
        "Email",
        "Giới tính",
        "Nội dung",
        "MSSV",
        "CLB",
        "Giải đấu",
        "Trạng thái",
      ];

      const csvRows = filteredRows.map((athlete) => [
        athlete.stt,
        athlete.name,
        athlete.email,
        athlete.gender,
        athlete.content,
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
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.name}>
                {tournament.name}
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
          {/* Search */}
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
              placeholder="Tìm theo tên, MSSV, Email, CLB..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
            />
          </div>

          {/* Filter Buttons */}
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
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2 h-3 w-3 text-blue-600"
                        defaultChecked
                      />
                      <span className="text-sm text-gray-700">Tất cả</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2 h-3 w-3 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Nam</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2 h-3 w-3 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Nữ</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="relative filter-dropdown">
              <button
                onClick={() => setShowClubFilter(!showClubFilter)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                CLB
              </button>
              {showClubFilter && (
                <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-300 rounded shadow-lg z-20">
                  <div className="p-2 space-y-1">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2 h-3 w-3 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Tất cả</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2 h-3 w-3 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">FPTU HCM</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2 h-3 w-3 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">FPTU HN</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2 h-3 w-3 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">FPTU ĐN</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="relative filter-dropdown">
              <button
                onClick={() => setShowArenaFilter(!showArenaFilter)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                Sân đấu
              </button>
              {showArenaFilter && (
                <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-300 rounded shadow-lg z-20">
                  <div className="p-2 space-y-1">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2 h-3 w-3 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Tất cả</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2 h-3 w-3 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Sân A</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2 h-3 w-3 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Sân B</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2 h-3 w-3 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Sân C</span>
                    </label>
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
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2 h-3 w-3 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Tất cả</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2 h-3 w-3 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">ĐÃ ĐẦU</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2 h-3 w-3 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">HOÀN ĐẦU</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2 h-3 w-3 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">VI PHẠM</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2 h-3 w-3 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">CHỜ ĐẦU</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2 h-3 w-3 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">ĐANG ĐẦU</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
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
