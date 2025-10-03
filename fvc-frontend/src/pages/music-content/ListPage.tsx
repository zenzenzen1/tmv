import { useEffect } from 'react';
import { useMusicContentStore } from '../../stores/musicContent';
import MusicContentModal from '@/pages/music-content/MusicContentModal';
import { CommonTable, type TableColumn } from '../../components/common/CommonTable';

export default function MusicContentListPage() {
  const { list, isLoading, error, fetch, openCreate, openEdit, setPage } = useMusicContentStore();

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-semibold">Võ nhạc - Quản lí nội dung</h1>
        <button className="btn-primary" onClick={openCreate}>+ Thêm nội dung</button>
      </div>

      {isLoading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {list && (
        <CommonTable<any>
          className="card"
          columns={[
            { key: 'name', title: 'Nội dung thi đấu' } as TableColumn<any>,
            {
              key: 'description',
              title: 'Ghi chú',
              render: (row) => row.description || '—',
            },
            {
              key: 'isActive',
              title: 'Trạng thái',
              render: (row) => (
                <span className={`px-2 py-1 rounded text-xs ${row.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {row.isActive ? 'Đang dùng' : 'Nháp'}
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
          ]}
          data={list.content}
          keyField={'id'}
          page={(list.page ?? 0) + 1}
          pageSize={list.size}
          total={list.totalElements}
          onPageChange={(p) => setPage(p - 1)}
        />
      )}
      <MusicContentModal />
    </div>
  );
}


