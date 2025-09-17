import './index.css'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { AppProvider } from './context/AppContext'
import { Dashboard } from './pages/Dashboard'
import { POS } from './pages/POS'
import { CRM } from './pages/CRM'
import { Reports } from './pages/Reports'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutProvider, useLayout } from './context/LayoutContext'
import { ToastProvider } from './components/ToastProvider'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Login } from './pages/Login'
import type { User } from './context/AuthContext'
import { MobileSidebar } from './components/MobileSidebar'

function PageContainer({ children }: { children: React.ReactNode }) {
  return <div className="p-4 sm:p-6">{children}</div>
}

function ProtectedRoute({ allowed }: { allowed?: Array<User['role']> }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (allowed && !allowed.includes(user.role)) {
    const fallback = user.role === 'cashier' ? '/pos' : '/'
    return <Navigate to={fallback} replace />
  }
  return <Outlet />
}

function Shell() {
  const { sidebarCollapsed, isMobile } = useLayout()
  const location = useLocation()
  const gridCols = sidebarCollapsed ? 'grid-cols-[72px_1fr]' : 'grid-cols-[260px_1fr]'

  return isMobile ? (
    <div className="flex h-screen flex-col bg-muted/40">
      <Topbar />
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <MobileSidebar />
    </div>
  ) : (
    <div className={`grid h-screen ${gridCols} grid-rows-[64px_1fr] bg-muted/40`}>
      <aside className="row-span-2 border-r bg-card">
        <Sidebar />
      </aside>
      <header className="col-start-2">
        <Topbar />
      </header>
      <main className="col-start-2 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <LayoutProvider>
          <BrowserRouter>
            <ToastProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<ProtectedRoute />}>
                  <Route element={<Shell />}>
                    <Route element={<ProtectedRoute allowed={['admin']} />}>
                      <Route index element={<PageContainer><Dashboard /></PageContainer>} />
                      <Route path="crm" element={<PageContainer><CRM /></PageContainer>} />
                      <Route path="reports" element={<PageContainer><Reports /></PageContainer>} />
                    </Route>
                    <Route element={<ProtectedRoute allowed={['admin', 'cashier']} />}>
                      <Route path="pos" element={<PageContainer><POS /></PageContainer>} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Route>
              </Routes>
            </ToastProvider>
          </BrowserRouter>
        </LayoutProvider>
      </AppProvider>
    </AuthProvider>
  )
}

export default App

