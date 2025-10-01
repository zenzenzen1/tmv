import { useEffect, useMemo, useState } from 'react';
import { useWeightClassStore } from '../../stores/weightClass';
import { Gender, WeightClassStatus } from '../../types';
import type { CreateWeightClassRequest, UpdateWeightClassRequest, WeightClassResponse } from '../../types';

export default function WeightClassModal() {
  const { modalOpen, editing, closeModal, create, update } = useWeightClassStore();
  const [gender, setGender] = useState<Gender>(Gender.MALE);
  const [minWeight, setMinWeight] = useState<string>('');
  const [maxWeight, setMaxWeight] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setGender(editing.gender);
      setMinWeight(String(editing.minWeight ?? ''));
      setMaxWeight(String(editing.maxWeight ?? ''));
      setNote(editing.note || '');
    } else {
      setGender(Gender.MALE);
      setMinWeight('');
      setMaxWeight('');
      setNote('');
    }
    setError(null);
  }, [editing, modalOpen]);

  const isValid = useMemo(() => {
    const min = Number(minWeight);
    const max = Number(maxWeight);
    if (Number.isNaN(min) || Number.isNaN(max)) return false;
    return min > 0 && max > 0 && min < max;
  }, [minWeight, maxWeight]);

  if (!modalOpen) return null;

  const onSaveDraft = async () => {
    if (!isValid) {
      setError('Vui lòng nhập cân nặng hợp lệ (min < max).');
      return;
    }
    try {
      if (editing) {
        const payload: UpdateWeightClassRequest = {
          minWeight: Number(minWeight),
          maxWeight: Number(maxWeight),
          note: note || undefined,
        };
        await update(editing.id, payload);
      } else {
        const payload: CreateWeightClassRequest = {
          gender,
          minWeight: Number(minWeight),
          maxWeight: Number(maxWeight),
          note: note || undefined,
          saveMode: WeightClassStatus.DRAFT,
        };
        await create(payload);
      }
    } catch (e) {
      // error handled in store
    }
  };

  const onSave = async () => {
    if (!isValid) {
      setError('Vui lòng nhập cân nặng hợp lệ (min < max).');
      return;
    }
    try {
      if (editing) {
        const payload: UpdateWeightClassRequest = {
          minWeight: Number(minWeight),
          maxWeight: Number(maxWeight),
          note: note || undefined,
        };
        await update(editing.id, payload);
      } else {
        const payload: CreateWeightClassRequest = {
          gender,
          minWeight: Number(minWeight),
          maxWeight: Number(maxWeight),
          note: note || undefined,
          saveMode: WeightClassStatus.ACTIVE,
        };
        await create(payload);
      }
    } catch {}
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{editing ? 'Chỉnh sửa hạng cân' : 'Thêm hạng cân'}</h2>
          <button onClick={closeModal} className="input-field">×</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Hạng cân (kg) - Min</label>
            <input className="input-field" value={minWeight} onChange={(e) => setMinWeight(e.target.value)} placeholder="45" />
          </div>
          <div>
            <label className="block text-sm mb-1">Hạng cân (kg) - Max</label>
            <input className="input-field" value={maxWeight} onChange={(e) => setMaxWeight(e.target.value)} placeholder="50" />
          </div>

          {!editing && (
            <div className="col-span-2">
              <label className="block text-sm mb-1">Giới tính</label>
              <select className="input-field" value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
                <option value={Gender.MALE}>Nam</option>
                <option value={Gender.FEMALE}>Nữ</option>
              </select>
            </div>
          )}

          <div className="col-span-2">
            <label className="block text-sm mb-1">Ghi chú</label>
            <input className="input-field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Chuẩn quốc gia / Áp dụng 2025" />
          </div>
        </div>

        {error && <div className="text-red-600 mt-3">{error}</div>}

        <div className="flex justify-end gap-2 mt-6">
          <button className="input-field" onClick={closeModal}>Hủy</button>
          <button className="input-field" onClick={onSaveDraft}>Lưu nháp</button>
          <button className="btn-primary" onClick={onSave}>Lưu</button>
        </div>
      </div>
    </div>
  );
}


