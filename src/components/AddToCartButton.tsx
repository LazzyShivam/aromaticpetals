'use client'

import { useState } from 'react'
import { Product } from '@/types'
import { ShoppingCart, Check } from 'lucide-react'
import { useCart } from '@/hooks/useCart'

export default function AddToCartButton({ product }: { product: Product }) {
  const [isAdded, setIsAdded] = useState(false)
  const { addItem } = useCart()

  const handleAddToCart = () => {
    addItem(product)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={product.stock_quantity === 0}
      className={`max-w-xs flex-1 flex items-center justify-center border border-transparent rounded-md py-3 px-8 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-full ${
        isAdded 
          ? 'bg-green-600 hover:bg-green-700' 
          : 'bg-indigo-600 hover:bg-indigo-700'
      } ${product.stock_quantity === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isAdded ? (
        <>
          <Check className="mr-2 h-5 w-5" />
          Added
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
