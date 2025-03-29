// TODO
/* eslint-disable react-hooks-extra/no-direct-set-state-in-use-effect */
import React, { useEffect, useState } from 'react'
import './EventDialog.css'

// 添加事件接口
interface CustomEventSourceInput {
  id: string
  title: string
  start: Date
  end?: Date
  allDay: boolean
  description?: string // 保留描述字段
}

interface EventDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (eventData: { title: string, start: Date, end?: Date, allDay: boolean, description?: string }) => void
  onDelete: () => void
  selectedDate: Date
  selectedEvent: CustomEventSourceInput | null
}

// 表单状态接口
interface EventFormState {
  title: string
  startDate: string
  endDate: string
  description: string
}

// TODO 用 dayjs 类似的库来处理日期
// 格式化为本地日期的辅助函数，避免时区问题
function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const EventDialog: React.FC<EventDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  selectedDate,
  selectedEvent,
}) => {
  // 使用单个状态对象，移除 color
  const [formState, setFormState] = useState<EventFormState>({
    title: '',
    startDate: formatLocalDate(selectedDate),
    endDate: formatLocalDate(selectedDate),
    description: '',
  })

  // 监听 isOpen 的变化来初始化表单数据
  useEffect(() => {
    // 只在对话框打开时初始化数据
    if (isOpen) {
      if (selectedEvent) {
        setFormState({
          title: selectedEvent.title,
          startDate: formatLocalDate(selectedEvent.start),
          endDate: selectedEvent.end
            ? formatLocalDate(selectedEvent.end)
            : formatLocalDate(selectedEvent.start),
          description: selectedEvent.description || '',
        })
      }
      else {
        setFormState({
          title: 'Happy',
          startDate: formatLocalDate(selectedDate),
          endDate: formatLocalDate(selectedDate),
          description: '',
        })
      }
    }
  }, [isOpen, selectedEvent, selectedDate])

  // 添加 ESC 键监听器
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') {
        onClose()
      }
    }

    // 添加全局键盘事件监听器
    window.addEventListener('keydown', handleEscapeKey)

    // 组件卸载时移除事件监听器
    return () => {
      window.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isOpen, onClose])

  // 用于更新单个表单字段的辅助函数
  const updateField = (field: keyof EventFormState, value: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  if (!isOpen)
    return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // 确保创建的日期对象是本地时间的午夜时刻
    const createDateAtMidnight = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number)
      return new Date(year, month - 1, day)
    }

    onSave({
      title: formState.title,
      start: createDateAtMidnight(formState.startDate),
      end: formState.endDate !== formState.startDate ? createDateAtMidnight(formState.endDate) : undefined,
      allDay: true,
      description: formState.description,
    })
  }

  return (
    <div className="event-dialog-overlay">
      <div className="event-dialog">
        <div className="event-dialog-header">
          <input
            type="text"
            placeholder="添加日程标题"
            value={formState.title}
            onChange={e => updateField('title', e.target.value)}
            className="event-title-input"
          />
          <div className="event-dialog-actions">
            {selectedEvent && (
              <button
                className="delete-button"
                type="button"
                onClick={onDelete}
                title="删除事件"
              >
                <i className="bi bi-trash"></i>
              </button>
            )}
            <button className="close-button" type="button" onClick={onClose}>
              <i className="bi bi-x"></i>
            </button>
          </div>
        </div>

        <div className="event-date-selector">
          <i className="bi bi-calendar"></i>
          <input
            type="date"
            value={formState.startDate}
            onChange={e => updateField('startDate', e.target.value)}
          />
          <span className="date-separator">→</span>
          <input
            type="date"
            value={formState.endDate}
            onChange={e => updateField('endDate', e.target.value)}
          />
        </div>

        <div className="event-description">
          <i className="bi bi-list"></i>
          <textarea
            placeholder="添加说明"
            value={formState.description}
            onChange={e => updateField('description', e.target.value)}
          >
          </textarea>
        </div>

        <div className="event-dialog-footer">
          <button className="save-button" type="button" onClick={handleSubmit}>
            {selectedEvent ? '更新' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EventDialog
