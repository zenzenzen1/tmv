import { useEffect } from "react";
import { useMusicContentStore } from "../../stores/musicContent";
import MusicContentModal from "@/pages/music-content/MusicContentModal";
import {
  CommonTable,
  type TableColumn,
} from "../../components/common/CommonTable";

export default function MusicContentListPage() {
  const {
    list,
    isLoading,
    error,
    fetch,
    openCreate,
    openEdit,
    setPage,
    remove,
  } = useMusicContentStore();

  useEffect(() => {
    fetch();
  }, [fetch]);

  console.log(list);

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-semibold">Võ nhạc - Quản lí nội dung</h1>
        <button className="btn-primary" onClick={openCreate}>
          + Thêm nội dung
        </button>
      </div>

      {isLoading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {list && (
        <CommonTable<any>
          className="card"
          columns={[
            { key: "name", title: "Nội dung thi đấu" } as TableColumn<any>,
            {
              key: "description",
              title: "Ghi chú",
              render: (row) => row.description || "—",
            },
            {
              key: "performersPerEntry",
              title: "Số người/tiết mục",
              render: (row) => row.performersPerEntry ?? 1,
            },
            {
              key: "isActive",
              title: "Trạng thái",
              render: (row) => (
                // <span className={`px-2 py-1 rounded text-xs ${(row.isActive === null || row.isActive === undefined) ? "bg-gray-100 text-gray-700" : row.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                //   {(row.isActive === null || row.isActive === undefined) ? "Nháp" : row.isActive ? 'Đang dùng' : 'Không dùng'}
                // </span>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    row.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {row.isActive ? "Đang dùng" : "Nháp"}
                </span>
              ),
            },
            {
              key: "actions",
              title: "Thao tác",
              render: (row) => (
                <div className="flex gap-2">
                  <button className="input-field" onClick={() => openEdit(row)}>
                    Chi tiết
                  </button>

                  {!row.isActive && (
                    <button
                      className="input-field text-red-600 hover:underline"
                      onClick={() => remove(row.id)}
                    >
                      Xóa
                    </button>
                  )}
                </div>
              ),
              sortable: false,
            },
          ]}
          data={list.content}
          keyField={"id"}
          page={(list.page ?? 0) + 1}
          pageSize={list.size}
          total={list.totalElements}
          onPageChange={(p) => {
            const next = p - 1; // CommonTable dùng 1-based
            setPage(next);
            fetch({ page: next, size: list.size }); // <-- truyền thẳng tham số mới
          }}
        />
      )}
      <MusicContentModal />
    </div>
  );
}
