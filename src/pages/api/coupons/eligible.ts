import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { computeCartSubtotal, getCartRowsForUser } from '@/lib/cartTotals'
import { computeDiscountAmount, validateCouponForSubtotal } from '@/lib/coupons'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  if ((session.user as any)?.role === 'admin') return res.status(403).json({ error: 'Forbidden' })

  const userId = (session.user as any).id as string
  const { rows, error: cartError } = await getCartRowsForUser(userId)
  if (cartError) return res.status(500).json({ error: cartError })

  const subtotal = computeCartSubtotal(rows)

  const { data, error } = await supabaseAdmin
    .from('coupons')
    .select('id, code, description, discount_type, discount_value, min_order_amount, max_discount, starts_at, ends_at, usage_limit, used_count, is_active')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  const now = new Date()
  const eligible = (data ?? [])
    .map((c: any) => {
      const valid = validateCouponForSubtotal(c, subtotal, now)
      if (!valid.ok) return null
      const discount = computeDiscountAmount(c, subtotal)
      return {
        code: c.code,
        description: c.description,
        discount_type: c.discount_type,
        discount_value: c.discount_value,
        max_discount: c.max_discount,
        min_order_amount: c.min_order_amount,
        discount,
        total: Number((subtotal - discount).toFixed(2)),
      }
    })
    .filter(Boolean)
    .sort((a: any, b: any) => Number(b.discount) - Number(a.discount))
    .slice(0, 10)

  return res.status(200).json({ subtotal, coupons: eligible })
}

