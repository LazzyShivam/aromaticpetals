import type { NextApiRequest, NextApiResponse } from 'next'
import Razorpay from 'razorpay'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { computeCartSubtotal, getCartRowsForUser } from '@/lib/cartTotals'
import { computeDiscountAmount, getCouponByCode, validateCouponForSubtotal } from '@/lib/coupons'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session) return res.status(401).json({ error: 'Unauthorized' })
    if ((session.user as any)?.role === 'admin') return res.status(403).json({ error: 'Forbidden' })

    const couponCode = typeof req.body?.coupon_code === 'string' ? req.body.coupon_code : ''
    const currency = typeof req.body?.currency === 'string' ? req.body.currency : 'INR'
    const receipt = typeof req.body?.receipt === 'string' ? req.body.receipt : undefined

    const userId = (session.user as any).id as string
    const { rows, error: cartError } = await getCartRowsForUser(userId)
    if (cartError) return res.status(500).json({ error: cartError })

    const subtotal = computeCartSubtotal(rows)
    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      return res.status(400).json({ error: 'Cart is empty' })
    }

    let discount = 0
    let appliedCoupon: any = null
    if (couponCode.trim()) {
      const { coupon, error } = await getCouponByCode(couponCode)
      if (!coupon) return res.status(400).json({ error: error || 'Invalid coupon code' })
      const valid = validateCouponForSubtotal(coupon, subtotal)
      if (!valid.ok) return res.status(400).json({ error: valid.reason })
      discount = computeDiscountAmount(coupon, subtotal)
      appliedCoupon = { id: coupon.id, code: coupon.code }
    }

    const total = Number((subtotal - discount).toFixed(2))
    if (!Number.isFinite(total) || total <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret || keyId.startsWith('your-') || keySecret.startsWith('your-')) {
      return res.status(500).json({ error: 'Razorpay keys are not configured' })
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })

    const order = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency,
      receipt,
      notes: {
        coupon_code: appliedCoupon?.code || '',
        subtotal_amount: String(subtotal),
        discount_amount: String(discount),
      },
    })

    return res.status(200).json({
      ...order,
      pricing: { subtotal, discount, total, coupon: appliedCoupon },
    })
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Something went wrong' })
  }
}
