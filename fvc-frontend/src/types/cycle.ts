export type ChallengeCycleStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";

export interface ChallengeCycleDto {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  cycleDurationMonths?: number;
  phaseDurationWeeks?: number;
  status: ChallengeCycleStatus;
  trainSessionsRequired?: number;
  eventsRequired?: number;
}

export interface ChallengeCycleCreateRequest {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string; // Optional - sẽ được tính từ startDate + cycleDurationMonths
  cycleDurationMonths: number;
  phaseDurationWeeks: number;
  status: ChallengeCycleStatus;
  trainSessionsRequired: number;
  eventsRequired: number;
}

export interface ChallengeCycleUpdateRequest extends ChallengeCycleCreateRequest {}

import type { ChallengePhaseCreateRequest } from "./phase";
import type { TeamWithMembersCreateRequest } from "./team";

export interface ChallengeCycleBulkCreateRequest {
  cycle: ChallengeCycleCreateRequest;
  phases: ChallengePhaseCreateRequest[];
  teams: TeamWithMembersCreateRequest[];
}

export type { ChallengePhaseCreateRequest, TeamWithMembersCreateRequest };
