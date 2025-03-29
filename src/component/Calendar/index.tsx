import bootstrap5Plugin from '@fullcalendar/bootstrap5'
import dayGridPlugin from '@fullcalendar/daygrid'
import FullCalendar from '@fullcalendar/react'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

export default function Calendar() {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, bootstrap5Plugin]}
      buttonText={{
        today: 'Today',
      }}
      themeSystem="bootstrap5"
    />
  )
}
