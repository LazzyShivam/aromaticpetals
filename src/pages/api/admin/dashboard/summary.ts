import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

async function count(table: string, filter?: (q: any) => any) {
  let q = supabaseAdmin.from(table).select('*', { count: 'exact', head: true })
  if (filter) q = filter(q)
  const { count: c, error } = await q
  if (error) throw new Error(error.message)
  return c ?? 0
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const [productsTotal, productsActive, ordersTotal, ordersPending, ordersConfirmed, ordersShipped, ordersDelivered] =
      await Promise.all([
        count('products'),
        count('products', (q) => q.eq('is_active', true)),
        count('orders'),
        count('orders', (q) => q.eq('status', 'pending')),
        count('orders', (q) => q.eq('status', 'confirmed')),
        count('orders', (q) => q.eq('status', 'shipped')),
        count('orders', (q) => q.eq('status', 'delivered')),
      ])

    return res.status(200).json({
      products: { total: productsTotal, active: productsActive },
      orders: {
        total: ordersTotal,
        pending: ordersPending,
        confirmed: ordersConfirmed,
        shipped: ordersShipped,
        delivered: ordersDelivered,
      },
    })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to load dashboard' })
  }
}

