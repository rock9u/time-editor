import TimeEditor from '@/components/TimelineEditor/TimeEditor'
import './App.css'
import { IntervalGrid } from './components/IntervalGrid'
import { TimelineEditor } from '@/components/TimelineEditor/TimelineEditor'
import { TimelineProvider } from './contexts/TimelineContext'
import { ErrorBoundary } from 'react-error-boundary'

function fallbackRender({ error, resetErrorBoundary }) {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.

  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: 'red' }}>{error.message}</pre>
    </div>
  )
}
function App() {
  return (
    <ErrorBoundary
      fallbackRender={fallbackRender}
      onReset={details => {
        console.error(details)
        window.location.reload()
      }}>
      <TimelineProvider>
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Timeline Editor</h1>
            <TimelineEditor />
          </div>
        </div>
      </TimelineProvider>
    </ErrorBoundary>
  )
}

export default App
