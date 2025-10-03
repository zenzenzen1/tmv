import { useEffect, useState, useMemo } from 'react';
import { useMusicContentStore } from '../../stores/musicContent';
import type { MusicContentCreateRequest, MusicContentUpdateRequest } from '../../types';

const NAME_MIN = 1;
const NAME_MAX = 120;
const DESC_MAX = 500;

export default function MusicContentModal() {
  const { modalOpen, editing, closeModal, create, update, error: storeError } = useMusicContentStore();
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

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
    setError(null);
    setSuccess(null);
    setSaving(false);
  }, [editing, modalOpen]);

  // Hiển thị lỗi từ store (nếu có)
  useEffect(() => {
    if (storeError) setError(storeError);
  }, [storeError]);

  // Validate logic
  const nameError = useMemo(() => {
    const trimmed = name.trim();
    if (trimmed.length < NAME_MIN) return 'Vui lòng nhập nội dung võ nhạc!';
    if (trimmed.length > NAME_MAX) return `Tên quá dài (tối đa ${NAME_MAX} ký tự).`;
    return null;
  }, [name]);

  const descError = useMemo(() => {
    if (description && description.length > DESC_MAX) {
      return `Ghi chú quá dài (tối đa ${DESC_MAX} ký tự).`;
    }
    return null;
  }, [description]);

  const firstError = useMemo(() => nameError || descError || null, [nameError, descError]);

  if (!modalOpen) return null;

  const handleResultOk = (msg: string) => {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleResultErr = (e?: unknown) => {
    // lỗi chi tiết đã được store set vào storeError -> effect ở trên sẽ hiển thị
    if (!storeError && !firstError) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    }
    console.error(e);
  };

  const onSaveDraft = async () => {
    // cho phép lưu nháp ngay cả khi isActive = false; nhưng vẫn cần name hợp lệ
    if (firstError) {
      setError(firstError);
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: MusicContentCreateRequest | MusicContentUpdateRequest = editing
        ? { name: name.trim(), description: description.trim(), isActive: false }
        : { name: name.trim(), description: description.trim(), isActive: false };

      if (editing) await update(editing.id, payload as MusicContentUpdateRequest);
      else await create(payload as MusicContentCreateRequest);

      handleResultOk('Đã lưu nháp thành công!');
    } catch (e) {
      handleResultErr(e);
    } finally {
      setSaving(false);
    }
  };

  const onSave = async () => {
    // Publish: bắt buộc name hợp lệ; isActive sẽ true
    if (firstError) {
      setError(firstError);
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: MusicContentCreateRequest | MusicContentUpdateRequest = {
        name: name.trim(),
        description: description.trim(),
        isActive: true,
      };

      if (editing) await update(editing.id, payload as MusicContentUpdateRequest);
      else await create(payload as MusicContentCreateRequest);

      handleResultOk(editing ? 'Đã cập nhật thành công!' : 'Đã tạo thành công!');
    } catch (e) {
      handleResultErr(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {editing ? 'Chỉnh sửa nội dung Võ nhạc' : 'Thêm nội dung Võ nhạc'}
          </h2>
          <button onClick={closeModal} className="input-field">×</button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm mb-1">Nội dung Võ nhạc<span className="text-red-600"> *</span></label>
            <input
              className={`input-field ${nameError ? 'border-red-500' : ''}`}
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              placeholder="Ví dụ: Võ nhạc số 1"
              maxLength={NAME_MAX + 10} // chặn outlier
            />
            {nameError && <p className="mt-1 text-sm text-red-600">{nameError}</p>}
          </div>

          <div>
            <label className="block text-sm mb-1">Ghi chú</label>
            <input
              className={`input-field ${descError ? 'border-red-500' : ''}`}
              value={description}
              onChange={(e) => { setDescription(e.target.value); setError(null); }}
              placeholder="VD: Áp dụng theo chuẩn Vovinam 2025"
              maxLength={DESC_MAX + 50}
            />
            {descError && <p className="mt-1 text-sm text-red-600">{descError}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="mc-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label htmlFor="mc-active">Đang dùng</label>
          </div>
        </div>

        {/* thông báo tổng hợp */}
        {error && <div className="text-red-600 mt-3">{error}</div>}
        {success && <div className="text-green-600 mt-3">{success}</div>}

        <div className="flex justify-end gap-2 mt-6">
          <button className="input-field" onClick={closeModal}>Hủy</button>
          {/* Không disable theo isValid để vẫn chạy validate và show lỗi; chỉ disable khi đang saving */}
          <button className={`input-field ${saving ? 'opacity-60 cursor-not-allowed' : ''}`} onClick={onSaveDraft} disabled={saving}>
            Lưu nháp
          </button>
          <button className={`btn-primary ${saving ? 'opacity-60 cursor-not-allowed' : ''}`} onClick={onSave} disabled={saving}>
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
