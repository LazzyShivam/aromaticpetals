import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { computeCartSubtotal, getCartRowsForUser } from '@/lib/cartTotals'
import { computeDiscountAmount, getCouponByCode, validateCouponForSubtotal } from '@/lib/coupons'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  if ((session.user as any)?.role === 'admin') return res.status(403).json({ error: 'Forbidden' })

  const couponCode = typeof req.body?.coupon_code === 'string' ? req.body.coupon_code : ''
  const userId = (session.user as any).id as string

  const { rows, error: cartError } = await getCartRowsForUser(userId)
  if (cartError) return res.status(500).json({ error: cartError })

  const subtotal = computeCartSubtotal(rows)
  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    return res.status(400).json({ error: 'Cart is empty' })
  }

  const { coupon, error } = await getCouponByCode(couponCode)
  if (!coupon) return res.status(400).json({ error: error || 'Invalid coupon code' })

  const valid = validateCouponForSubtotal(coupon, subtotal)
  if (!valid.ok) return res.status(400).json({ error: valid.reason })

  const discount = computeDiscountAmount(coupon, subtotal)
  const total = Number((subtotal - discount).toFixed(2))

  return res.status(200).json({
    coupon: { code: coupon.code, discount_type: coupon.discount_type, discount_value: coupon.discount_value, max_discount: coupon.max_discount },
    subtotal,
    discount,
    total,
  })
}

