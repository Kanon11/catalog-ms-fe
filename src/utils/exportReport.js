// Client-side report export helpers (CSV / Excel / PDF).
//
// All three take the same shape so callers describe their data once:
//   columns: [{ header: 'Worker', key: 'worker' }, ...]
//   rows:    [{ worker: 'Rahim Uddin', ... }, ...]   // keyed by column.key
//
// We only ever *write* files here (never parse), so the xlsx parser CVEs don't apply.
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Brand purple, matching the antd theme token in Root.jsx.
const BRAND_RGB = [114, 46, 209]

function buildWorkbook(columns, rows, sheetName) {
  const header = columns.map((c) => c.header)
  // Keep native types (numbers stay numbers) so Excel sorts/sums them correctly.
  const body = rows.map((row) => columns.map((c) => row[c.key] ?? ''))
  const worksheet = XLSX.utils.aoa_to_sheet([header, ...body])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  return workbook
}

// Writes a UTF-8 .csv and triggers a browser download.
export function exportCsv(filename, columns, rows, { sheetName = 'Report' } = {}) {
  XLSX.writeFile(buildWorkbook(columns, rows, sheetName), filename, { bookType: 'csv' })
}

// Writes a .xlsx workbook and triggers a browser download.
export function exportExcel(filename, columns, rows, { sheetName = 'Report' } = {}) {
  XLSX.writeFile(buildWorkbook(columns, rows, sheetName), filename, { bookType: 'xlsx' })
}

// Renders a titled table to a .pdf (landscape) and triggers a browser download.
export function exportPdf(filename, columns, rows, { title } = {}) {
  const doc = new jsPDF({ orientation: 'landscape' })
  const startY = title ? 22 : 14
  if (title) doc.text(title, 14, 16)
  autoTable(doc, {
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => String(row[c.key] ?? ''))),
    startY,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: BRAND_RGB },
  })
  doc.save(filename)
}
