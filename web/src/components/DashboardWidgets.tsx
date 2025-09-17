import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function StatsCards({
  salesToday,
  rangeLabel,
  rangeSales,
  ordersCount,
  activeClients,
  lowStock,
}: {
  salesToday: number
  rangeLabel: string
  rangeSales: number
  ordersCount: number
  activeClients: number
  lowStock: number
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Card>
        <CardHeader>
          <CardTitle>Sales Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{salesToday.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Sales ({rangeLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{rangeSales.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Orders ({rangeLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{ordersCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Active Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{activeClients}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Low Stock Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{lowStock}</div>
        </CardContent>
      </Card>
    </div>
  )
}

