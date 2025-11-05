import React from 'react';
import { useArrangeOrderStore } from '../../stores/arrangeOrderStore';
import type { ContentItem, ContentType } from '../../types/arrange';

interface ContentListProps {
  items: ContentItem[];
  contentType: ContentType;
}

export default function ContentList({ items, contentType }: ContentListProps) {
  const { pool, addToSection } = useArrangeOrderStore();

  const handleAutoAssign = (contentId: string, count: number) => {
    // Filter pool by contentId
    const candidates = pool.filter((item) => item.contentId === contentId);
    
    // Random pick 'count' items
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));
    
    // Add to section
    selected.forEach((item) => {
      addToSection(contentId, item);
    });
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Không có danh mục nội dung
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="grid grid-cols-[40px_1fr_auto] items-center gap-3 p-3 border border-gray-200 rounded-xl bg-white cursor-pointer hover:bg-gray-50"
        >
          <div className="w-[34px] h-7 rounded-lg border border-gray-200 flex items-center justify-center font-bold text-gray-900">
            #
          </div>
          <div className="flex flex-col gap-1">
            <div className="font-semibold text-gray-900">{item.name}</div>
            <div className="text-xs text-gray-600">Nhấp để auto-assign vài mục</div>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => handleAutoAssign(item.id, 2)}
              className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              +2
            </button>
            <button
              onClick={() => handleAutoAssign(item.id, 5)}
              className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              +5
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

