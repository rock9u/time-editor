import TimeEditor from '@/components/TimelineEditor/TimeEditor'
import './App.css'
import { IntervalGrid } from './components/IntervalGrid'
import { TimelineEditor } from '@/components/TimelineEditor/TimelineEditor'

function App() {
  return (
    <main className="items-center justify-center h-screen w-full min-w-screen">
      <h1 className="text-3xl font-bold underline">Timeline UI</h1>
      <TimeEditor />
      <TimelineEditor />
      <IntervalGrid />
    </main>
  )
}

export default App
