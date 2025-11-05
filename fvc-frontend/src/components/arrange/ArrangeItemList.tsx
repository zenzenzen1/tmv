import React, { useState } from 'react';
import { useArrangeOrderStore } from '../../stores/arrangeOrderStore';
import ArrangeItem from './ArrangeItem';
import type { ArrangeItem as ArrangeItemType, ContentType } from '../../types/arrange';

interface ArrangeItemListProps {
  sectionId: string;
  items: ArrangeItemType[];
  contentType: ContentType;
}

export default function ArrangeItemList({
  sectionId,
  items,
  contentType,
}: ArrangeItemListProps) {
  const { moveItemInSection, moveBackToPool, addToSection } = useArrangeOrderStore();
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    try {
      const itemData = JSON.parse(e.dataTransfer.getData('text/plain'));
      // Add to section if not already present
      if (!items.some((item) => item.id === itemData.id)) {
        addToSection(sectionId, itemData);
      }
    } catch (error) {
      console.error('Failed to parse drag data:', error);
    }
  };

  if (items.length === 0) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`min-h-[240px] flex flex-col gap-2 p-1.5 rounded-lg border-2 border-dashed ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div className="text-center py-8 text-gray-500 text-sm">
          Kéo thả vận động viên vào đây
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col gap-2 min-h-[240px] p-1.5 rounded-lg ${
        dragOver ? 'bg-blue-50 border-2 border-dashed border-blue-500' : ''
      }`}
    >
      {items.map((item, index) => (
        <ArrangeItem
          key={item.id}
          item={item}
          contentType={contentType}
          showOrder={true}
          orderIndex={index + 1}
          onMoveUp={() => moveItemInSection(sectionId, item.id, -1)}
          onMoveDown={() => moveItemInSection(sectionId, item.id, 1)}
          onRemove={() => moveBackToPool(sectionId, item.id)}
        />
      ))}
    </div>
  );
}

