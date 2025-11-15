import { useEffect, useState } from "react";
import { useMusicContentStore } from "../../stores/musicContent";
import MusicContentModal from "@/pages/music-content/MusicContentModal";
import {
  CommonTable,
  type TableColumn,
} from "../../components/common/CommonTable";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
} from "@mui/material";
import { useToast } from "../../components/common/ToastContext";

export default function MusicContentListPage() {
  const {
    list,
    isLoading,
    fetch,
    openCreate,
    openEdit,
    setPage,
    remove,
  } = useMusicContentStore();
  const { success, error: toastError } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

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
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    onClick={() => openEdit(row)}
                  >
                    Sửa
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => {
                      setItemToDelete(row);
                      setDeleteConfirmOpen(true);
                    }}
                  >
                    Xóa
                  </Button>
                </Stack>
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa nội dung <strong>"{itemToDelete?.name}"</strong> không? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">
            Hủy
          </Button>
          <Button
            onClick={async () => {
              if (!itemToDelete) return;
              try {
                await remove(itemToDelete.id);
                success("Đã xóa nội dung");
                setDeleteConfirmOpen(false);
                setItemToDelete(null);
              } catch (e: any) {
                // Check if content is in use
                if (e?.response?.data?.errorCode === "CONTENT_IN_USE") {
                  toastError(e.response.data.message || "Xóa nội dung thất bại do nội dung đang được sử dụng trong giải đấu");
                } else {
                  toastError("Xóa nội dung thất bại");
                }
                setDeleteConfirmOpen(false);
                setItemToDelete(null);
              }
            }}
            color="error"
            variant="contained"
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
