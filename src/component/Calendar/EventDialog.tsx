import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, Trash2 } from 'lucide-react'
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

// 添加事件接口
interface TimeSlot {
  start: Date
  end?: Date
}

interface CustomEventSourceInput {
  id: string
  title: string
  timeSlots: TimeSlot[]
  allDay: boolean
  description?: string
}

interface EventDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (eventData: { title: string, timeSlots: TimeSlot[], allDay: boolean, description?: string }) => void
  onDelete: () => void
  selectedDate: Date
  selectedEvent: CustomEventSourceInput | null
}

// 创建表单验证模式
const formSchema = z.object({
  title: z.string().min(1, { message: '标题不能为空' }),
  timeSlots: z.array(z.object({
    start: z.date(),
    end: z.date().optional(),
  })),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

const EventDialog: React.FC<EventDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  selectedDate,
  selectedEvent,
}) => {
  // 使用 react-hook-form 设置表单
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: 'Happy',
      timeSlots: [{ start: selectedDate, end: selectedDate }],
      description: '',
    },
  })

  // 当对话框打开或选中的事件变化时重置表单
  useEffect(() => {
    if (isOpen) {
      if (selectedEvent) {
        form.reset({
          title: selectedEvent.title,
          timeSlots: selectedEvent.timeSlots,
          description: selectedEvent.description || '',
        })
      }
      else {
        form.reset({
          title: 'Happy',
          timeSlots: [{ start: selectedDate, end: selectedDate }],
          description: '',
        })
      }
    }
  }, [isOpen, selectedEvent, selectedDate, form])

  // 检查两个日期是否是同一天
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear()
      && date1.getMonth() === date2.getMonth()
      && date1.getDate() === date2.getDate()
    )
  }

  // 处理表单提交
  const onSubmit = (data: FormValues) => {
    onSave({
      title: data.title,
      timeSlots: data.timeSlots.map(slot => ({
        start: slot.start,
        end: !isSameDay(slot.start, slot.end || slot.start) ? slot.end : undefined,
      })),
      allDay: true,
      description: data.description,
    })
  }

  // 添加新的时间段
  const addTimeSlot = () => {
    const currentTimeSlots = form.getValues('timeSlots')
    form.setValue('timeSlots', [
      ...currentTimeSlots,
      { start: selectedDate, end: selectedDate },
    ])
  }

  // 删除时间段
  const removeTimeSlot = (index: number) => {
    const currentTimeSlots = form.getValues('timeSlots')
    form.setValue(
      'timeSlots',
      currentTimeSlots.filter((_, i) => i !== index),
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>
                {selectedEvent ? '编辑日程' : '新建日程'}
              </DialogTitle>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="添加日程标题"
                        className="text-lg font-medium border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">时间段</span>
                </div>
                {form.watch('timeSlots').map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <FormField
                        control={form.control}
                        name={`timeSlots.${index}.start`}
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className="pl-3 text-left font-normal"
                                  >
                                    {field.value
                                      ? format(field.value, 'yyyy-MM-dd')
                                      : <span>选择开始日期</span>}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`timeSlots.${index}.end`}
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className="pl-3 text-left font-normal"
                                  >
                                    {field.value
                                      ? format(field.value, 'yyyy-MM-dd')
                                      : <span>选择结束日期</span>}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormItem>
                        )}
                      />
                    </div>
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTimeSlot(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={addTimeSlot}
                >
                  添加时间段
                </Button>
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <span className="h-5 w-5 text-muted-foreground">📝</span>
                      描述
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="添加说明"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex justify-between">
              {selectedEvent && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                >
                  删除
                </Button>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  取消
                </Button>
                <Button type="submit">保存</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default EventDialog
