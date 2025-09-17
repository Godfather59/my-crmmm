import { Button } from './ui/button'
import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { useToast } from './ToastProvider'

type SnapshotItem = { productId: string; name: string; price: number; qty: number; exclusions?: string[] }
type OrderSnapshot = {
  id: string
  date: string
  items: SnapshotItem[]
  totals: { subtotal: number; tax: number; total: number }
}

export function POSCart() {
  const { cart, products, setQty, removeLine, checkout, updateExclusions } = useApp()
  const { toast } = useToast()

  const items = cart.map((i) => ({
    ...i,
    product: products.find((p) => p.id === i.productId)!,
  }))

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.product.price * i.qty, 0)
    const tax = subtotal * 0.07
    const total = subtotal + tax
    return { subtotal, tax, total }
  }, [items])

  const previewOrderId = useMemo(() => Math.random().toString(36).slice(2, 8).toUpperCase(), [])
  const previewDateStr = useMemo(() => new Date().toLocaleString(), [])
  const cashier = 'Admin'

  const [qr, setQr] = useState<string | null>(null)
  const [order, setOrder] = useState<OrderSnapshot | null>(null)
  // Exclusions per cart line id for customization UI
  const [customizing, setCustomizing] = useState<string | null>(null)
  const currentLine = customizing ? cart.find((l) => l.id === customizing) : undefined
  const currentLineProduct = currentLine ? products.find((p) => p.id === currentLine.productId) : undefined
  const currentIngredients = currentLineProduct?.ingredients ?? []
  const currentExclusions = currentLine?.exclusions ?? []
  const toggleIngredient = (name: string) => {
    if (!currentLine) return
    const set = new Set(currentExclusions)
    if (set.has(name)) set.delete(name)
    else set.add(name)
    updateExclusions(currentLine.id, Array.from(set))
  }
  useEffect(() => {
    import('qrcode').then(({ default: QRCode }) => {
      const payload = JSON.stringify({ orderId: order?.id ?? previewOrderId, total: (order?.totals.total ?? totals.total).toFixed(2), at: order?.date ?? previewDateStr })
      QRCode.toDataURL(payload, { margin: 0, width: 120 }).then(setQr).catch(() => setQr(null))
    })
  }, [order?.id, order?.totals.total, order?.date, totals.total, previewOrderId, previewDateStr])

  const handleCheckout = () => {
    if (cart.length === 0) return
    const snapshotItems: SnapshotItem[] = cart.map((line) => {
      const p = products.find((pp) => pp.id === line.productId)!
      return { productId: line.productId, name: p.name, price: p.price, qty: line.qty, exclusions: line.exclusions }
    })
    const subtotal = snapshotItems.reduce((s, it) => s + it.price * it.qty, 0)
    const tax = subtotal * 0.07
    const total = subtotal + tax
    const id = Math.random().toString(36).slice(2, 8).toUpperCase()
    const date = new Date().toLocaleString()
    setOrder({ id, date, items: snapshotItems, totals: { subtotal, tax, total } })
    checkout()
  }

  // old product-level exclusions state removed; using line-level in context

  return (
    <div className="flex h-full flex-col rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-950">
      <div className="mb-2 text-sm font-medium">Cart</div>
      <div className="flex-1 space-y-2 overflow-auto">
        {items.length === 0 && (
          <div className="text-sm text-muted-foreground">No items yet</div>
        )}
        {cart.map((line) => {
          const i = { productId: line.productId, qty: line.qty, product: products.find((p) => p.id === line.productId)! }
          return (
          <div key={line.id} className="flex items-center justify-between gap-2 rounded-md border p-2">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{i.product.name}</div>
              <div className="text-xs text-muted-foreground dark:text-slate-400">{i.product.price.toFixed(2)}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setQty(line.id, i.qty - 1)}>-</Button>
              <div className="w-6 text-center text-sm">{i.qty}</div>
              <Button
                variant="outline"
                size="sm"
                disabled={i.qty >= i.product.stock}
                onClick={() => {
                  if (i.qty >= i.product.stock) {
                    toast({ title: 'No more stock', description: `${i.product.name} has only ${i.product.stock} in stock.`, variant: 'destructive' })
                    return
                  }
                  setQty(line.id, i.qty + 1)
                }}
              >
                +
              </Button>
              {i.product.ingredients && i.product.ingredients.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setCustomizing(line.id)}>Customize</Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => removeLine(line.id)}>Remove</Button>
            </div>
          </div>
        )})}
      </div>

      <div className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{totals.subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Tax</span><span>{totals.tax.toFixed(2)}</span></div>
        <div className="flex justify-between font-semibold"><span>Total</span><span>{totals.total.toFixed(2)}</span></div>
      </div>

      <div className="mt-3 space-y-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button disabled={items.length === 0} onClick={handleCheckout} className="w-full">Checkout</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Receipt</DialogTitle>
            </DialogHeader>

            <div className="print-area receipt mx-auto w-full max-w-[360px] rounded-md bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
              <div className="px-4 py-3 text-center">
                {/* Optional logo: place a logo.svg in /public */}
                <img src="/logo.svg" alt="Logo" className="mx-auto mb-1 h-8 w-auto" onError={(e) => ((e.currentTarget.style.display = 'none'))} />
                <div className="text-base font-semibold">FlowSuite POS</div>
                <div className="text-xs">123 Main St, Your City</div>
                <div className="text-xs">Tel: (555) 123-4567</div>
              </div>

              <div className="grid grid-cols-3 gap-1 px-4 text-xs">
                <div>Order: <span className="font-mono font-medium">{order?.id ?? previewOrderId}</span></div>
                <div className="text-center">Cashier: {cashier}</div>
                <div className="text-right">{order?.date ?? previewDateStr}</div>
              </div>

              <div className="border-t dark:border-slate-800" />

              <div className="px-4 py-2">
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 text-xs font-medium">
                  <div>Item</div><div>Qty</div><div>Amt</div>
                </div>
                <div className="mt-1 border-t dark:border-slate-800" />
                <div className="space-y-1 pt-1 text-xs font-mono">
                  {(order?.items ?? cart.map(line => ({ productId: line.productId, name: products.find(p=>p.id===line.productId)!.name, price: products.find(p=>p.id===line.productId)!.price, qty: line.qty, exclusions: line.exclusions })) ).map((i, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_auto_auto] gap-x-3">
                      <div className="truncate">{i.name}</div>
                      <div className="text-right">x {i.qty}</div>
                      <div className="text-right">{(i.price * i.qty).toFixed(2)}</div>
                      {i.exclusions && i.exclusions.length > 0 && (
                        <div className="col-span-3 text-xs text-muted-foreground">No: {i.exclusions.join(', ')}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t dark:border-slate-800" />

              <div className="px-4 py-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">{(order?.totals.subtotal ?? totals.subtotal).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Tax</span><span className="font-mono">{(order?.totals.tax ?? totals.tax).toFixed(2)}</span></div>
                <div className="mt-1 flex justify-between font-semibold"><span>Total</span><span className="font-mono">{(order?.totals.total ?? totals.total).toFixed(2)}</span></div>
              </div>

              <div className="px-4 py-3 text-center text-xs">
                {qr && (
                  <img alt="Order QR" src={qr} className="mx-auto mb-2 h-24 w-24" />
                )}
                Thank you for your business!
              </div>
            </div>

            <div className="pt-2 print:hidden">
              <Button variant="outline" onClick={() => window.print()}>Print</Button>
            </div>
          </DialogContent>
        </Dialog>
        {/* Ingredient customization dialog */}
        <Dialog open={!!customizing} onOpenChange={(o) => setCustomizing(o ? customizing : null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Customize {currentLineProduct?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {currentIngredients.map((ing) => {
                const checked = !currentExclusions.includes(ing)
                return (
                  <label key={ing} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={checked}
                      onChange={() => toggleIngredient(ing)}
                    />
                    <span>{ing}</span>
                    {!checked && <span className="ml-auto text-xs text-muted-foreground">excluded</span>}
                  </label>
                )
              })}
              {currentIngredients.length === 0 && (
                <div className="text-sm text-muted-foreground">No configurable ingredients.</div>
              )}
              <div className="pt-2">
                <Button onClick={() => setCustomizing(null)} className="w-full">Done</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

