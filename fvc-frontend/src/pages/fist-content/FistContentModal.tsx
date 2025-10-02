import { useFistContentStore } from '../../stores/fistContent';
import { useState, useEffect, useMemo } from 'react';

export default function FistContentModal() {
  const { modalOpen, closeModal, isLoading, editing, create, update } = useFistContentStore();
  const [contentType, setContentType] = useState<'song-luyen' | 'don-luyen' | 'da-luyen' | 'dong-doi'>('song-luyen');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (editing) {
      setName(editing.name || '');
      setDescription(editing.description || '');
      setActive(!!editing.status);
    } else {
      setName('');
      setDescription('');
      setActive(true);
    }
  }, [editing, modalOpen]);

  const isValid = useMemo(() => name.trim().length > 0, [name]);

  if (!modalOpen) return null;

  const onSaveDraft = async () => {
    if (!isValid) return;
    if (editing) {
      await update(editing.id, { name, description, status: false });
    } else {
      await create({ name, description, status: false });
    }
  };

  const onSave = async () => {
    if (!isValid) return;
    if (editing) {
      await update(editing.id, { name, description, status: active });
    } else {
      await create({ name, description, status: active });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Thêm nội dung Quyền</h2>
          <button onClick={closeModal} className="input-field">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Loại nội dung</label>
            <select className="input-field" value={contentType} onChange={(e) => setContentType(e.target.value as any)}>
              <option value="song-luyen">Chọn kiểu thi đấu</option>
              <option value="song-luyen">Song luyện</option>
              <option value="don-luyen">Đơn luyện</option>
              <option value="da-luyen">Đa luyện</option>
              <option value="dong-doi">Đồng đội</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Nội dung Quyền</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Song Luyện quyền 1" />
          </div>
          <div>
            <label className="block text-sm mb-1">Ghi chú</label>
            <input className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="VD: Áp dụng theo chuẩn Vovinam 2025" />
          </div>
          <div className="flex items-center gap-2">
            <input id="status" type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <label htmlFor="status">Đang dùng</label>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button className="input-field" onClick={closeModal}>Hủy</button>
          <button className="input-field" onClick={onSaveDraft} disabled={!isValid || isLoading}>Lưu nháp</button>
          <button className="btn-primary" onClick={onSave} disabled={!isValid || isLoading}>Lưu</button>
        </div>
      </div>
    </div>
  );
}


