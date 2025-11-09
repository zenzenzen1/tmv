import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import LoadingSpinner from "../../components/common/LoadingSpinner";

type FormField = {
  id: string;
  label: string;
  name: string;
  fieldType: string;
  required: boolean;
  sortOrder: number;
  options?: string;
};

type FormMeta = {
  id: string;
  name: string;
  description?: string;
  status: string;
  fields?: FormField[];
};

export default function TournamentFormViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [meta, setMeta] = useState<FormMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadForm();
    }
  }, [id]);

  const loadForm = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get<FormMeta>(
        API_ENDPOINTS.TOURNAMENT_FORMS.BY_ID(id as string)
      );

      if (res.success && res.data) {
        setMeta(res.data);
      } else {
        setError("Không tìm thấy form");
      }
    } catch (err: any) {
      console.error("Error loading form:", err);
      setError("Không thể tải form: " + (err?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const parseOptions = (options?: string): string[] => {
    if (!options) return [];
    try {
      const parsed = JSON.parse(options);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return options.split(",").map((s) => s.trim());
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !meta) {
    return (
      <div className="min-h-screen bg-[#f0ebf8] py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-md border border-[#dadce0] p-6">
            <div className="text-center">
              <p className="text-red-600">{error || "Không tìm thấy form"}</p>
              <button
                onClick={() => navigate(-1)}
                className="mt-4 text-blue-600 hover:underline"
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0ebf8] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Top color bar like Google Forms */}
        <div
          className="h-4 w-full rounded-t-xl"
          style={{
            background: "linear-gradient(90deg, #673ab7 0%, #8e24aa 100%)",
          }}
        />

        {/* Form card */}
        <div className="bg-white rounded-b-xl shadow-md border border-[#dadce0]">
          {/* Header Section */}
          <div className="p-6 pb-4 border-b border-[#dadce0]">
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-blue-600 hover:underline mb-4"
            >
              ← Quay lại
            </button>
            <h1 className="text-3xl font-semibold text-[#202124]">
              {meta.name}
            </h1>
            {meta.description && (
              <p className="mt-2 text-sm text-[#5f6368]">{meta.description}</p>
            )}
          </div>

          {/* Form Fields - Read Only */}
          <div className="p-6 space-y-6">
            {meta.fields && meta.fields.length > 0 && (
              <>
                {meta.fields
                  .filter((field) => field.label !== "Nội dung thi đấu")
                  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                  .map((field) => {
                    return (
                      <div
                        key={field.id}
                        className="rounded-xl border border-[#dadce0] p-5"
                      >
                        <label className="block text-base font-medium text-[#202124] mb-3">
                          {field.label}
                          {field.required && (
                            <span className="text-[#d93025] ml-1">*</span>
                          )}
                        </label>
                        <div className="text-sm">
                          {(field.fieldType === "TEXT" ||
                            field.fieldType === "SHORT-ANSWER" ||
                            field.fieldType === "EMAIL" ||
                            field.fieldType === "DATE") && (
                            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                              [Xem trước - không có dữ liệu]
                            </div>
                          )}
                          {field.fieldType === "TEXTAREA" && (
                            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 min-h-[80px]">
                              [Xem trước - không có dữ liệu]
                            </div>
                          )}
                          {(field.fieldType === "SELECT" ||
                            field.fieldType === "DROPDOWN" ||
                            field.fieldType === "MULTIPLE-CHOICE") && (
                            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                              [Xem trước - không có dữ liệu]
                            </div>
                          )}
                          {field.fieldType === "CHECKBOX" && (
                            <div className="space-y-2">
                              {parseOptions(field.options).map((option) => (
                                <div
                                  key={option}
                                  className="flex items-center text-gray-500"
                                >
                                  <div className="mr-2 w-4 h-4 border border-gray-300 rounded bg-gray-50"></div>
                                  {option}
                                </div>
                              ))}
                            </div>
                          )}
                          {field.fieldType === "FILE-UPLOAD" && (
                            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                              [Xem trước - không có file]
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </>
            )}

            {/* Competition Type Selection - Read Only */}
            <div className="rounded-xl border border-[#dadce0] p-5">
              <label className="block text-base font-medium text-[#202124] mb-3">
                Nội dung thi đấu <span className="text-[#d93025] ml-1">*</span>
              </label>
              <div className="text-sm">
                <div className="space-y-3">
                  <div className="flex items-center text-gray-500">
                    <div className="mr-3 w-4 h-4 border border-gray-300 rounded-full bg-gray-50"></div>
                    <span className="text-sm font-medium">Đối kháng</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <div className="mr-3 w-4 h-4 border border-gray-300 rounded-full bg-gray-50"></div>
                    <span className="text-sm font-medium">Quyền</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <div className="mr-3 w-4 h-4 border border-gray-300 rounded-full bg-gray-50"></div>
                    <span className="text-sm font-medium">Võ nhạc</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
