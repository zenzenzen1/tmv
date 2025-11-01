import { useEffect, useState } from "react";
import api from "@/services/api";
import type { SubmittedRow, SubmittedFormFilters, SubmittedFormPagination } from "../types";
import { 
  extractFormDataFields, 
  extractNameFromFormData, 
  safePick 
} from "../utils/formDataUtils";
import { FORM_TYPE_CLUB_REGISTRATION } from "../constants";

interface UseSubmittedFormsParams extends SubmittedFormPagination, SubmittedFormFilters {}

interface UseSubmittedFormsResult {
  rows: SubmittedRow[];
  loading: boolean;
  error: string;
  totalElements: number;
}

export function useSubmittedForms(params: UseSubmittedFormsParams): UseSubmittedFormsResult {
  const [rows, setRows] = useState<SubmittedRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [totalElements, setTotalElements] = useState<number>(0);

  useEffect(() => {
    let ignore = false;
    
    async function fetchData() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get<{
          content: any[];
          page: number;
          size: number;
          totalElements: number;
        }>("/v1/submitted-forms", {
          type: FORM_TYPE_CLUB_REGISTRATION,
          page: params.page - 1,
          size: params.pageSize,
          sortBy: "createdAt",
          sortDirection: "desc",
          status: params.status || undefined,
          dateFrom: params.dateFrom || undefined,
          dateTo: params.dateTo || undefined,
          search: params.query || undefined,
        });
        
        if (!ignore) {
          const mapped: SubmittedRow[] = (res.data?.content ?? []).map((s: any, idx: number) => {
            const emailFromUser = s.userPersonalMail || s.userEduMail || "";
            const codeFromUser = s.userStudentCode || "";
            const nameFromUser = s.userFullName || "";
            const phoneFromForm = s.formData ? safePick(s.formData, ["phone", "sdt", "mobile"]) : "";
            
            // Extract tất cả các trường từ form data
            const formFields = extractFormDataFields(s.formData);
            
            // Logic ưu tiên tên: 1) Từ bảng user nếu có user_id, 2) Từ form_data nếu không có user_id
            let finalName = "";
            if (s.userId && nameFromUser) {
              finalName = nameFromUser;
            } else {
              finalName = s.formData ? extractNameFromFormData(s.formData) : "";
            }
            
            return {
              id: String(s.id ?? idx),
              submittedAt: s.createdAt ?? "",
              fullName: finalName,
              email: emailFromUser || (s.formData ? safePick(s.formData, ["email", "mail"]) : ""),
              studentCode: codeFromUser || (s.formData ? safePick(s.formData, ["studentCode", "mssv", "msv"]) : ""),
              phone: phoneFromForm,
              note: s.reviewerNote ?? "",
              formData: s.formData,
              formType: s.formType || "",
              formName: s.applicationFormConfigName || "",
              applicationFormConfigId: s.applicationFormConfigId || "",
              ...formFields,
            } as SubmittedRow;
          });
          
          setRows(mapped);
          setTotalElements(res.data?.totalElements ?? mapped.length);
        }
      } catch (e: any) {
        if (!ignore) {
          setError(e?.message || "Không tải được dữ liệu");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    
    fetchData();
    return () => {
      ignore = true;
    };
  }, [
    params.page, 
    params.pageSize, 
    params.status, 
    params.dateFrom, 
    params.dateTo, 
    params.query
  ]);

  return { rows, loading, error, totalElements };
}


