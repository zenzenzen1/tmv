export interface LocationDto {
  id: string;
  name: string;
  address?: string;
  capacityDefault?: number | null;
  description?: string;
  lat?: number | null;
  lng?: number | null;
  isActive: boolean;
  createdBy?: { id: string; fullName?: string } | null;
  updatedBy?: { id: string; fullName?: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationCreateRequest {
  name: string;
  address?: string;
  capacityDefault?: number;
  description?: string;
  lat?: number;
  lng?: number;
}

export interface LocationUpdateRequest {
  name?: string;
  address?: string;
  capacityDefault?: number;
  description?: string;
  lat?: number;
  lng?: number;
  isActive?: boolean;
}

export interface LocationFilters {
  page?: number;
  size?: number;
  search?: string;
  isActive?: boolean;
}


