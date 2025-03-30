import type { EventChangeArg, EventClickArg, EventDropArg } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import { Button } from '@/components/ui/button'
import { History } from '@/utils/history'
import bootstrap5Plugin from '@fullcalendar/bootstrap5'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import { useLocalStorageState } from 'ahooks'
import { addDays, isWeekend, startOfDay, startOfMonth } from 'date-fns'
import { useEffect, useRef, useState } from 'react'
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
  color?: string
}

interface DialogState {
  isOpen: boolean
  mode: 'create' | 'edit'
  event: CustomEventSourceInput | null
  initialDate: Date
}

// 辅助函数：将时间段按周末拆分
function splitTimeSlotsByWeekend(start: Date, end: Date): TimeSlot[] {
  const slots: TimeSlot[] = []
  let currentStart = start
  const currentEnd = end

  while (currentStart < currentEnd) {
    // 找到下一个周末的开始
    let nextWeekendStart = new Date(currentStart)
    while (nextWeekendStart < currentEnd && !isWeekend(nextWeekendStart)) {
      nextWeekendStart = addDays(nextWeekendStart, 1)
    }

    // 如果找到了周末，添加工作日时间段
    if (nextWeekendStart > currentStart) {
      slots.push({
        start: currentStart,
        end: nextWeekendStart,
      })
    }

    // 找到周末的结束
    let weekendEnd = new Date(nextWeekendStart)
    while (weekendEnd < currentEnd && isWeekend(weekendEnd)) {
      weekendEnd = addDays(weekendEnd, 1)
    }

    // 更新当前开始时间
    currentStart = weekendEnd
  }

  return slots
}

export default function Calendar() {
  const [events, setEvents] = useLocalStorageState<CustomEventSourceInput[]>(
    'calendar-events',
    {
      defaultValue: [
        {
          id: '1',
          title: 'Monthly Conference',
          timeSlots: splitTimeSlotsByWeekend(
            startOfDay(startOfMonth(new Date())),
            startOfDay(addDays(startOfMonth(new Date()), 15)),
          ),
          allDay: true,
          color: '#3788d8',
        },
        {
          id: '2',
          title: 'Project Phase',
          timeSlots: [
            ...splitTimeSlotsByWeekend(
              startOfDay(startOfMonth(new Date())),
              startOfDay(addDays(startOfMonth(new Date()), 10)),
            ),
            ...splitTimeSlotsByWeekend(
              startOfDay(addDays(startOfMonth(new Date()), 15)),
              startOfDay(addDays(startOfMonth(new Date()), 25)),
            ),
          ],
          allDay: true,
          color: '#28a745',
        },
        {
          id: '3',
          title: 'Training Sessions',
          timeSlots: [
            ...splitTimeSlotsByWeekend(
              startOfDay(addDays(startOfMonth(new Date()), 5)),
              startOfDay(addDays(startOfMonth(new Date()), 8)),
            ),
            ...splitTimeSlotsByWeekend(
              startOfDay(addDays(startOfMonth(new Date()), 12)),
              startOfDay(addDays(startOfMonth(new Date()), 15)),
            ),
            ...splitTimeSlotsByWeekend(
              startOfDay(addDays(startOfMonth(new Date()), 20)),
              startOfDay(addDays(startOfMonth(new Date()), 23)),
            ),
          ],
          allDay: true,
          color: '#ffc107',
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

  const fileInputRef = useRef<HTMLInputElement>(null)
  const historyRef = useRef<History<CustomEventSourceInput[]>>(null)

  if (!historyRef.current) {
    historyRef.current = new History<CustomEventSourceInput[]>(events!)
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          const newState = historyRef.current?.redo()
          if (newState) {
            setEvents(newState)
          }
        }
        else {
          const newState = historyRef.current?.undo()
          if (newState) {
            setEvents(newState)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateEvents = (newEvents: CustomEventSourceInput[]) => {
    setEvents(newEvents)
    historyRef.current?.push(newEvents)
  }

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
    updateEvents(updatedEvents || [])
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
    updateEvents(updatedEvents || [])
  }

  const handleSaveEvent = (eventData: {
    title: string
    timeSlots: TimeSlot[]
    allDay: boolean
    description?: string
    color?: string
  }) => {
    if (dialogState.mode === 'edit' && dialogState.event) {
      const updatedEvents = events?.map(event =>
        event.id === dialogState.event?.id
          ? { ...event, ...eventData }
          : event,
      ) || []
      updateEvents(updatedEvents)
    }
    else {
      const newEvent = {
        id: Date.now().toString(),
        ...eventData,
      }
      updateEvents([...(events || []), newEvent])
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
      updateEvents(updatedEvents)
      setDialogState(prev => ({ ...prev, isOpen: false }))
    }
  }

  const handleExportEvents = () => {
    if (!events)
      return

    const jsonString = JSON.stringify(events, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'calendar-events.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportEvents = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file)
      return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsedEvents = JSON.parse(content)

        if (!Array.isArray(parsedEvents)) {
          throw new TypeError('Imported data must be an array of events')
        }

        const processedEvents = parsedEvents.map(event => ({
          ...event,
          timeSlots: event.timeSlots.map((slot: TimeSlot) => ({
            start: new Date(slot.start),
            end: slot.end ? new Date(slot.end) : undefined,
          })),
          allDay: event.allDay !== undefined ? event.allDay : true,
        }))

        updateEvents(processedEvents)
      }
      catch (error) {
        console.error('Import failed:', error)
      }
    }
    reader.readAsText(file)
  }

  return (
    <>
      <div className="mb-4 flex gap-2 flex-row-reverse">
        <Button
          onClick={handleExportEvents}
          className="rounded"
        >
          Export Events
        </Button>
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="rounded"
        >
          Import Events
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportEvents}
          className="hidden"
        />
      </div>

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
            backgroundColor: event.color,
            borderColor: event.color,
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
