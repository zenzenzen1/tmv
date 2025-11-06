import React from 'react';
import { useArrangeOrderStore } from '../../stores/arrangeOrderStore';
import ArrangeItemList from './ArrangeItemList';
import type { ArrangeSection, ContentType } from '../../types/arrange';

interface SectionsPanelProps {
  sections: Record<string, ArrangeSection>;
  contentType: ContentType;
}

export default function SectionsPanel({ sections, contentType }: SectionsPanelProps) {
  const { resetAll, saveOrder, randomize, loading } = useArrangeOrderStore();

  const handleRandomAssign = async () => {
    await randomize(true);
  };

  const sectionEntries = Object.values(sections);

  if (sectionEntries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Chưa có danh mục nội dung được cấu hình
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sectionEntries.map((section) => (
        <div key={section.contentId} className="mb-4">
          <h3 className="text-sm text-gray-600 mb-3 flex items-center gap-2">
            {section.contentName}
            <span className="font-semibold text-gray-900">
              ({section.items.length})
            </span>
          </h3>
          <ArrangeItemList
            sectionId={section.contentId}
            items={section.items}
            contentType={contentType}
          />
        </div>
      ))}

      {/* Footer Actions */}
      <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={resetAll}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
        >
          Đặt lại tất cả
        </button>
        <button
          onClick={handleRandomAssign}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
        >
          Random phân bổ
        </button>
        <button
          onClick={saveOrder}
          disabled={loading}
          className="bg-green-600 text-white border border-green-700 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Đang lưu...' : 'Lưu thứ tự'}
        </button>
      </div>
    </div>
  );
}

