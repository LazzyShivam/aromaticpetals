'use client'

import { Product } from '@/types'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

export const dynamic = 'force-dynamic'

type NewProductForm = {
  id?: string
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
  const inputClass =
    'mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
  const selectClass =
    'mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
  const textareaClass =
    'mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<NewProductForm>({
    id: undefined,
    name: '',
    description: '',
    category: 'Flowers',
    price: '',
    stock_quantity: '',
    image_url: '',
    is_active: true,
  })

  const isEditing = !!form.id

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

  async function onSubmitProduct(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(isEditing ? '/api/admin/products/update' : '/api/admin/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
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
        throw new Error(data?.error || (isEditing ? 'Failed to update product' : 'Failed to create product'))
      }
      setShowForm(false)
      setForm({
        id: undefined,
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
      setError(e?.message || (isEditing ? 'Failed to update product' : 'Failed to create product'))
    } finally {
      setSubmitting(false)
    }
  }

  async function onDeleteProduct(productId: string) {
    const ok = window.confirm('Delete this product? This cannot be undone.')
    if (!ok) return

    setError(null)
    try {
      const res = await fetch('/api/admin/products/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to delete product')
      }
      await loadProducts()
    } catch (e: any) {
      setError(e?.message || 'Failed to delete product')
    }
  }

  function onEditProduct(product: Product) {
    setShowForm(true)
    setError(null)
    setForm({
      id: product.id,
      name: product.name || '',
      description: product.description || '',
      category: product.category || 'Uncategorized',
      price: String(product.price ?? ''),
      stock_quantity: String(product.stock_quantity ?? ''),
      image_url: product.image_url || '',
      is_active: !!product.is_active,
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Products</h1>
        <button
          type="button"
          onClick={() => {
            if (showForm) {
              setShowForm(false)
              setForm({
                id: undefined,
                name: '',
                description: '',
                category: 'Flowers',
                price: '',
                stock_quantity: '',
                image_url: '',
                is_active: true,
              })
            } else {
              setShowForm(true)
            }
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          {showForm ? 'Close' : 'Add Product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSubmitProduct} className="mb-6 bg-white dark:bg-zinc-800 shadow-sm rounded-lg p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">{isEditing ? 'Edit product' : 'New product'}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{isEditing ? 'Update details and save changes.' : 'Create a new product for your store.'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className={inputClass}
                placeholder="Product name"
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className={selectClass}
                disabled={submitting}
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
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                className={inputClass}
                placeholder="0.00"
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={form.stock_quantity}
                onChange={(e) => setForm((p) => ({ ...p, stock_quantity: e.target.value }))}
                className={inputClass}
                placeholder="0"
                required
                disabled={submitting}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Image URL</label>
              <input
                type="url"
                value={form.image_url}
                onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                className={inputClass}
                placeholder="https://..."
                disabled={submitting}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className={textareaClass}
                rows={3}
                placeholder="Optional description"
                disabled={submitting}
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              disabled={submitting}
              />
              <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setForm({
                  id: undefined,
                  name: '',
                  description: '',
                  category: 'Flowers',
                  price: '',
                  stock_quantity: '',
                  image_url: '',
                  is_active: true,
                })
              }}
              className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 disabled:opacity-60 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
            >
              {submitting ? (isEditing ? 'Saving…' : 'Creating…') : isEditing ? 'Save changes' : 'Create product'}
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
              <th className="px-6 py-3 relative"><span className="sr-only">Actions</span></th>
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
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => onEditProduct(product)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteProduct(product.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                    <Link
                      href={`/product?id=${product.id}`}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                    >
                      Preview
                    </Link>
                  </div>
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
