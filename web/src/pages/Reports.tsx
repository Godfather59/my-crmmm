import { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '../components/ui/input'
import { ReportCharts, type RevenuePoint, type CategoryPoint } from '../components/ReportCharts'
import { Button } from '../components/ui/button'
import { useApp } from '../context/AppContext'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Label } from '../components/ui/label'

const DAY = 86_400_000
const PRESET_STORAGE_KEY = 'flowsuite-report-presets@1'

type ReportPreset = {
  id: string
  name: string
  from: string
  to: string
}

const formatDate = (value: Date) => value.toISOString().slice(0, 10)
const dayKey = (value: number | Date | string) => {
  const d = new Date(value)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}
const formatLabel = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

export function Reports() {
  const { orders, products } = useApp()
  const ref = useRef<HTMLDivElement>(null)
  const [presets, setPresets] = useState<ReportPreset[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState<string>('')
  const [{ from, to }, setRange] = useState(() => {
    if (orders.length === 0) {
      const end = new Date()
      const start = new Date(end)
      start.setDate(start.getDate() - 6)
      return { from: formatDate(start), to: formatDate(end) }
    }
    const latestTs = orders.reduce((max, order) => Math.max(max, new Date(order.date).getTime()), 0)
    const end = new Date(latestTs)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    return { from: formatDate(start), to: formatDate(end) }
  })
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [presetName, setPresetName] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem(PRESET_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as ReportPreset[]
        setPresets(parsed)
      }
    } catch (error) {
      console.warn('Unable to load report presets', error)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets))
    } catch (error) {
      console.warn('Unable to persist report presets', error)
    }
  }, [presets])

  const summary = useMemo(() => {
    const start = new Date(`${from}T00:00:00`)
    const end = new Date(`${to}T23:59:59`)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return {
        revenue: [] as RevenuePoint[],
        categories: [] as CategoryPoint[],
        totalSales: 0,
        orderCount: 0,
      }
    }

    const revenueByDay = new Map<string, number>()
    const revenuePoints: RevenuePoint[] = []
    const categories = new Map<string, number>()
    const productIndex = new Map(products.map((p) => [p.id, p]))

    const filtered = orders.filter((order) => {
      const ts = new Date(order.date).getTime()
      return ts >= start.getTime() && ts <= end.getTime()
    })

    for (const order of filtered) {
      const key = dayKey(order.date)
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + order.totals.total)
      for (const item of order.items) {
        const product = productIndex.get(item.productId)
        const category = product?.category ?? 'Uncategorized'
        categories.set(category, (categories.get(category) ?? 0) + item.price * item.qty)
      }
    }

    const startDayTs = new Date(start)
    startDayTs.setHours(0, 0, 0, 0)
    const endDayTs = new Date(end)
    endDayTs.setHours(0, 0, 0, 0)

    for (let ts = startDayTs.getTime(); ts <= endDayTs.getTime(); ts += DAY) {
      const key = dayKey(ts)
      revenuePoints.push({
        day: formatLabel.format(new Date(ts)),
        value: Number((revenueByDay.get(key) ?? 0).toFixed(2)),
      })
    }

    const categoryPoints: CategoryPoint[] = Array.from(categories.entries())
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)

    const totalSales = filtered.reduce((sum, order) => sum + order.totals.total, 0)

    return {
      revenue: revenuePoints,
      categories: categoryPoints,
      totalSales: Number(totalSales.toFixed(2)),
      orderCount: filtered.length,
    }
  }, [orders, products, from, to])

  const exportExcel = () => {
    const wb = XLSX.utils.book_new()
    const s1 = XLSX.utils.json_to_sheet(summary.revenue.map((r) => ({ Day: r.day, Revenue: r.value })))
    const s2 = XLSX.utils.json_to_sheet(summary.categories.map((c) => ({ Category: c.name, Revenue: c.value })))
    XLSX.utils.book_append_sheet(wb, s1, 'RevenueByDay')
    XLSX.utils.book_append_sheet(wb, s2, 'SalesByCategory')
    const filename = `reports_${from}_to_${to}.xlsx`
    XLSX.writeFile(wb, filename)
  }

  const exportCSV = () => {
    const rows: Array<Array<string | number>> = [
      ['Section', 'Label', 'Value'],
      ...summary.revenue.map((r) => ['RevenueByDay', r.day, r.value.toFixed(2)]),
      ['', '', ''],
      ...summary.categories.map((c) => ['SalesByCategory', c.name, c.value.toFixed(2)]),
    ]
    const csv = rows
      .map((row) => row
        .map((value) => {
          const str = String(value)
          return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
        })
        .join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reports_${from}_to_${to}.csv`
    link.click()
    URL.revokeObjectURL(url)
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

  const applyPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId)
    if (!preset) return
    setSelectedPresetId(preset.id)
    setRange({ from: preset.from, to: preset.to })
  }

  const onSavePreset = () => {
    if (!presetName.trim()) return
    const next: ReportPreset = { id: crypto.randomUUID(), name: presetName.trim(), from, to }
    setPresets((prev) => [next, ...prev])
    setSelectedPresetId(next.id)
    setPresetName('')
    setSaveDialogOpen(false)
  }

  const clearPresetSelection = () => setSelectedPresetId('')
  const removePreset = (presetId: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== presetId))
    if (selectedPresetId === presetId) setSelectedPresetId('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <div className="text-xs text-muted-foreground">From</div>
          <Input
            type="date"
            value={from}
            onChange={(e) => {
              clearPresetSelection()
              setRange((prev) => ({ ...prev, from: e.target.value }))
            }}
          />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">To</div>
          <Input
            type="date"
            value={to}
            onChange={(e) => {
              clearPresetSelection()
              setRange((prev) => ({ ...prev, to: e.target.value }))
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={selectedPresetId}
            onChange={(e) => {
              const value = e.target.value
              if (value) applyPreset(value)
              else clearPresetSelection()
            }}
          >
            <option value="">Load preset...</option>
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name} ({preset.from} to {preset.to})
              </option>
            ))}
          </select>
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Save Preset</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save report preset</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="preset-name">Name</Label>
                  <Input id="preset-name" value={presetName} onChange={(e) => setPresetName(e.target.value)} />
                </div>
                <Button onClick={onSavePreset} disabled={!presetName.trim()}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="ghost"
            disabled={!selectedPresetId}
            onClick={() => selectedPresetId && removePreset(selectedPresetId)}
          >
            Delete Preset
          </Button>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={exportCSV} disabled={!summary.revenue.length && !summary.categories.length}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={exportExcel} disabled={!summary.revenue.length && !summary.categories.length}>
            Export Excel
          </Button>
          <Button onClick={exportPDF} disabled={!summary.revenue.length && !summary.categories.length}>
            Export PDF
          </Button>
        </div>
      </div>
      <div ref={ref} className="space-y-3 rounded-lg border bg-white p-4 dark:bg-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Revenue {from} to {to}</div>
            <div className="text-xs text-muted-foreground">
              {summary.orderCount} orders | {summary.totalSales.toFixed(2)} total
            </div>
          </div>
        </div>
        <ReportCharts revenue={summary.revenue} categories={summary.categories} />
      </div>
    </div>
  )
}

