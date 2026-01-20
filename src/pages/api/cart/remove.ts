import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type RemoveBody = { product_id?: string }

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
  const body = (req.body ?? {}) as RemoveBody
  const productId = typeof body.product_id === 'string' ? body.product_id : ''

  if (!productId) {
    return res.status(400).json({ error: 'Invalid payload' })
  }

  const { error } = await supabaseAdmin
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ ok: true })
}

