import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function StatsCards({ salesToday, activeClients, lowStock }: { salesToday: number; activeClients: number; lowStock: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Sales Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{salesToday}</div>
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
