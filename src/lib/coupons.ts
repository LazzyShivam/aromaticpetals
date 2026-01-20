import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type Coupon = {
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
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase()
}

export async function getCouponByCode(rawCode: string) {
  const code = normalizeCode(rawCode)
  if (!code) return { coupon: null as Coupon | null, error: 'Coupon code is required' }

  const { data, error } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('code', code)
    .maybeSingle()

  if (error) return { coupon: null as Coupon | null, error: error.message }
  if (!data) return { coupon: null as Coupon | null, error: 'Invalid coupon code' }

  return { coupon: data as unknown as Coupon, error: null as string | null }
}

export function validateCouponForSubtotal(
  coupon: Coupon,
  subtotal: number,
  now = new Date()
): { ok: true } | { ok: false; reason: string } {
  if (!coupon.is_active) return { ok: false, reason: 'Coupon is not active' }
  if (!Number.isFinite(subtotal) || subtotal <= 0) return { ok: false, reason: 'Cart is empty' }
  if (subtotal < Number(coupon.min_order_amount || 0)) {
    return { ok: false, reason: `Minimum order is ₹${coupon.min_order_amount}` }
  }
  if (coupon.starts_at && now < new Date(coupon.starts_at)) {
    return { ok: false, reason: 'Coupon is not active yet' }
  }
  if (coupon.ends_at && now > new Date(coupon.ends_at)) {
    return { ok: false, reason: 'Coupon has expired' }
  }
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    return { ok: false, reason: 'Coupon usage limit reached' }
  }
  return { ok: true }
}

export function computeDiscountAmount(coupon: Coupon, subtotal: number) {
  const sub = Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0
  let discount = 0

  if (coupon.discount_type === 'percent') {
    discount = (sub * Number(coupon.discount_value || 0)) / 100
  } else {
    discount = Number(coupon.discount_value || 0)
  }

  if (coupon.max_discount !== null) {
    discount = Math.min(discount, Number(coupon.max_discount))
  }

  discount = Math.min(discount, sub)
  return Number(discount.toFixed(2))
}

