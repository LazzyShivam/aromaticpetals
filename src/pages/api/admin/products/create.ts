import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { createClient } from '@supabase/supabase-js'
import { authOptions } from '@/lib/auth'

type CreateProductBody = {
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

  const body = (req.body ?? {}) as CreateProductBody

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const category = typeof body.category === 'string' ? body.category.trim() : ''
  const imageUrl = typeof body.image_url === 'string' ? body.image_url.trim() : ''
  const price = typeof body.price === 'number' ? body.price : Number(body.price)
  const stockQuantity = typeof body.stock_quantity === 'number' ? body.stock_quantity : Number(body.stock_quantity)
  const isActive = typeof body.is_active === 'boolean' ? body.is_active : true

  if (!name) {
    return res.status(400).json({ error: 'Name is required' })
  }
  if (!Number.isFinite(price) || price < 0) {
    return res.status(400).json({ error: 'Price must be a number' })
  }
  if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
    return res.status(400).json({ error: 'Stock must be a number' })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Supabase is not configured' })
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      name,
      description,
      price,
      stock_quantity: stockQuantity,
      category: category || 'Uncategorized',
      image_url: imageUrl || null,
      is_active: isActive,
    })
    .select('*')
    .single()

  if (error || !data) {
    return res.status(500).json({ error: error?.message || 'Failed to create product' })
  }

  return res.status(200).json({ product: data })
}

