import React from "react";

interface StatisticsCardsProps {
  totalElements: number;
  filteredCount: number;
  currentPage: number;
}

export default function StatisticsCards({ 
  totalElements, 
  filteredCount, 
  currentPage 
}: StatisticsCardsProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
        <div className="text-2xl font-bold text-blue-600">{totalElements}</div>
        <div className="text-sm text-gray-600">Tổng số đăng ký</div>
      </div>
      <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
        <div className="text-2xl font-bold text-green-600">{filteredCount}</div>
        <div className="text-sm text-gray-600">Kết quả hiển thị</div>
      </div>
      <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
        <div className="text-2xl font-bold text-purple-600">{currentPage}</div>
        <div className="text-sm text-gray-600">Trang hiện tại</div>
      </div>
    </div>
  );
}


