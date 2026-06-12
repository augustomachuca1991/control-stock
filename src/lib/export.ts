import * as XLSX from 'xlsx'

export interface ExportColumn<T> {
  key: keyof T | ((item: T) => string | number)
  header: string
  format?: (value: unknown) => string
}

function getValue<T>(item: T, col: ExportColumn<T>): string | number {
  const raw = typeof col.key === 'function' ? col.key(item) : item[col.key]
  return col.format ? col.format(raw) : String(raw ?? '')
}

export function exportToCSV<T>(data: T[], columns: ExportColumn<T>[], filename: string): void {
  if (data.length === 0) return
  const sep = ';'
  const head = columns.map((c) => `"${c.header}"`).join(sep)
  const rows = data.map((item) => columns.map((c) => `"${String(getValue(item, c)).replace(/"/g, '""')}"`).join(sep))
  const csv = [head, ...rows].join('\n')
  const bom = '\uFEFF'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportToXLSX<T>(data: T[], columns: ExportColumn<T>[], filename: string, sheetName = 'Datos'): void {
  if (data.length === 0) return
  const headerRow = columns.map((c) => c.header)
  const dataRows = data.map((item) => columns.map((c) => getValue(item, c)))
  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows])

  const colWidths = columns.map((_, i) => {
    const maxLen = Math.max(
      columns[i].header.length,
      ...dataRows.map((r) => String(r[i]).length)
    )
    return { wch: Math.min(maxLen + 3, 40) }
  })
  ws['!cols'] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
