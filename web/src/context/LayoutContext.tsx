import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type LayoutCtx = {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
  isMobile: boolean
}

const LayoutContext = createContext<LayoutCtx | null>(null)

const MOBILE_QUERY = '(max-width: 1023px)'

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(MOBILE_QUERY).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia(MOBILE_QUERY)
    const handleChange = () => setIsMobile(media.matches)

    handleChange()
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(false)
      setSidebarOpen(false)
    }
  }, [isMobile])

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (isMobile && sidebarOpen) document.body.classList.add('scroll-lock')
    else document.body.classList.remove('scroll-lock')
    return () => document.body.classList.remove('scroll-lock')
  }, [isMobile, sidebarOpen])

  const value = useMemo<LayoutCtx>(() => ({
    sidebarCollapsed,
    setSidebarCollapsed,
    sidebarOpen,
    setSidebarOpen,
    isMobile,
  }), [sidebarCollapsed, sidebarOpen, isMobile])

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
}

export function useLayout() {
  const ctx = useContext(LayoutContext)
  if (!ctx) throw new Error('useLayout must be used within LayoutProvider')
  return ctx
}

