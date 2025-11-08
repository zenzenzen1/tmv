export interface TeamDto {
  id: string;
  cycleId: string;
  code: string;
  name?: string;
  description?: string;
}

export interface TeamCreateRequest {
  code: string;
  name?: string;
  description?: string;
}

export interface TeamUpdateRequest {
  name?: string;
  description?: string;
}

import type { TeamMemberAddRequest } from "./teammember";

export interface TeamWithMembersCreateRequest {
  team: TeamCreateRequest;
  members: TeamMemberAddRequest[];
}

export type { TeamMemberAddRequest };
