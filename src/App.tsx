import { ModeToggle } from '@/components/mode-toggle'
import { ThemeProvider } from '@/components/theme-provider'
import { TimelineEditor } from '@/components/TimelineEditor/TimelineEditor'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { TimelineProvider } from './contexts/TimelineContext'
import { Button } from '@/components/ui/button'

function fallbackRender({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert">
      <span>
        <span className="text-lg">Something went wrong</span>
        <Button onClick={resetErrorBoundary} className="ml-2" variant="ghost">
          Retry
        </Button>
      </span>
      <pre className="text-red-500">{error.message}</pre>
      <pre className="text-red-500">{error.stack}</pre>
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
