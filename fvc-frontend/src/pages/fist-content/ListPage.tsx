import { useEffect, useMemo, useState } from 'react';
import { CommonTable, type TableColumn } from '../../components/common/CommonTable';
import { useFistContentStore } from '../../stores/fistContent';
import FistContentModal from './FistContentModal';
import { Box, Chip, Stack, Typography, Button, Tabs, Tab, TextField, Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

export default function FistContentListPage() {
  const { list, isLoading, error, fetch, openCreate, openEdit, setPage, remove, fistConfigs, fetchFistConfigs } = useFistContentStore();
  const [tab, setTab] = useState<'items' | 'types'>('items');
  const [allItems, setAllItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [openItemModal, setOpenItemModal] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemTypeId, setItemTypeId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch();
    fetchFistConfigs();
  }, [fetch, fetchFistConfigs]);

  useEffect(() => {
    const load = async () => {
      setItemsLoading(true);
      try {
        const svc = (await import('../../services/fistContent')).fistContentService;
        const res = await svc.listItems({ size: 100 });
        setAllItems(res?.content ?? []);
      } finally {
        setItemsLoading(false);
      }
    };
    load();
  }, []);

  const filteredItems = useMemo(() => {
    let data = allItems;
    if (selectedType) data = data.filter((it) => it.parentId === selectedType);
    if (search.trim()) data = data.filter((it) => it.name.toLowerCase().includes(search.toLowerCase()));
    return data;
  }, [allItems, selectedType, search]);

  return (
    <Box p={3}>
      <Typography variant="h5" sx={{ mb: 1 }}>Quản lý nội dung Fist</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Quản lý loại và nội dung bài tập</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab value="items" label="Nội dung bài tập" />
        <Tab value="types" label="Loại nội dung" />
      </Tabs>

      {tab === 'items' && (
        <>
          <Stack direction="row" spacing={2} mb={2}>
            <TextField size="small" placeholder="Tìm kiếm nội dung..." value={search} onChange={(e) => setSearch(e.target.value)} fullWidth />
            <Autocomplete
              size="small"
              options={fistConfigs}
              getOptionLabel={(o) => o.name}
              value={fistConfigs.find(c => c.id === selectedType) || null}
              onChange={(_, v) => setSelectedType(v?.id || null)}
              renderInput={(params) => <TextField {...params} label="Loại" />}
              sx={{ width: 260 }}
            />
            <Button variant="contained" onClick={() => setOpenItemModal(true)}>+ Tạo nội dung</Button>
          </Stack>

          {itemsLoading ? (
            <div>Loading...</div>
          ) : (
            <CommonTable<any>
              className="card"
              columns={([
                { key: 'name', title: 'Tên' } as TableColumn<any>,
                { key: 'type', title: 'Loại', render: (r) => {
                  const cfg = fistConfigs.find((c) => c.id === r.parentId);
                  return cfg ? <Chip label={cfg.name} size="small" /> : '—';
                } },
                { key: 'description', title: 'Mô tả', render: (r) => r.description || '—' },
                { key: 'status', title: 'Trạng thái', render: () => <Chip label="Hoạt động" size="small" color="success" /> },
                { key: 'actions', title: 'Thao tác', render: (row) => (
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => {
                      setEditingItemId(row.id);
                      setItemName(row.name);
                      setItemDescription(row.description || '');
                      setItemTypeId(row.parentId || null);
                      setOpenItemModal(true);
                    }}>Sửa</Button>
                    <Button size="small" color="error" onClick={async () => {
                      if (!row.parentId) return;
                      if (!confirm('Xóa mục này?')) return;
                      const svc = (await import('../../services/fistContent')).fistContentService;
                      await svc.deleteItem(row.parentId, row.id);
                      const res = await svc.listItems({ size: 200 });
                      setAllItems(res.content);
                    }}>Xóa</Button>
                  </Stack>
                ), sortable: false },
              ])}
              data={filteredItems}
              keyField={'id'}
              page={1}
              pageSize={filteredItems.length}
              total={filteredItems.length}
              onPageChange={() => {}}
            />
          )}

          <Dialog open={openItemModal} onClose={() => setOpenItemModal(false)} fullWidth maxWidth="sm">
            <DialogTitle>{editingItemId ? 'Chỉnh sửa nội dung' : 'Tạo nội dung'}</DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2}>
                <TextField label="Tên nội dung" value={itemName} onChange={(e) => setItemName(e.target.value)} />
                <Autocomplete
                  options={fistConfigs}
                  getOptionLabel={(o) => o.name}
                  value={fistConfigs.find(c => c.id === itemTypeId) || null}
                  onChange={(_, v) => setItemTypeId(v?.id || null)}
                  renderInput={(params) => <TextField {...params} label="Loại nội dung" />}
                />
                <TextField label="Mô tả" value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenItemModal(false)} color="inherit">Hủy</Button>
              <Button onClick={async () => {
                if (!itemTypeId || !itemName.trim()) return;
                const svc = (await import('../../services/fistContent')).fistContentService;
                if (editingItemId) {
                  await svc.updateItem(itemTypeId, editingItemId, { name: itemName.trim(), description: itemDescription || undefined });
                } else {
                  await svc.createItem(itemTypeId, { name: itemName.trim(), description: itemDescription || undefined });
                }
                setOpenItemModal(false);
                setEditingItemId(null);
                setItemName('');
                setItemDescription('');
                try {
                  const res = await svc.listItems({ size: 100 });
                  setAllItems(res?.content ?? []);
                } catch {
                  setAllItems([]);
                }
              }} variant="contained">Lưu</Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {tab === 'types' && (
        <>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <TextField size="small" placeholder="Tìm kiếm loại nội dung..." fullWidth />
            <Button variant="contained" onClick={openCreate}>+ Tạo loại</Button>
          </Stack>
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
                row.status ? <Chip label="Hoạt động" color="success" size="small" /> : <Chip label="Không hoạt động" color="default" size="small" variant="outlined" />
              ),
            },
            {
              key: 'actions',
              title: 'Thao tác',
              render: (row) => (
                <div className="flex gap-2">
                <button className="input-field" onClick={() => openEdit(row)}>Chi tiết</button>
                <button className="input-field" onClick={() => { setTab('items'); setSelectedType(row.id); }}>Quản lý mục</button>
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
          ])}
          data={list.content}
          keyField={'id'}
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


