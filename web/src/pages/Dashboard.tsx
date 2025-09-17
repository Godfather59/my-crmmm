import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { StatsCards } from '../components/DashboardWidgets'

export function Dashboard() {
  const { clients, products } = useApp()

  const stats = useMemo(() => {
    const salesToday = 342 // mock KPI; replace with real aggregation
    const activeClients = clients.length
    const lowStock = products.filter((p) => p.stock < 10).length
    return { salesToday, activeClients, lowStock }
  }, [clients, products])

  const chartData = [
    { name: 'Mon', sales: 220, orders: 30 },
    { name: 'Tue', sales: 280, orders: 40 },
    { name: 'Wed', sales: 190, orders: 24 },
    { name: 'Thu', sales: 320, orders: 44 },
    { name: 'Fri', sales: 410, orders: 55 },
    { name: 'Sat', sales: 380, orders: 49 },
    { name: 'Sun', sales: 260, orders: 33 },
  ]

  const topProducts = useMemo(() => {
    return products.slice(0, 5)
  }, [products])

  return (
    <div className="space-y-6">
      <StatsCards salesToday={stats.salesToday} activeClients={stats.activeClients} lowStock={stats.lowStock} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} />
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
              {topProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="truncate">{p.name}</span>
                  <span className="text-muted-foreground">{p.price.toFixed(2)}</span>
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
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="orders" fill="#0ea5e9" />
                <Bar dataKey="sales" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
