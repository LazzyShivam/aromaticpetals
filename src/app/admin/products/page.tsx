'use client'

import { Product } from '@/types'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

export const dynamic = 'force-dynamic'

type NewProductForm = {
  name: string
  description: string
  category: string
  price: string
  stock_quantity: string
  image_url: string
  is_active: boolean
}

export default function AdminProductsPage() {
  const categories = useMemo(() => ['Flowers', 'Plants', 'Gifts', 'Uncategorized'], [])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<NewProductForm>({
    name: '',
    description: '',
    category: 'Flowers',
    price: '',
    stock_quantity: '',
    image_url: '',
    is_active: true,
  })

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/products/list', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load products')
      }
      setProducts(Array.isArray(data?.products) ? data.products : [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  async function onCreateProduct(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category: form.category,
          price: form.price,
          stock_quantity: form.stock_quantity,
          image_url: form.image_url,
          is_active: form.is_active,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to create product')
      }
      setShowForm(false)
      setForm({
        name: '',
        description: '',
        category: 'Flowers',
        price: '',
        stock_quantity: '',
        image_url: '',
        is_active: true,
      })
      await loadProducts()
    } catch (e: any) {
      setError(e?.message || 'Failed to create product')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Products</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          Add Product
        </button>
      </div>

      {showForm && (
        <form onSubmit={onCreateProduct} className="mb-6 bg-white dark:bg-zinc-800 shadow-sm rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
              <input
                inputMode="decimal"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
              <input
                inputMode="numeric"
                value={form.stock_quantity}
                onChange={(e) => setForm((p) => ({ ...p, stock_quantity: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Image URL</label>
              <input
                value={form.image_url}
                onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                rows={3}
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
            >
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 dark:bg-zinc-800 dark:border-red-900/40 dark:text-red-300 rounded-md p-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-800 shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
          <thead className="bg-gray-50 dark:bg-zinc-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 relative"><span className="sr-only">Edit</span></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-zinc-800 divide-y divide-gray-200 dark:divide-zinc-700">
            {loading ? (
              <tr>
                <td className="px-6 py-6 text-sm text-gray-500 dark:text-gray-400" colSpan={6}>
                  Loading…
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td className="px-6 py-6 text-sm text-gray-500 dark:text-gray-400" colSpan={6}>
                  No products.
                </td>
              </tr>
            ) : (
              products.map((product: Product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={product.image_url || 'https://images.unsplash.com/photo-1496062031456-07b8f162a322?w=200&q=80'}
                        alt=""
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{product.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">₹{product.price}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{product.stock_quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/product?id=${product.id}`}
                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    View
                  </Link>
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
