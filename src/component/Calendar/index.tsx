import type { EventDropArg } from '@fullcalendar/core'
import bootstrap5Plugin from '@fullcalendar/bootstrap5'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

interface CustomEventSourceInput {
  id: string
  title: string
  start: Date
}

export default function Calendar() {
  const [events, setEvents] = useState<CustomEventSourceInput[]>([
    { id: '1', title: '示例事件', start: new Date() },
    { id: '2', title: '示例事件', start: new Date() },
  ])

  const handleEventDrop = (info: EventDropArg) => {
    // 获取被拖拽的事件ID
    const eventId = info.event.id

    // 创建更新后的事件数组
    const updatedEvents = events.map((event) => {
      if (event.id === eventId) {
        // 返回更新后的事件，保持原始数据不变，只更新开始时间
        return {
          ...event,
          start: info.event.start || new Date(),
        }
      }
      return event
    })

    // 更新状态
    setEvents(updatedEvents)
  }

  return (
    <FullCalendar
      plugins={[dayGridPlugin, bootstrap5Plugin, interactionPlugin]}
      buttonText={{
        today: 'Today',
      }}
      themeSystem="bootstrap5"
      editable={true}
      droppable={true}
      events={events}
      eventDrop={handleEventDrop}
    />
  )
}
