import * as React from 'react'

interface FormFieldContextValue {
  name: string
}

interface FormItemContextValue {
  id: string
}

export const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue)
export const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue)
