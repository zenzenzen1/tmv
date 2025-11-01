import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
}

export default function Pagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  pageSizeOptions = [5, 10, 20, 50]
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalElements);

  if (totalElements === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
      {/* Mobile pagination */}
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Trước
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Sau
        </button>
      </div>

      {/* Desktop pagination */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <p className="text-sm text-gray-700">
              Hiển thị <span className="font-medium">{startItem}</span> đến{" "}
              <span className="font-medium">{endItem}</span> trong{" "}
              <span className="font-medium">{totalElements}</span> kết quả
            </p>
          </div>
          
          {showPageSizeSelector && onPageSizeChange && (
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700">Hiển thị:</label>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:border-blue-500 focus:outline-none"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-700">mục</span>
            </div>
          )}
        </div>

        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            {/* Previous button */}
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Trước</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Page numbers with ellipsis */}
            {(() => {
              const items: (number | 'ellipsis')[] = [];
              
              if (totalPages <= 5) {
                // Show all pages if 5 or fewer
                for (let p = 1; p <= totalPages; p++) items.push(p);
              } else {
                // Always show first page and page 2
                items.push(1);
                items.push(2);
                
                // Calculate what to show in the middle
                let start = Math.max(3, currentPage - 1);
                let end = Math.min(totalPages - 1, currentPage + 1);
                
                // If we're on pages 1-3, show pages 3-5
                if (currentPage <= 3) {
                  start = 3;
                  end = Math.min(5, totalPages - 1);
                  if (end >= 3) {
                    for (let p = start; p <= end; p++) {
                      items.push(p);
                    }
                  }
                  // Add ellipsis if there's a gap before last page
                  if (end < totalPages - 1) {
                    items.push('ellipsis');
                  }
                } 
                // If we're near the end (last 2 pages), show pages near the end
                else if (currentPage >= totalPages - 2) {
                  start = Math.max(3, totalPages - 4);
                  if (start > 3) {
                    items.push('ellipsis');
                  }
                  for (let p = start; p <= totalPages - 1; p++) {
                    items.push(p);
                  }
                } 
                // We're in the middle
                else {
                  // Add ellipsis if there's a gap after page 2
                  if (start > 3) {
                    items.push('ellipsis');
                  }
                  // Add pages around current
                  for (let p = start; p <= end; p++) {
                    items.push(p);
                  }
                  // Add ellipsis if there's a gap before last page
                  if (end < totalPages - 1) {
                    items.push('ellipsis');
                  }
                }
                
                // Always show last page
                items.push(totalPages);
              }

              return items.map((it, idx) => {
                if (it === 'ellipsis') {
                  return (
                    <span
                      key={`e-${idx}`}
                      className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 select-none"
                    >
                      …
                    </span>
                  );
                }
                const pageNum = it as number;
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`relative inline-flex items-center px-3 py-2 text-sm font-semibold ${
                      pageNum === currentPage
                        ? "z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              });
            })()}
            
            {/* Next button */}
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Sau</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

