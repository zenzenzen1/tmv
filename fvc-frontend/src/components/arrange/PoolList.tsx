import React, { useMemo } from 'react';
import ArrangeItem from './ArrangeItem';
import type { ArrangeItem as ArrangeItemType, ContentType } from '../../types/arrange';

interface PoolListProps {
  items: ArrangeItemType[];
  contentType: ContentType;
  filters: {
    gender: string;
    formType: string;
    search: string;
  };
}

export default function PoolList({ items, contentType, filters }: PoolListProps) {
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Gender filter
      if (filters.gender !== 'all' && item.gender !== filters.gender) {
        return false;
      }

      // FormType filter (Quyền only)
      if (
        contentType === 'QUYEN' &&
        filters.formType !== 'all' &&
        item.formType !== filters.formType
      ) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(searchLower);
        const matchesStudent = item.studentCode.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesStudent) {
          return false;
        }
      }

      return true;
    });
  }, [items, contentType, filters]);

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Không có vận động viên nào trong danh sách chờ
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 min-h-[240px]">
      {filteredItems.map((item) => (
        <ArrangeItem
          key={item.id}
          item={item}
          contentType={contentType}
          showOrder={false}
          onMoveUp={() => {}}
          onMoveDown={() => {}}
          onRemove={() => {}}
        />
      ))}
    </div>
  );
}

