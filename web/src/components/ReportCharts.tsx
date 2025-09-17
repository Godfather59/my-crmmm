import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#3b82f6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444']

export type RevenuePoint = { day: string; value: number }
export type CategoryPoint = { name: string; value: number }

export function ReportCharts({
  revenue = [
    { day: 'Mon', value: 220 },
    { day: 'Tue', value: 260 },
    { day: 'Wed', value: 240 },
    { day: 'Thu', value: 330 },
    { day: 'Fri', value: 410 },
    { day: 'Sat', value: 390 },
    { day: 'Sun', value: 280 },
  ],
  categories = [
    { name: 'Beverage', value: 580 },
    { name: 'Bakery', value: 260 },
    { name: 'Snacks', value: 120 },
  ],
}: { revenue?: RevenuePoint[]; categories?: CategoryPoint[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="h-[300px] rounded-lg border bg-card p-4">
        <div className="mb-2 text-sm font-medium">Revenue (Last 7 days)</div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={revenue}>
            <XAxis dataKey="day" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="h-[300px] rounded-lg border bg-card p-4">
        <div className="mb-2 text-sm font-medium">Sales by Category</div>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={categories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
              {categories.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
