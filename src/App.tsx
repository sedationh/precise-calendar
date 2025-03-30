import { Analytics } from '@vercel/analytics/react'
import Calendar from './component/Calendar'

function App() {
  return (
    <div className="mx-auto max-w-screen-lg p-4">
      <Calendar />
      <Analytics />
    </div>
  )
}
export default App
