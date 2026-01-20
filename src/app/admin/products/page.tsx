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
  is_active: boolean
}

type ProductMediaRow = {
  id: string
  product_id: string
  media_type: 'image' | 'video'
  storage_path: string
  public_url: string
  sort_order: number
  created_at: string
}

export default function AdminProductsPage() {
  const categories = useMemo(() => ['Flowers', 'Candles', 'Plants', 'Gifts', 'Uncategorized'], [])
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
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [pendingUploadError, setPendingUploadError] = useState<string | null>(null)
  const [mediaProduct, setMediaProduct] = useState<Product | null>(null)
  const [media, setMedia] = useState<ProductMediaRow[]>([])
  const [mediaLoading, setMediaLoading] = useState(false)
  const [mediaUploading, setMediaUploading] = useState(false)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [form, setForm] = useState<NewProductForm>({
    id: undefined,
    name: '',
    description: '',
    category: 'Flowers',
    price: '',
    stock_quantity: '',
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

  const loadMedia = useCallback(async (productId: string) => {
    setMediaLoading(true)
    setMediaError(null)
    try {
      const res = await fetch(`/api/admin/products/media/list?product_id=${encodeURIComponent(productId)}`, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to load media')
      setMedia(Array.isArray(data?.media) ? data.media : [])
    } catch (e: any) {
      setMediaError(e?.message || 'Failed to load media')
      setMedia([])
    } finally {
      setMediaLoading(false)
    }
  }, [])

  const uploadMediaFiles = useCallback(
    async (files: FileList) => {
      if (!mediaProduct) return
      setMediaUploading(true)
      setMediaError(null)
      try {
        const fileArray = Array.from(files)
        for (const file of fileArray) {
          const mediaType: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image'
          const signedRes = await fetch('/api/admin/products/media/create-signed-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product_id: mediaProduct.id,
              file_name: file.name,
              content_type: file.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
              media_type: mediaType,
            }),
          })
          const signedData = await signedRes.json().catch(() => null)
          if (!signedRes.ok) throw new Error(signedData?.error || 'Failed to start upload')

          const putRes = await fetch(signedData.signedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': signedData.contentType },
            body: file,
          })
          if (!putRes.ok) throw new Error('Upload failed')

          const commitRes = await fetch('/api/admin/products/media/commit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product_id: mediaProduct.id,
              media_type: mediaType,
              storage_path: signedData.path,
              public_url: signedData.publicUrl,
              sort_order: media.length,
            }),
          })
          const commitData = await commitRes.json().catch(() => null)
          if (!commitRes.ok) throw new Error(commitData?.error || 'Failed to save media')
        }

        await loadMedia(mediaProduct.id)
        await loadProducts()
      } catch (e: any) {
        setMediaError(e?.message || 'Upload failed')
      } finally {
        setMediaUploading(false)
      }
    },
    [loadMedia, loadProducts, media.length, mediaProduct]
  )

  const uploadMediaFilesForProductId = useCallback(
    async (productId: string, files: File[]) => {
      if (!productId || files.length === 0) return
      setPendingUploadError(null)
      try {
        for (const file of files) {
          const mediaType: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image'
          const signedRes = await fetch('/api/admin/products/media/create-signed-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product_id: productId,
              file_name: file.name,
              content_type: file.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
              media_type: mediaType,
            }),
          })
          const signedData = await signedRes.json().catch(() => null)
          if (!signedRes.ok) throw new Error(signedData?.error || 'Failed to start upload')

          const putRes = await fetch(signedData.signedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': signedData.contentType },
            body: file,
          })
          if (!putRes.ok) throw new Error('Upload failed')

          const commitRes = await fetch('/api/admin/products/media/commit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product_id: productId,
              media_type: mediaType,
              storage_path: signedData.path,
              public_url: signedData.publicUrl,
              sort_order: 0,
            }),
          })
          const commitData = await commitRes.json().catch(() => null)
          if (!commitRes.ok) throw new Error(commitData?.error || 'Failed to save media')
        }
      } catch (e: any) {
        setPendingUploadError(e?.message || 'Upload failed')
      }
    },
    []
  )

  const deleteMedia = useCallback(
    async (id: string) => {
      if (!mediaProduct) return
      setMediaError(null)
      try {
        const res = await fetch('/api/admin/products/media/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.error || 'Failed to delete media')
        await loadMedia(mediaProduct.id)
        await loadProducts()
      } catch (e: any) {
        setMediaError(e?.message || 'Failed to delete media')
      }
    },
    [loadMedia, loadProducts, mediaProduct]
  )

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  async function onSubmitProduct(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setPendingUploadError(null)
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
          is_active: form.is_active,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || (isEditing ? 'Failed to update product' : 'Failed to create product'))
      }

      const productId = data?.product?.id || form.id
      if (productId && pendingFiles.length > 0) {
        await uploadMediaFilesForProductId(productId, pendingFiles)
      }

      setShowForm(false)
      setForm({
        id: undefined,
        name: '',
        description: '',
        category: 'Flowers',
        price: '',
        stock_quantity: '',
        is_active: true,
      })
      setPendingFiles([])
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
      is_active: !!product.is_active,
    })
    setPendingFiles([])
    setPendingUploadError(null)
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
                is_active: true,
              })
              setPendingFiles([])
              setPendingUploadError(null)
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Images / Videos</label>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                disabled={submitting}
                onChange={(e) => {
                  const files = e.target.files ? Array.from(e.target.files) : []
                  setPendingFiles(files)
                  e.target.value = ''
                }}
                className="mt-1 block w-full text-sm text-gray-700 dark:text-gray-200 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Files will upload automatically when you click {isEditing ? 'Save changes' : 'Create product'}.
              </p>
              {pendingFiles.length > 0 && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Selected: {pendingFiles.length} file(s)</p>
              )}
              {pendingUploadError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{pendingUploadError}</p>
              )}
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
                  is_active: true,
                })
                setPendingFiles([])
                setPendingUploadError(null)
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
                      onClick={() => {
                        setMediaProduct(product)
                        setMedia([])
                        void loadMedia(product.id)
                      }}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                    >
                      Media
                    </button>
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

      {mediaProduct && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              if (mediaUploading) return
              setMediaProduct(null)
              setMedia([])
              setMediaError(null)
            }}
          />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 shadow-xl overflow-y-auto">
            <div className="p-5 border-b border-gray-200 dark:border-zinc-800 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage media</p>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{mediaProduct.name}</h2>
              </div>
              <button
                type="button"
                disabled={mediaUploading}
                onClick={() => {
                  setMediaProduct(null)
                  setMedia([])
                  setMediaError(null)
                }}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-200"
              >
                Close
              </button>
            </div>

            <div className="p-5">
              {mediaError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 dark:bg-zinc-800 dark:border-red-900/40 dark:text-red-300 rounded-md p-3 text-sm">
                  {mediaError}
                </div>
              )}

              <div className="rounded-md border border-gray-200 dark:border-zinc-800 p-4 bg-gray-50 dark:bg-zinc-800">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Upload images / videos</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">You can select multiple files.</p>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  disabled={mediaUploading}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      void uploadMediaFiles(e.target.files)
                      e.target.value = ''
                    }
                  }}
                  className="mt-3 block w-full text-sm text-gray-700 dark:text-gray-200 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                />
                {mediaUploading && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Uploading…</p>}
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Media</p>
                  {mediaLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>}
                </div>

                {!mediaLoading && media.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No media uploaded yet.</p>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {media.map((m) => (
                      <div key={m.id} className="rounded-md border border-gray-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                        <div className="aspect-square bg-gray-100 dark:bg-zinc-800">
                          {m.media_type === 'video' ? (
                            <video src={m.public_url} controls className="w-full h-full object-cover" />
                          ) : (
                            <img src={m.public_url} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="p-2 flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">{m.media_type}</span>
                          <button
                            type="button"
                            disabled={mediaUploading}
                            onClick={() => void deleteMedia(m.id)}
                            className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
