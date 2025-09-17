import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useAuth } from '../context/AuthContext'

type LocationState = { from?: { pathname: string } }

export function Login() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | undefined
  const [name, setName] = useState('')
  const [role, setRole] = useState<'admin' | 'cashier'>('admin')

  const redirectTarget = state?.from?.pathname ?? (role === 'cashier' ? '/pos' : '/')

  useEffect(() => {
    if (!user) return
    const target = user.role === 'cashier' ? '/pos' : '/'
    navigate(target, { replace: true })
  }, [user, navigate])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    signIn({ name, role })
    navigate(redirectTarget, { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <div className="text-2xl font-semibold">FlowSuite Access</div>
          <div className="text-sm text-muted-foreground">Choose a role to explore the workspace.</div>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="name">Display name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex" className="h-12 text-base" />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              className="mt-1 h-12 w-full rounded-md border border-input bg-background px-3 text-base"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'cashier')}
            >
              <option value="admin">Administrator</option>
              <option value="cashier">Cashier</option>
            </select>
          </div>
          <Button type="submit" className="w-full h-12 text-base">
            Continue
          </Button>
        </form>
      </div>
    </div>
  )
}

