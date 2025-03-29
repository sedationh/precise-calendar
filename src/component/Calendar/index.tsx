import type { EventDropArg } from '@fullcalendar/core'
import bootstrap5Plugin from '@fullcalendar/bootstrap5'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import { useLocalStorageState } from 'ahooks'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

interface CustomEventSourceInput {
  id: string
  title: string
  start: Date
}

export default function Calendar() {
  // 使用 useLocalStorageState 替代 useState
  // 注意：localStorage 存储的是字符串，所以需要转换日期
  // TODO 这里 useLocalStorageState 不应该返回 undefined 类型
  const [events, setEvents] = useLocalStorageState<CustomEventSourceInput[]>(
    'calendar-events', // localStorage 中的键名
    {
      defaultValue: [
        { id: '1', title: '示例事件1', start: new Date() },
        { id: '2', title: '示例事件2', start: new Date(Date.now() + 86400000) }, // 明天
      ],
      serializer: value => JSON.stringify(value, (_, v) =>
        v instanceof Date ? v.toISOString() : v),

      deserializer: (value) => {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed)
          ? parsed.map(event => ({
              ...event,
              start: new Date(event.start),
            }))
          : []
      },
    },
  )

  const handleEventDrop = (info: EventDropArg) => {
    // 获取被拖拽的事件ID
    const eventId = info.event.id

    // 创建更新后的事件数组
    const updatedEvents = events?.map((event) => {
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
