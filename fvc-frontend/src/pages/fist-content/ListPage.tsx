import { useEffect, useState } from "react";
import {
  CommonTable,
  type TableColumn,
} from "../../components/common/CommonTable";
import { useFistContentStore } from "../../stores/fistContent";
import FistContentModal from "./FistContentModal";
import {
  Box,
  Chip,
  Stack,
  Typography,
  Button,
  Tabs,
  Tab,
  TextField,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { fistContentService } from "../../services/fistContent";
import { useToast } from "../../components/common/ToastContext";

export default function FistContentListPage() {
  const {
    list,
    isLoading,
    error,
    fetch,
    openCreate,
    openEdit,
    setPage,
    remove,
    fistConfigs,
    fetchFistConfigs,
  } = useFistContentStore();
  const { success, error: toastError } = useToast();
  const [tab, setTab] = useState<"items" | "types">("items");
  const [allItems, setAllItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  // Removed selectedType logic per request
  const [openItemModal, setOpenItemModal] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemTypeId, setItemTypeId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [participantsPerEntry, setParticipantsPerEntry] = useState<number>(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch();
    fetchFistConfigs();
  }, [fetch, fetchFistConfigs]);

  // No auto-select; load all items instead

  useEffect(() => {
    const load = async () => {
      setItemsLoading(true);
      try {
        const res = await fistContentService.listItems({ size: 100 });
        console.log(res);
        setAllItems(res?.content ?? []);
      } finally {
        setItemsLoading(false);
      }
    };
    load();
  }, []);
  console.log(allItems);

  return (
    <Box p={3}>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Quản lý nội dung Fist
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Quản lý loại và nội dung bài tập
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab value="items" label="Nội dung bài tập" />
        <Tab value="types" label="Loại nội dung" />
      </Tabs>

      {tab === "items" && (
        <>
          <Stack direction="row" spacing={2} mb={2}>
            <TextField
              size="small"
              placeholder="Tìm kiếm nội dung..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
            />
            {/* Type filter removed */}
            <Button variant="contained" onClick={() => setOpenItemModal(true)}>
              + Tạo nội dung
            </Button>
          </Stack>

          {itemsLoading ? (
            <div>Loading...</div>
          ) : (
            <CommonTable<any>
              className="card"
              columns={[
                { key: "name", title: "Tên" } as TableColumn<any>,
                {
                  key: "configName",
                  title: "Loại",
                  render: (r) =>
                    r.configName ? (
                      <Chip label={r.configName} size="small" />
                    ) : (
                      "—"
                    ),
                },
                {
                  key: "description",
                  title: "Mô tả",
                  render: (r) => r.description || "—",
                },
                {
                  key: "participantsPerEntry",
                  title: "Số người/tiết mục",
                  render: (row) => row.participantsPerEntry ?? 1,
                },
                {
                  key: "status",
                  title: "Trạng thái",
                  render: () => (
                    <Chip label="Hoạt động" size="small" color="success" />
                  ),
                },
                {
                  key: "actions",
                  title: "Thao tác",
                  render: (row) => (
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        onClick={() => {
                          setEditingItemId(row.id);
                          setItemName(row.name);
                          setItemDescription(row.description || "");
                          setItemTypeId(row.configId || null);
                          setParticipantsPerEntry(
                            typeof (row as any).participantsPerEntry ===
                              "number"
                              ? (row as any).participantsPerEntry
                              : 1
                          );
                          setOpenItemModal(true);
                        }}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={async () => {
                          const configId = row.configId;
                          if (!configId) return;
                          if (!confirm("Xóa mục này?")) return;
                          const svc = (
                            await import("../../services/fistContent")
                          ).fistContentService;
                          try {
                            await svc.deleteItem(configId, row.id);
                            success("Đã xóa nội dung");
                            const res = await svc.listItems({ size: 100 });
                            setAllItems(res.content ?? []);
                          } catch (e) {
                            console.error(e);
                            toastError("Xóa nội dung thất bại");
                          }
                        }}
                      >
                        Xóa
                      </Button>
                    </Stack>
                  ),
                  sortable: false,
                },
              ]}
              data={allItems}
              keyField={"id"}
              page={1}
              pageSize={allItems.length}
              total={allItems.length}
              onPageChange={() => {}}
            />
          )}

          <Dialog
            open={openItemModal}
            onClose={() => setOpenItemModal(false)}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>
              {editingItemId ? "Chỉnh sửa nội dung" : "Tạo nội dung"}
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2}>
                <TextField
                  label="Tên nội dung"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
                <Autocomplete
                  options={fistConfigs}
                  getOptionLabel={(o) => o.name}
                  value={fistConfigs.find((c) => c.id === itemTypeId) || null}
                  onChange={(_, v) => setItemTypeId(v?.id || null)}
                  renderInput={(params) => (
                    <TextField {...params} label="Loại nội dung" />
                  )}
                />
                <TextField
                  label="Mô tả"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                />
                <TextField
                  label="Số người/tiết mục"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={participantsPerEntry}
                  onChange={(e) => {
                    const v = Math.max(1, Number(e.target.value || 1));
                    setParticipantsPerEntry(Number.isFinite(v) ? v : 1);
                  }}
                  helperText="Ví dụ: Đơn luyện = 1, Song luyện = 2, Tam luyện = 3"
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenItemModal(false)} color="inherit">
                Hủy
              </Button>
              <Button
                onClick={async () => {
                  if (!itemTypeId || !itemName.trim()) return;
                  const svc = (await import("../../services/fistContent"))
                    .fistContentService;
                  if (editingItemId) {
                    await svc.updateItem(itemTypeId, editingItemId, {
                      name: itemName.trim(),
                      description: itemDescription || undefined,
                      // gửi thêm số người/tiết mục; backend có thể bỏ qua nếu chưa hỗ trợ
                      participantsPerEntry: participantsPerEntry,
                    } as any);
                  } else {
                    await svc.createItem(itemTypeId, {
                      name: itemName.trim(),
                      description: itemDescription || undefined,
                      participantsPerEntry: participantsPerEntry,
                    } as any);
                  }
                  setOpenItemModal(false);
                  setEditingItemId(null);
                  setItemName("");
                  setItemDescription("");
                  setParticipantsPerEntry(1);
                  try {
                    const res = await svc.listItems({ size: 100 });
                    setAllItems(res.content ?? []);
                    success(
                      editingItemId ? "Đã cập nhật nội dung" : "Đã tạo nội dung"
                    );
                  } catch (e) {
                    console.error(e);
                    toastError(
                      editingItemId
                        ? "Cập nhật nội dung thất bại"
                        : "Tạo nội dung thất bại"
                    );
                  }
                }}
                variant="contained"
              >
                Lưu
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {tab === "types" && (
        <>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
          >
            <TextField
              size="small"
              placeholder="Tìm kiếm loại nội dung..."
              fullWidth
            />
            <Button variant="contained" onClick={openCreate}>
              + Tạo loại
            </Button>
          </Stack>
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
                  render: (r) => r.description || "—",
                },
                {
                  key: "status",
                  title: "Trạng thái",
                  render: (row) =>
                    row.status ? (
                      <Chip label="Hoạt động" color="success" size="small" />
                    ) : (
                      <Chip
                        label="Không hoạt động"
                        color="default"
                        size="small"
                        variant="outlined"
                      />
                    ),
                },
                {
                  key: "actions",
                  title: "Thao tác",
                  render: (row) => (
                    <div className="flex gap-2">
                      <button
                        className="input-field"
                        onClick={() => openEdit(row)}
                      >
                        Chi tiết
                      </button>
                      <button
                        className="input-field"
                        onClick={() => {
                          setTab("items");
                        }}
                      >
                        Quản lý mục
                      </button>
                      {!row.status && (
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
              onPageChange={(p) => setPage(p - 1)}
            />
          )}
        </>
      )}
      <FistContentModal />
    </Box>
  );
}
