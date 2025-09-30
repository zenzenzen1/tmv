import React from "react";

export type TableColumn<T> = {
  key: keyof T | string;
  title: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
};

export type CommonTableProps<T> = {
  columns: Array<TableColumn<T>>;
  data: T[];
  keyField?: keyof T;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  className?: string;
};

function range(from: number, to: number): number[] {
  const result: number[] = [];
  for (let i = from; i <= to; i += 1) result.push(i);
  return result;
}

export function CommonTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  page = 1,
  pageSize = 10,
  total = data.length,
  onPageChange,
  className,
}: CommonTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className={className}>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white/95 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#f6f9ff]">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600 ${
                    col.className ?? ""
                  }`}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, idx) => {
              const keyValue = keyField ? (row[keyField] as React.Key) : idx;
              return (
                <tr key={keyValue} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={`px-5 py-3 text-sm text-gray-800 ${
                        col.className ?? ""
                      }`}
                    >
                      {col.render
                        ? col.render(row)
                        : (row[col.key as keyof T] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          onClick={() => onPageChange?.(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          &lt;
        </button>
        {range(1, totalPages).map((p) => (
          <button
            key={p}
            className={`rounded px-3 py-1 text-sm ${
              p === page
                ? "bg-[#2563eb] text-white shadow"
                : "border border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => onPageChange?.(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          &gt;
        </button>
      </div>
    </div>
  );
}

export default CommonTable;
