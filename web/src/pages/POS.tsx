import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { Input } from '../components/ui/input'
import { POSCart } from '../components/POSCart'
import { ProductCard } from '../components/ProductCard'

export function POS() {
  const { products } = useApp()
  const [query, setQuery] = useState('')
  const filtered = useMemo(
    () =>
      products.filter(
        (p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.category?.toLowerCase().includes(query.toLowerCase()),
      ),
    [products, query],
  )

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-3">
          <Input
            placeholder="Search products"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 text-base"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} id={p.id} name={p.name} price={p.price} stock={p.stock} />
          ))}
        </div>
      </div>
      <div className="lg:col-span-1">
        <POSCart />
      </div>
    </div>
  )
}

