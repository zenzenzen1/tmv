import apiClient from "../config/axios";
import type { BaseResponse, PaginationResponse, RequestParams } from "../types/api";
import type {
  ChallengePhaseDto,
  ChallengePhaseCreateRequest,
  ChallengePhaseUpdateRequest,
  PhaseStatus,
  PhaseOrderUpdate,
} from "../types/phase";

const cyclesPath = "/v1/cycles";
const phasesPath = "/phases"; // For nested paths under cycles
const phasesBasePath = "/v1/phases"; // For direct phase operations

export const phaseService = {
  listByCycle: async (
    cycleId: string,
    params: RequestParams & { status?: PhaseStatus; search?: string }
  ) => {
    const res = await apiClient.get<BaseResponse<PaginationResponse<ChallengePhaseDto>>>(
      `${cyclesPath}/${cycleId}${phasesPath}`,
      { params }
    );
    return res.data.data;
  },

  getById: async (id: string) => {
    const res = await apiClient.get<BaseResponse<ChallengePhaseDto>>(`${phasesBasePath}/${id}`);
    return res.data.data;
  },

  create: async (cycleId: string, data: ChallengePhaseCreateRequest) => {
    const res = await apiClient.post<BaseResponse<ChallengePhaseDto>>(
      `${cyclesPath}/${cycleId}${phasesPath}`,
      data
    );
    return res.data.data;
  },

  update: async (id: string, data: ChallengePhaseUpdateRequest) => {
    const res = await apiClient.put<BaseResponse<ChallengePhaseDto>>(`${phasesBasePath}/${id}` , data);
    return res.data.data;
  },

  reorder: async (cycleId: string, orderUpdates: PhaseOrderUpdate[]) => {
    const res = await apiClient.post<BaseResponse<void>>(
      `${cyclesPath}/${cycleId}${phasesPath}/reorder`,
      orderUpdates
    );
    return res.data;
  },
};


