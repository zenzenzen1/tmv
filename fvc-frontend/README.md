# FVC Frontend

A modern React TypeScript application built with Vite, featuring Tailwind CSS, Material-UI, Zustand state management, and Axios for API communication.

## 🚀 Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Material-UI (MUI)** - React component library
- **Zustand** - State management
- **Axios** - HTTP client
- **ESLint** - Code linting

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── config/             # Configuration files
│   ├── axios.ts        # Axios configuration
│   ├── endpoints.ts    # API endpoints
│   └── env.ts          # Environment variables
├── hooks/              # Custom React hooks
├── services/           # API services
│   └── api.ts          # Generic API service
├── stores/             # Zustand stores
│   └── auth.ts         # Authentication store
├── types/              # TypeScript type definitions
│   ├── api.ts          # API types
│   ├── index.ts        # Common types
│   └── store.ts        # Store types
├── utils/              # Utility functions
│   └── errorHandler.ts # Error handling utilities
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Setup

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8080/api

# Environment
VITE_NODE_ENV=development

# Feature Flags
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
```

## 🎯 Best Practices & Implementation Examples

### 1. State Management with Zustand

#### Basic Store Usage

```typescript
// Using the auth store
import { useAuth, useAuthActions } from '../stores/auth';

function LoginComponent() {
  const { user, isAuthenticated, isLoading, error } = useAuth();
  const { login, logout, clearError } = useAuthActions();

  const handleLogin = async (credentials: LoginRequest) => {
    try {
      await login(credentials);
      // Handle success
    } catch (error) {
      // Error is automatically handled by the store
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.firstName}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <LoginForm onSubmit={handleLogin} />
      )}
    </div>
  );
}
```

### 2. API Communication

#### Using the API Service

```typescript
// services/userService.ts
import apiService from './api';
import type { User, BaseResponse, PaginationResponse } from '../types';

export const userService = {
  // Get all users with pagination
  getUsers: async (params: RequestParams) => {
    return apiService.get<PaginationResponse<User>>('/users', params);
  },

  // Get user by ID
  getUser: async (id: string) => {
    return apiService.get<User>(`/users/${id}`);
  },

  // Create new user
  createUser: async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    return apiService.post<User>('/users', userData);
  },

  // Update user
  updateUser: async (id: string, userData: Partial<User>) => {
    return apiService.put<User>(`/users/${id}`, userData);
  },

  // Delete user
  deleteUser: async (id: string) => {
    return apiService.delete(`/users/${id}`);
  },
};
```

### 3. Component Development

#### Reusable Components with Tailwind

```typescript
// components/ui/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      } ${className || ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
};
```

### 4. Custom Hooks

```typescript
// hooks/useApi.ts
import { useState, useCallback } from 'react';
import { globalErrorHandler } from '../utils/errorHandler';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiActions<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>
): UseApiState<T> & UseApiActions<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      const { message } = globalErrorHandler(err);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}
```

### 5. Error Handling

```typescript
// components/UserList.tsx
import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { globalErrorHandler } from '../utils/errorHandler';
import type { User } from '../types';

function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getUsers({ page: 0, size: 10 });
      setUsers(response.data.content);
    } catch (err) {
      const { message } = globalErrorHandler(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.firstName} {user.lastName}</div>
      ))}
    </div>
  );
}
```

## 🎨 Styling Guidelines

### Tailwind CSS Best Practices

1. **Use component classes** for repeated patterns:
```css
/* In index.css */
@layer components {
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200;
  }
}
```

2. **Use utility classes** for one-off styles:
```tsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-semibold text-gray-900">Title</h2>
  <Button variant="primary">Action</Button>
</div>
```

3. **Responsive design**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

## 🔧 Development Guidelines

### Code Organization

1. **Keep components small and focused**
2. **Use TypeScript interfaces for props**
3. **Extract custom hooks for reusable logic**
4. **Use Zustand for global state, local state for component-specific data**
5. **Handle errors consistently using the error handler**

### Performance

1. **Use React.memo for expensive components**
2. **Implement proper loading states**
3. **Use lazy loading for route components**
4. **Optimize images and assets**

### Testing

```typescript
// Example test structure
describe('LoginForm', () => {
  it('should validate email format', () => {
    // Test implementation
  });
  
  it('should handle form submission', async () => {
    // Test implementation
  });
});
```

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Vite Documentation](https://vitejs.dev/guide/)

## 🤝 Contributing

1. Follow the established code style
2. Write meaningful commit messages
3. Add tests for new features
4. Update documentation as needed

## 📄 License

This project is licensed under the MIT License.