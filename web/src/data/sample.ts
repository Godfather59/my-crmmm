import type { Order, Product } from '../context/AppContext'

export const sampleProducts: Product[] = [
  { id: 'p1', name: 'Espresso', price: 3.0, stock: 80, category: 'Beverage', ingredients: ['Espresso Shot'] },
  { id: 'p2', name: 'Latte', price: 4.5, stock: 65, category: 'Beverage', ingredients: ['Espresso Shot', 'Milk', 'Foam'] },
  { id: 'p3', name: 'Cappuccino', price: 4.0, stock: 70, category: 'Beverage', ingredients: ['Espresso Shot', 'Milk', 'Foam'] },
  { id: 'p4', name: 'Blueberry Muffin', price: 2.5, stock: 20, category: 'Bakery', ingredients: ['Wheat', 'Blueberries', 'Sugar'] },
  { id: 'p5', name: 'Croissant', price: 2.8, stock: 12, category: 'Bakery', ingredients: ['Wheat', 'Butter'] },
  { id: 'p6', name: 'Bagel', price: 2.2, stock: 5, category: 'Bakery', ingredients: ['Wheat', 'Sesame'] },
]

export const sampleOrders: Order[] = [
  {
    id: 'o2001',
    date: '2025-09-10T09:15:00.000Z',
    clientId: 'c1',
    items: [
      { productId: 'p1', name: 'Espresso', price: 3.0, qty: 2 },
      { productId: 'p5', name: 'Croissant', price: 2.8, qty: 1 },
    ],
    totals: { subtotal: 8.8, tax: 0.62, total: 9.42 },
    syncedAt: '2025-09-10T09:16:00.000Z',
    shiftId: null,
  },
  {
    id: 'o2002',
    date: '2025-09-11T12:30:00.000Z',
    items: [
      { productId: 'p2', name: 'Latte', price: 4.5, qty: 3 },
      { productId: 'p4', name: 'Blueberry Muffin', price: 2.5, qty: 2 },
    ],
    totals: { subtotal: 18.5, tax: 1.3, total: 19.8 },
    syncedAt: '2025-09-11T12:31:00.000Z',
    shiftId: null,
  },
  {
    id: 'o2003',
    date: '2025-09-12T08:05:00.000Z',
    items: [
      { productId: 'p3', name: 'Cappuccino', price: 4.0, qty: 2 },
      { productId: 'p6', name: 'Bagel', price: 2.2, qty: 1 },
    ],
    totals: { subtotal: 10.2, tax: 0.71, total: 10.91 },
    syncedAt: '2025-09-12T08:06:00.000Z',
    shiftId: null,
  },
  {
    id: 'o2004',
    date: '2025-09-13T14:45:00.000Z',
    clientId: 'c1',
    items: [
      { productId: 'p2', name: 'Latte', price: 4.5, qty: 1 },
      { productId: 'p4', name: 'Blueberry Muffin', price: 2.5, qty: 1 },
      { productId: 'p5', name: 'Croissant', price: 2.8, qty: 2 },
    ],
    totals: { subtotal: 12.6, tax: 0.88, total: 13.48 },
    syncedAt: '2025-09-13T14:46:00.000Z',
    shiftId: null,
  },
  {
    id: 'o2005',
    date: '2025-09-14T10:20:00.000Z',
    clientId: 'c2',
    items: [
      { productId: 'p1', name: 'Espresso', price: 3.0, qty: 1 },
      { productId: 'p3', name: 'Cappuccino', price: 4.0, qty: 1 },
      { productId: 'p6', name: 'Bagel', price: 2.2, qty: 2 },
    ],
    totals: { subtotal: 11.4, tax: 0.8, total: 12.2 },
    syncedAt: '2025-09-14T10:21:00.000Z',
    shiftId: null,
  },
  {
    id: 'o2006',
    date: '2025-09-15T16:10:00.000Z',
    items: [
      { productId: 'p2', name: 'Latte', price: 4.5, qty: 2 },
      { productId: 'p1', name: 'Espresso', price: 3.0, qty: 1 },
      { productId: 'p4', name: 'Blueberry Muffin', price: 2.5, qty: 1 },
    ],
    totals: { subtotal: 14.5, tax: 1.02, total: 15.52 },
    syncedAt: '2025-09-15T16:11:00.000Z',
    shiftId: null,
  },
  {
    id: 'o2007',
    date: '2025-09-16T11:50:00.000Z',
    items: [
      { productId: 'p3', name: 'Cappuccino', price: 4.0, qty: 3 },
      { productId: 'p5', name: 'Croissant', price: 2.8, qty: 1 },
    ],
    totals: { subtotal: 14.8, tax: 1.04, total: 15.84 },
    syncedAt: '2025-09-16T11:51:00.000Z',
    shiftId: null,
  },
]
