## Proposal: Dynamic Fist Content Types (UI/UX)

### Problem
- Frontend hardcodes content types in `FistContentModal` (`don-luyen`, `da-luyen`, `dong-doi`, `song-luyen`).
- Backend/database model supports adding arbitrary new content types, but UI blocks creation and filtering by those dynamic types.

### Goals
- Allow admins to manage an open-ended set of fist content types.
- Remove hardcoded enums from FE; fetch and cache types from API.
- Provide simple discoverability and filtering by type.

### Proposed UX
1) Type Management
   - New page `Manage Fist Types` under `Quản lí nội dung`.
   - CRUD: create/rename/deactivate types (soft delete via status).
   - Minimal fields: `id`, `name`, `description?`, `isActive`.

2) Fist Content List
   - Add top filter: `Type` (Autocomplete/Select) fed by types API.
   - Columns: Content name, Type, Description, Status, Actions.
   - Keep pagination; add chip for Type.

3) Create/Edit Modal (Fist Content)
   - Replace hardcoded `MenuItem`s with dynamic list from types API.
   - Use `Autocomplete` with free-text create option disabled; only pick existing type.
   - Validation: require type and name.

4) Competition Flow
   - When selecting configs/items, show grouping by dynamic Type (section headers).
   - Future: type-specific fields (e.g., member count for team types) behind feature flag.

### API Additions (FE expectations)
- GET `/fist-types?page,size` -> list of types
- POST `/fist-types` -> create type
- PATCH `/fist-types/{id}` -> update
- DELETE `/fist-types/{id}` or PATCH status -> deactivate
- Existing fist content endpoints accept `typeId` (or `typeKey`) field.

If BE already exposes types (different naming), adapt FE service accordingly.

### FE Changes
- Store: `stores/fistContent.ts`
  - Add `types`, `fetchTypes`, CRUD for types (optional for initial).
  - Extend `FistContentResponse` to include `typeId` and `typeName`.
- Services: `services/fistContent.ts`
  - Add `listTypes`, `createType`, `updateType`, `deleteType`.
- UI
  - `pages/fist-content/ListPage.tsx`: add type filter dropdown; display type chip.
  - `pages/fist-content/FistContentModal.tsx`: replace static menu with dynamic `Autocomplete` or `Select` bound to types.
  - Sidebar: optional entry `Loại nội dung` routed to `/manage/fist-content/types`.

### Migration Plan
1) Data fetch
   - Implement `fetchTypes` and preload on list page mount.
2) Modal
   - Replace hardcoded type select with dynamic options.
3) List
   - Add filter by `typeId` (persist in store.filters), show type column.
4) Optional: Type management screen for admins.

### Edge Cases & UX Notes
- If no types exist: show empty state with CTA `Tạo loại nội dung`.
- Deactivated type: cannot assign in modal; show as `(Không hoạt động)` chip on list.
- Backward compatibility: if existing content has unknown type, show `Khác` and allow editing after selecting a valid type.

### Visual Components (MUI)
- Filters: `Stack` + `Autocomplete` for Type.
- Chips: MUI `Chip` with default color, optional color per type.
- Modal fields: `TextField` for name/description; `Select`/`Autocomplete` for type; `Checkbox` for active.

### Success Criteria
- Zero hardcoded types in UI.
- Able to create content with any type configured in the system.
- List page filters and displays by type; competition flows group by type.


