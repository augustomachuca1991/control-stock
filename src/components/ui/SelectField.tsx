import { useField, type FieldHookConfig } from 'formik'
import { Select } from './Select'

interface SelectFieldProps {
  name: string
  label?: string
  placeholder?: string
  options: { value: string; label: string }[]
}

export function SelectField({ label, placeholder, options, ...props }: SelectFieldProps) {
  const [field, meta] = useField(props as FieldHookConfig<string>)
  return (
    <Select
      label={label}
      placeholder={placeholder}
      options={options}
      {...field}
      value={field.value || ''}
      error={meta.touched && meta.error ? meta.error : undefined}
    />
  )
}
