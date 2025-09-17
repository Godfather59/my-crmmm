import { NavLink } from 'react-router-dom'
import { LayoutGrid, ShoppingCart, Users2, BarChart3, Menu, ChevronLeft } from 'lucide-react'
import { Button } from './ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { useLayout } from '../context/LayoutContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid },
  { to: '/pos', label: 'POS', icon: ShoppingCart },
  { to: '/crm', label: 'CRM', icon: Users2 },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
]

export function Sidebar() {
  const { sidebarCollapsed: collapsed, setSidebarCollapsed: setCollapsed } = useLayout()
  return (
    <div className="h-full">
      <div className="flex h-16 items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
          {!collapsed && <span className="text-lg font-semibold">FlowSuite</span>}
        </div>
      </div>
      <nav className={"px-2"}>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
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
