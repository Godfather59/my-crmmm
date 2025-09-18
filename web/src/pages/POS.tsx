import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { Input } from '../components/ui/input'
import { POSCart } from '../components/POSCart'
import { ProductCard } from '../components/ProductCard'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useToast } from '../components/ToastProvider'
import { useAuth } from '../context/AuthContext'

const formatDateTime = (value: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString()
}

const supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'MAD']
const SUMMARY_DAYS = 7
const dayFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

const toDayKey = (value: Date) => {
  const copy = new Date(value)
  copy.setHours(0, 0, 0, 0)
  return copy.toISOString().slice(0, 10)
}

export function POS() {
  const { products, orders, currency, setCurrency, markOrdersSynced, shifts, activeShiftId, startShift, closeShift } = useApp()
  const [query, setQuery] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const online = useOnlineStatus()
  const { toast } = useToast()
  const { user } = useAuth()
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat(undefined, { style: 'currency', currency }),
    [currency],
  )
  const formatCurrency = (value: number) => currencyFormatter.format(value)
  const recentOrders = useMemo(() => orders.slice(0, 25), [orders])
  const historySummary = useMemo(
    () =>
      recentOrders.reduce(
        (acc, order) => {
          acc.orderCount += 1
          acc.itemCount += order.items.reduce((sum, item) => sum + item.qty, 0)
          acc.totalAmount += order.totals.total
          return acc
        },
        { orderCount: 0, itemCount: 0, totalAmount: 0 },
      ),
    [recentOrders],
  )
  const reportWindowStart = useMemo(() => {
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    const start = new Date(end)
    start.setDate(start.getDate() - (SUMMARY_DAYS - 1))
    start.setHours(0, 0, 0, 0)
    return start
  }, [])
  const summary = useMemo(() => {
    const totals = { totalSales: 0, orderCount: 0, itemCount: 0 }
    const dailyMap = new Map<string, { total: number; orders: number }>()
    const productMap = new Map<string, { qty: number; total: number }>()
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    for (const order of orders) {
      const date = new Date(order.date)
      if (Number.isNaN(date.getTime())) continue
      if (date < reportWindowStart || date > end) continue
      totals.totalSales += order.totals.total
      totals.orderCount += 1
      const itemsQty = order.items.reduce((sum, item) => sum + item.qty, 0)
      totals.itemCount += itemsQty
      const key = toDayKey(date)
      const entry = dailyMap.get(key) ?? { total: 0, orders: 0 }
      entry.total += order.totals.total
      entry.orders += 1
      dailyMap.set(key, entry)
      for (const item of order.items) {
        const seen = productMap.get(item.name) ?? { qty: 0, total: 0 }
        seen.qty += item.qty
        seen.total += item.price * item.qty
        productMap.set(item.name, seen)
      }
    }
    const daily = Array.from({ length: SUMMARY_DAYS }, (_, idx) => {
      const day = new Date(reportWindowStart)
      day.setDate(reportWindowStart.getDate() + idx)
      const key = toDayKey(day)
      const entry = dailyMap.get(key) ?? { total: 0, orders: 0 }
      return { label: dayFormatter.format(day), total: entry.total, orders: entry.orders }
    })
    const topProducts = Array.from(productMap.entries())
      .map(([name, info]) => ({ name, qty: info.qty, total: info.total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
    const averageTicket = totals.orderCount > 0 ? totals.totalSales / totals.orderCount : 0
    return { ...totals, averageTicket, daily, topProducts }
  }, [orders, reportWindowStart])
  const filtered = useMemo(
    () =>
      products.filter(
        (p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.category?.toLowerCase().includes(query.toLowerCase()),
      ),
    [products, query],
  )

  const unsyncedOrders = useMemo(() => orders.filter((order) => !order.syncedAt), [orders])
  const activeShift = useMemo(() => (activeShiftId ? shifts.find((shift) => shift.id === activeShiftId) ?? null : null), [activeShiftId, shifts])
  const activeShiftOrders = useMemo(() => (activeShiftId ? orders.filter((order) => order.shiftId === activeShiftId) : []), [orders, activeShiftId])
  const activeShiftTotals = useMemo(() => {
    if (!activeShift) return { total: 0, count: 0 }
    const total = activeShiftOrders.reduce((sum, order) => sum + order.totals.total, 0)
    return { total, count: activeShiftOrders.length }
  }, [activeShift, activeShiftOrders])

  const [openingFloat, setOpeningFloat] = useState('100')
  const [openingNote, setOpeningNote] = useState('')
  const [closingCount, setClosingCount] = useState('')
  const [closingNote, setClosingNote] = useState('')

  const handleSyncPending = () => {
    if (!unsyncedOrders.length) return
    markOrdersSynced(unsyncedOrders.map((order) => order.id))
    toast({ title: 'Offline sales marked synced', description: 'Queued orders moved to synced history.' })
  }

  const handleStartShift = (event: React.FormEvent) => {
    event.preventDefault()
    const parsed = Number(openingFloat)
    if (Number.isNaN(parsed) || parsed < 0) {
      toast({ title: 'Invalid opening float', description: 'Enter a non-negative amount.', variant: 'destructive' })
      return
    }
    const openedBy = user?.name ?? 'Cashier'
    const normalizedOpening = Math.round(parsed * 100) / 100
    const shift = startShift({ openingFloat: normalizedOpening, openingNote: openingNote.trim() || undefined, openedBy })
    toast({ title: 'Shift started', description: `Drawer seeded with ${formatCurrency(shift.openingFloat)}.` })
    setOpeningNote('')
  }

  const handleCloseShift = (event: React.FormEvent) => {
    event.preventDefault()
    if (!activeShift) return
    const parsed = Number(closingCount)
    if (Number.isNaN(parsed) || parsed < 0) {
      toast({ title: 'Invalid closing count', description: 'Enter a non-negative amount.', variant: 'destructive' })
      return
    }
    const closedBy = user?.name ?? 'Cashier'
    const normalizedClosing = Math.round(parsed * 100) / 100
    const result = closeShift({ shiftId: activeShift.id, closingCount: normalizedClosing, closingNote: closingNote.trim() || undefined, closedBy })
    if (result) {
      toast({
        title: 'Shift closed',
        description: `Variance recorded at ${formatCurrency(result.variance ?? 0)}.`,
      })
    }
    setClosingCount('')
    setClosingNote('')
  }

  const handlePrintHistory = () => {
    const escapeHtml = (value: string) =>
      value.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char] ?? char))
    const historyHtml = recentOrders
      .map((order) => {
        const itemRows = order.items
          .map(
            (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.qty}</td>
                  <td>${formatCurrency(item.price)}</td>
                  <td>${formatCurrency(item.price * item.qty)}</td>
                </tr>
              `,
          )
          .join('')
        const noteMarkup = order.note
          ? `<div class="order-note"><strong>Note:</strong><br/>${escapeHtml(order.note)}</div>`
          : ''
        const pending = !order.syncedAt
        const statusMarkup = `<div class="order-status ${pending ? 'pending' : 'synced'}">${
          pending ? 'Pending sync' : `Synced ${formatDateTime(order.syncedAt!)}`
        }</div>`
        return `
            <section class="order">
              <div class="order-header">
                <span><strong>Order:</strong> ${order.id}</span>
                <span>${formatDateTime(order.date)}</span>
                <span><strong>Total:</strong> ${formatCurrency(order.totals.total)}</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>
              ${noteMarkup}
              ${statusMarkup}
            </section>
          `
      })
      .join('')
    const printable = `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Recent Sales</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { font-size: 20px; margin-bottom: 16px; }
            .summary { margin-bottom: 16px; font-size: 14px; }
            .order { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
            .order-header { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; font-size: 13px; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border-bottom: 1px solid #e5e7eb; padding: 6px 4px; text-align: left; font-size: 12px; }
            th:last-child, td:last-child { text-align: right; }
            .order-note { font-size: 11px; margin-top: 8px; white-space: pre-wrap; color: #374151; }
            .order-status { font-size: 11px; margin-top: 8px; color: #4b5563; }
            .order-status.pending { color: #b45309; }
            .order-status.synced { color: #047857; }
          </style>
        </head>
        <body>
          <h1>Recent Sales</h1>
          <div class="summary">
            <div><strong>Orders:</strong> ${historySummary.orderCount}</div>
            <div><strong>Items:</strong> ${historySummary.itemCount}</div>
            <div><strong>Total captured:</strong> ${formatCurrency(historySummary.totalAmount)}</div>
          </div>
          ${historyHtml || '<p>No sales recorded yet.</p>'}
        </body>
      </html>`

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) return
    printWindow.document.open()
    printWindow.document.write(printable)
    printWindow.document.close()
    printWindow.focus()
    printWindow.onafterprint = () => printWindow.close()
    printWindow.print()
  }

  const [activeTab, setActiveTab] = useState<'sale' | 'summary' | 'shift'>('sale')

  return (
    <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'sale' | 'summary' | 'shift')} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="sale">Checkout</TabsTrigger>
          <TabsTrigger value="summary">Sales summary</TabsTrigger>
          <TabsTrigger value="shift">Shift planner</TabsTrigger>
        </TabsList>
        <label className="flex items-center gap-2 text-sm" htmlFor="currency-select">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Currency</span>
          <select
            id="currency-select"
            className="h-10 rounded-md border border-input bg-background px-2 text-sm"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {supportedCurrencies.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
      </div>
      <TabsContent value="sale" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Input
                placeholder="Search products"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 flex-1 min-w-[220px] text-base"
              />
              <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-12">
                    Recent sales
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Recent sales</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div>
                      <div className="font-medium">Last {recentOrders.length} orders</div>
                      <div className="text-xs text-muted-foreground">
                        {historySummary.orderCount} orders | {historySummary.itemCount} items | {formatCurrency(historySummary.totalAmount)} total{unsyncedOrders.length ? ` | ${unsyncedOrders.length} pending` : ''}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrintHistory}
                      disabled={recentOrders.length === 0}
                    >
                      Print
                    </Button>
                  </div>
                  <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                    {recentOrders.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No sales recorded yet.</div>
                    ) : (
                  recentOrders.map((order) => {
                    const pending = !order.syncedAt
                    return (
                      <div key={order.id} className="rounded-lg border p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="font-mono font-medium">{order.id}</div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                pending
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                              }`}
                            >
                              {pending ? 'Pending sync' : 'Synced'}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">{formatDateTime(order.date)}</div>
                          <div className="font-semibold">{formatCurrency(order.totals.total)}</div>
                        </div>
                        <div className="mt-2 space-y-1 text-xs">
                          {order.items.map((item, idx) => (
                            <div key={`${order.id}-${idx}`} className="grid grid-cols-[1fr_auto_auto] gap-x-3">
                              <span className="truncate">{item.name}</span>
                              <span className="text-right">x {item.qty}</span>
                              <span className="text-right">{formatCurrency(item.price * item.qty)}</span>
                            </div>
                          ))}
                        </div>
                        {order.note && (
                          <div className="pt-2 text-xs text-muted-foreground">
                            <div className="font-semibold uppercase tracking-wide text-[10px]">Note</div>
                            <div className="mt-1 whitespace-pre-line">{order.note}</div>
                          </div>
                        )}
                        <div className="pt-2 text-xs text-muted-foreground">
                          {pending ? 'Awaiting sync' : `Synced ${formatDateTime(order.syncedAt!)}`}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </DialogContent>
          </Dialog>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} id={p.id} name={p.name} price={p.price} stock={p.stock} />
              ))}
            </div>
          </div>
          <div className="lg:col-span-1">
            <POSCart />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="summary" className="space-y-4">
        {unsyncedOrders.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">Offline sales queue</div>
                <div className="text-xs text-muted-foreground">
                  {unsyncedOrders.length} order{unsyncedOrders.length === 1 ? '' : 's'} pending sync.
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleSyncPending}
                disabled={!online}
                title={online ? undefined : 'Reconnect to mark these orders as synced'}
              >
                Mark synced
              </Button>
            </div>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              {unsyncedOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex justify-between gap-2 font-mono">
                  <span>{order.id}</span>
                  <span>{formatDateTime(order.date)}</span>
                </div>
              ))}
              {unsyncedOrders.length > 5 && (
                <div className="text-xs italic">+{unsyncedOrders.length - 5} more queued...</div>
              )}
            </div>
          </div>
        )}

        <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-950">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Last {SUMMARY_DAYS} days</div>
              <div className="text-xs text-muted-foreground">Automatically aggregates completed orders.</div>
            </div>
            <div className="text-xs text-muted-foreground">{summary.orderCount} orders captured</div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border bg-card/60 p-3 dark:bg-slate-900">
              <div className="text-xs text-muted-foreground">Total sales</div>
              <div className="text-2xl font-semibold">{formatCurrency(summary.totalSales)}</div>
            </div>
            <div className="rounded-lg border bg-card/60 p-3 dark:bg-slate-900">
              <div className="text-xs text-muted-foreground">Orders</div>
              <div className="text-2xl font-semibold">{summary.orderCount}</div>
            </div>
            <div className="rounded-lg border bg-card/60 p-3 dark:bg-slate-900">
              <div className="text-xs text-muted-foreground">Items sold</div>
              <div className="text-2xl font-semibold">{summary.itemCount}</div>
            </div>
            <div className="rounded-lg border bg-card/60 p-3 dark:bg-slate-900">
              <div className="text-xs text-muted-foreground">Average ticket</div>
              <div className="text-2xl font-semibold">{formatCurrency(summary.averageTicket)}</div>
            </div>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-950">
            <div className="text-sm font-medium">Daily totals</div>
            <div className="mt-3 space-y-2">
              {summary.daily.map((day) => (
                <div key={day.label} className="flex items-baseline justify-between gap-3 text-sm">
                  <div>
                    <div>{day.label}</div>
                    <div className="text-xs text-muted-foreground">{day.orders} orders</div>
                  </div>
                  <div className="font-medium">{formatCurrency(day.total)}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-950">
            <div className="text-sm font-medium">Top products</div>
            <div className="mt-3 space-y-2">
              {summary.topProducts.length === 0 ? (
                <div className="text-sm text-muted-foreground">No products sold in this window.</div>
              ) : (
                summary.topProducts.map((product) => (
                  <div key={product.name} className="flex items-baseline justify-between gap-3 text-sm">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.qty} sold</div>
                    </div>
                    <div className="font-medium">{formatCurrency(product.total)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="shift" className="space-y-4">
        {activeShift ? (
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-950">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">Active shift</div>
                  <div className="text-xs text-muted-foreground">
                    Opened {formatDateTime(activeShift.openedAt)} by {activeShift.openedBy}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Opening float {formatCurrency(activeShift.openingFloat)}
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-card/60 p-3 dark:bg-slate-900">
                  <div className="text-xs text-muted-foreground">Orders in shift</div>
                  <div className="text-2xl font-semibold">{activeShiftTotals.count}</div>
                </div>
                <div className="rounded-lg border bg-card/60 p-3 dark:bg-slate-900">
                  <div className="text-xs text-muted-foreground">Sales captured</div>
                  <div className="text-2xl font-semibold">{formatCurrency(activeShiftTotals.total)}</div>
                </div>
                <div className="rounded-lg border bg-card/60 p-3 dark:bg-slate-900">
                  <div className="text-xs text-muted-foreground">Expected drawer</div>
                  <div className="text-2xl font-semibold">{formatCurrency(activeShift.openingFloat + activeShiftTotals.total)}</div>
                </div>
                <div className="rounded-lg border bg-card/60 p-3 dark:bg-slate-900">
                  <div className="text-xs text-muted-foreground">Offline orders pending</div>
                  <div className="text-2xl font-semibold">{unsyncedOrders.filter((order) => order.shiftId === activeShift.id).length}</div>
                </div>
              </div>
              {activeShift.openingNote && (
                <div className="mt-3 text-xs text-muted-foreground">
                  <div className="font-semibold uppercase tracking-wide text-[10px]">Opening note</div>
                  <div className="mt-1 whitespace-pre-line">{activeShift.openingNote}</div>
                </div>
              )}
            </div>
            <form onSubmit={handleCloseShift} className="flex flex-col gap-3 rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-950">
              <div>
                <div className="text-sm font-medium">Close shift</div>
                <div className="text-xs text-muted-foreground">Count the drawer and record variance.</div>
              </div>
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground" htmlFor="closing-count">
                Cash counted
              </label>
              <Input
                id="closing-count"
                type="number"
                min="0"
                step="0.01"
                value={closingCount}
                onChange={(e) => setClosingCount(e.target.value)}
                placeholder="e.g. 245.50"
                required
              />
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground" htmlFor="closing-note">
                Notes (optional)
              </label>
              <textarea
                id="closing-note"
                value={closingNote}
                onChange={(e) => setClosingNote(e.target.value)}
                className="h-24 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="rounded-md border border-muted-foreground/10 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                Expected drawer {formatCurrency(activeShift.openingFloat + activeShiftTotals.total)}
              </div>
              <Button type="submit" className="mt-2" disabled={!closingCount.trim()}>
                Finalise shift
              </Button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleStartShift} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-950">
            <div>
              <div className="text-sm font-medium">Start new shift</div>
              <div className="text-xs text-muted-foreground">Seed the drawer float before taking orders.</div>
            </div>
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground" htmlFor="opening-float">
              Opening float
            </label>
            <Input
              id="opening-float"
              type="number"
              min="0"
              step="0.01"
              value={openingFloat}
              onChange={(e) => setOpeningFloat(e.target.value)}
              required
            />
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground" htmlFor="opening-note">
              Notes (optional)
            </label>
            <textarea
              id="opening-note"
              value={openingNote}
              onChange={(e) => setOpeningNote(e.target.value)}
              className="h-24 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" className="mt-2">
              Begin shift
            </Button>
          </form>
        )}

        <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-950">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Shift history</div>
            <div className="text-xs text-muted-foreground">Most recent first</div>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            {shifts.length === 0 && <div className="text-muted-foreground">No shifts logged yet.</div>}
            {shifts.slice(0, 10).map((shift) => {
              const closed = Boolean(shift.closedAt)
              const varianceLabel = typeof shift.variance === 'number' ? formatCurrency(shift.variance) : '—'
              return (
                <div key={shift.id} className="rounded-md border px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{formatDateTime(shift.openedAt)}</span>
                    <span>{shift.openedBy}</span>
                    <span
                      className={`font-medium ${
                        closed
                          ? (shift.variance ?? 0) === 0
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {closed ? `Variance ${varianceLabel}` : 'Open'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Float {formatCurrency(shift.openingFloat)}
                    {closed && shift.systemExpected !== undefined && shift.closingCount !== undefined && (
                      <span>
                        {' · '}Expected {formatCurrency(shift.systemExpected)} | Counted {formatCurrency(shift.closingCount)}
                      </span>
                    )}
                  </div>
                  {shift.closingNote && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      <span className="font-semibold uppercase tracking-wide text-[10px]">Closing note</span>
                      <div className="whitespace-pre-line">{shift.closingNote}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

