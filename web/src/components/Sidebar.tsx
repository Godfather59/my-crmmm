import { NavLink } from 'react-router-dom'
import { ShoppingCart, Menu, ChevronLeft, X } from 'lucide-react'
import { Button } from './ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { useLayout } from '../context/LayoutContext'
import { useAuth } from '../context/AuthContext'

type NavItem = {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: Array<'admin' | 'cashier'>
}

const navItems: NavItem[] = [{ to: '/pos', label: 'POS', icon: ShoppingCart, roles: ['admin', 'cashier'] }]

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, isMobile, setSidebarOpen } = useLayout()
  const { user } = useAuth()
  if (!user) return null

  const collapsed = isMobile ? false : sidebarCollapsed
  const allowedNav = navItems.filter((item) => item.roles.includes(user.role))

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex h-16 items-center justify-between px-3">
        <div className="flex items-center gap-2">
          {!isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(!collapsed)}>
              {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>
          )}
          {(!collapsed || isMobile) && <span className="text-lg font-semibold">FlowSuite</span>}
        </div>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      <nav className={`flex-1 overflow-y-auto px-2 ${collapsed ? 'py-2' : 'py-4'}`}>
        {allowedNav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            onClick={() => {
              if (isMobile) setSidebarOpen(false)
            }}
            className={({ isActive }) =>
              `mb-2 flex items-center ${collapsed ? 'justify-center' : 'gap-3'} rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted ${
                isActive ? 'bg-muted text-foreground' : 'text-muted-foreground'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

