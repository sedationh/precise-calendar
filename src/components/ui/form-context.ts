import type { FieldPath, FieldValues } from 'react-hook-form'
import * as React from 'react'

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName
}

interface FormItemContextValue {
  id: string
}

export const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
)

export const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
)
