## Frontend Action Audit and Toast Notification Plan

This document catalogs all user actions (create, update, delete, status changes) across pages and modals, and proposes consistent toast notifications for success and error outcomes.

### Conventions
- Success toast: short, specific, green accent
- Error toast: concise, include reason if available, red accent
- Show within 100–300ms of action completion
- Dismiss after 3–4s; keep error toasts clickable to see details in console

Toast API available:
- `ToastProvider` + `ToastContext` (see `src/components/common/ToastProvider.tsx`, `ToastContext.tsx`)
- Use: `const { toast } = useToast(); toast.success('...'); toast.error('...');`

---

### Pages and Modals

1) Fist Content
- File: `src/pages/fist-content/ListPage.tsx`
- Actions:
  - Create FistItem (dialog) → POST `/v1/fist-configs/{configId}/items`
  - Update FistItem (dialog) → PUT `/v1/fist-configs/{configId}/items/{itemId}`
  - Delete FistItem (table action) → DELETE `/v1/fist-configs/{configId}/items/{itemId}`
  - Create/Update/Delete FistContent parent (via `FistContentModal.tsx`)
- Toast plan:
  - Create item: success `Đã tạo nội dung`, error `Tạo nội dung thất bại`
  - Update item: success `Đã cập nhật nội dung`, error `Cập nhật nội dung thất bại`
  - Delete item: success `Đã xóa nội dung`, error `Xóa nội dung thất bại`
  - Create parent: success `Đã tạo loại`, error `Tạo loại thất bại`
  - Update parent: success `Đã cập nhật loại`, error `Cập nhật loại thất bại`

2) Music Content
- Files: `src/pages/music-content/ListPage.tsx`, `MusicContentModal.tsx`
- Actions:
  - Create music content
  - Update music content
  - Optional: Delete (if supported in UI)
- Toast plan:
  - Create: `Đã tạo nội dung Võ nhạc`, error `Tạo nội dung Võ nhạc thất bại`
  - Update: `Đã cập nhật nội dung Võ nhạc`, error `Cập nhật nội dung Võ nhạc thất bại`
  - Delete: `Đã xóa nội dung Võ nhạc`, error `Xóa nội dung Võ nhạc thất bại`

3) Weight Class
- Files: `src/pages/weight-class/ListPage.tsx`, `WeightClassModal.tsx`
- Actions:
  - Create weight class
  - Update weight class
  - Delete weight class (if supported)
  - Status transitions (Draft → Active) when applicable
- Toast plan:
  - Create: `Đã tạo hạng cân`, error `Tạo hạng cân thất bại`
  - Update: `Đã cập nhật hạng cân`, error `Cập nhật hạng cân thất bại`
  - Delete: `Đã xóa hạng cân`, error `Xóa hạng cân thất bại`
  - Change status: `Đã cập nhật trạng thái`, error `Cập nhật trạng thái thất bại`

4) Tournament/Competitions
- Files: `src/pages/tournament/ListPage.tsx`, `CompetitionFormPage.tsx`
- Actions:
  - Create competition
  - Update competition
  - Optional: Delete competition
- Toast plan:
  - Create: `Đã tạo giải đấu`, error `Tạo giải đấu thất bại`
  - Update: `Đã cập nhật giải đấu`, error `Cập nhật giải đấu thất bại`
  - Delete: `Đã xóa giải đấu`, error `Xóa giải đấu thất bại`

5) Application Forms
- Files: `src/pages/forms/ListPage.tsx`, `BuilderPage.tsx`, `EditPage.tsx`, `RegistrationPage.tsx`
- Actions:
  - Create form config
  - Update form config
  - Delete form config (if supported)
  - Submit registration
- Toast plan:
  - Create/Update: `Lưu cấu hình form thành công`, error `Lưu cấu hình form thất bại`
  - Delete: `Đã xóa cấu hình form`, error `Xóa cấu hình form thất bại`
  - Submit registration: `Gửi đăng ký thành công`, error `Gửi đăng ký thất bại`

6) Athletes
- Files: `src/pages/athletes/AthleteManagementPage.tsx`, `AthleteManagementWrapper.tsx`
- Actions (based on service availability):
  - Create/Update athlete
  - Delete athlete (if supported)
- Toast plan:
  - Create/Update: `Lưu VĐV thành công`, error `Lưu VĐV thất bại`
  - Delete: `Đã xóa VĐV`, error `Xóa VĐV thất bại`

---

### Integration Plan (Implementation Outline)

1) Provide toast context globally
- Ensure `ToastProvider` wraps `App` in `src/main.tsx` or `src/App.tsx`.

2) Hook into action handlers
- Pattern:
```ts
try {
  await apiCall();
  toast.success('Message');
} catch (e) {
  const reason = (e as any)?.message || 'Vui lòng thử lại';
  toast.error(`Thất bại: ${reason}`);
}
```

3) Specific touchpoints to update
- `src/pages/fist-content/ListPage.tsx`: after create/update/delete item
- `src/pages/fist-content/FistContentModal.tsx`: after save
- `src/pages/music-content/MusicContentModal.tsx`: after save
- `src/pages/weight-class/WeightClassModal.tsx`: after save
- `src/pages/tournament/CompetitionFormPage.tsx`: after submit
- `src/pages/forms/*`: after save/publish/delete/submit

4) Error normalization
- Use `globalErrorHandler` (if available) to extract a user-friendly message and pass to `toast.error()`.

5) Placement & behavior
- Position: top-right
- Auto close: 3.5s; allow hover to pause
- Max 3 concurrent toasts; queue overflow

---

### Example Snippets

Fist item delete (ListPage.tsx):
```ts
try {
  await svc.deleteItem(configId, row.id);
  toast.success('Đã xóa nội dung');
  const res = await svc.listItems({ size: 100 });
  setAllItems(res.content);
} catch (e) {
  toast.error('Xóa nội dung thất bại');
}
```

Competition save (CompetitionFormPage.tsx):
```ts
try {
  const ok = isEdit ? await updateCompetition(id, data) : await createCompetition(data);
  if (ok) toast.success(isEdit ? 'Đã cập nhật giải đấu' : 'Đã tạo giải đấu');
} catch (e) {
  toast.error('Lưu giải đấu thất bại');
}
```

---

### Rollout Steps
1) Add `ToastProvider` at root (if not already)
2) Implement toasts for Fist Content pages
3) Implement toasts for Weight Class, Music Content
4) Implement toasts for Competition & Forms
5) QA pass to ensure no duplicate toasts and correct messages


