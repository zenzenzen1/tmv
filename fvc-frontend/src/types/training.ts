export type TrainingSessionStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface TrainingSessionDto {
  id: string;
  title: string;
  description?: string;
  cycleId: string;
  teamId?: string | null;
  phaseId?: string | null;
  locationId?: string | null;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  capacity?: number | null;
  status: TrainingSessionStatus;
  createdBy?: { id: string; fullName?: string } | null;
  updatedBy?: { id: string; fullName?: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrainingSessionListDto extends TrainingSessionDto {}

export interface TrainingSessionCreateRequest {
  title: string;
  description?: string;
  cycleId: string;
  teamId?: string;
  phaseId?: string;
  locationId?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  capacity?: number;
  status?: TrainingSessionStatus; // default PLANNED
}

export interface TrainingSessionUpdateRequest {
  title?: string;
  description?: string;
  teamId?: string;
  phaseId?: string;
  locationId?: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  status?: TrainingSessionStatus;
}

export interface TrainingSessionCalendarParams {
  startDate: string; // ISO date (YYYY-MM-DD)
  endDate: string; // ISO date (YYYY-MM-DD)
  cycleId?: string;
  teamId?: string;
  phaseId?: string;
}


