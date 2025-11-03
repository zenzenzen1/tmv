# Unit Tests for FormListPage

## Setup

Để chạy unit tests, cần cài đặt các dependencies sau:

```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Hoặc với yarn:
```bash
yarn add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

## Chạy Tests

```bash
# Chạy tests một lần
npm run test

# Chạy tests trong watch mode
npm run test:watch

# Chạy tests với coverage
npm run test:coverage
```

Thêm vào `package.json`:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Test Coverage

Tests bao gồm:
- ✅ Initial render và UI elements
- ✅ Data loading từ API
- ✅ Error handling
- ✅ Search functionality
- ✅ Status filtering
- ✅ Status badge display
- ✅ Form actions (view, edit, copy link)
- ✅ Navigation
- ✅ Form type và field count display
- ✅ Pagination
- ✅ Date formatting

## Mocking

Tests sử dụng các mocks cho:
- `apiService` - API calls
- `react-router-dom` - Navigation
- `useToast` - Toast notifications
- `navigator.clipboard` - Clipboard API
- `window.location` - Location API


