import dayGridPlugin from '@fullcalendar/daygrid' // a plugin!
import FullCalendar from '@fullcalendar/react'

export default function Calendar() {
  return (
    <FullCalendar
      plugins={[dayGridPlugin]}
      buttonText={{
        today: 'Today',
      }}
    />
  )
}
