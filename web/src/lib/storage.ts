import type { Client, Employee, Order, Product } from '../context/AppContext'

const STORAGE_KEY = 'flowsuite-app-state@1'

type PersistedState = {
  products: Product[]
  clients: Client[]
  employees: Employee[]
  orders: Order[]
}

export function loadPersistedState(): PersistedState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedState> | null
    if (!parsed) return null

    return {
      products: parsed.products ?? [],
      clients: parsed.clients ?? [],
      employees: parsed.employees ?? [],
      orders: parsed.orders ?? [],
    }
  } catch (error) {
    console.warn('Unable to load persisted state', error)
    return null
  }
}

export function savePersistedState(state: PersistedState) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.warn('Unable to persist state', error)
  }
}

export function clearPersistedState() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn('Unable to clear persisted state', error)
  }
}

