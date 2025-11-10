import apiService from "./api";
import { API_ENDPOINTS } from "../config/endpoints";
import type { BaseResponse } from "../types/api";
import type {
  SessionAttendanceDto,
  SessionAttendanceCreateRequest,
  SessionAttendanceUpdateRequest,
  BulkAttendanceRequest,
  AttendanceStatistics,
} from "../types/attendance";

export const attendanceService = {
  async listBySession(sessionId: string): Promise<BaseResponse<SessionAttendanceDto[]>> {
    return apiService.get<SessionAttendanceDto[]>(API_ENDPOINTS.ATTENDANCE.BY_SESSION(sessionId));
  },

  async statistics(sessionId: string): Promise<BaseResponse<AttendanceStatistics>> {
    return apiService.get<AttendanceStatistics>(API_ENDPOINTS.ATTENDANCE.STATISTICS(sessionId));
  },

  async mark(sessionId: string, data: SessionAttendanceCreateRequest): Promise<BaseResponse<SessionAttendanceDto>> {
    return apiService.post<BaseResponse<SessionAttendanceDto>>(API_ENDPOINTS.ATTENDANCE.BY_SESSION(sessionId), data);
  },

  async bulkMark(sessionId: string, data: BulkAttendanceRequest): Promise<BaseResponse<SessionAttendanceDto[]>> {
    return apiService.post<BaseResponse<SessionAttendanceDto[]>>(API_ENDPOINTS.ATTENDANCE.BULK(sessionId), data);
  },

  async update(sessionId: string, id: string, data: SessionAttendanceUpdateRequest): Promise<BaseResponse<SessionAttendanceDto>> {
    return apiService.put<SessionAttendanceDto>(API_ENDPOINTS.ATTENDANCE.BY_ATTENDANCE_ID(sessionId, id), data);
  },
};


