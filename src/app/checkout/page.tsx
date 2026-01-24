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
  const [couponInput, setCouponInput] = useState('')
  const [couponCode, setCouponCode] = useState<string | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [pricing, setPricing] = useState<{ subtotal: number; discount: number; total: number } | null>(null)
  const [eligibleCoupons, setEligibleCoupons] = useState<any[]>([])
  const [eligibleLoading, setEligibleLoading] = useState(false)
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: ''
  })

  const displaySubtotal = pricing?.subtotal ?? totalPrice()
  const displayDiscount = pricing?.discount ?? 0
  const displayTotal = pricing?.total ?? totalPrice()

  useEffect(() => {
    let cancelled = false
    const loadEligible = async () => {
      setEligibleLoading(true)
      try {
        const res = await fetch('/api/coupons/eligible', { method: 'GET', headers: { 'Cache-Control': 'no-cache' } })
        const data = await res.json().catch(() => null)
        if (!res.ok) return
        if (cancelled) return
        setEligibleCoupons(Array.isArray(data?.coupons) ? data.coupons : [])
      } finally {
        if (!cancelled) setEligibleLoading(false)
      }
    }

    void loadEligible()
    return () => {
      cancelled = true
    }
  }, [items])

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
      const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      if (!publicKey || publicKey.startsWith('your-')) {
        throw new Error('Razorpay public key is not configured')
      }

      // 1. Create Order on Backend
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
          coupon_code: couponCode,
        })
      })

      const contentType = res.headers.get('content-type') || ''
      const orderData = contentType.includes('application/json') ? await res.json() : await res.text()

      if (!res.ok) {
        throw new Error(typeof orderData === 'string' ? orderData : orderData.error)
      }

      // 2. Open Razorpay Modal
      const options = {
        key: publicKey,
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
                shipping_address: shippingAddress,
                payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                coupon_code: couponCode,
              })
            })

            if (!orderRes.ok) {
              const orderContentType = orderRes.headers.get('content-type') || ''
              const orderErr = orderContentType.includes('application/json') ? await orderRes.json() : await orderRes.text()
              throw new Error(typeof orderErr === 'string' ? orderErr : orderErr.error || 'Failed to create order')
            }

            const orderBody = await orderRes.json().catch(() => null)
            await clearCart()
            const orderId = orderBody?.order?.id
            router.push(orderId ? `/checkout/confirmation?order_id=${encodeURIComponent(orderId)}` : '/profile')
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

  const applyCouponCode = async (rawCode: string) => {
    setCouponError(null)
    const code = rawCode.trim()
    if (!code) {
      setCouponCode(null)
      setPricing(null)
      setCouponInput('')
      return
    }
    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon_code: code }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || 'Invalid coupon')
      }
      const normalized = String(data?.coupon?.code || code).trim()
      setCouponCode(normalized)
      setCouponInput(normalized)
      setPricing({ subtotal: data.subtotal, discount: data.discount, total: data.total })
    } catch (e: any) {
      setCouponCode(null)
      setPricing(null)
      setCouponError(e?.message || 'Invalid coupon')
    }
  }

  const applyCoupon = async () => {
    return applyCouponCode(couponInput)
  }

  const removeCoupon = () => {
    setCouponCode(null)
    setPricing(null)
    setCouponInput('')
    setCouponError(null)
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
                  {loading ? 'Processing...' : `Pay ₹${displayTotal.toFixed(2)}`}
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
              <div className="border-t border-gray-200 dark:border-zinc-700 px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void applyCoupon()
                      }
                    }}
                    placeholder="Coupon code"
                    autoCapitalize="characters"
                    className="flex-1 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {couponCode ? (
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-200"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={applyCoupon}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                      Apply
                    </button>
                  )}
                </div>
                {couponError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{couponError}</p>}
                {couponCode && !couponError && (
                  <p className="mt-2 text-sm text-green-700 dark:text-green-400">Applied: {couponCode}</p>
                )}

                {eligibleLoading ? (
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading available discounts…</p>
                ) : eligibleCoupons.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Available discounts</p>
                    <div className="mt-2 space-y-2">
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className={`w-full text-left rounded-md border px-3 py-2 ${
                          !couponCode
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                            : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                        }`}
                      >
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">No coupon</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Pay full price</p>
                      </button>
                      {eligibleCoupons.map((c) => {
                        const selected = couponCode === c.code
                        return (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => void applyCouponCode(c.code)}
                            className={`w-full text-left rounded-md border px-3 py-2 ${
                              selected
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                                : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{c.code}</p>
                                {c.description && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400">{c.description}</p>
                                )}
                              </div>
                              <p className="text-sm font-medium text-green-700 dark:text-green-400">Save ₹{Number(c.discount).toFixed(2)}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
              <dl className="border-t border-gray-200 dark:border-zinc-700 py-6 px-4 space-y-6 sm:px-6">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600 dark:text-gray-300">Subtotal</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">₹{displaySubtotal.toFixed(2)}</dd>
                </div>
                {displayDiscount > 0 && (
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-gray-600 dark:text-gray-300">Discount</dt>
                    <dd className="text-sm font-medium text-green-700 dark:text-green-400">-₹{displayDiscount.toFixed(2)}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-gray-900 dark:text-white">Total</dt>
                  <dd className="text-base font-medium text-gray-900 dark:text-white">₹{displayTotal.toFixed(2)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
