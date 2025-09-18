import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { sampleOrders, sampleProducts } from '../data/sample'
import { loadPersistedState, savePersistedState } from '../lib/storage'

export type Product = {
  id: string
  name: string
  price: number
  stock: number
  category?: string
  ingredients?: string[]
}

export type CartItem = { id: string; productId: string; qty: number; exclusions?: string[] }

export type OrderItem = {
  productId: string
  name: string
  price: number
  qty: number
  exclusions?: string[]
}

export type Order = {
  id: string
  date: string
  totals: { subtotal: number; tax: number; total: number }
  items: OrderItem[]
  clientId?: string
  note?: string
  syncedAt?: string | null
  shiftId?: string | null
}

export type Shift = {
  id: string
  openedAt: string
  openedBy: string
  openingFloat: number
  openingNote?: string
  closedAt?: string
  closedBy?: string
  closingCount?: number
  systemExpected?: number
  variance?: number
  closingNote?: string
}

type State = {
  products: Product[]
  cart: CartItem[]
  orders: Order[]
  currency: string
  shifts: Shift[]
  activeShiftId: string | null
}

type HydratePayload = Partial<Pick<State, 'products' | 'orders' | 'currency' | 'shifts' | 'activeShiftId'>>

type Action =
  | { type: 'state/hydrate'; state: HydratePayload }
  | { type: 'cart/addLine'; productId: string; qty?: number; exclusions?: string[] }
  | { type: 'cart/removeLine'; id: string }
  | { type: 'cart/setQty'; id: string; qty: number }
  | { type: 'cart/updateExclusions'; id: string; exclusions: string[] }
  | { type: 'cart/checkout'; order: Order }
  | { type: 'settings/setCurrency'; currency: string }
  | { type: 'orders/markSynced'; ids: string[] }
  | { type: 'shift/start'; shift: Shift }
  | { type: 'shift/close'; shiftId: string; payload: { closedAt: string; closedBy: string; closingCount: number; systemExpected: number; variance: number; closingNote?: string } }

const initialState: State = {
  products: sampleProducts,
  orders: sampleOrders,
  cart: [],
  currency: 'USD',
  shifts: [],
  activeShiftId: null,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'state/hydrate': {
      const next: State = {
        ...state,
        products: action.state.products ?? state.products,
        orders: action.state.orders ?? state.orders,
        currency: action.state.currency ?? state.currency,
        shifts: action.state.shifts ?? state.shifts,
        activeShiftId: action.state.activeShiftId ?? state.activeShiftId,
      }
      return next
    }
    case 'cart/addLine': {
      const product = state.products.find((p) => p.id === action.productId)
      if (!product) return state
      const allocated = state.cart.filter((c) => c.productId === action.productId).reduce((s, c) => s + c.qty, 0)
      const available = product.stock - allocated
      const qty = Math.max(0, Math.min(action.qty ?? 1, available))
      if (qty <= 0) return state
      const line: CartItem = { id: crypto.randomUUID(), productId: action.productId, qty, exclusions: action.exclusions }
      return { ...state, cart: [...state.cart, line] }
    }
    case 'cart/updateExclusions': {
      const cart = state.cart.map((c) => (c.id === action.id ? { ...c, exclusions: action.exclusions } : c))
      return { ...state, cart }
    }
    case 'cart/checkout': {
      const qtyById = new Map<string, number>()
      const order = action.order
      for (const item of order.items) qtyById.set(item.productId, (qtyById.get(item.productId) ?? 0) + item.qty)
      const products = state.products.map((p) => {
        const q = qtyById.get(p.id)
        if (!q) return p
        const newStock = Math.max(0, p.stock - q)
        return { ...p, stock: newStock }
      })
      const orders = [order, ...state.orders]
      return { ...state, products, cart: [], orders }
    }
    case 'orders/markSynced': {
      const now = new Date().toISOString()
      const ids = new Set(action.ids)
      const orders = state.orders.map((order) =>
        ids.has(order.id) ? { ...order, syncedAt: order.syncedAt ?? now } : order,
      )
      return { ...state, orders }
    }
    case 'shift/start': {
      return {
        ...state,
        shifts: [action.shift, ...state.shifts],
        activeShiftId: action.shift.id,
      }
    }
    case 'shift/close': {
      const shifts = state.shifts.map((shift) =>
        shift.id === action.shiftId
          ? {
              ...shift,
              closedAt: action.payload.closedAt,
              closedBy: action.payload.closedBy,
              closingCount: action.payload.closingCount,
              systemExpected: action.payload.systemExpected,
              variance: action.payload.variance,
              closingNote: action.payload.closingNote,
            }
          : shift,
      )
      const orders = state.orders.map((order) =>
        order.shiftId === action.shiftId ? { ...order, syncedAt: order.syncedAt ?? null } : order,
      )
      return { ...state, shifts, orders, activeShiftId: state.activeShiftId === action.shiftId ? null : state.activeShiftId }
    }
    case 'cart/removeLine': {
      return { ...state, cart: state.cart.filter((c) => c.id !== action.id) }
    }
    case 'cart/setQty': {
      const line = state.cart.find((c) => c.id === action.id)
      if (!line) return state
      const product = state.products.find((p) => p.id === line.productId)
      const stock = product ? product.stock : Infinity
      const others = state.cart.filter((c) => c.productId === line.productId && c.id !== line.id).reduce((s, c) => s + c.qty, 0)
      const limitForLine = Math.max(0, stock - others)
      const newQty = Math.max(0, Math.min(action.qty, limitForLine))
      const cart = state.cart
        .map((c) => (c.id === action.id ? { ...c, qty: newQty } : c))
        .filter((c) => c.qty > 0)
      return { ...state, cart }
    }
    case 'settings/setCurrency': {
      return { ...state, currency: action.currency }
    }
    default:
      return state
  }
}

