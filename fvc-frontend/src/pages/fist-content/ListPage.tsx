import { useEffect } from 'react';
import { CommonTable, type TableColumn } from '../../components/common/CommonTable';
import { useFistContentStore } from '../../stores/fistContent';
import FistContentModal from './FistContentModal';

export default function FistContentListPage() {
  const { list, isLoading, error, fetch, openCreate, openEdit, setPage } = useFistContentStore();

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-semibold">Quyền - Quản lí nội dung</h1>
        <button className="btn-primary" onClick={openCreate}>+ Thêm nội dung</button>
      </div>

      {isLoading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {list && (
        <CommonTable<any>
          className="card"
          columns={([
            { key: 'name', title: 'Nội dung thi đấu' } as TableColumn<any>,
            { key: 'description', title: 'Ghi chú', render: (r) => r.description || '—' },
            {
              key: 'status',
              title: 'Trạng thái',
              render: (row) => (
                <span className={`px-2 py-1 rounded text-xs ${row.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {row.status ? 'Đang dùng' : 'Khóa'}
                </span>
              ),
            },
            {
              key: 'actions',
              title: 'Thao tác',
              render: (row) => (
                <button className="input-field" onClick={() => openEdit(row)}>Chi tiết</button>
              ),
              sortable: false,
            },
          ])}
          data={list.content}
          keyField={'id'}
          page={(list.page ?? 0) + 1}
          pageSize={list.size}
          total={list.totalElements}
          onPageChange={(p) => setPage(p - 1)}
        />
      )}
      <FistContentModal />
    </div>
  );
}


