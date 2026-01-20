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
  if (!session || (session.user as any)?.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const productId = typeof req.query?.product_id === 'string' ? req.query.product_id : ''
  if (!productId) return res.status(400).json({ error: 'product_id is required' })

  const { data, error } = await supabaseAdmin
    .from('product_media')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ media: data ?? [] })
}

