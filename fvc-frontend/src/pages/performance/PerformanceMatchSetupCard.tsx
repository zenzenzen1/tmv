import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import { useToast } from "../../components/common/ToastContext";
import type { FieldResponse } from "../../types";

type CompetitionType = "quyen" | "music";

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
  performanceId?: string;
  matchOrder?: number;
  status?: string;
  fistConfigId?: string | null;
  fistItemId?: string | null;
  musicContentId?: string | null;
  gender?: "MALE" | "FEMALE";
  teamType?: "TEAM" | "PERSON";
  teamName?: string | null;
  fieldId?: string | null;
  fieldName?: string | null;
};

type AssessorDetail = {
  id: string;
  fullName?: string;
  email?: string;
};

type SetupModalState = {
  open: boolean;
  matchId?: string;
  assessors: Record<string, string>;
  assessorDetails: Record<string, AssessorDetail | null>;
  judgesCount: number;
  defaultTimerSec: number;
  fieldId?: string;
  scheduledStartTime?: string | null;
  athletesPresent?: Record<string, boolean>;
  performanceMatchId?: string;
};

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
      return "Chưa bắt đầu";
  }
}

type ActiveSetupSummary = {
  match: Match;
  contentName: string;
  participantsDisplay: string;
  teamDisplay: string;
  isTeamMatch: boolean;
};

type AvailableAssessor = {
  id: string;
  fullName: string;
  email: string;
};

type Athlete = {
  id: string;
  name: string;
  fullName?: string;
  email?: string;
};

interface PerformanceMatchSetupCardProps {
  layout: "modal" | "page";
  setupModal: SetupModalState;
  setSetupModal: React.Dispatch<React.SetStateAction<SetupModalState>>;
  activeSetupSummary: ActiveSetupSummary | null;
  fields: FieldResponse[];
  availableAssessors: AvailableAssessor[];
  showAssignAssessorsModal: boolean;
  setShowAssignAssessorsModal: (show: boolean) => void;
  onClose: () => void;
  onSave?: () => void; // Optional now since we have separate save handlers
  isStandaloneMode?: boolean;
  onBeginMatch?: (matchId: string) => void;
  athletes?: Athlete[];
  onSaveField?: () => void;
  onSaveDuration?: () => void;
  onSaveAssessors?: () => void;
}

