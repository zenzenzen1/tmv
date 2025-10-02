import { useEffect, useState } from 'react';
import { useMusicContentStore } from '../../stores/musicContent';
import type { MusicContentCreateRequest, MusicContentResponse, MusicContentUpdateRequest } from '../../types';

export default function MusicContentModal() {
  const { modalOpen, editing, closeModal, create, update } = useMusicContentStore();
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setDescription(editing.description || '');
      setIsActive(editing.isActive);
    } else {
      setName('');
      setDescription('');
      setIsActive(true);
    }
  }, [editing, modalOpen]);

  if (!modalOpen) return null;

  const onSaveDraft = async () => {
    const payload: MusicContentCreateRequest | MusicContentUpdateRequest = editing
      ? { name, description, isActive }
      : { name, description, isActive: false };
    if (editing) await update(editing.id, payload as MusicContentUpdateRequest);
    else await create(payload as MusicContentCreateRequest);
  };

  const onSave = async () => {
    const payload: MusicContentCreateRequest | MusicContentUpdateRequest = { name, description, isActive: true };
    if (editing) await update(editing.id, payload as MusicContentUpdateRequest);
    else await create(payload as MusicContentCreateRequest);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{editing ? 'Chỉnh sửa nội dung võ nhạc' : 'Thêm nội dung Võ nhạc'}</h2>
          <button onClick={closeModal} className="input-field">×</button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm mb-1">Nội dung Võ nhạc</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Võ nhạc số 1" />
          </div>
          <div>
            <label className="block text-sm mb-1">Ghi chú</label>
            <input className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="VD: Áp dụng theo chuẩn Vovinam 2025" />
          </div>
          <div className="flex items-center gap-2">
            <input id="mc-active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <label htmlFor="mc-active">Đang dùng</label>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button className="input-field" onClick={closeModal}>Hủy</button>
          <button className="input-field" onClick={onSaveDraft}>Lưu nháp</button>
          <button className="btn-primary" onClick={onSave}>Lưu</button>
        </div>
      </div>
    </div>
  );
}


