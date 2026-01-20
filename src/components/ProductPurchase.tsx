'use client'

import { useMemo, useState } from 'react'
import { Product } from '@/types'
import AddToCartButton from '@/components/AddToCartButton'
import { useCart } from '@/hooks/useCart'

export default function ProductPurchase({ product }: { product: Product }) {
  const maxQty = useMemo(() => {
    const stock = Number.isFinite(product.stock_quantity) ? product.stock_quantity : 0
    if (stock <= 0) return 1
    return Math.min(stock, 20)
  }, [product.stock_quantity])

  const { addItem, removeItem, updateQuantity } = useCart()
  const inCartQuantity = useCart(
    useMemo(
      () => (state) => state.items.find((i) => i.product_id === product.id)?.quantity ?? 0,
      [product.id]
    )
  )

  const [busy, setBusy] = useState(false)

  async function onInc() {
    if (busy || product.stock_quantity === 0) return
    if (inCartQuantity >= maxQty) return
    setBusy(true)
    try {
      if (inCartQuantity === 0) {
        await addItem(product, 1)
        return
      }
      await updateQuantity(product.id, inCartQuantity + 1)
    } finally {
      setBusy(false)
    }
  }

  async function onDec() {
    if (busy || product.stock_quantity === 0) return
    if (inCartQuantity <= 0) return
    setBusy(true)
    try {
      if (inCartQuantity === 1) {
        await removeItem(product.id)
        return
      }
      await updateQuantity(product.id, inCartQuantity - 1)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-10">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Quantity</label>
        <div className="inline-flex items-center rounded-md border border-gray-300 dark:border-zinc-700 overflow-hidden">
          <button
            type="button"
            onClick={onDec}
            disabled={busy || product.stock_quantity === 0 || inCartQuantity === 0}
            className="px-3 py-2 text-gray-700 dark:text-gray-200 disabled:opacity-50"
          >
            −
          </button>
          <input
            inputMode="numeric"
            value={String(inCartQuantity)}
            readOnly
            className="w-16 text-center bg-white dark:bg-zinc-900 dark:text-white py-2 outline-none"
            aria-label="Quantity"
            disabled={product.stock_quantity === 0}
          />
          <button
            type="button"
            onClick={onInc}
            disabled={busy || product.stock_quantity === 0 || inCartQuantity >= maxQty}
            className="px-3 py-2 text-gray-700 dark:text-gray-200 disabled:opacity-50"
          >
            +
          </button>
        </div>
        {product.stock_quantity > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">Max {maxQty}</span>
        )}
      </div>

      <div className="mt-4 flex">
        <AddToCartButton product={product} />
      </div>
    </div>
  )
}
