import type { Dispatch, SetStateAction } from "react";
import type { CompetitionType } from "../../arrange/ArrangeOrderWrapper";

type TournamentOption = { id: string; name: string };

interface TournamentSelectorProps {
  tournaments: TournamentOption[];
  selectedTournament: string;
  onTournamentChange: (value: string) => void;
  activeTab: CompetitionType;
  competitionTypes: Record<CompetitionType, string>;
  onTabChange: (tab: CompetitionType) => void;
}

export function TournamentSelector({
  tournaments,
  selectedTournament,
  onTournamentChange,
  activeTab,
  competitionTypes,
  onTabChange,
}: TournamentSelectorProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chọn giải đấu
          </label>
          <select
            value={selectedTournament}
            onChange={(event) => onTournamentChange(event.target.value)}
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
            {Object.entries(competitionTypes).map(([key, label]) => (
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
  );
}

interface QuyenFiltersProps {
  isLoading: boolean;
  teamFilter: "PERSON" | "TEAM" | "";
  showTeamFilter: boolean;
  toggleTeamFilter: () => void;
  onTeamFilterChange: (value: "PERSON" | "TEAM") => void;
  genderFilter: "" | "MALE" | "FEMALE";
  showGenderFilter: boolean;
  toggleGenderFilter: () => void;
  onGenderFilterChange: (value: "" | "MALE" | "FEMALE") => void;
  fistConfigs: Array<{ id: string; name: string }>;
  fistItems: Array<{ id: string; name: string; configId?: string }>;
  subCompetitionFilter: string;
  onSubCompetitionChange: Dispatch<SetStateAction<string>>;
  detailCompetitionFilter: string;
  onDetailCompetitionChange: Dispatch<SetStateAction<string>>;
  openCategory: string;
  setOpenCategory: Dispatch<SetStateAction<string>>;
  effectiveAllowedFistConfigIds: Set<string>;
  allowedFistConfigNames: Set<string>;
  allowedFistItemIds: Set<string>;
}

export function QuyenFilters({
  isLoading,
  teamFilter,
  showTeamFilter,
  toggleTeamFilter,
  onTeamFilterChange,
  genderFilter,
  showGenderFilter,
  toggleGenderFilter,
  onGenderFilterChange,
  fistConfigs,
  fistItems,
  subCompetitionFilter,
  onSubCompetitionChange,
  detailCompetitionFilter,
  onDetailCompetitionChange,
  openCategory,
  setOpenCategory,
  effectiveAllowedFistConfigIds,
  allowedFistConfigNames,
  allowedFistItemIds,
}: QuyenFiltersProps) {
  const hasConfigConstraint =
    effectiveAllowedFistConfigIds.size > 0 || allowedFistConfigNames.size > 0;
  const teamOptions: Array<{ label: string; value: "PERSON" | "TEAM" }> = [
    { label: "Cá nhân", value: "PERSON" },
    { label: "Đồng đội", value: "TEAM" },
  ];
  const genderOptions: Array<{ label: string; value: "" | "MALE" | "FEMALE" }> =
    [
      { label: "Tất cả", value: "" },
      { label: "Nam", value: "MALE" },
      { label: "Nữ", value: "FEMALE" },
    ];

  return (
    <div className="mb-4 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 rounded flex items-center justify-center z-10">
          <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div className="flex items-center flex-wrap gap-2">
        <div className="relative filter-dropdown">
          <button
            type="button"
            onClick={toggleTeamFilter}
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
                {teamOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="teamFilter"
                      className="mr-2 h-3 w-3 text-blue-600"
                      checked={teamFilter === opt.value}
                      onChange={() => onTeamFilterChange(opt.value)}
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative filter-dropdown">
          <button
            type="button"
            onClick={toggleGenderFilter}
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
                {genderOptions.map((g) => (
                  <label
                    key={g.value}
                    className="flex items-center cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="genderFilter"
                      className="mr-2 h-3 w-3 text-blue-600"
                      checked={genderFilter === g.value}
                      onChange={() => onGenderFilterChange(g.value)}
                    />
                    <span className="text-sm text-gray-700">{g.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {fistConfigs
          .filter((config) => {
            const allowById =
              effectiveAllowedFistConfigIds.size === 0 ||
              effectiveAllowedFistConfigIds.has(config.id);
            const allowByName =
              allowedFistConfigNames.size === 0 ||
              allowedFistConfigNames.has(config.name);
            return hasConfigConstraint ? allowById && allowByName : true;
          })
          .map((config) => (
            <div key={config.id} className="relative filter-dropdown">
              <button
                type="button"
                onClick={() => {
                  if (subCompetitionFilter === config.id) {
                    onSubCompetitionChange("");
                    onDetailCompetitionChange("");
                    setOpenCategory("");
                  } else {
                    onSubCompetitionChange(config.id);
                    onDetailCompetitionChange("");
                    setOpenCategory(
                      (prev) => (prev === config.name ? "" : config.name) || ""
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
                        onChange={() => onDetailCompetitionChange("")}
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
                            onChange={() => onDetailCompetitionChange(item.id)}
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
  );
}

interface MusicFiltersProps {
  isLoading: boolean;
  teamFilter: "PERSON" | "TEAM" | "";
  showTeamFilter: boolean;
  toggleTeamFilter: () => void;
  onTeamFilterChange: (value: "PERSON" | "TEAM") => void;
  genderFilter: "" | "MALE" | "FEMALE";
  showGenderFilter: boolean;
  toggleGenderFilter: () => void;
  onGenderFilterChange: (value: "" | "MALE" | "FEMALE") => void;
  subCompetitionFilter: string;
  onSubCompetitionChange: Dispatch<SetStateAction<string>>;
  showCompetitionFilter: boolean;
  toggleCompetitionFilter: () => void;
  musicContents: Array<{ id: string; name: string }>;
  allowedMusicContentIds: Set<string>;
  allowedMusicContentNames: Set<string>;
}

export function MusicFilters({
  isLoading,
  teamFilter,
  showTeamFilter,
  toggleTeamFilter,
  onTeamFilterChange,
  genderFilter,
  showGenderFilter,
  toggleGenderFilter,
  onGenderFilterChange,
  subCompetitionFilter,
  onSubCompetitionChange,
  showCompetitionFilter,
  toggleCompetitionFilter,
  musicContents,
  allowedMusicContentIds,
  allowedMusicContentNames,
}: MusicFiltersProps) {
  const hasMusicConstraint =
    allowedMusicContentIds.size > 0 || allowedMusicContentNames.size > 0;
  const teamOptions: Array<{ label: string; value: "PERSON" | "TEAM" }> = [
    { label: "Cá nhân", value: "PERSON" },
    { label: "Đồng đội", value: "TEAM" },
  ];
  const genderOptions: Array<{ label: string; value: "" | "MALE" | "FEMALE" }> =
    [
      { label: "Tất cả", value: "" },
      { label: "Nam", value: "MALE" },
      { label: "Nữ", value: "FEMALE" },
    ];

  return (
    <div className="mb-4 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 rounded flex items-center justify-center z-10">
          <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div className="flex items-center flex-wrap gap-2">
        <div className="relative filter-dropdown">
          <button
            onClick={toggleTeamFilter}
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
                {teamOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="teamFilter"
                      className="mr-2 h-3 w-3 text-blue-600"
                      checked={teamFilter === opt.value}
                      onChange={() => onTeamFilterChange(opt.value)}
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative filter-dropdown">
          <button
            type="button"
            onClick={toggleGenderFilter}
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
                {genderOptions.map((g) => (
                  <label
                    key={g.value}
                    className="flex items-center cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="genderFilter"
                      className="mr-2 h-3 w-3 text-blue-600"
                      checked={genderFilter === g.value}
                      onChange={() => onGenderFilterChange(g.value)}
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
            onClick={toggleCompetitionFilter}
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
                      allowedMusicContentNames.size === 0 ||
                      allowedMusicContentNames.has(content.name);
                    return hasMusicConstraint ? allowById && allowByName : true;
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
                        onChange={() => onSubCompetitionChange(content.id)}
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
  );
}
