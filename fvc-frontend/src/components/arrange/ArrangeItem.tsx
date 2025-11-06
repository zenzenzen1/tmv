import React, { useState } from 'react';
import type { ArrangeItem as ArrangeItemType, ContentType } from '../../types/arrange';

interface ArrangeItemProps {
  item: ArrangeItemType;
  contentType: ContentType;
  showOrder: boolean;
  orderIndex?: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  draggable?: boolean;
}

export default function ArrangeItem({
  item,
  contentType,
  showOrder,
  orderIndex,
  onMoveUp,
  onMoveDown,
  onRemove,
  draggable = true,
}: ArrangeItemProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', JSON.stringify(item));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const genderLabel =
    item.gender === 'mixed'
      ? 'Đồng đội'
      : item.gender === 'male'
      ? 'Nam'
      : 'Nữ';

  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`grid grid-cols-[40px_1fr_auto] items-center gap-3 p-3 border border-gray-200 rounded-xl bg-white ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {/* Order Badge */}
      <div
        className={`w-[34px] h-7 rounded-lg border border-gray-200 flex items-center justify-center font-bold text-gray-900 ${
          showOrder ? 'bg-gray-100' : ''
        }`}
      >
        {showOrder && orderIndex ? orderIndex : '#'}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1">
        <div className="font-semibold text-gray-900">{item.name}</div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
          {/* Gender Chip */}
          <span className="bg-green-50 border border-green-200 text-green-800 px-2 py-0.5 rounded-full">
            {genderLabel}
          </span>

          {/* FormType Chip (Quyền only) */}
          {contentType === 'QUYEN' && item.formType && (
            <span className="bg-green-50 border border-green-200 text-green-800 px-2 py-0.5 rounded-full">
              Hình thức: {item.formType}
            </span>
          )}

          {/* Content Chip */}
          {item.contentId && (
            <span className="bg-blue-50 border border-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
              {contentType === 'QUYEN' ? 'Nội dung: ' : ''}
              {item.contentId}
            </span>
          )}

          {/* MSSV */}
          <span className="text-gray-600">MSSV: {item.studentCode}</span>
        </div>

        {/* Team Members Expansion */}
        {item.members && item.members.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-900">
              Thành viên ({item.members.length})
            </summary>
            <div className="mt-2 pl-12 space-y-2">
              {item.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 pt-2 border-t border-gray-200"
                >
                  <span className="font-semibold text-gray-900">{member.name}</span>
                  <span className="bg-green-50 border border-green-200 text-green-800 px-2 py-0.5 rounded-full text-xs">
                    {member.gender === 'male' ? 'Nam' : 'Nữ'}
                  </span>
                  {contentType === 'QUYEN' && member.formType && (
                    <span className="bg-green-50 border border-green-200 text-green-800 px-2 py-0.5 rounded-full text-xs">
                      Hình thức: {member.formType}
                    </span>
                  )}
                  {member.contentId && (
                    <span className="bg-blue-50 border border-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                      {contentType === 'QUYEN' ? 'Nội dung: ' : ''}
                      {member.contentId}
                    </span>
                  )}
                  <span className="text-xs text-gray-600">
                    MSSV: {member.studentCode}
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Actions */}
      {showOrder && (
        <div className="flex gap-1.5">
          <button
            onClick={onMoveUp}
            className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            title="Lên"
          >
            ↑
          </button>
          <button
            onClick={onMoveDown}
            className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            title="Xuống"
          >
            ↓
          </button>
          <button
            onClick={onRemove}
            className="bg-red-600 text-white border border-red-700 rounded-lg px-2 py-1 text-sm font-semibold hover:bg-red-700"
            title="Xóa"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

