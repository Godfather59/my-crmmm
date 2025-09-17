import type { Client, Employee, Product } from '../context/AppContext'

export const sampleProducts: Product[] = [
  { id: 'p1', name: 'Espresso', price: 3.0, stock: 80, category: 'Beverage', ingredients: ['Espresso Shot'] },
  { id: 'p2', name: 'Latte', price: 4.5, stock: 65, category: 'Beverage', ingredients: ['Espresso Shot', 'Milk', 'Foam'] },
  { id: 'p3', name: 'Cappuccino', price: 4.0, stock: 70, category: 'Beverage', ingredients: ['Espresso Shot', 'Milk', 'Foam'] },
  { id: 'p4', name: 'Blueberry Muffin', price: 2.5, stock: 20, category: 'Bakery', ingredients: ['Wheat', 'Blueberries', 'Sugar'] },
  { id: 'p5', name: 'Croissant', price: 2.8, stock: 12, category: 'Bakery', ingredients: ['Wheat', 'Butter'] },
  { id: 'p6', name: 'Bagel', price: 2.2, stock: 5, category: 'Bakery', ingredients: ['Wheat', 'Sesame'] },
]

export const sampleClients: Client[] = [
  {
    id: 'c1',
    name: 'Jane Cooper',
    email: 'jane@example.com',
    phone: '+1 555-0101',
    loyaltyPoints: 120,
    orders: [
      { id: 'o1001', total: 24.5, date: '2025-09-12' },
      { id: 'o1005', total: 12.5, date: '2025-09-16' },
    ],
  },
  {
    id: 'c2',
    name: 'John Carter',
    email: 'john@example.com',
    phone: '+1 555-0102',
    loyaltyPoints: 45,
    orders: [{ id: 'o1012', total: 8.0, date: '2025-09-09' }],
  },
]

export const sampleEmployees: Employee[] = [
  { id: 'e1', name: 'Alex Johnson', role: 'Manager' },
  { id: 'e2', name: 'Sam Lee', role: 'Cashier' },
]
