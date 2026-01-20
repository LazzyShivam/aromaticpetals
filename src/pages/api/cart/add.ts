import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type AddBody = { product_id?: string; quantity?: number | string }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if ((session.user as any)?.role === 'admin') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const userId = (session.user as any).id as string
  const body = (req.body ?? {}) as AddBody
  const productId = typeof body.product_id === 'string' ? body.product_id : ''
  const qty = typeof body.quantity === 'number' ? body.quantity : Number(body.quantity)

  if (!productId || !Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Invalid payload' })
  }

  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (productError || !product) {
    return res.status(400).json({ error: 'Product not found' })
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle()

  if (existingError) {
    return res.status(500).json({ error: existingError.message })
  }

  if (existing?.id) {
    const newQty = existing.quantity + qty
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('cart_items')
      .update({ quantity: newQty })
      .eq('id', existing.id)
      .select('id, user_id, product_id, quantity, products(*)')
      .single()

    if (updateError || !updated) {
      return res.status(500).json({ error: updateError?.message || 'Failed to update cart' })
    }

    return res.status(200).json({
      item: {
        id: updated.id,
        user_id: updated.user_id,
        product_id: updated.product_id,
        quantity: updated.quantity,
        product: (updated as any).products,
      },
    })
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('cart_items')
    .insert({ user_id: userId, product_id: productId, quantity: qty })
    .select('id, user_id, product_id, quantity, products(*)')
    .single()

  if (insertError || !inserted) {
    return res.status(500).json({ error: insertError?.message || 'Failed to add to cart' })
  }

  return res.status(200).json({
    item: {
      id: inserted.id,
      user_id: inserted.user_id,
      product_id: inserted.product_id,
      quantity: inserted.quantity,
      product: (inserted as any).products,
    },
  })
}

