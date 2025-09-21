import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app-container">
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center space-x-8 mb-8">
            <a 
              href="https://vite.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="transition-transform hover:scale-110"
            >
              <img src={viteLogo} className="logo" alt="Vite logo" />
            </a>
            <a 
              href="https://react.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="transition-transform hover:scale-110"
            >
              <img src={reactLogo} className="logo react logo-spin" alt="React logo" />
            </a>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Vite + React + Tailwind
          </h1>
          <p className="text-xl text-gray-600">
            Modern development with TypeScript, MUI, Zustand & Axios
          </p>
        </div>

        {/* Main Card */}
        <div className="card max-w-md w-full">
          <div className="text-center">
            <button 
              onClick={() => setCount((count) => count + 1)}
              className="btn-primary mb-4"
            >
              Count is {count}
            </button>
            <p className="text-gray-600 mb-4">
              Edit <code className="bg-gray-100 px-2 py-1 rounded text-sm">src/App.tsx</code> and save to test HMR
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                ✨ Tailwind CSS configured and ready
              </p>
              <p className="text-sm text-gray-500">
                🎨 MUI components available
              </p>
              <p className="text-sm text-gray-500">
                🗃️ Zustand for state management
              </p>
              <p className="text-sm text-gray-500">
                🌐 Axios for API calls
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-gray-500 text-center">
          Click on the Vite and React logos to learn more
        </p>
      </div>
    </div>
  )
}

export default App
