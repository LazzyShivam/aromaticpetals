import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
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

  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .select('id, user_id, product_id, quantity, products(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  const items = (data ?? [])
    .map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      product_id: row.product_id,
      quantity: row.quantity,
      product: row.products,
    }))
    .filter((x: any) => !!x.product)

  return res.status(200).json({ items })
}

