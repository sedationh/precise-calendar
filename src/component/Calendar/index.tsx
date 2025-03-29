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

interface CustomEventSourceInput {
  id: string
  title: string
  start: Date
  end?: Date // 添加结束日期支持多天事件
  allDay: boolean // 默认都是全天事件
}

export default function Calendar() {
  // 使用 useLocalStorageState 替代 useState
  // 注意：localStorage 存储的是字符串，所以需要转换日期
  // TODO 这里 useLocalStorageState 不应该返回 undefined 类型
  const [events, setEvents] = useLocalStorageState<CustomEventSourceInput[]>(
    'calendar-events', // localStorage 中的键名
    {
      defaultValue: [
        { id: '1', title: '示例事件1', start: new Date(), allDay: true },
        {
          id: '2',
          title: '示例多天事件',
          start: new Date(),
          end: new Date(Date.now() + 2 * 86400000), // 当前日期加2天
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
              start: new Date(event.start),
              end: event.end ? new Date(event.end) : undefined,
              allDay: event.allDay !== undefined ? event.allDay : true,
            }))
          : []
      },
    },
  )

  // 添加状态用于控制对话框
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CustomEventSourceInput | null>(null)

  const handleEventDrop = (info: EventDropArg) => {
    // 获取被拖拽的事件ID
    const eventId = info.event.id

    // 创建更新后的事件数组
    const updatedEvents = events?.map((event) => {
      if (event.id === eventId) {
        // 返回更新后的事件，保持原始数据不变，只更新开始和结束时间
        return {
          ...event,
          start: info.event.start || new Date(),
          end: info.event.end || undefined,
        }
      }
      return event
    })

    // 更新状态
    setEvents(updatedEvents)
  }

  // 添加事件调整大小的处理函数
  const handleEventResize = (info: EventChangeArg) => {
    // 获取被调整的事件ID
    const eventId = info.event.id

    // 创建更新后的事件数组
    const updatedEvents = events?.map((event) => {
      if (event.id === eventId) {
        // 返回更新后的事件，保持原始数据不变，只更新结束时间
        return {
          ...event,
          start: info.event.start!,
          end: info.event.end!,
        }
      }
      return event
    })

    // 更新状态
    setEvents(updatedEvents)
  }

  // 添加保存事件的处理函数
  const handleSaveEvent = (eventData: {
    title: string
    start: Date
    end?: Date
    allDay: boolean
  }) => {
    if (selectedEvent) {
      // 更新现有事件
      const updatedEvents = events?.map(event =>
        event.id === selectedEvent.id
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

    setIsDialogOpen(false)
  }

  const handleDateClick = (arg: DateClickArg) => {
    setSelectedDate(new Date(arg.date))
    setSelectedEvent(null) // 清空选中的事件
    setIsDialogOpen(true)
  }

  // 修改事件点击处理函数
  const handleEventClick = (clickInfo: EventClickArg) => {
    // 获取点击的事件
    const eventId = clickInfo.event.id
    const event = events?.find(e => e.id === eventId)

    if (!event) {
      return
    }

    setSelectedEvent(event)
    setSelectedDate(event.start)
    setIsDialogOpen(true)
  }

  // 添加删除事件的处理函数
  const handleDeleteEvent = () => {
    if (selectedEvent) {
      // 过滤掉要删除的事件
      const updatedEvents = events?.filter(event => event.id !== selectedEvent.id) || []
      setEvents(updatedEvents)
      setIsDialogOpen(false)
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
        events={events}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        // 当日期有太多事件时，显示"更多"链接
        // dayMaxEvents={true}
        firstDay={1}
      />

      {/* 修改事件对话框 */}
      <EventDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        selectedDate={selectedDate}
        selectedEvent={selectedEvent}
      />
    </>
  )
}
