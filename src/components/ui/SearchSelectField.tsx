import { useField, type FieldHookConfig } from 'formik'
import { SearchSelect } from './SearchSelect'

interface SearchSelectFieldProps {
  name: string
  label?: string
  placeholder?: string
  options: { value: string; label: string }[]
}

export function SearchSelectField({ label, placeholder, options, ...props }: SearchSelectFieldProps) {
  const [field, meta, helpers] = useField(props as FieldHookConfig<string>)
  return (
    <SearchSelect
      label={label}
      placeholder={placeholder}
      options={options}
      value={field.value ?? ''}
      onChange={(val) => helpers.setValue(val)}
      error={meta.touched && meta.error ? meta.error : undefined}
    />
  )
}
