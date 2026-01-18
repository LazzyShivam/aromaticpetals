'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { useSession } from 'next-auth/react'
import Script from 'next/script'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { items, totalPrice, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/checkout')
    }
  }, [status, router])

  if (status === 'loading' || !session) {
    return <div className="flex justify-center py-24"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>
  }

  if (items.length === 0) {
    router.push('/cart')
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setShippingAddress(prev => ({ ...prev, [name]: value }))
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Create Order on Backend
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalPrice(),
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`
        })
      })

      const contentType = res.headers.get('content-type') || ''
      const orderData = contentType.includes('application/json') ? await res.json() : await res.text()

      if (!res.ok) {
        throw new Error(typeof orderData === 'string' ? orderData : orderData.error)
      }

      // 2. Open Razorpay Modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Aromatic Petals',
        description: 'Order Payment',
        order_id: orderData.id,
        handler: async function (response: any) {
          // 3. Payment Success - Create Order in DB
          try {
            const orderRes = await fetch('/api/orders/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                items: items,
                total_amount: totalPrice(),
                shipping_address: shippingAddress,
                payment_id: response.razorpay_payment_id
              })
            })

            if (!orderRes.ok) {
              const orderContentType = orderRes.headers.get('content-type') || ''
              const orderErr = orderContentType.includes('application/json') ? await orderRes.json() : await orderRes.text()
              throw new Error(typeof orderErr === 'string' ? orderErr : orderErr.error || 'Failed to create order')
            }

            clearCart()
            router.push('/profile')
          } catch (err) {
            console.error(err)
            alert('Payment successful but failed to create order record. Please contact support.')
          }
        },
        prefill: {
          name: shippingAddress.name,
          email: session.user?.email,
          contact: shippingAddress.phone
        },
        theme: {
          color: '#4F46E5'
        }
      }

      const paymentObject = new window.Razorpay(options)
      paymentObject.open()
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Payment initiation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-zinc-900 min-h-screen py-12">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">Checkout</h1>
        
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Shipping Information</h2>
            <form onSubmit={handlePayment} className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={shippingAddress.name}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="address"
                    name="address"
                    required
                    value={shippingAddress.address}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="city"
                    name="city"
                    required
                    value={shippingAddress.city}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300">State</label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="state"
                    name="state"
                    required
                    value={shippingAddress.state}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="zip" className="block text-sm font-medium text-gray-700 dark:text-gray-300">ZIP / Postal Code</label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="zip"
                    name="zip"
                    required
                    value={shippingAddress.zip}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                <div className="mt-1">
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={shippingAddress.phone}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : `Pay ₹${totalPrice().toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-10 lg:mt-0">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Order Summary</h2>
            <div className="mt-4 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm">
              <ul role="list" className="divide-y divide-gray-200 dark:divide-zinc-700">
                {items.map((item) => (
                  <li key={item.product_id} className="flex py-6 px-4 sm:px-6">
                    <div className="flex-shrink-0">
                      <Image
                        src={item.product.image_url || 'https://images.unsplash.com/photo-1496062031456-07b8f162a322?w=800&q=80'}
                        alt={item.product.name}
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-md object-cover object-center"
                      />
                    </div>
                    <div className="ml-6 flex flex-1 flex-col">
                      <div className="flex">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.product.name}</h4>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.product.category}</p>
                        </div>
                      </div>
                      <div className="flex flex-1 items-end justify-between pt-2">
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">₹{item.product.price} x {item.quantity}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <dl className="border-t border-gray-200 dark:border-zinc-700 py-6 px-4 space-y-6 sm:px-6">
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-gray-900 dark:text-white">Total</dt>
                  <dd className="text-base font-medium text-gray-900 dark:text-white">₹{totalPrice().toFixed(2)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
