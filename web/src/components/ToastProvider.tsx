import { AnimatePresence, motion } from 'framer-motion'
import React, { createContext, useContext, useMemo, useState } from 'react'

type Toast = {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

type ToastCtx = {
  toast: (t: Omit<Toast, 'id'>) => void
}

const Ctx = createContext<ToastCtx | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const api = useMemo<ToastCtx>(() => ({
    toast: ({ title, description, variant = 'default', duration = 3000 }) => {
      const id = crypto.randomUUID()
      const t: Toast = { id, title, description, variant, duration }
      setToasts((prev) => [...prev, t])
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id))
      }, duration)
    },
  }), [])

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[360px] flex-col gap-2 max-sm:w-[92%]">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`pointer-events-auto rounded-md border p-3 shadow-md ${
                t.variant === 'destructive'
                  ? 'border-red-600 bg-red-600/10 text-red-800 dark:border-red-500 dark:bg-red-500/15 dark:text-red-200'
                  : 'border-border bg-card'
              }`}
            >
              <div className="text-sm font-medium">{t.title}</div>
              {t.description && (
                <div className="mt-0.5 text-xs text-muted-foreground">{t.description}</div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

