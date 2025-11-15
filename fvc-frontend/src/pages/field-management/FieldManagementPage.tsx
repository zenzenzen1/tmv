import { useEffect, useState } from 'react';
import { useFieldStore } from '../../stores/field';
import type { FieldResponse } from '../../types';
import FieldModal from './FieldModal';
import { CommonTable, type TableColumn } from '../../components/common/CommonTable';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { useToast } from '../../components/common/ToastContext';

export default function FieldManagementPage() {
  const { list, isLoading, error, fetch, openCreate, openEdit, remove, setPage } = useFieldStore();
  const { success, error: toastError } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<FieldResponse | null>(null);

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
                    <Button
                      size="small"
                      onClick={() => openEdit(row)}
                    >
                      Chi tiết
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      disabled={row.isUsed}
                      onClick={() => {
                        if (row.isUsed) {
                          toastError("Không thể xóa sân đấu đang được sử dụng");
                          return;
                        }
                        setFieldToDelete(row);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      Xóa
                    </Button>
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
            Bạn có chắc chắn muốn xóa sân đấu "{fieldToDelete?.location}" không? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">
            Hủy
          </Button>
          <Button
            onClick={async () => {
              if (!fieldToDelete) return;
              try {
                await remove(fieldToDelete.id);
                success("Đã xóa sân đấu");
                setDeleteConfirmOpen(false);
                setFieldToDelete(null);
              } catch (e: any) {
                console.error(e);
                // Check if error is due to field being in use
                const errorMessage = e?.response?.data?.message || e?.message || "";
                if (errorMessage.toLowerCase().includes("đang được sử dụng") || 
                    errorMessage.toLowerCase().includes("in use") ||
                    errorMessage.toLowerCase().includes("being used")) {
                  toastError("Không thể xóa sân đấu đang được sử dụng");
                } else {
                  toastError("Xóa sân đấu thất bại");
                }
                setDeleteConfirmOpen(false);
                setFieldToDelete(null);
              }
            }}
            color="error"
            variant="contained"
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
      
      <FieldModal />
    </div>
  );
}

