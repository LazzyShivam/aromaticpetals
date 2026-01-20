import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { computeCartSubtotal, getCartRowsForUser } from '@/lib/cartTotals'
import { computeDiscountAmount, getCouponByCode, validateCouponForSubtotal } from '@/lib/coupons'

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

    if ((session.user as any)?.role === 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const userId = (session.user as any).id as string
    const shippingAddress = req.body?.shipping_address
    const paymentId = typeof req.body?.payment_id === 'string' ? req.body.payment_id : null
    const couponCode = typeof req.body?.coupon_code === 'string' ? req.body.coupon_code : ''

    if (!userId || !shippingAddress) {
      return res.status(400).json({ error: 'Invalid order payload' })
    }

    const { rows, error: cartError } = await getCartRowsForUser(userId)
    if (cartError) return res.status(500).json({ error: cartError })

    const cartRows = rows.filter((r) => !!r.products)
    if (!cartRows.length) {
      return res.status(400).json({ error: 'Cart is empty' })
    }

    const subtotal = computeCartSubtotal(cartRows)
    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      return res.status(400).json({ error: 'Cart is empty' })
    }

    let discount = 0
    let couponId: string | null = null
    let couponCodeNormalized: string | null = null
    let couponUsedCount: number | null = null

    if (couponCode.trim()) {
      const { coupon, error } = await getCouponByCode(couponCode)
      if (!coupon) return res.status(400).json({ error: error || 'Invalid coupon code' })
      const valid = validateCouponForSubtotal(coupon, subtotal)
      if (!valid.ok) return res.status(400).json({ error: valid.reason })
      discount = computeDiscountAmount(coupon, subtotal)
      couponId = coupon.id
      couponCodeNormalized = coupon.code
      couponUsedCount = coupon.used_count
    }

    const totalAmount = Number((subtotal - discount).toFixed(2))
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        order_number: `ORD-${Date.now()}`,
        subtotal_amount: subtotal,
        discount_amount: discount,
        coupon_code: couponCodeNormalized,
        coupon_id: couponId,
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

    const orderItems = cartRows
      .map((row: any) => {
        const productId = typeof row?.product_id === 'string' ? row.product_id : ''
        const quantity = typeof row?.quantity === 'number' ? row.quantity : Number(row?.quantity)
        const unitPrice = typeof row?.products?.price === 'number' ? row.products.price : Number(row?.products?.price)

        if (!productId || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice)) {
          return null
        }

        return {
          order_id: order.id,
          product_id: productId,
          quantity,
          unit_price: unitPrice,
          subtotal: Number((unitPrice * quantity).toFixed(2)),
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

    const { error: clearError } = await supabaseAdmin.from('cart_items').delete().eq('user_id', userId)
    if (clearError) {
      return res.status(500).json({ error: clearError.message })
    }

    if (couponId && couponUsedCount !== null) {
      await supabaseAdmin
        .from('coupons')
        .update({ used_count: couponUsedCount + 1, updated_at: new Date().toISOString() })
        .eq('id', couponId)
        .eq('used_count', couponUsedCount)
    }

    return res.status(200).json({ success: true, order })
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Unexpected error' })
  }
}
