'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/hooks/useCart'
import { Trash2, Plus, Minus } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="bg-white dark:bg-zinc-900 min-h-screen py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-12 border rounded-lg border-gray-200 dark:border-zinc-800">
            <p className="text-lg text-gray-500 mb-6">Your cart is empty.</p>
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
            <div className="lg:col-span-7">
              <ul className="divide-y divide-gray-200 dark:divide-zinc-800 border-t border-b border-gray-200 dark:border-zinc-800">
                {items.map((item) => (
                  <li key={item.product_id} className="flex py-6 sm:py-10">
                    <div className="flex-shrink-0">
                      <Image
                        src={item.product.image_url}
                        alt={item.product.name}
                        width={96}
                        height={96}
                        className="h-24 w-24 rounded-md object-cover object-center sm:h-48 sm:w-48"
                      />
                    </div>

                    <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                      <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                        <div>
                          <div className="flex justify-between">
                            <h3 className="text-sm">
                              <Link href={`/product?id=${item.product_id}`} className="font-medium text-gray-700 dark:text-white hover:text-gray-800">
                                {item.product.name}
                              </Link>
                            </h3>
                          </div>
                          <div className="mt-1 flex text-sm">
                            <p className="text-gray-500 dark:text-gray-400">{item.product.category}</p>
                          </div>
                          <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">₹{item.product.price}</p>
                        </div>

                        <div className="mt-4 sm:mt-0 sm:pr-9">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => updateQuantity(item.product_id, Math.max(1, item.quantity - 1))}
                              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
                            >
                              <Minus className="h-4 w-4 text-gray-500" />
                            </button>
                            <span className="text-gray-900 dark:text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
                            >
                              <Plus className="h-4 w-4 text-gray-500" />
                            </button>
                          </div>

                          <div className="absolute right-0 top-0">
                            <button
                              type="button"
                              onClick={() => removeItem(item.product_id)}
                              className="-m-2 inline-flex p-2 text-gray-400 hover:text-gray-500"
                            >
                              <span className="sr-only">Remove</span>
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-16 rounded-lg bg-gray-50 dark:bg-zinc-800 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Order summary</h2>

              <dl className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Subtotal</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">₹{totalPrice().toFixed(2)}</dd>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 pt-4">
                  <dt className="text-base font-medium text-gray-900 dark:text-white">Order total</dt>
                  <dd className="text-base font-medium text-gray-900 dark:text-white">₹{totalPrice().toFixed(2)}</dd>
                </div>
              </dl>

              <div className="mt-6">
                <Link
                  href="/checkout"
                  className="w-full flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50"
                >
                  Checkout
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
