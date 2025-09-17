import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { AppProvider, useApp, type Order } from './AppContext'

const wrapper = ({ children }: { children: ReactNode }) => <AppProvider>{children}</AppProvider>

describe('AppContext', () => {
  it('reduces stock and records an order on checkout', () => {
    const { result } = renderHook(() => useApp(), { wrapper })

    const initialStock = result.current.products.find((p) => p.id === 'p1')?.stock ?? 0

    act(() => {
      result.current.addLine('p1', 2)
    })

    const order: Order = {
      id: 'TEST-ORDER',
      date: new Date('2025-09-18T10:00:00Z').toISOString(),
      items: [{ productId: 'p1', name: 'Espresso', price: 3, qty: 2 }],
      totals: { subtotal: 6, tax: 0.42, total: 6.42 },
    }

    act(() => {
      result.current.checkout(order)
    })

    const updatedStock = result.current.products.find((p) => p.id === 'p1')?.stock ?? 0

    expect(result.current.cart).toHaveLength(0)
    expect(updatedStock).toBe(initialStock - 2)
    expect(result.current.orders[0]).toMatchObject({ id: 'TEST-ORDER' })
  })

  it('allows adding and updating clients', () => {
    const { result } = renderHook(() => useApp(), { wrapper })

    const newClient = {
      id: 'client-test',
      name: 'Test Client',
      email: 'test@example.com',
      phone: '+1 555-1000',
      loyaltyPoints: 10,
      orders: [],
    }

    const initialLength = result.current.clients.length

    act(() => {
      result.current.addClient(newClient)
    })

    expect(result.current.clients).toHaveLength(initialLength + 1)
    expect(result.current.clients[0]).toMatchObject({ id: 'client-test' })

    act(() => {
      result.current.updateClient({ ...newClient, loyaltyPoints: 25 })
    })

    expect(result.current.clients[0].loyaltyPoints).toBe(25)
  })
})

