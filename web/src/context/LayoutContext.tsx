import React, { createContext, useContext, useState } from 'react'

type LayoutCtx = {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
}

const Ctx = createContext<LayoutCtx | null>(null)

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  return <Ctx.Provider value={{ sidebarCollapsed, setSidebarCollapsed }}>{children}</Ctx.Provider>
}

export function useLayout() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useLayout must be used within LayoutProvider')
  return ctx
}

