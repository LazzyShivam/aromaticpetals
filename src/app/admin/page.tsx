'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Summary = {
  products: { total: number; active: number }
  orders: { total: number; pending: number; confirmed: number; shipped: number; delivered: number }
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-5 py-4 hover:shadow-sm transition"
    >
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
        {value}
      </div>
    </Link>
  )
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/admin/dashboard/summary', { method: 'GET', headers: { 'Cache-Control': 'no-cache' } })
        const json = await res.json().catch(() => null)
        if (!res.ok) throw new Error(json?.error || 'Failed to load dashboard')
        if (!cancelled) setSummary(json)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const cards = useMemo(() => {
    if (!summary) return []
    return [
      { label: 'Products', value: summary.products.total, href: '/admin/products' },
      { label: 'Active products', value: summary.products.active, href: '/admin/products' },
      { label: 'Orders', value: summary.orders.total, href: '/admin/orders' },
      { label: 'Pending orders', value: summary.orders.pending, href: '/admin/orders' },
    ]
  }, [summary])

  return (
    <div>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Quick overview of products and orders.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/products"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Manage products
          </Link>
          <Link
            href="/admin/orders"
            className="rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-700"
          >
            View orders
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 dark:bg-zinc-800 dark:border-red-900/40 dark:text-red-300 rounded-md p-4 text-sm">
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-5 py-4 animate-pulse">
                <div className="h-3 w-24 bg-gray-200 dark:bg-zinc-700 rounded" />
                <div className="mt-3 h-6 w-16 bg-gray-200 dark:bg-zinc-700 rounded" />
              </div>
            ))
          : cards.map((c) => <StatCard key={c.label} label={c.label} value={c.value} href={c.href} />)}
      </div>

      {summary && !loading && (
        <div className="mt-8 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
          <div className="text-sm font-medium text-gray-900 dark:text-white">Order pipeline</div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Pending</div>
              <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{summary.orders.pending}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Confirmed</div>
              <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{summary.orders.confirmed}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Shipped</div>
              <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{summary.orders.shipped}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Delivered</div>
              <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{summary.orders.delivered}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
