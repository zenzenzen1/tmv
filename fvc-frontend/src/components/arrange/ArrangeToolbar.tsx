import React from 'react';
import { useArrangeOrderStore } from '../../stores/arrangeOrderStore';
import type { ContentType, FormType } from '../../types/arrange';

interface ArrangeToolbarProps {
  contentType: ContentType;
  onContentTypeChange: (type: ContentType) => void;
  filters: {
    gender: string;
    formType: string;
    search: string;
  };
  onFiltersChange: (filters: {
    gender: string;
    formType: string;
    search: string;
  }) => void;
}

const FORM_TYPES: FormType[] = ['Song luyện', 'Đơn Luyện', 'Đồng Đội', 'Đa Luyện'];

export default function ArrangeToolbar({
  contentType,
  onContentTypeChange,
  filters,
  onFiltersChange,
}: ArrangeToolbarProps) {
  const {
    randomize,
    shuffleSection,
    seedSection,
    resetAll,
    saveOrder,
    exportJSON,
    loading,
    sections,
  } = useArrangeOrderStore();

  const handleShuffle = () => {
    Object.keys(sections).forEach((sectionId) => {
      shuffleSection(sectionId);
    });
  };

  const handleSeed = () => {
    Object.keys(sections).forEach((sectionId) => {
      seedSection(sectionId);
    });
  };

  const handleRandomAssign = async () => {
    await randomize(true, {
      gender: filters.gender !== 'all' ? filters.gender : undefined,
      formType: filters.formType !== 'all' ? filters.formType : undefined,
    });
  };

  const handleLoadFromRegistration = async () => {
    await randomize(false, {
      gender: filters.gender !== 'all' ? filters.gender : undefined,
      formType: filters.formType !== 'all' ? filters.formType : undefined,
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 items-center">
        {/* Left Tools */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Content Type Switcher */}
          <div className="bg-gray-100 border border-gray-200 rounded-xl p-1 inline-flex">
            <button
              onClick={() => onContentTypeChange('QUYEN')}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                contentType === 'QUYEN'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-900 hover:text-gray-700'
              }`}
            >
              Quyền
            </button>
            <button
              onClick={() => onContentTypeChange('VONHAC')}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                contentType === 'VONHAC'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-900 hover:text-gray-700'
              }`}
            >
              Võ Nhạc
            </button>
          </div>

          {/* Gender Filter */}
          <select
            value={filters.gender}
            onChange={(e) =>
              onFiltersChange({ ...filters, gender: e.target.value })
            }
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Hạng mục"
          >
            <option value="all">Tất cả hạng mục</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="mixed">Đồng đội</option>
          </select>

          {/* Form Type Filter (Quyền only) */}
          {contentType === 'QUYEN' && (
            <select
              value={filters.formType}
              onChange={(e) =>
                onFiltersChange({ ...filters, formType: e.target.value })
              }
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Hình thức (Quyền)"
            >
              <option value="all">Tất cả hình thức</option>
              {FORM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          )}

          {/* Search */}
          <input
            type="text"
            placeholder="Tìm kiếm VĐV/Đội..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[200px]"
          />
        </div>

        {/* Right Tools */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleShuffle}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            title="Xáo trộn ngẫu nhiên"
          >
            Xáo trộn
          </button>
          <button
            onClick={handleSeed}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            title="Sắp xếp theo hạt giống"
          >
            Seed
          </button>
          <button
            onClick={resetAll}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            title="Xóa danh sách"
          >
            Xóa
          </button>
          <button
            onClick={handleLoadFromRegistration}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            title="Nạp từ đăng ký"
          >
            Nạp từ đăng ký
          </button>
          <button
            onClick={exportJSON}
            className="bg-green-600 text-white border border-green-700 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-green-700"
          >
            Xuất JSON
          </button>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white border border-blue-700 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-blue-700"
          >
            In/Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}

