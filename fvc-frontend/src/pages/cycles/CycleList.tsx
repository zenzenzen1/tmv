import { useEffect, useState } from "react";
import { useCyclesStore } from "../../stores/cyclesStore";
import type { ChallengeCycleDto, ChallengeCycleStatus } from "../../types/cycle";

export default function CycleList() {
  const { items, page, loading, error, fetch } = useCyclesStore();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ChallengeCycleStatus | "">("");

  useEffect(() => {
    fetch({ page: 0 });
  }, [fetch]);

  const onFilter = () => {
    fetch({ page: 0, search: search || undefined, status: status || undefined });
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Quản Lý Chu Kỳ Tuyển Thành Viên</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Tổng Số Chu Kỳ" value={page?.totalElements ?? 0} icon="📦" />
        <StatCard label="Chu Kỳ Đang Hoạt Động" value={(items || []).filter(c => c.status === "ACTIVE").length} icon="⚡" />
        <StatCard label="Thành Viên Đang Thử Thách" value={45} icon="👥" />
        <StatCard label="Số Đội" value={3} icon="👤" />
      </div>

      <div className="flex items-center gap-3">
        <input className="input-field flex-1" placeholder="Tìm kiếm theo tên chu kỳ, mô tả..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input-field max-w-xs" value={status}
                onChange={(e) => setStatus(e.target.value as any)}>
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">Nháp</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="COMPLETED">Đã hoàn thành</option>
          <option value="ARCHIVED">Đã lưu trữ</option>
        </select>
        <button className="btn-primary" onClick={onFilter}>Lọc</button>
        <a className="btn-primary" href="/manage/cycles/new">+ Tạo Chu Kỳ Mới</a>
      </div>

      <div className="card">
        <table className="w-full text-left">
          <thead>
          <tr className="border-b">
            <th className="py-2 px-3">#</th>
            <th className="py-2 px-3">Tên Chu Kỳ</th>
            <th className="py-2 px-3">Trạng Thái</th>
            <th className="py-2 px-3">Ngày Bắt Đầu</th>
            <th className="py-2 px-3">Ngày Kết Thúc</th>
            <th className="py-2 px-3">Thao Tác</th>
          </tr>
          </thead>
          <tbody>
          {loading && (
            <tr><td colSpan={6} className="py-6 text-center">Đang tải...</td></tr>
          )}
          {error && !loading && (
            <tr><td colSpan={6} className="py-6 text-center text-red-600">{error}</td></tr>
          )}
          {!loading && !error && items.map((c: ChallengeCycleDto, idx: number) => (
            <tr key={c.id} className="border-t">
              <td className="py-3 px-3">{idx + 1}</td>
              <td className="py-3 px-3">
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-gray-500">{c.description?.slice(0, 40) || ""}</div>
              </td>
              <td className="py-3 px-3"><StatusBadge status={c.status} /></td>
              <td className="py-3 px-3">{c.startDate}</td>
              <td className="py-3 px-3">{c.endDate}</td>
              <td className="py-3 px-3">
                <a className="text-primary-600 hover:underline" href={`/manage/cycles/${c.id}`}>Xem</a>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="card flex items-center justify-between">
      <div>
        <div className="text-gray-500 text-sm">{label}</div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: ChallengeCycleStatus }) {
  const map: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    ACTIVE: "bg-green-100 text-green-700",
    COMPLETED: "bg-blue-100 text-blue-700",
    ARCHIVED: "bg-purple-100 text-purple-700",
  };
  return <span className={`px-2 py-1 rounded text-xs ${map[status]}`}>{status}</span>;
}


