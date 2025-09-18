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

    const iso = new Date('2025-09-18T10:00:00Z').toISOString()
    const order: Order = {
      id: 'TEST-ORDER',
      date: iso,
      items: [{ productId: 'p1', name: 'Espresso', price: 3, qty: 2 }],
      totals: { subtotal: 6, tax: 0.42, total: 6.42 },
      syncedAt: iso,
    }

    act(() => {
      result.current.checkout(order)
    })

    const updatedStock = result.current.products.find((p) => p.id === 'p1')?.stock ?? 0

    expect(result.current.cart).toHaveLength(0)
    expect(updatedStock).toBe(initialStock - 2)
    expect(result.current.orders[0]).toMatchObject({ id: 'TEST-ORDER' })
  })

  it('updates cart quantities and prunes empty lines', () => {
    const { result } = renderHook(() => useApp(), { wrapper })

    act(() => {
      result.current.addLine('p1', 2)
    })

    expect(result.current.cart).toHaveLength(1)

    const lineId = result.current.cart[0]?.id ?? ''

    act(() => {
      result.current.setQty(lineId, 0)
    })

    expect(result.current.cart).toHaveLength(0)
  })

  it('updates currency preference', () => {
    const { result } = renderHook(() => useApp(), { wrapper })

    expect(result.current.currency).toBe('USD')

    act(() => {
      result.current.setCurrency('EUR')
    })

    expect(result.current.currency).toBe('EUR')
  })

  it('marks offline orders as synced', () => {
    const { result } = renderHook(() => useApp(), { wrapper })

    act(() => {
      result.current.checkout({
        id: 'PENDING-1',
        date: new Date('2025-09-19T09:00:00Z').toISOString(),
        items: [{ productId: 'p1', name: 'Espresso', price: 3, qty: 1 }],
        totals: { subtotal: 3, tax: 0.21, total: 3.21 },
        syncedAt: null,
        shiftId: null,
      })
    })

    expect(result.current.orders[0]?.syncedAt).toBeNull()

    act(() => {
      result.current.markOrdersSynced(['PENDING-1'])
    })

    expect(result.current.orders[0]?.syncedAt).not.toBeNull()
  })

  it('supports starting and closing shifts', () => {
    const { result } = renderHook(() => useApp(), { wrapper })

    let shiftId = ''
    act(() => {
      const shift = result.current.startShift({ openingFloat: 150, openedBy: 'Test Cashier', openingNote: 'AM shift' })
      shiftId = shift.id
    })

    expect(result.current.activeShiftId).toBe(shiftId)

    act(() => {
      result.current.checkout({
        id: 'SHIFT-ORDER',
        date: new Date('2025-09-19T09:30:00Z').toISOString(),
        items: [{ productId: 'p1', name: 'Espresso', price: 3, qty: 2 }],
        totals: { subtotal: 6, tax: 0.42, total: 6.42 },
        syncedAt: null,
      })
    })

    expect(result.current.orders[0]?.shiftId).toBe(shiftId)

    act(() => {
      result.current.closeShift({ shiftId, closingCount: 200, closedBy: 'Test Cashier', closingNote: 'Balanced' })
    })

    expect(result.current.activeShiftId).toBeNull()
    const closedShift = result.current.shifts.find((shift) => shift.id === shiftId)
    expect(closedShift?.closedAt).toBeTruthy()
    expect(typeof closedShift?.variance).toBe('number')
  })
})

