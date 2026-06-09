import { useField, type FieldHookConfig } from 'formik'
import { Input } from './Input'
import type { ReactNode } from 'react'

interface FieldProps {
  name: string
  label?: string
  icon?: ReactNode
  type?: string
  placeholder?: string
  disabled?: boolean
  min?: string | number
  max?: string | number
  step?: string
}

export function Field({ label, icon, ...props }: FieldProps) {
  const [field, meta] = useField(props as FieldHookConfig<string>)
  return (
    <Input
      label={label}
      icon={icon}
      {...field}
      value={field.value ?? ''}
      error={meta.touched && meta.error ? meta.error : undefined}
      {...props}
    />
  )
}
