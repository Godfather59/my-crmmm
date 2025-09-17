import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useApp } from '../context/AppContext'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { StatsCards } from '../components/DashboardWidgets'

const DAY = 86_400_000
const RANGE_OPTIONS = [
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '30d', label: 'Last 30 days', days: 30 },
  { id: '90d', label: 'Last 90 days', days: 90 },
] as const
type RangeKey = (typeof RANGE_OPTIONS)[number]['id']

const dateKey = (value: number | Date | string) => {
  const time = typeof value === 'string' ? new Date(value).getTime() : value instanceof Date ? value.getTime() : value
  const d = new Date(time)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

const startOfDay = (value: number | Date | string) => {
  const time = typeof value === 'string' ? new Date(value).getTime() : value instanceof Date ? value.getTime() : value
  const d = new Date(time)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const formatLabel = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

export function Dashboard() {
  const { clients, products, orders } = useApp()
  const [range, setRange] = useState<RangeKey>('7d')
  const rangeConfig = RANGE_OPTIONS.find((r) => r.id === range) ?? RANGE_OPTIONS[0]

  const summary = useMemo(() => {
    const today = Date.now()
    const latestOrderTs = orders.reduce((max, order) => Math.max(max, new Date(order.date).getTime()), 0)
    const rangeEnd = Math.max(today, latestOrderTs || today)
    const rangeStart = startOfDay(rangeEnd - (rangeConfig.days - 1) * DAY)

    const dayTotals = new Map<string, { sales: number; orders: number }>()
    const productTotals = new Map<string, { id: string; name: string; qty: number; revenue: number }>()

    const ordersInRange = orders.filter((order) => {
      const ts = new Date(order.date).getTime()
      return ts >= rangeStart && ts <= rangeEnd
    })

    for (const order of ordersInRange) {
      const key = dateKey(order.date)
      const day = dayTotals.get(key) ?? { sales: 0, orders: 0 }
      day.sales += order.totals.total
      day.orders += 1
      dayTotals.set(key, day)

      for (const item of order.items) {
        const pt = productTotals.get(item.productId) ?? { id: item.productId, name: item.name, qty: 0, revenue: 0 }
        pt.qty += item.qty
        pt.revenue += item.price * item.qty
        productTotals.set(item.productId, pt)
      }
    }

    const chartData: Array<{ name: string; sales: number; orders: number }> = []
    const firstDay = startOfDay(rangeStart)
    const lastDay = startOfDay(rangeEnd)
    for (let day = firstDay; day <= lastDay; day += DAY) {
      const key = dateKey(day)
      const totals = dayTotals.get(key) ?? { sales: 0, orders: 0 }
      chartData.push({
        name: formatLabel.format(new Date(day)),
        sales: Number(totals.sales.toFixed(2)),
        orders: totals.orders,
      })
    }

    const topProducts = Array.from(productTotals.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)

    const rangeSales = ordersInRange.reduce((sum, order) => sum + order.totals.total, 0)
    const ordersCount = ordersInRange.length

    const todayStart = startOfDay(today)
    const todayEnd = todayStart + DAY - 1
    const salesToday = orders
      .filter((order) => {
        const ts = new Date(order.date).getTime()
        return ts >= todayStart && ts <= todayEnd
      })
      .reduce((sum, order) => sum + order.totals.total, 0)

    const activeClientIds = new Set<string>()
    for (const order of ordersInRange) {
      if (order.clientId) activeClientIds.add(order.clientId)
    }
    const activeClients = activeClientIds.size || clients.filter((c) => c.orders.length > 0).length || clients.length

    const lowStock = products.filter((p) => p.stock < 10).length

    return {
      chartData,
      topProducts,
      stats: {
        salesToday: Number(salesToday.toFixed(2)),
        rangeSales: Number(rangeSales.toFixed(2)),
        ordersCount,
        activeClients,
        lowStock,
      },
    }
  }, [orders, rangeConfig.days, clients, products])

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
          {RANGE_OPTIONS.map((option) => (
            <Button
              key={option.id}
              variant={option.id === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRange(option.id)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <StatsCards
          salesToday={summary.stats.salesToday}
          rangeLabel={rangeConfig.label}
          rangeSales={summary.stats.rangeSales}
          ordersCount={summary.stats.ordersCount}
          activeClients={summary.stats.activeClients}
          lowStock={summary.stats.lowStock}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.chartData}>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.topProducts.length === 0 && (
                <div className="text-sm text-muted-foreground">No sales in selected range.</div>
              )}
              {summary.topProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">Sold {p.qty}</div>
                  </div>
                  <span className="font-mono">{p.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Orders vs Sales</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.chartData}>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="orders" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

