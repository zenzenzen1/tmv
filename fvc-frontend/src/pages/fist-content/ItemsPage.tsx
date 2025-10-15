import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Stack, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { CommonTable, type TableColumn } from '../../components/common/CommonTable';
import { fistContentService } from '../../services/fistContent';
import type { FistItemResponse } from '../../types';

export default function FistItemsPage() {
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<FistItemResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FistItemResponse | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fistContentService.getItemsByConfig(id);
      setItems(res.content);
    } catch (e: any) {
      setError(e?.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleOpenCreate = () => { setEditing(null); setName(''); setDescription(''); setOpen(true); };
  const handleOpenEdit = (item: FistItemResponse) => { setEditing(item); setName(item.name); setDescription(item.description || ''); setOpen(true); };
  const handleClose = () => setOpen(false);

  const handleSave = async () => {
    // NOTE: Backend endpoints for create/update item under a config are assumed; adjust if different.
    // Placeholder: reuse create/update via BY_ID if available, else extend service later.
    handleClose();
    load();
  };

  return (
    <Box p={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Quản lý mục nội dung</Typography>
        <Button variant="contained" onClick={handleOpenCreate}>+ Thêm mục</Button>
      </Stack>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}

      <CommonTable<any>
        className="card"
        columns={([
          { key: 'name', title: 'Mục' } as TableColumn<any>,
          { key: 'description', title: 'Ghi chú', render: (r) => r.description || '—' },
          { key: 'actions', title: 'Thao tác', render: (row) => (
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={() => handleOpenEdit(row)}>Sửa</Button>
            </Stack>
          ), sortable: false },
        ])}
        data={items}
        keyField={'id'}
        page={1}
        pageSize={items.length}
        total={items.length}
        onPageChange={() => {}}
      />

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Chỉnh sửa mục' : 'Thêm mục'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField label="Tên" value={name} onChange={(e) => setName(e.target.value)} />
            <TextField label="Ghi chú" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">Hủy</Button>
          <Button onClick={handleSave} variant="contained">Lưu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


