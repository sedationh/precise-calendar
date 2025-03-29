import type { EventChangeArg, EventClickArg, EventDropArg } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import bootstrap5Plugin from '@fullcalendar/bootstrap5'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import { useLocalStorageState } from 'ahooks'
import { useState } from 'react'
import EventDialog from './EventDialog'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

interface TimeSlot {
  start: Date
  end?: Date
}

interface CustomEventSourceInput {
  id: string
  title: string
  timeSlots: TimeSlot[]
  allDay: boolean
}

interface DialogState {
  isOpen: boolean
  mode: 'create' | 'edit'
  event: CustomEventSourceInput | null
  initialDate: Date
}

export default function Calendar() {
  // 使用 useLocalStorageState 替代 useState
  // 注意：localStorage 存储的是字符串，所以需要转换日期
  // TODO 这里 useLocalStorageState 不应该返回 undefined 类型
  const [events, setEvents] = useLocalStorageState<CustomEventSourceInput[]>(
    'calendar-events',
    {
      defaultValue: [
        {
          id: '1',
          title: '示例事件1',
          timeSlots: [{ start: new Date(), end: new Date() }],
          allDay: true,
        },
        {
          id: '2',
          title: '示例多天事件',
          timeSlots: [
            {
              start: new Date(),
              end: new Date(Date.now() + 2 * 86400000),
            },
            {
              start: new Date(Date.now() + 5 * 86400000),
              end: new Date(Date.now() + 7 * 86400000),
            },
          ],
          allDay: true,
        },
      ],
      serializer: value => JSON.stringify(value, (_, v) =>
        v instanceof Date ? v.toISOString() : v),

      deserializer: (value) => {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed)
          ? parsed.map(event => ({
              ...event,
              timeSlots: event.timeSlots.map((slot: TimeSlot) => ({
                start: new Date(slot.start),
                end: slot.end ? new Date(slot.end) : undefined,
              })),
              allDay: event.allDay !== undefined ? event.allDay : true,
            }))
          : []
      },
    },
  )

  // 使用一个状态来管理对话框
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    mode: 'create',
    event: null,
    initialDate: new Date(),
  })

  const handleEventDrop = (info: EventDropArg) => {
    const [eventId, slotIndex] = info.event.id.split('-').map(Number)

    const updatedEvents = events?.map((event) => {
      if (event.id === `${eventId}`) {
        const updatedTimeSlots = event.timeSlots.map((slot, index) => {
          if (index === slotIndex) {
            return {
              ...slot,
              start: info.event.start || new Date(),
              end: info.event.end || undefined,
            }
          }
          return slot
        })
        return {
          ...event,
          timeSlots: updatedTimeSlots,
        }
      }
      return event
    })
    setEvents(updatedEvents)
  }

  const handleEventResize = (info: EventChangeArg) => {
    const [eventId, slotIndex] = info.event.id.split('-').map(Number)

    const updatedEvents = events?.map((event) => {
      if (event.id === eventId.toString()) {
        const updatedTimeSlots = event.timeSlots.map((slot, index) => {
          if (index === slotIndex) {
            return {
              ...slot,
              start: info.event.start!,
              end: info.event.end!,
            }
          }
          return slot
        })
        return {
          ...event,
          timeSlots: updatedTimeSlots,
        }
      }
      return event
    })
    setEvents(updatedEvents)
  }

  const handleSaveEvent = (eventData: {
    title: string
    timeSlots: TimeSlot[]
    allDay: boolean
  }) => {
    if (dialogState.mode === 'edit' && dialogState.event) {
      // 更新现有事件
      const updatedEvents = events?.map(event =>
        event.id === dialogState.event?.id
          ? { ...event, ...eventData }
          : event,
      ) || []
      setEvents(updatedEvents)
    }
    else {
      // 添加新事件
      const newEvent = {
        id: Date.now().toString(),
        ...eventData,
      }
      setEvents([...(events || []), newEvent])
    }

    setDialogState(prev => ({ ...prev, isOpen: false }))
  }

  const handleDateClick = (arg: DateClickArg) => {
    setDialogState({
      isOpen: true,
      mode: 'create',
      event: null,
      initialDate: new Date(arg.date),
    })
  }

  const handleEventClick = (clickInfo: EventClickArg) => {
    const eventId = clickInfo.event.id.split('-')[0]
    const event = events?.find(e => e.id === eventId)

    if (!event) {
      return
    }

    setDialogState({
      isOpen: true,
      mode: 'edit',
      event,
      initialDate: event.timeSlots[0].start,
    })
  }

  const handleDeleteEvent = () => {
    if (dialogState.event) {
      const updatedEvents = events?.filter(event => event.id !== dialogState.event?.id) || []
      setEvents(updatedEvents)
      setDialogState(prev => ({ ...prev, isOpen: false }))
    }
  }

  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin, bootstrap5Plugin, interactionPlugin]}
        buttonText={{
          today: 'Today',
        }}
        themeSystem="bootstrap5"
        editable={true}
        eventResizableFromStart={true}
        droppable={true}
        events={events?.flatMap(event =>
          event.timeSlots.map((slot, index) => ({
            id: `${event.id}-${index}`,
            title: event.title,
            start: slot.start,
            end: slot.end,
            allDay: event.allDay,
          })),
        )}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        firstDay={1}
      />

      <EventDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        selectedDate={dialogState.initialDate}
        selectedEvent={dialogState.event}
      />
    </>
  )
}