type Ctx = State & {
  addLine: (productId: string, qty?: number, exclusions?: string[]) => void
  removeLine: (lineId: string) => void
  setQty: (lineId: string, qty: number) => void
  updateExclusions: (lineId: string, exclusions: string[]) => void
  checkout: (order: Order) => void
  setCurrency: (currency: string) => void
  markOrdersSynced: (ids: string[]) => void
  startShift: (input: { openingFloat: number; openingNote?: string; openedBy: string }) => Shift
  closeShift: (input: { shiftId: string; closingCount: number; closingNote?: string; closedBy: string }) => Shift | null
}

const AppContext = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const persisted = loadPersistedState()
    if (persisted) {
      dispatch({ type: 'state/hydrate', state: persisted })
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    savePersistedState({
      products: state.products,
      orders: state.orders,
      currency: state.currency,
      shifts: state.shifts,
      activeShiftId: state.activeShiftId,
    })
  }, [state.products, state.orders, state.currency, state.shifts, state.activeShiftId, hydrated])

  const value = useMemo<Ctx>(() => ({
    ...state,
    addLine: (productId, qty, exclusions) => dispatch({ type: 'cart/addLine', productId, qty, exclusions }),
    removeLine: (lineId) => dispatch({ type: 'cart/removeLine', id: lineId }),
    setQty: (lineId, qty) => dispatch({ type: 'cart/setQty', id: lineId, qty }),
    updateExclusions: (lineId, exclusions) => dispatch({ type: 'cart/updateExclusions', id: lineId, exclusions }),
    checkout: (order) => {
      const shiftId = state.activeShiftId ?? order.shiftId ?? null
      dispatch({ type: 'cart/checkout', order: shiftId ? { ...order, shiftId } : order })
    },
    setCurrency: (currency) => dispatch({ type: 'settings/setCurrency', currency }),
    markOrdersSynced: (ids) => dispatch({ type: 'orders/markSynced', ids }),
    startShift: ({ openingFloat, openingNote, openedBy }) => {
      const id = crypto.randomUUID()
      const openedAt = new Date().toISOString()
      const shift: Shift = { id, openedAt, openedBy, openingFloat, openingNote }
      dispatch({ type: 'shift/start', shift })
      return shift
    },
    closeShift: ({ shiftId, closingCount, closingNote, closedBy }) => {
      const shift = state.shifts.find((s) => s.id === shiftId)
      if (!shift) return null
      const closedAt = new Date().toISOString()
      const shiftOrders = state.orders.filter((order) => order.shiftId === shiftId)
      const systemExpectedRaw = shift.openingFloat + shiftOrders.reduce((sum, order) => sum + order.totals.total, 0)
      const systemExpected = Math.round(systemExpectedRaw * 100) / 100
      const variance = Math.round((closingCount - systemExpected) * 100) / 100
      dispatch({
        type: 'shift/close',
        shiftId,
        payload: { closedAt, closedBy, closingCount, systemExpected, variance, closingNote },
      })
      return {
        ...shift,
        closedAt,
        closedBy,
        closingCount,
        systemExpected,
        variance,
        closingNote,
      }
    },
  }), [state])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

