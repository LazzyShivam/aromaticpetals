'use client'

import { useCallback, useEffect, useState } from 'react'

export const dynamic = 'force-dynamic'

type AdminOrderRow = {
  id: string
  order_number: string
  created_at: string
  total_amount: number
  status: string
  users?: { email?: string | null } | null
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/orders/list', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load orders')
      }
      setOrders(Array.isArray(data?.orders) ? data.orders : [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Orders</h1>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 dark:bg-zinc-800 dark:border-red-900/40 dark:text-red-300 rounded-md p-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-800 shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
          <thead className="bg-gray-50 dark:bg-zinc-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-zinc-800 divide-y divide-gray-200 dark:divide-zinc-700">
            {loading ? (
              <tr>
                <td className="px-6 py-6 text-sm text-gray-500 dark:text-gray-400" colSpan={5}>
                  Loading…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td className="px-6 py-6 text-sm text-gray-500 dark:text-gray-400" colSpan={5}>
                  No orders.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 dark:text-indigo-400">{order.order_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{order.users?.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">₹{order.total_amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
