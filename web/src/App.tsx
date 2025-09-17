import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
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

function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="p-6"
    >
      {children}
    </motion.div>
  )
}

function App() {
  return (
    <AppProvider>
      <LayoutProvider>
        <BrowserRouter>
          <ToastProvider>
            <Shell />
          </ToastProvider>
        </BrowserRouter>
      </LayoutProvider>
    </AppProvider>
  )
}

function Shell() {
  const { sidebarCollapsed } = useLayout()
  const gridCols = sidebarCollapsed ? 'grid-cols-[72px_1fr]' : 'grid-cols-[260px_1fr]'
  return (
    <div className={`grid h-screen ${gridCols} grid-rows-[64px_1fr] bg-muted/40`}>
      <aside className="row-span-2 border-r bg-card">
        <Sidebar />
      </aside>
      <header className="col-start-2">
        <Topbar />
      </header>
      <main className="col-start-2 overflow-y-auto">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<PageContainer><Dashboard /></PageContainer>} />
            <Route path="/pos" element={<PageContainer><POS /></PageContainer>} />
            <Route path="/crm" element={<PageContainer><CRM /></PageContainer>} />
            <Route path="/reports" element={<PageContainer><Reports /></PageContainer>} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
