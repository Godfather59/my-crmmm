import { useRef, useState } from 'react'
import { Input } from '../components/ui/input'
import { ReportCharts, type RevenuePoint, type CategoryPoint } from '../components/ReportCharts'
import { Button } from '../components/ui/button'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export function Reports() {
  const [from, setFrom] = useState('2025-09-10')
  const [to, setTo] = useState('2025-09-17')
  const ref = useRef<HTMLDivElement>(null)

  const revenue: RevenuePoint[] = [
    { day: 'Mon', value: 220 },
    { day: 'Tue', value: 260 },
    { day: 'Wed', value: 240 },
    { day: 'Thu', value: 330 },
    { day: 'Fri', value: 410 },
    { day: 'Sat', value: 390 },
    { day: 'Sun', value: 280 },
  ]
  const categories: CategoryPoint[] = [
    { name: 'Beverage', value: 580 },
    { name: 'Bakery', value: 260 },
    { name: 'Snacks', value: 120 },
  ]

  const exportExcel = () => {
    const wb = XLSX.utils.book_new()
    const s1 = XLSX.utils.json_to_sheet(revenue)
    const s2 = XLSX.utils.json_to_sheet(categories)
    XLSX.utils.book_append_sheet(wb, s1, 'RevenueByDay')
    XLSX.utils.book_append_sheet(wb, s2, 'SalesByCategory')
    const filename = `reports_${from}_to_${to}.xlsx`
    XLSX.writeFile(wb, filename)
  }

  const exportPDF = async () => {
    if (!ref.current) return
    const canvas = await html2canvas(ref.current, { scale: 2, backgroundColor: '#ffffff' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth - 40
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const y = 40
    pdf.setFontSize(12)
    pdf.text(`Reports ${from} to ${to}`, 40, 24)
    pdf.addImage(imgData, 'PNG', 20, y, imgWidth, Math.min(imgHeight, pageHeight - y - 20))
    pdf.save(`reports_${from}_to_${to}.pdf`)
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <div className="text-xs text-muted-foreground">From</div>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">To</div>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
          <Button onClick={exportPDF}>Export PDF</Button>
        </div>
      </div>
      <div ref={ref} className="rounded-lg border bg-white p-4 dark:bg-slate-950">
        <ReportCharts revenue={revenue} categories={categories} />
      </div>
    </div>
  )
}
