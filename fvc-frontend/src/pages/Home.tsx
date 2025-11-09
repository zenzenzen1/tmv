import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import type { PaginationResponse } from "../types/api";
import { API_ENDPOINTS } from "../config/endpoints";

type FormRow = {
  id: string;
  formTitle: string;
  description?: string;
  status: "draft" | "publish" | "archived" | "postpone";
  endDate?: string | null;
  expired?: boolean;
};

export default function Home() {
  const [rows, setRows] = useState<FormRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const fetchForms = async () => {
    try {
      setLoading(true);
      const res = await api.get<
        PaginationResponse<{
          id: string;
          formTitle: string;
          description?: string;
          status: string;
        }>
      >(API_ENDPOINTS.TOURNAMENT_FORMS.BASE, {
        page: 0,
        size: 50,
        _ts: Date.now(),
      });
      const baseList = res.data.content
        .map((i) => ({
          id: i.id,
          formTitle: i.formTitle,
          description: (i as { description?: string }).description,
          status: (i.status as FormRow["status"]) || "draft",
        }))
        .filter((i) => {
          const status = i.status?.toLowerCase();
          return status === "publish" || status === "PUBLISH";
        });

      // Load details to get endDate and compute expiration
      const detailed = await Promise.all(
        baseList.map(async (b) => {
          try {
            const detail = await api.get<{
              description?: string;
              endDate?: string;
            }>(API_ENDPOINTS.TOURNAMENT_FORMS.BY_ID(b.id));
            const endDate: string | undefined = detail.data?.endDate;
            const description: string | undefined = detail.data?.description;
            let expired = false;
            if (endDate) {
              const endTs = Date.parse(endDate);
              if (!Number.isNaN(endTs)) expired = Date.now() > endTs;
            }
            return {
              ...b,
              description: description || b.description,
              endDate: endDate || null,
              expired,
            } as FormRow;
          } catch {
            return { ...b } as FormRow;
          }
        })
      );
      setRows(detailed);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();

    const onFocus = () => fetchForms();
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchForms();
    };
    const onFormsChanged = () => fetchForms();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("forms:changed", onFormsChanged as EventListener);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(
        "forms:changed",
        onFormsChanged as EventListener
      );
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F6FF] to-[#E0EAFF]">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-800">
            Form đang mở để điền
          </h1>
          <button
            onClick={fetchForms}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Làm mới
          </button>
        </div>
        {loading ? (
          <div className="text-sm text-gray-600">Đang tải...</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-gray-600">Chưa có form nào được mở.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rows.map((f) => (
              <div
                key={f.id}
                className="rounded-xl bg-white border border-gray-200 shadow-sm p-4"
              >
                <div className="text-[15px] font-semibold text-gray-800 mb-1">
                  {f.formTitle}
                </div>
                {f.description && (
                  <div className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {f.description}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  {f.expired ? (
                    <span className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                      HẾT HẠN
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                      ĐANG MỞ
                    </span>
                  )}
                  {f.expired ? (
                    <button
                      disabled
                      className="rounded-md bg-gray-300 px-3 py-1.5 text-white text-sm cursor-not-allowed"
                    >
                      Đã hết hạn
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/published-form/${f.id}`)}
                      className="rounded-md bg-[#377CFB] px-3 py-1.5 text-white text-sm hover:bg-[#2e6de0]"
                    >
                      Điền form
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
