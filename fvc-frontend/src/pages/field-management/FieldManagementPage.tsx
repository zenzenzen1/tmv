import { useEffect } from 'react';
import { useFieldStore } from '../../stores/field';
import type { FieldResponse } from '../../types';
import FieldModal from './FieldModal';
import { CommonTable, type TableColumn } from '../../components/common/CommonTable';

export default function FieldManagementPage() {
  const { list, isLoading, error, fetch, openCreate, openEdit, remove, setPage } = useFieldStore();

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-semibold">Quản lý Sân đấu</h1>
        <button className="btn-primary" onClick={openCreate}>+ Thêm sân đấu</button>
      </div>

      {isLoading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {list && list.content && list.content.length > 0 ? (
        <CommonTable<FieldResponse>
          className="card"
          columns={[
            {
              key: 'location',
              title: 'Vị trí',
              render: (row) => row ? <span>{row.location}</span> : <span>-</span>,
            } as TableColumn<FieldResponse>,
            {
              key: 'isUsed',
              title: 'Trạng thái sử dụng',
              render: (row) => row ? (
                <span className={`px-2 py-1 rounded text-xs ${
                  row.isUsed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {row.isUsed ? 'Đang sử dụng' : 'Chưa sử dụng'}
                </span>
              ) : <span>-</span>,
            },
            {
              key: 'actions',
              title: 'Thao tác',
              render: (row) => (
                row ? (
                  <div className="flex gap-2">
                    <button className="input-field" onClick={() => openEdit(row)}>Chi tiết</button>
                    <button 
                      className="input-field text-red-600 hover:text-red-700" 
                      onClick={async () => {
                        if (confirm('Bạn có chắc chắn muốn xóa sân đấu này?')) {
                          try {
                            await remove(row.id);
                          } catch (err) {
                            console.error('Delete failed:', err);
                          }
                        }
                      }}
                    >
                      Xóa
                    </button>
                  </div>
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
            Không có dữ liệu sân đấu nào
          </div>
        )
      )}
      <FieldModal />
    </div>
  );
}

