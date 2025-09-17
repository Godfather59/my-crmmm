import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { sampleClients, sampleEmployees, sampleOrders, sampleProducts } from '../data/sample'
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

export type Client = {
  id: string
  name: string
  email: string
  phone?: string
  loyaltyPoints: number
  orders: Array<{ id: string; total: number; date: string }>
}

export type Employee = {
  id: string
  name: string
  role: string
}

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
}

type State = {
  products: Product[]
  clients: Client[]
  employees: Employee[]
  cart: CartItem[]
  orders: Order[]
}

type HydratePayload = Partial<Pick<State, 'products' | 'clients' | 'employees' | 'orders'>>

type Action =
  | { type: 'state/hydrate'; state: HydratePayload }
  | { type: 'cart/addLine'; productId: string; qty?: number; exclusions?: string[] }
  | { type: 'cart/removeLine'; id: string }
  | { type: 'cart/setQty'; id: string; qty: number }
  | { type: 'cart/updateExclusions'; id: string; exclusions: string[] }
  | { type: 'cart/checkout'; order: Order }
  | { type: 'client/add'; client: Client }
  | { type: 'client/update'; client: Client }
  | { type: 'employee/add'; employee: Employee }
  | { type: 'employee/update'; employee: Employee }

const initialState: State = {
  products: sampleProducts,
  clients: sampleClients,
  employees: sampleEmployees,
  orders: sampleOrders,
  cart: [],
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'state/hydrate': {
      const next: State = {
        ...state,
        products: action.state.products ?? state.products,
        clients: action.state.clients ?? state.clients,
        employees: action.state.employees ?? state.employees,
        orders: action.state.orders ?? state.orders,
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
      return { ...state, products, cart: [], orders: [order, ...state.orders] }
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
    case 'client/add': {
      return { ...state, clients: [action.client, ...state.clients] }
    }
    case 'client/update': {
      return { ...state, clients: state.clients.map((c) => (c.id === action.client.id ? action.client : c)) }
    }
    case 'employee/add': {
      return { ...state, employees: [action.employee, ...state.employees] }
    }
    case 'employee/update': {
      return { ...state, employees: state.employees.map((e) => (e.id === action.employee.id ? action.employee : e)) }
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
  addClient: (c: Client) => void
  updateClient: (c: Client) => void
  addEmployee: (e: Employee) => void
  updateEmployee: (e: Employee) => void
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
      clients: state.clients,
      employees: state.employees,
      orders: state.orders,
    })
  }, [state.products, state.clients, state.employees, state.orders, hydrated])

  const value = useMemo<Ctx>(() => ({
    ...state,
    addLine: (productId, qty, exclusions) => dispatch({ type: 'cart/addLine', productId, qty, exclusions }),
    removeLine: (lineId) => dispatch({ type: 'cart/removeLine', id: lineId }),
    setQty: (lineId, qty) => dispatch({ type: 'cart/setQty', id: lineId, qty }),
    updateExclusions: (lineId, exclusions) => dispatch({ type: 'cart/updateExclusions', id: lineId, exclusions }),
    checkout: (order) => dispatch({ type: 'cart/checkout', order }),
    addClient: (c) => dispatch({ type: 'client/add', client: c }),
    updateClient: (c) => dispatch({ type: 'client/update', client: c }),
    addEmployee: (e) => dispatch({ type: 'employee/add', employee: e }),
    updateEmployee: (e) => dispatch({ type: 'employee/update', employee: e }),
  }), [state])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

