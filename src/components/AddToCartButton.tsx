'use client'

import { useMemo, useState } from 'react'
import { Product } from '@/types'
import { ShoppingCart, Trash2 } from 'lucide-react'
import { useCart } from '@/hooks/useCart'

export default function AddToCartButton({
  product,
}: {
  product: Product
}) {
  const [busy, setBusy] = useState(false)
  const { addItem, removeItem } = useCart()
  const inCartQuantity = useCart(
    useMemo(
      () => (state) => state.items.find((i) => i.product_id === product.id)?.quantity ?? 0,
      [product.id]
    )
  )
  const inCart = inCartQuantity > 0

  const handleToggle = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (busy) return
    setBusy(true)
    try {
      if (inCart) {
        await removeItem(product.id)
        return
      }
      await addItem(product, 1)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      type="button"
      disabled={busy || product.stock_quantity === 0}
      className={`max-w-xs flex-1 flex items-center justify-center border border-transparent rounded-md py-3 px-8 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-full ${
        inCart
          ? 'bg-zinc-700 hover:bg-zinc-800'
          : 'bg-indigo-600 hover:bg-indigo-700'
      } ${busy || product.stock_quantity === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {busy ? (
        <>
          <ShoppingCart className="mr-2 h-5 w-5" />
          Adding…
        </>
      ) : inCart ? (
        <>
          <Trash2 className="mr-2 h-5 w-5" />
          Remove from Cart
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-5 w-5" />
          Add to Cart
        </>
      )}
    </button>
  )
}
