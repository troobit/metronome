import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 text-gray-900">
      <div className="mb-8 flex gap-8">
        <a href="https://vite.dev" target="_blank" rel="noreferrer">
          <img
            src={viteLogo}
            className="h-24 transition-transform hover:scale-110"
            alt="Vite logo"
          />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img
            src={reactLogo}
            className="h-24 transition-transform hover:scale-110"
            alt="React logo"
          />
        </a>
      </div>
      <h1 className="mb-8 text-4xl font-bold">Vite + React + Tailwind</h1>
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <button
          onClick={() => setCount((count) => count + 1)}
          className="rounded-md bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          count is {count}
        </button>
        <p className="mt-4 text-gray-600">
          Edit{' '}
          <code className="rounded bg-gray-200 px-2 py-1">src/App.tsx</code> and
          save to test HMR
        </p>
      </div>
      <p className="mt-8 text-gray-500">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}

export default App
