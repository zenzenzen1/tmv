export type TeamMemberStatus = "ACTIVE" | "REMOVED";

export interface TeamMemberDto {
  id: string;
  teamId: string;
  userId: string;
  status: TeamMemberStatus;
  joinedAt?: string;
  leftAt?: string;
}

export interface TeamMemberAddRequest {
  userId: string;
  note?: string;
}

export interface TeamMemberRemoveRequest {
  note?: string;
}

export interface TeamMemberBulkAddRequest {
  userIds: string[];
  note?: string;
}


