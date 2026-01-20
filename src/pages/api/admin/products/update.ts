import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type UpdateProductBody = {
  id?: string
  name?: string
  description?: string
  price?: number | string
  stock_quantity?: number | string
  category?: string
  image_url?: string
  is_active?: boolean
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const body = (req.body ?? {}) as UpdateProductBody
  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) {
    return res.status(400).json({ error: 'Product id is required' })
  }

  const patch: Record<string, any> = {}

  if (typeof body.name === 'string') {
    const v = body.name.trim()
    if (!v) return res.status(400).json({ error: 'Name is required' })
    patch.name = v
  }

  if (typeof body.description === 'string') {
    patch.description = body.description.trim()
  }

  if (typeof body.category === 'string') {
    patch.category = body.category.trim() || 'Uncategorized'
  }

  if (typeof body.image_url === 'string') {
    const v = body.image_url.trim()
    patch.image_url = v ? v : null
  }

  if (typeof body.is_active === 'boolean') {
    patch.is_active = body.is_active
  }

  if (typeof body.price !== 'undefined') {
    const price = typeof body.price === 'number' ? body.price : Number(body.price)
    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({ error: 'Price must be a number' })
    }
    patch.price = price
  }

  if (typeof body.stock_quantity !== 'undefined') {
    const stock = typeof body.stock_quantity === 'number' ? body.stock_quantity : Number(body.stock_quantity)
    if (!Number.isFinite(stock) || stock < 0) {
      return res.status(400).json({ error: 'Stock must be a number' })
    }
    patch.stock_quantity = stock
  }

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'No fields to update' })
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    return res.status(500).json({ error: error?.message || 'Failed to update product' })
  }

  return res.status(200).json({ product: data })
}

