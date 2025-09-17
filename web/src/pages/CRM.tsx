import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { ClientTable } from '../components/ClientTable'
import { useApp } from '../context/AppContext'

export function CRM() {
  const { clients } = useApp()
  const selected = clients[0]
  return (
    <div className="space-y-6">
      <Tabs defaultValue="clients">
        <TabsList>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
        </TabsList>
        <TabsContent value="clients" className="mt-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ClientTable />
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="mb-2 text-sm font-medium">Client Profile</div>
              {selected ? (
                <div className="space-y-2 text-sm">
                  <div className="font-medium">{selected.name}</div>
                  <div className="text-muted-foreground">{selected.email}</div>
                  <div>Loyalty: {selected.loyaltyPoints}</div>
                  <div className="pt-2 text-xs font-medium text-muted-foreground">Recent Orders</div>
                  <div className="space-y-1">
                    {selected.orders.map((o) => (
                      <div key={o.id} className="flex justify-between">
                        <span>{o.date}</span>
                        <span>${o.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No client selected</div>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="employees" className="mt-4">
          <EmployeeManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}

import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import type { Employee } from '../context/AppContext'

function EmployeeManager() {
  const { employees, addEmployee, updateEmployee } = useApp()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Employees</div>
        <Button onClick={() => { setEditing(null); setOpen(true) }}>Add Employee</Button>
      </div>
      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Role</th>
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="px-3 py-2">{e.name}</td>
                <td className="px-3 py-2">{e.role}</td>
                <td className="px-3 py-2 text-right">
                  <Button variant="outline" onClick={() => { setEditing(e); setOpen(true) }}>Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Employee' : 'Add Employee'}</DialogTitle></DialogHeader>
          <EmployeeForm
            existing={editing ?? undefined}
            onSubmit={(emp) => {
              editing ? updateEmployee(emp) : addEmployee(emp)
              setOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EmployeeForm({ existing, onSubmit }: { existing?: Employee; onSubmit: (e: Employee) => void }) {
  const [form, setForm] = useState<Employee>(existing ?? { id: crypto.randomUUID(), name: '', role: '' })
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(form)
      }}
    >
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="role">Role</Label>
        <Input id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
      </div>
      <Button type="submit" className="w-full">Save</Button>
    </form>
  )
}
