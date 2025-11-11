export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export interface SessionAttendanceDto {
  id: string;
  sessionId: string;
  user: { id: string; fullName?: string };
  status: AttendanceStatus;
  markedAt?: string;
  markedBy?: { id: string; fullName?: string } | null;
  method?: string | null;
  note?: string | null;
}

export interface SessionAttendanceCreateRequest {
  userId: string;
  status: AttendanceStatus;
  note?: string;
}

export interface SessionAttendanceUpdateRequest {
  status: AttendanceStatus;
  note?: string;
}

export interface BulkAttendanceRequest {
  attendances: SessionAttendanceCreateRequest[];
}

export interface AttendanceStatistics {
  present: number;
  absent: number;
  late: number;
  excused: number;
}


