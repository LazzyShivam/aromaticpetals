import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = (session.user as any).id as string
    const items = Array.isArray(req.body?.items) ? req.body.items : []
    const totalAmount = typeof req.body?.total_amount === 'number' ? req.body.total_amount : Number(req.body?.total_amount)
    const shippingAddress = req.body?.shipping_address
    const paymentId = typeof req.body?.payment_id === 'string' ? req.body.payment_id : null

    if (!userId || !items.length || !Number.isFinite(totalAmount) || !shippingAddress) {
      return res.status(400).json({ error: 'Invalid order payload' })
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        order_number: `ORD-${Date.now()}`,
        total_amount: totalAmount,
        status: 'confirmed',
        shipping_address: shippingAddress,
        payment_id: paymentId,
      })
      .select()
      .single()

    if (orderError || !order) {
      return res.status(500).json({ error: orderError?.message || 'Failed to create order' })
    }

    const orderItems = items
      .map((item: any) => {
        const productId = typeof item?.product_id === 'string' ? item.product_id : ''
        const quantity = typeof item?.quantity === 'number' ? item.quantity : Number(item?.quantity)
        const unitPrice = typeof item?.product?.price === 'number' ? item.product.price : Number(item?.product?.price)

        if (!productId || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice)) {
          return null
        }

        return {
          order_id: order.id,
          product_id: productId,
          quantity,
          unit_price: unitPrice,
          subtotal: unitPrice * quantity,
        }
      })
      .filter(Boolean)

    if (!orderItems.length) {
      return res.status(400).json({ error: 'Invalid items' })
    }

    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems as any)

    if (itemsError) {
      return res.status(500).json({ error: itemsError.message })
    }

    return res.status(200).json({ success: true, order })
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Unexpected error' })
  }
}
