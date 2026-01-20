'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

export const dynamic = 'force-dynamic'

type CouponRow = {
  id: string
  code: string
  description: string | null
  discount_type: 'percent' | 'amount'
  discount_value: number
  min_order_amount: number
  max_discount: number | null
  starts_at: string | null
  ends_at: string | null
  usage_limit: number | null
  used_count: number
  is_active: boolean
  created_at: string
}

type CouponForm = {
  id?: string
  code: string
  description: string
  discount_type: 'percent' | 'amount'
  discount_value: string
  min_order_amount: string
  max_discount: string
  usage_limit: string
  starts_at: string
  ends_at: string
  is_active: boolean
}

function toDatetimeLocalValue(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocalValue(v: string) {
  if (!v) return null
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

export default function AdminCouponsPage() {
  const inputClass =
    'mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
  const selectClass =
    'mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
  const [coupons, setCoupons] = useState<CouponRow[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<CouponForm>({
    id: undefined,
    code: '',
    description: '',
    discount_type: 'percent',
    discount_value: '',
    min_order_amount: '0',
    max_discount: '',
    usage_limit: '',
    starts_at: '',
    ends_at: '',
    is_active: true,
  })

  const isEditing = !!form.id
  const typeHelp = useMemo(() => (form.discount_type === 'percent' ? 'e.g. 10 means 10% off' : 'e.g. 100 means ₹100 off'), [form.discount_type])

  const loadCoupons = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/coupons/list', { method: 'GET', headers: { 'Cache-Control': 'no-cache' } })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to load coupons')
      setCoupons(Array.isArray(data?.coupons) ? data.coupons : [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load coupons')
      setCoupons([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCoupons()
  }, [loadCoupons])

  function resetForm() {
    setForm({
      id: undefined,
      code: '',
      description: '',
      discount_type: 'percent',
      discount_value: '',
      min_order_amount: '0',
      max_discount: '',
      usage_limit: '',
      starts_at: '',
      ends_at: '',
      is_active: true,
    })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/coupons/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          code: form.code,
          description: form.description,
          discount_type: form.discount_type,
          discount_value: form.discount_value,
          min_order_amount: form.min_order_amount,
          max_discount: form.max_discount,
          usage_limit: form.usage_limit,
          starts_at: fromDatetimeLocalValue(form.starts_at),
          ends_at: fromDatetimeLocalValue(form.ends_at),
          is_active: form.is_active,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || (isEditing ? 'Failed to update coupon' : 'Failed to create coupon'))
      setShowForm(false)
      resetForm()
      await loadCoupons()
    } catch (e: any) {
      setError(e?.message || 'Failed to save coupon')
    } finally {
      setSubmitting(false)
    }
  }

  function onEdit(row: CouponRow) {
    setShowForm(true)
    setError(null)
    setForm({
      id: row.id,
      code: row.code,
      description: row.description || '',
      discount_type: row.discount_type,
      discount_value: String(row.discount_value),
      min_order_amount: String(row.min_order_amount ?? 0),
      max_discount: row.max_discount === null ? '' : String(row.max_discount),
      usage_limit: row.usage_limit === null ? '' : String(row.usage_limit),
      starts_at: toDatetimeLocalValue(row.starts_at),
      ends_at: toDatetimeLocalValue(row.ends_at),
      is_active: !!row.is_active,
    })
  }

  async function onDelete(id: string) {
    const ok = window.confirm('Delete this coupon? This cannot be undone.')
    if (!ok) return
    setError(null)
    try {
      const res = await fetch('/api/admin/coupons/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to delete coupon')
      await loadCoupons()
    } catch (e: any) {
      setError(e?.message || 'Failed to delete coupon')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Coupons</h1>
        <button
          type="button"
          onClick={() => {
            if (showForm) {
              setShowForm(false)
              resetForm()
            } else {
              setShowForm(true)
            }
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          {showForm ? 'Close' : 'Add Coupon'}
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 dark:bg-zinc-800 dark:border-red-900/40 dark:text-red-300 rounded-md p-4 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={onSubmit} className="mb-6 bg-white dark:bg-zinc-800 shadow-sm rounded-lg p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">{isEditing ? 'Edit coupon' : 'New coupon'}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Create a coupon code customers can apply at checkout.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Code</label>
              <input
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                className={inputClass}
                placeholder="WELCOME10"
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <div className="mt-2 flex items-center gap-2">
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className={inputClass}
                placeholder="10% off on your first order"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Discount type</label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm((p) => ({ ...p, discount_type: e.target.value === 'amount' ? 'amount' : 'percent' }))}
                className={selectClass}
                disabled={submitting}
              >
                <option value="percent">Percent (%)</option>
                <option value="amount">Amount (₹)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{typeHelp}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Discount value</label>
              <input
                type="number"
                inputMode="decimal"
                value={form.discount_value}
                onChange={(e) => setForm((p) => ({ ...p, discount_value: e.target.value }))}
                className={inputClass}
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Minimum order (₹)</label>
              <input
                type="number"
                inputMode="decimal"
                value={form.min_order_amount}
                onChange={(e) => setForm((p) => ({ ...p, min_order_amount: e.target.value }))}
                className={inputClass}
                min={0}
                step="0.01"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max discount (₹) (optional)</label>
              <input
                type="number"
                inputMode="decimal"
                value={form.max_discount}
                onChange={(e) => setForm((p) => ({ ...p, max_discount: e.target.value }))}
                className={inputClass}
                min={0}
                step="0.01"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Usage limit (optional)</label>
              <input
                type="number"
                inputMode="numeric"
                value={form.usage_limit}
                onChange={(e) => setForm((p) => ({ ...p, usage_limit: e.target.value }))}
                className={inputClass}
                min={0}
                step={1}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Starts at (optional)</label>
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm((p) => ({ ...p, starts_at: e.target.value }))}
                className={inputClass}
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ends at (optional)</label>
              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm((p) => ({ ...p, ends_at: e.target.value }))}
                className={inputClass}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                resetForm()
              }}
              className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : isEditing ? 'Save changes' : 'Create coupon'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-zinc-800 shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
          <thead className="bg-gray-50 dark:bg-zinc-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Discount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Min</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Used</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-zinc-800 divide-y divide-gray-200 dark:divide-zinc-700">
            {loading ? (
              <tr>
                <td className="px-6 py-6 text-sm text-gray-500 dark:text-gray-400" colSpan={6}>
                  Loading…
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td className="px-6 py-6 text-sm text-gray-500 dark:text-gray-400" colSpan={6}>
                  No coupons.
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{c.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {c.discount_type === 'percent' ? `${c.discount_value}%` : `₹${c.discount_value}`}
                    {c.max_discount !== null ? ` (max ₹${c.max_discount})` : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">₹{c.min_order_amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {c.used_count}{c.usage_limit !== null ? ` / ${c.usage_limit}` : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                    >
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <div className="inline-flex gap-3">
                      <button
                        type="button"
                        onClick={() => onEdit(c)}
                        className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(c.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        Delete
                      </button>
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
