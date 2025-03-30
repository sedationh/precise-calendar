import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { addDays, format, subDays } from 'date-fns'
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
  color?: string
}

interface EventDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (eventData: { title: string, timeSlots: TimeSlot[], allDay: boolean, description?: string, color?: string }) => void
  onDelete: () => void
  selectedDate: Date
  selectedEvent: CustomEventSourceInput | null
}

// 创建表单验证模式
const formSchema = z.object({
  title: z.string().min(1, { message: 'Title cannot be empty' }),
  timeSlots: z.array(z.object({
    start: z.date(),
    end: z.date().optional(),
  })),
  description: z.string().optional(),
  color: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// 预定义的颜色选项
const colorOptions = [
  { label: 'Blue', value: '#3788d8' },
  { label: 'Red', value: '#dc3545' },
  { label: 'Green', value: '#28a745' },
  { label: 'Purple', value: '#6f42c1' },
  { label: 'Yellow', value: '#ffc107' },
  { label: 'Pink', value: '#e83e8c' },
]

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
      title: '',
      timeSlots: [{ start: selectedDate, end: selectedDate }],
      description: '',
      color: '#3788d8',
    },
  })

  // 当对话框打开或选中的事件变化时重置表单
  useEffect(() => {
    if (isOpen) {
      if (selectedEvent) {
        // 确保时间段按开始时间排序
        const sortedTimeSlots = [...selectedEvent.timeSlots].sort((a, b) =>
          a.start.getTime() - b.start.getTime(),
        )

        form.reset({
          title: selectedEvent.title,
          timeSlots: sortedTimeSlots,
          description: selectedEvent.description || '',
          color: selectedEvent.color || '#3788d8',
        })
      }
      else {
        form.reset({
          title: '',
          timeSlots: [{
            start: selectedDate,
            end: addDays(selectedDate, 1),
          }],
          description: '',
          color: '#3788d8',
        })
      }
    }
  }, [isOpen, selectedEvent, selectedDate, form])

  // 处理表单提交
  const onSubmit = (data: FormValues) => {
    onSave({
      title: data.title,
      timeSlots: data.timeSlots.map(slot => ({
        start: slot.start,
        end: slot.end ?? slot.start,
      })),
      allDay: true,
      description: data.description,
      color: data.color,
    })
  }

  // 删除时间段
  const removeTimeSlot = (index: number) => {
    const currentTimeSlots = form.getValues('timeSlots')
    const newTimeSlots = currentTimeSlots.filter((_, i) => i !== index)

    if (newTimeSlots.length === 0) {
      // 如果删除后没有时间段了，删除整个任务
      onDelete()
      return
    }

    // 按开始时间排序
    newTimeSlots.sort((a, b) => a.start.getTime() - b.start.getTime())
    form.setValue('timeSlots', newTimeSlots)
  }

  // 添加新的时间段
  const addTimeSlot = () => {
    const currentTimeSlots = form.getValues('timeSlots')
    // 找出当前所有时间段中最晚的结束时间
    const latestEndDate = currentTimeSlots.reduce((latest, slot) => {
      if (!slot.end)
        return latest
      return slot.end > latest ? slot.end : latest
    }, currentTimeSlots[0]?.end || selectedDate)

    const newTimeSlots = [
      ...currentTimeSlots,
      { start: latestEndDate, end: addDays(latestEndDate, 1) },
    ]
    // 按开始时间排序
    newTimeSlots.sort((a, b) => a.start.getTime() - b.start.getTime())
    form.setValue('timeSlots', newTimeSlots)
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>
                {selectedEvent ? 'Edit Event' : 'New Event'}
              </DialogTitle>
              <DialogDescription>
                {selectedEvent ? 'Modify event details' : 'Create a new event'}
              </DialogDescription>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Add event title"
                        className="text-lg font-medium border-none focus-visible:ring-0 focus-visible:ring-offset-0"
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
                  <span className="text-sm font-medium">Time Slots</span>
                </div>
                {form.watch('timeSlots').map((_, index) => (
                  // eslint-disable-next-line react/no-array-index-key
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
                                      : <span>Select start date</span>}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => {
                                    field.onChange(date)
                                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
                                  }}
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
                                      ? format(subDays(field.value, 1), 'yyyy-MM-dd')
                                      : <span>Select end date</span>}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value ? subDays(field.value, 1) : undefined}
                                  onSelect={(date) => {
                                    field.onChange(date ? addDays(date, 1) : undefined)
                                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
                                  }}
                                  initialFocus
                                  weekStartsOn={1}
                                />
                              </PopoverContent>
                            </Popover>
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTimeSlot(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={addTimeSlot}
                >
                  Add Time Slot
                </Button>
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <span className="h-5 w-5 text-muted-foreground">📝</span>
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add description"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <span className="h-5 w-5 text-muted-foreground">🎨</span>
                      Color
                    </FormLabel>
                    <div className="flex gap-2">
                      {colorOptions.map(color => (
                        <div
                          key={color.value}
                          onClick={() => field.onChange(color.value)}
                          className={`w-6 h-6 rounded-full cursor-pointer ${
                            field.value === color.value ? 'ring-2 ring-offset-2 ring-black' : ''
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.label}
                        />
                      ))}
                    </div>
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
                  Delete
                </Button>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default EventDialog
