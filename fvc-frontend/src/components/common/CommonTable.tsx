import React, { useMemo, useState } from "react";

export type TableColumn<T> = {
  key: keyof T | string;
  title: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
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

  const [sortKey, setSortKey] = useState<string | keyof T | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function handleHeaderClick(col: TableColumn<T>) {
    const isSortable = col.sortable ?? true;
    if (!isSortable) return;
    const colKey = col.key;
    if (sortKey === colKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(colKey);
      setSortDir("asc");
    }
  }

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const copy = [...data];

    const getValue = (row: T): unknown => {
      const key = sortKey;
      const record = row as unknown as Record<string, unknown>;
      return record[String(key)];
    };

    copy.sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);

      let cmp = 0;
      const ta = typeof va;
      const tb = typeof vb;

      if (ta === "number" && tb === "number") {
        cmp = (va as number) - (vb as number);
      } else if (va instanceof Date && vb instanceof Date) {
        cmp = va.getTime() - vb.getTime();
      } else {
        const sa = va == null ? "" : String(va).toLowerCase();
        const sb = vb == null ? "" : String(vb).toLowerCase();
        if (sa < sb) cmp = -1;
        else if (sa > sb) cmp = 1;
        else cmp = 0;
      }

      return sortDir === "asc" ? cmp : -cmp;
    });

    return copy;
  }, [data, sortKey, sortDir]);

  return (
    <div className={className}>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white/95 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
        <table className="w-full table-auto divide-y divide-gray-200">
          <thead className="bg-[#f6f9ff]">
            <tr>
              {columns.map((col) => {
                const isSortable = col.sortable ?? true;
                const isSorted = sortKey === col.key;
                const ariaSort: "none" | "ascending" | "descending" = isSorted
                  ? sortDir === "asc"
                    ? "ascending"
                    : "descending"
                  : "none";
                return (
                  <th
                    key={String(col.key)}
                    aria-sort={ariaSort}
                    className={`px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600 break-words ${
                      col.className ?? ""
                    }`}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => handleHeaderClick(col)}
                        className="inline-flex items-center gap-1 hover:text-gray-900 focus:outline-none"
                      >
                        <span>{col.title}</span>
                        {isSorted && (
                          <span className="text-xs">
                            {sortDir === "asc" ? "\u2191" : "\u2193"}
                          </span>
                        )}
                      </button>
                    ) : (
                      <span>{col.title}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedData.map((row, idx) => {
              const keyValue = keyField ? (row[keyField] as React.Key) : idx;
              return (
                <tr key={keyValue} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={`px-5 py-3 text-sm text-gray-800 align-top break-words ${
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
