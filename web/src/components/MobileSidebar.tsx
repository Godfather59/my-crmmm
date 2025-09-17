import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { useLayout } from '../context/LayoutContext'

export function MobileSidebar() {
  const { isMobile, sidebarOpen, setSidebarOpen } = useLayout()

  if (!isMobile) return null

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <motion.div
            className="relative ml-auto flex h-full w-[280px] max-w-full bg-card shadow-xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          >
            <Sidebar />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

