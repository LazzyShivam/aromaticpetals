import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

function normalizeCode(code: string) {
  return code.trim().toUpperCase()
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

  const id = typeof req.body?.id === 'string' ? req.body.id : undefined
  const codeRaw = typeof req.body?.code === 'string' ? req.body.code : ''
  const code = normalizeCode(codeRaw)
  const description = typeof req.body?.description === 'string' ? req.body.description : null
  const discountType = req.body?.discount_type === 'amount' ? 'amount' : 'percent'
  const discountValue = Number(req.body?.discount_value)
  const minOrder = Number(req.body?.min_order_amount ?? 0)
  const maxDiscount = req.body?.max_discount === '' || req.body?.max_discount === null || typeof req.body?.max_discount === 'undefined'
    ? null
    : Number(req.body?.max_discount)
  const usageLimit = req.body?.usage_limit === '' || req.body?.usage_limit === null || typeof req.body?.usage_limit === 'undefined'
    ? null
    : Number(req.body?.usage_limit)
  const startsAt = typeof req.body?.starts_at === 'string' && req.body.starts_at ? req.body.starts_at : null
  const endsAt = typeof req.body?.ends_at === 'string' && req.body.ends_at ? req.body.ends_at : null
  const isActive = typeof req.body?.is_active === 'boolean' ? req.body.is_active : true

  if (!code) return res.status(400).json({ error: 'Code is required' })
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return res.status(400).json({ error: 'Discount value must be > 0' })
  }
  if (!Number.isFinite(minOrder) || minOrder < 0) {
    return res.status(400).json({ error: 'Min order must be >= 0' })
  }
  if (maxDiscount !== null && (!Number.isFinite(maxDiscount) || maxDiscount < 0)) {
    return res.status(400).json({ error: 'Max discount must be >= 0' })
  }
  if (usageLimit !== null && (!Number.isFinite(usageLimit) || usageLimit < 0)) {
    return res.status(400).json({ error: 'Usage limit must be >= 0' })
  }

  const payload: any = {
    code,
    description,
    discount_type: discountType,
    discount_value: discountValue,
    min_order_amount: minOrder,
    max_discount: maxDiscount,
    usage_limit: usageLimit,
    starts_at: startsAt,
    ends_at: endsAt,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  }

  if (id) payload.id = id

  const { data, error } = await supabaseAdmin
    .from('coupons')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  return res.status(200).json({ coupon: data })
}

