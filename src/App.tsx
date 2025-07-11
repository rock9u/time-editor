import { ModeToggle } from '@/components/mode-toggle'
import { ThemeProvider } from '@/components/theme-provider'
import { TimelineEditor } from '@/components/TimelineEditor/TimelineEditor'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { TimelineProvider } from './contexts/TimelineContext'

function fallbackRender({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: 'red' }}>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Retry</button>
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
      <ThemeProvider defaultTheme="system" storageKey="timeline-editor-theme">
        <TimelineProvider>
          <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto p-4">
              <nav className="flex justify-between items-center">
                <h1 className="text-2xl font-bold mb-4">Timeline Editor</h1>
                <ModeToggle />
              </nav>
              <TimelineEditor />
            </div>
          </div>
        </TimelineProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
