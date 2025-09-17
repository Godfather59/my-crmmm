import { Search, Sun, Moon, User2, LogOut, Menu } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { useEffect, useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useLayout } from '../context/LayoutContext'

export function Topbar() {
  const [dark, setDark] = useState<boolean>(() => document.documentElement.classList.contains('dark'))
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { isMobile, setSidebarOpen } = useLayout()

  useEffect(() => {
    const root = document.documentElement
    if (dark) root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored) setDark(stored === 'dark')
  }, [])

  const handleSignOut = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-16 items-center justify-between border-b bg-background/60 px-4 backdrop-blur">
      <div className="flex items-center gap-2">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="relative hidden sm:block">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="h-10 w-[260px] pl-8" placeholder="Search..." />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} aria-label="Toggle theme">
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <User2 className="h-5 w-5" />
              <span className="hidden text-left sm:inline">
                <span className="block text-sm font-medium leading-tight">{user?.name ?? 'Guest'}</span>
                {user && <span className="block text-xs text-muted-foreground capitalize">{user.role}</span>}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

