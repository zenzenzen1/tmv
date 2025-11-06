export type PhaseStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE";

export interface ChallengePhaseDto {
  id: string;
  cycleId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: PhaseStatus;
  order?: number | null;
}

export interface ChallengePhaseCreateRequest {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: PhaseStatus;
  order?: number | null;
}

export interface ChallengePhaseUpdateRequest extends ChallengePhaseCreateRequest {}

export interface PhaseOrderUpdate {
  phaseId: string;
  order: number;
}


