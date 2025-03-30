export class History<T> {
  private past: T[] = []
  private present: T
  private future: T[] = []

  constructor(initialState: T) {
    this.present = this.deepClone(initialState)
  }

  // 深拷贝，考虑 Date 类型
  private deepClone(obj: T): T {
    return JSON.parse(JSON.stringify(obj), (_, value) => {
      if (value && typeof value === 'object' && value.constructor === Date) {
        return new Date(value)
      }
      return value
    })
  }

  push(newState: T) {
    this.past.push(this.deepClone(this.present))
    this.present = this.deepClone(newState)
    this.future = []
  }

  undo(): T | null {
    if (this.past.length === 0)
      return null

    this.future.push(this.deepClone(this.present))
    this.present = this.deepClone(this.past.pop()!)
    return this.present
  }

  redo(): T | null {
    if (this.future.length === 0)
      return null

    this.past.push(this.deepClone(this.present))
    this.present = this.deepClone(this.future.pop()!)
    return this.present
  }
}
