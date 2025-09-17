import { Button } from './ui/button'
import { useApp } from '../context/AppContext'
import { useToast } from './ToastProvider'

export function ProductCard({ id, name, price, stock }: { id: string; name: string; price: number; stock: number }) {
  const { addLine, cart } = useApp()
  const { toast } = useToast()
  const inCart = cart.filter((c) => c.productId === id).reduce((s, c) => s + c.qty, 0)
  const atMax = inCart >= stock
  return (
    <div className="flex flex-col rounded-lg border bg-card p-4 shadow-sm transition-transform hover:-translate-y-0.5">
      <div className="flex-1">
        <div className="text-sm text-muted-foreground">Stock: {stock}</div>
        <div className="mt-1 truncate text-base font-medium">{name}</div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-lg font-semibold">{price.toFixed(2)}</div>
        <Button
          onClick={() => {
            if (stock <= 0 || atMax) {
              toast({ title: 'Out of stock', description: `${name} is currently out of stock.`, variant: 'destructive' })
              return
            }
            addLine(id, 1)
          }}
          size="lg"
          className="min-w-[88px] touch-manipulation"
          disabled={atMax}
        >
          Add
        </Button>
      </div>
      {(stock <= 0 || atMax) && (
        <div className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">Out of stock</div>
      )}
    </div>
  )
}

