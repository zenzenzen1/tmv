import React, { useState } from "react";
import type { SubmittedFormFilters } from "../types";

interface FiltersProps extends SubmittedFormFilters {
  onFiltersChange: (filters: Partial<SubmittedFormFilters>) => void;
  onResetFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

export default function Filters({
  status,
  dateFrom,
  dateTo,
  query,
  onFiltersChange,
  onResetFilters,
  filteredCount,
  totalCount,
}: FiltersProps) {
  const [dateError, setDateError] = useState<string>("");

  const handleFilterChange = (key: keyof SubmittedFormFilters, value: string) => {
    // Validate date range
    if (key === "dateFrom" || key === "dateTo") {
      const newDateFrom = key === "dateFrom" ? value : dateFrom;
      const newDateTo = key === "dateTo" ? value : dateTo;
      
      // Validate: Đến ngày không được nhỏ hơn Từ ngày
      if (newDateFrom && newDateTo && newDateFrom > newDateTo) {
        setDateError("Đến ngày phải lớn hơn hoặc bằng Từ ngày");
        return; // Không cập nhật filter nếu invalid
      }
      
      // Clear error if valid
      setDateError("");
    }
    
    // Update filter only if validation passes
    onFiltersChange({ [key]: value });
  };

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Bộ lọc</h3>
        <button
          onClick={() => {
            setDateError("");
            onResetFilters();
          }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Xóa tất cả bộ lọc
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
          <select
            value={status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Đang chờ</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Từ ngày <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            max={dateTo || undefined}
            className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none ${
              dateError ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-[#2563eb]"
            }`}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Đến ngày <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            min={dateFrom || undefined}
            className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none ${
              dateError ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-[#2563eb]"
            }`}
          />
          {dateError && (
            <p className="mt-1 text-xs text-red-600">{dateError}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
          <input
            placeholder="Tên, email, MSSV..."
            value={query}
            onChange={(e) => handleFilterChange("query", e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none"
          />
        </div>
      </div>
      
      {dateError && (
        <div className="mt-2 rounded-md bg-red-50 border border-red-200 p-2">
          <p className="text-sm text-red-600">{dateError}</p>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        Hiển thị {filteredCount} trong {totalCount} kết quả
      </div>
    </div>
  );
}

