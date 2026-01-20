import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const id = typeof req.body?.id === 'string' ? req.body.id : ''
  if (!id) return res.status(400).json({ error: 'Missing coupon id' })

  const { error } = await supabaseAdmin.from('coupons').delete().eq('id', id)
  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ ok: true })
}