export default function PerformanceMatchSetupCard({
  layout,
  setupModal,
  setSetupModal,
  activeSetupSummary,
  fields,
  availableAssessors,
  showAssignAssessorsModal, // eslint-disable-line @typescript-eslint/no-unused-vars
  setShowAssignAssessorsModal,
  onClose,
  onSave,
  isStandaloneMode = false, // eslint-disable-line @typescript-eslint/no-unused-vars
  onBeginMatch,
  athletes = [], // eslint-disable-line @typescript-eslint/no-unused-vars
  onSaveField,
  onSaveDuration,
  onSaveAssessors,
}: PerformanceMatchSetupCardProps) {
  const toast = useToast();
  const [showScheduledTimeModal, setShowScheduledTimeModal] = useState(false);
  const [scheduledStartTimeInput, setScheduledStartTimeInput] =
    useState<string>("");

  const containerClasses =
    layout === "modal"
      ? "bg-white rounded-xl shadow-lg w-full max-w-4xl p-6 md:p-8 max-h-[90vh] overflow-y-auto"
      : "bg-white rounded-xl shadow-lg p-6 md:p-8";

  // Handler for updating scheduled start time
  const handleUpdateScheduledStartTime = useCallback(
    async (clearTime: boolean = false) => {
      if (!setupModal.performanceMatchId) {
        toast.error("Không tìm thấy thông tin trận đấu");
        return;
      }

      try {
        let scheduledTime: string | null = null;
        if (!clearTime && scheduledStartTimeInput) {
          const date = new Date(scheduledStartTimeInput);
          scheduledTime = date.toISOString();
        }

        await api.patch(
          API_ENDPOINTS.PERFORMANCE_MATCHES.UPDATE_SCHEDULED_START_TIME(
            setupModal.performanceMatchId
          ),
          { scheduledStartTime: scheduledTime }
        );

        setSetupModal((prev) => ({
          ...prev,
          scheduledStartTime: scheduledTime || undefined,
        }));

        setScheduledStartTimeInput("");
        setShowScheduledTimeModal(false);
        toast.success(
          clearTime
            ? "Giờ bắt đầu dự kiến đã được xóa!"
            : "Giờ bắt đầu dự kiến đã được cập nhật!"
        );
      } catch (error: unknown) {
        const errorMessage =
          (
            error as {
              response?: { data?: { message?: string } };
              message?: string;
            }
          )?.response?.data?.message ||
          (error as { message?: string })?.message ||
          "Không thể cập nhật giờ bắt đầu";
        toast.error(errorMessage);
        console.error("Error updating scheduled start time:", error);
      }
    },
    [
      setupModal.performanceMatchId,
      scheduledStartTimeInput,
      setSetupModal,
      toast,
    ]
  );

  // Handler for updating athlete presence
  const handleUpdateAthletePresence = useCallback(
    async (athleteId: string, isPresent: boolean) => {
      if (!setupModal.performanceMatchId) {
        toast.error("Không tìm thấy thông tin trận đấu");
        return;
      }

      try {
        const currentPresence = setupModal.athletesPresent || {};
        const updatedPresence = {
          ...currentPresence,
          [athleteId]: isPresent,
        };

        await api.patch(
          API_ENDPOINTS.PERFORMANCE_MATCHES.UPDATE_ATHLETE_PRESENCE(
            setupModal.performanceMatchId
          ),
          { athletesPresent: updatedPresence }
        );

        setSetupModal((prev) => ({
          ...prev,
          athletesPresent: updatedPresence,
        }));

        toast.success(
          isPresent
            ? "Đã xác nhận vận động viên có mặt"
            : "Đã hủy xác nhận vận động viên có mặt"
        );
      } catch (error: unknown) {
        const errorMessage =
          (
            error as {
              response?: { data?: { message?: string } };
              message?: string;
            }
          )?.response?.data?.message ||
          (error as { message?: string })?.message ||
          "Không thể cập nhật trạng thái vận động viên";
        toast.error(errorMessage);
        console.error("Error updating athlete presence:", error);
      }
    },
    [
      setupModal.performanceMatchId,
      setupModal.athletesPresent,
      setSetupModal,
      toast,
    ]
  );

  const renderScheduledTimeModal = () => {
    if (!showScheduledTimeModal) return null;

    if (typeof document === "undefined" || !document.body) {
      return null;
    }

    return createPortal(
      <div
        className="fixed inset-0 flex items-center justify-center pointer-events-none"
        style={{
          position: "fixed",
          zIndex: 9999,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <div
          className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Cấu hình giờ bắt đầu dự kiến
          </h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giờ bắt đầu dự kiến
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={scheduledStartTimeInput}
                onChange={(e) => setScheduledStartTimeInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              />
            </div>
            <div className="mt-2 flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-gray-500">
                Trận đấu chỉ có thể bắt đầu khi đã đến giờ này và cả hai vận
                động viên đã được xác nhận có mặt.
              </p>
            </div>
            {setupModal.scheduledStartTime && (
              <button
                onClick={() => handleUpdateScheduledStartTime(true)}
                className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
              >
                Xóa giờ bắt đầu
              </button>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowScheduledTimeModal(false);
                if (setupModal.scheduledStartTime) {
                  const date = new Date(setupModal.scheduledStartTime);
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, "0");
                  const day = String(date.getDate()).padStart(2, "0");
                  const hours = String(date.getHours()).padStart(2, "0");
                  const minutes = String(date.getMinutes()).padStart(2, "0");
                  setScheduledStartTimeInput(
                    `${year}-${month}-${day}T${hours}:${minutes}`
                  );
                } else {
                  setScheduledStartTimeInput("");
                }
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={() => handleUpdateScheduledStartTime(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Lưu
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <div className={containerClasses}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
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
          <div className="flex items-center gap-3">
            {activeSetupSummary?.match && onBeginMatch && (
              <>
                {activeSetupSummary.match.status === "IN_PROGRESS" ? (
                  <button
                    disabled
                    className="px-4 py-2 text-sm font-medium bg-blue-100 text-blue-700 rounded-lg cursor-not-allowed"
                  >
                    Đang diễn ra
                  </button>
                ) : activeSetupSummary.match.status === "COMPLETED" ? (
                  <button
                    disabled
                    className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-600 rounded-lg cursor-not-allowed"
                  >
                    Đã kết thúc
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (activeSetupSummary.match.id && onBeginMatch) {
                        onBeginMatch(activeSetupSummary.match.id);
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    Bắt đầu trận đấu
                  </button>
                )}
              </>
            )}
            {layout === "modal" && (
              <button
                className="text-gray-400 hover:text-gray-600 transition text-2xl leading-none"
                onClick={onClose}
                aria-label="Đóng"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {activeSetupSummary ? (
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Thông tin tiết mục
                  </h4>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    activeSetupSummary.match.status
                  )}`}
                >
                  {getStatusLabel(activeSetupSummary.match.status)}
                </span>
              </div>

              {/* Scheduled Start Time */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-medium text-blue-900">
                        Giờ bắt đầu dự kiến
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (setupModal.scheduledStartTime) {
                            const date = new Date(
                              setupModal.scheduledStartTime
                            );
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(
                              2,
                              "0"
                            );
                            const day = String(date.getDate()).padStart(2, "0");
                            const hours = String(date.getHours()).padStart(
                              2,
                              "0"
                            );
                            const minutes = String(date.getMinutes()).padStart(
                              2,
                              "0"
                            );
                            setScheduledStartTimeInput(
                              `${year}-${month}-${day}T${hours}:${minutes}`
                            );
                          } else {
                            setScheduledStartTimeInput("");
                          }
                          setShowScheduledTimeModal(true);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 underline cursor-pointer"
                      >
                        Thiết lập
                      </button>
                    </div>
                    {setupModal.scheduledStartTime ? (
                      <p className="text-lg font-semibold text-blue-700">
                        {new Date(setupModal.scheduledStartTime).toLocaleString(
                          "vi-VN",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        Chưa thiết lập giờ bắt đầu
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-gray-100 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Nội dung
                  </p>
                  <p className="mt-1 text-base font-medium text-gray-900">
                    {activeSetupSummary.contentName}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-100 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {activeSetupSummary.isTeamMatch
                      ? "Đội biểu diễn"
                      : "VĐV biểu diễn"}
                  </p>
                  <p className="mt-1 text-base font-medium text-gray-900">
                    {activeSetupSummary.participantsDisplay}
                  </p>

                  {/* Athlete Presence Confirmation */}
                  {activeSetupSummary.match.participantIds &&
                    activeSetupSummary.match.participantIds.length > 0 && (
                      <div className="mt-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={
                              activeSetupSummary.match.participantIds.every(
                                (id) =>
                                  setupModal.athletesPresent?.[id] === true
                              ) || false
                            }
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              activeSetupSummary.match.participantIds.forEach(
                                (participantId) => {
                                  handleUpdateAthletePresence(
                                    participantId,
                                    isChecked
                                  );
                                }
                              );
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            Xác nhận vận động viên đã có mặt
                          </span>
                        </label>
                      </div>
                    )}
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
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={30}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={setupModal.defaultTimerSec}
                      onChange={(e) =>
                        setSetupModal((prev) => ({
                          ...prev,
                          defaultTimerSec: Number(e.target.value),
                        }))
                      }
                    />
                    {onSaveDuration && (
                      <button
                        type="button"
                        onClick={onSaveDuration}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        Lưu
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Nhập thời gian tối đa cho tiết mục. Giá trị tối thiểu 30
                    giây.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sân thi đấu
                  </label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    {onSaveField && (
                      <button
                        type="button"
                        onClick={onSaveField}
                        disabled={
                          !setupModal.fieldId ||
                          setupModal.fieldId.trim() === ""
                        }
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        Lưu
                      </button>
                    )}
                  </div>
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
      </div>
      {renderScheduledTimeModal()}
    </>
  );
}
