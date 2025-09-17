import { useMemo, useState } from 'react'
import { useApp, type Client } from '../context/AppContext'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'

export function ClientTable() {
  const { clients, addClient, updateClient } = useApp()
  const [query, setQuery] = useState('')
  const filtered = useMemo(
    () => clients.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.email.toLowerCase().includes(query.toLowerCase())),
    [clients, query],
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Input className="max-w-sm" placeholder="Search clients" value={query} onChange={(e) => setQuery(e.target.value)} />
        <ClientForm onSubmit={addClient} submitLabel="Add Client" />
      </div>
      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Email</th>
              <th className="px-3 py-2 text-left font-medium">Loyalty</th>
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-3 py-2">{c.name}</td>
                <td className="px-3 py-2">{c.email}</td>
                <td className="px-3 py-2">{c.loyaltyPoints}</td>
                <td className="px-3 py-2 text-right">
                  <ClientForm existing={c} onSubmit={updateClient} submitLabel="Edit" variant="outline" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ClientForm({ existing, onSubmit, variant, submitLabel }: { existing?: Client; onSubmit: (c: Client) => void; variant?: 'outline' | 'default'; submitLabel: string }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Client>(
    existing ?? { id: crypto.randomUUID(), name: '', email: '', phone: '', loyaltyPoints: 0, orders: [] },
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant}>{submitLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit Client' : 'Add Client'}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit(form)
            setOpen(false)
          }}
        >
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="points">Loyalty Points</Label>
            <Input
              id="points"
              type="number"
              value={form.loyaltyPoints}
              onChange={(e) => setForm({ ...form, loyaltyPoints: Number(e.target.value) })}
            />
          </div>
          <div className="pt-2">
            <Button type="submit" className="w-full">
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

