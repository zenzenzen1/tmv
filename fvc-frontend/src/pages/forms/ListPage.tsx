import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../config/endpoints';
import { useToast } from '../../components/common/ToastContext';
import {
  CommonTable,
  type TableColumn,
} from '../../components/common/CommonTable';

type FormRow = {
  id: string;
  name: string;
  description: string;
  formType: string;
  fieldCount: number;
  createdAt: string;
  updatedAt: string;
  status: "DRAFT" | "PUBLISH" | "ARCHIVED" | "POSTPONE";
};

export default function FormListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;
  const [rows, setRows] = useState<FormRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "DRAFT" | "PUBLISH" | "ARCHIVED" | "POSTPONE"
  >("ALL");

  const columns: Array<TableColumn<FormRow>> = useMemo(
    () => [
      {
        key: "name",
        title: "Tên Form",
        className: "text-[15px] w-64",
      },
      {
        key: "description",
        title: "Mô tả",
        className: "text-[15px] w-96",
      },
      {
        key: "formType",
        title: "Loại Form",
        className: "text-[15px] w-40",
        render: (r: FormRow) => (
          <span className="text-sm">
            {r.formType === 'CLUB_REGISTRATION' ? 'Đăng ký câu lạc bộ' : 'Đăng ký giải đấu'}
          </span>
        ),
      },
      {
        key: "fieldCount",
        title: "Số câu hỏi",
        className: "text-[15px] w-24 text-center",
        render: (r: FormRow) => (
          <span className="text-sm">{r.fieldCount}</span>
        ),
      },
      {
        key: "createdAt",
        title: "Ngày tạo",
        className: "text-[15px] w-36",
        render: (r: FormRow) => (
          <span className="text-sm">
            {new Date(r.createdAt).toLocaleDateString('vi-VN')}
          </span>
        ),
      },
      {
        key: "status",
        title: "Trạng thái",
        className: "text-[15px] w-40",
        render: (r: FormRow) => (
          <div className="flex items-center gap-2">
            <select
              className={`rounded-md px-2 py-1 text-xs border ${
                r.status === "PUBLISH"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : r.status === "ARCHIVED"
                  ? "bg-rose-50 text-rose-600 border-rose-200"
                  : r.status === "POSTPONE"
                  ? "bg-gray-100 text-gray-700 border-gray-300"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
              value={r.status}
              onChange={async (e) => {
                const val = e.target.value as FormRow["status"];
                try {
                  // Optimistic update
                  setRows((prev) =>
                    prev.map((row) =>
                      row.id === r.id ? { ...row, status: val } : row
                    )
                  );
                  await apiService.put<void>(
                    `${API_ENDPOINTS.APPLICATION_FORMS.BASE}/${r.id}`,
                    { status: val }
                  );
                  toast.success("Cập nhật trạng thái thành công");
                  loadForms(); // Refresh data
                } catch (err) {
                  console.error("Failed to update status", err);
                  // Rollback optimistic update on failure
                  setRows((prev) =>
                    prev.map((row) =>
                      row.id === r.id ? { ...row, status: r.status } : row
                    )
                  );
                  toast.error("Cập nhật trạng thái thất bại");
                }
              }}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISH">Đã xuất bản</option>
              <option value="ARCHIVED">Lưu trữ</option>
              <option value="POSTPONE">Hoãn</option>
            </select>
          </div>
        ),
        sortable: false,
      },
      {
        key: "actions",
        title: "Thao tác",
        className: "text-[15px] whitespace-nowrap w-40",
        render: (r: FormRow) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewForm(r.id)}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
            >
              Xem
            </button>
            <button
              onClick={() => handleEditForm(r.id)}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
            >
              Sửa
            </button>
          </div>
        ),
        sortable: false,
      },
    ],
    [toast]
  );

  const loadForms = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.get<any>(API_ENDPOINTS.APPLICATION_FORMS.BASE);
      
      if (response.success && response.data) {
        const allForms: FormRow[] = response.data.map((form: any) => ({
          id: form.id,
          name: form.name,
          description: form.description || "",
          formType: form.formType || "CLUB_REGISTRATION",
          fieldCount: form.fields?.length || 0,
          createdAt: form.createdAt || "",
          updatedAt: form.updatedAt || "",
          status: (form.status as FormRow["status"]) || "DRAFT",
        }));

        // Client-side filtering
        const filtered = allForms.filter((row) => {
          const matchesText = searchText
            ? (row.name + " " + row.description)
                .toLowerCase()
                .includes(searchText.toLowerCase())
            : true;
          const matchesStatus =
            statusFilter === "ALL"
              ? true
              : row.status === statusFilter;
          return matchesText && matchesStatus;
        });

        setTotal(filtered.length);
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        setRows(filtered.slice(start, end));
      } else {
        setRows([]);
        setTotal(0);
      }
    } catch (err: any) {
      console.error("Error loading forms:", err);
      toast.error(err?.message || 'Tải danh sách form thất bại');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, [page, searchText, statusFilter]);

  const handleEditForm = (formId: string) => {
    navigate(`/manage/forms/${formId}/edit`); 
  };

  const handleViewForm = (formId: string) => {
    navigate(`/manage/forms/${formId}/view`);
  };

  const handleCreateNew = () => {
    navigate('/manage/forms/new');
  };

  return (
    <div className="px-6 pb-10 w-full">
      <div className="flex items-center justify-between py-4">
        <h1 className="text-[15px] font-semibold text-gray-800">
          Quản lý Form
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateNew}
            className="rounded-md bg-[#377CFB] px-3 py-2 text-white text-sm shadow hover:bg-[#2f6ae0]"
          >
            + Tạo form mới
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <input
          value={searchText}
          onChange={(e) => {
            setPage(1);
            setSearchText(e.target.value);
          }}
          placeholder="Tìm tên form / mô tả..."
          className="w-80 rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value as any);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PUBLISH">Đã xuất bản</option>
          <option value="ARCHIVED">Lưu trữ</option>
          <option value="POSTPONE">Hoãn</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      <CommonTable<FormRow>
        columns={columns}
        data={rows}
        keyField="id"
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
