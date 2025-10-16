import { useEffect } from 'react';
import { useWeightClassStore } from '../../stores/weightClass';
import type { WeightClassResponse } from '../../types';
import WeightClassModal from './WeightClassModal';
import { CommonTable, type TableColumn } from '../../components/common/CommonTable';

export default function WeightClassListPage() {
  const { list, isLoading, error, fetch, openCreate, openEdit, setPage } = useWeightClassStore();

  useEffect(() => {
    fetch();
  }, [fetch]);


  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-semibold">Đối kháng - Quản lí Hạng cân</h1>
        <button className="btn-primary" onClick={openCreate}>+ Thêm hạng cân</button>
      </div>

      {isLoading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {list && list.content && list.content.length > 0 ? (
        <CommonTable<WeightClassResponse>
          className="card"
          columns={[
            {
              key: 'range',
              title: 'Hạng cân',
              render: (row) => (
                row ? <span>{row.minWeight}–{row.maxWeight} kg</span> : <span>-</span>
              ),
            } as TableColumn<WeightClassResponse>,
            {
              key: 'gender',
              title: 'Giới tính',
              render: (row) => row ? (row.gender === 'MALE' ?
                'Nam' : 'Nữ') : '-',
            },
            { key: 'note', title: 'Ghi chú', render: (row) => row ? (row.note || '—') : '—' },
            {
              key: 'status',
              title: 'Trạng thái',
              render: (row) => row ? (
                <span className={`px-2 py-1 rounded text-xs ${
                  row.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  row.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {row.status === 'ACTIVE' ? 'Đang dùng' : row.status === 'DRAFT' ? 'Nháp' : 'Khóa'}
                </span>
              ) : <span>-</span>,
            },
            {
              key: 'actions',
              title: 'Thao tác',
              render: (row) => (
                row ? (
                  <button className="input-field" onClick={() => openEdit(row)}>Chi tiết</button>
                ) : (
                  <span>-</span>
                )
              ),
              sortable: false,
            },
          ]}
          data={list.content || []}
          keyField={'id'}
          page={(list.page ?? 0) + 1}
          pageSize={list.size}
          total={list.totalElements}
          onPageChange={(p) => setPage(p - 1)}
        />
      ) : (
        !isLoading && (
          <div className="text-center py-8 text-gray-500">
            Không có dữ liệu hạng cân nào
          </div>
        )
      )}
      <WeightClassModal />
    </div>
  );
}


