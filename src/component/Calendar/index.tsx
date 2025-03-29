/* eslint-disable no-alert */
import type { EventClickArg, EventDropArg } from '@fullcalendar/core'
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

  // 添加日期点击处理函数
  const handleDateClick = (arg: any) => {
    const title = prompt('请输入事件标题:')
    if (title) {
      const isMultiDay = confirm('是否是多天事件？')

      const start = new Date(arg.date)
      let end

      if (isMultiDay) {
        const daysInput = prompt('请输入事件持续天数:', '2')
        const days = Number.parseInt(daysInput || '2', 10)
        if (!Number.isNaN(days) && days > 0) {
          const endDate = new Date(start)
          endDate.setDate(endDate.getDate() + days)
          end = endDate
        }
      }

      const newEvent = {
        id: Date.now().toString(),
        title,
        start,
        end,
        allDay: true, // 所有事件都是全天事件
      }

      // 添加新事件到事件列表中
      setEvents([...(events || []), newEvent])
    }
  }

  // 添加事件点击处理函数
  const handleEventClick = (clickInfo: EventClickArg) => {
    if (confirm(`是否要删除事件 "${clickInfo.event.title}"?`)) {
      // 获取要删除的事件ID
      const eventId = clickInfo.event.id

      // 过滤掉要删除的事件
      const updatedEvents = events?.filter(event => event.id !== eventId) || []

      // 更新事件列表
      setEvents(updatedEvents)
    }
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
      dateClick={handleDateClick}
      eventClick={handleEventClick}
      // 当日期有太多事件时，显示"更多"链接
      // dayMaxEvents={true}
      firstDay={1}
    />
  )
}
