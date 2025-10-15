import React from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

// ==========================
// Types (shared)
// ==========================
export type Gender = "Nam" | "Nữ" | "Khác";
export type FistFormType = "Đơn Luyện" | "Song Luyện" | "Đa Luyện" | "Đồng Đội" | "Tự chọn";
export type AthleteStatus = "Đủ điều kiện" | "Hoàn tất" | "Đạt HN" | "Đang chờ" | "Đang xét";

export interface Athlete {
  id: string;
  name: string;
  email: string;
  gender: Gender;
  formType: FistFormType; // Hình thức
  content: string; // Nội dung quyền
  studentId?: string; // MSSV
  club?: string; // CLB
  status: AthleteStatus;
}

export interface ArrangeOrderItem {
  id: string; // athlete id or pair id
  display: string; // label shown on the right list
  meta?: string; // optional extra info (e.g., club)
}

// ==========================
// UI helpers
// ==========================
const Badge: React.FC<{ label: string } & React.HTMLAttributes<HTMLSpanElement>> = ({ label, className = "", ...rest }) => {
  const palette: Record<string, string> = {
    "Đủ điều kiện": "bg-emerald-100 text-emerald-700",
    "Hoàn tất": "bg-purple-100 text-purple-700",
    "Đạt HN": "bg-rose-100 text-rose-700",
    "Đang chờ": "bg-amber-100 text-amber-700",
    "Đang xét": "bg-sky-100 text-sky-700",
  };
  const color = palette[label] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${color} ${className}`} {...rest}>
      {label}
    </span>
  );
};

// Draggable row for the right-side order list
const SortableItem: React.FC<{ id: string; primary: string; secondary?: string }>
= ({ id, primary, secondary }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded-xl border p-3 shadow-sm bg-white ${isDragging ? "ring-2 ring-indigo-500" : ""}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 shrink-0 rounded-lg border flex items-center justify-center">⋮⋮</div>
        <div>
          <div className="font-medium">{primary}</div>
          {secondary && <div className="text-xs text-gray-500">{secondary}</div>}
        </div>
      </div>
    </div>
  );
};

// ==========================
// PROPS for VIEW-ONLY component
// ==========================
export interface ArrangeFistOrderViewProps {
  // Filters/Selections (controlled from outside)
  tournamentOptions: string[];
  selectedTournament: string;
  onChangeTournament?: (value: string) => void;

  contentOptions: string[];
  selectedContent: string;
  onChangeContent?: (value: string) => void;

  searchQuery: string;
  onChangeSearch?: (value: string) => void;

  genderOptions: (Gender | "Tất cả")[];
  selectedGender: Gender | "Tất cả";
  onChangeGender?: (value: Gender | "Tất cả") => void;

  formOptions: (FistFormType | "Tất cả")[];
  selectedForm: FistFormType | "Tất cả";
  onChangeForm?: (value: FistFormType | "Tất cả") => void;

  clubOptions: (string | "Tất cả")[];
  selectedClub: string | "Tất cả";
  onChangeClub?: (value: string | "Tất cả") => void;

  // Table data (read-only)
  athletes: Athlete[];
  page: number;
  total: number;
  pageSize: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;

  // Order list (controlled)
  order: ArrangeOrderItem[];
  onAddToOrder?: (athlete: Athlete) => void;
  onRemoveFromOrder?: (id: string) => void;
  onReorder?: (next: ArrangeOrderItem[]) => void;
  onClearOrder?: () => void;
  onSaveOrder?: () => void;
}

// ==========================
// VIEW-ONLY COMPONENT (no data fetching, no internal state except dnd sensors)
// ==========================
const PAGE_HEADER = {
  title: "Danh sách VDV thi đấu quyền",
  subtitle: "Sắp xếp thứ tự ra sân cho nội dung Quyền",
};

export default function ArrangeFistOrderView(props: ArrangeFistOrderViewProps) {
  const {
    tournamentOptions,
    selectedTournament,
    onChangeTournament,
    contentOptions,
    selectedContent,
    onChangeContent,
    searchQuery,
    onChangeSearch,
    genderOptions,
    selectedGender,
    onChangeGender,
    formOptions,
    selectedForm,
    onChangeForm,
    clubOptions,
    selectedClub,
    onChangeClub,
    athletes,
    page,
    total,
    pageSize,
    onPrevPage,
    onNextPage,
    order,
    onAddToOrder,
    onRemoveFromOrder,
    onReorder,
    onClearOrder,
    onSaveOrder,
  } = props;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (!onReorder) return;
    const oldIndex = order.findIndex((i) => i.id === active.id);
    const newIndex = order.findIndex((i) => i.id === over.id);
    onReorder(arrayMove(order, oldIndex, newIndex));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-semibold">{PAGE_HEADER.title}</h1>
        <p className="text-sm text-gray-500">{PAGE_HEADER.subtitle}</p>
      </div>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <div className="col-span-2">
          <label className="mb-1 block text-sm text-gray-600">Chọn giải:</label>
          <select value={selectedTournament} onChange={(e) => onChangeTournament?.(e.target.value)} className="w-full rounded-xl border p-2.5">
            {tournamentOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Chọn nội dung:</label>
          <select value={selectedContent} onChange={(e) => onChangeContent?.(e.target.value)} className="w-full rounded-xl border p-2.5">
            {contentOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2 lg:col-span-2">
          <label className="mb-1 block text-sm text-gray-600">Từ khoá tên, MSSV, Email/CLB</label>
          <div className="flex gap-2">
            <input value={searchQuery} onChange={(e) => onChangeSearch?.(e.target.value)} placeholder="Nhập từ khoá..." className="w-full rounded-xl border p-2.5" />
            <button onClick={() => onChangeSearch?.("")} className="rounded-xl border px-3 text-sm">Xoá</button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Giới tính</label>
          <select value={selectedGender} onChange={(e) => onChangeGender?.(e.target.value as any)} className="w-full rounded-xl border p-2.5">
            {genderOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Hình thức</label>
          <select value={selectedForm} onChange={(e) => onChangeForm?.(e.target.value as any)} className="w-full rounded-xl border p-2.5">
            {formOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">CLB</label>
          <select value={selectedClub} onChange={(e) => onChangeClub?.(e.target.value)} className="w-full rounded-xl border p-2.5">
            {clubOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick filters like design (pills) */}
      <div className="mb-5 space-y-2">
        {/* Gender quick filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Giới tính:</span>
          {(["Tất cả", "Nam", "Nữ", "Khác"] as (Gender | "Tất cả")[]).map((g) => (
            <button
              key={g}
              onClick={() => onChangeGender?.(g)}
              className={`rounded-full border px-3 py-1 text-sm ${selectedGender === g ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 hover:bg-gray-50"}`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Form quick filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Hình thức:</span>
          {(["Tất cả", "Đơn Luyện", "Song Luyện", "Đa Luyện", "Đồng Đội", "Tự chọn"] as (FistFormType | "Tất cả")[]).map((f) => (
            <button
              key={f}
              onClick={() => onChangeForm?.(f)}
              className={`rounded-full border px-3 py-1 text-sm ${selectedForm === f ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 hover:bg-gray-50"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: table */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">STT</th>
                  <th className="px-4 py-3">Tên</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Giới tính</th>
                  <th className="px-4 py-3">Hình thức</th>
                  <th className="px-4 py-3">Nội dung</th>
                  <th className="px-4 py-3">MSSV</th>
                  <th className="px-4 py-3">CLB</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {athletes.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-500" colSpan={10}>Không có dữ liệu</td>
                  </tr>
                )}
                {athletes.map((a, idx) => (
                  <tr key={a.id} className="border-t">
                    <td className="px-4 py-3">{(page - 1) * pageSize + idx + 1}</td>
                    <td className="px-4 py-3 font-medium">{a.name}</td>
                    <td className="px-4 py-3 text-gray-600">{a.email}</td>
                    <td className="px-4 py-3">{a.gender}</td>
                    <td className="px-4 py-3">{a.formType}</td>
                    <td className="px-4 py-3">{a.content}</td>
                    <td className="px-4 py-3">{a.studentId}</td>
                    <td className="px-4 py-3">{a.club}</td>
                    <td className="px-4 py-3"><Badge label={a.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onAddToOrder?.(a)}
                        className="rounded-xl bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
                      >
                        Thêm vào thứ tự
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3">
              <div className="text-sm text-gray-600">Tổng {total} VĐV</div>
              <div className="flex items-center gap-2">
                <button className="rounded-xl border px-3 py-1 disabled:opacity-50" onClick={onPrevPage} disabled={page <= 1}>Trang trước</button>
                <span className="text-sm">{page}/{totalPages}</span>
                <button className="rounded-xl border px-3 py-1 disabled:opacity-50" onClick={onNextPage} disabled={page >= totalPages}>Trang sau</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: order list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Thứ tự thi quyền</h2>
            {order.length > 0 && (
              <button onClick={onClearOrder} className="text-sm text-gray-600 hover:underline">Xoá tất cả</button>
            )}
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={order.map((o) => o.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {order.length === 0 && (
                  <div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-500">
                    Chưa có VĐV. Chọn ở bảng bên trái để thêm vào thứ tự.
                  </div>
                )}
                {order.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <div className="w-8 shrink-0 text-center text-sm text-gray-500">{idx + 1}</div>
                    <div className="flex-1">
                      <SortableItem id={item.id} primary={item.display} secondary={item.meta} />
                    </div>
                    <button onClick={() => onRemoveFromOrder?.(item.id)} className="shrink-0 rounded-xl border px-2 py-1 text-sm">Gỡ</button>
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="pt-2">
            <button disabled={order.length === 0} onClick={onSaveOrder} className="w-full rounded-2xl bg-indigo-600 px-4 py-3 font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50">
              Lưu thứ tự
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
