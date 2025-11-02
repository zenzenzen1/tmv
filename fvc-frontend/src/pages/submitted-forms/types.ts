export type SubmittedRow = {
  id: string;
  submittedAt: string;
  fullName: string;
  email: string;
  studentCode: string;
  phone: string;
  note: string;
  formType?: string;
  formName?: string;
  applicationFormConfigId?: string;
  stt?: number;
  formData?: any;
  [key: string]: any; // Cho phép các trường động từ form data
};

export interface SubmittedFormFilters {
  status: string;
  dateFrom: string;
  dateTo: string;
  query: string;
}

export interface SubmittedFormPagination {
  page: number;
  pageSize: number;
  totalElements: number;
}


