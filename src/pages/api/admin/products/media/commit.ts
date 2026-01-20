import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type Body = {
  product_id?: string
  media_type?: 'image' | 'video'
  storage_path?: string
  public_url?: string
  sort_order?: number
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

  const body = (req.body ?? {}) as Body
  const productId = typeof body.product_id === 'string' ? body.product_id : ''
  const mediaType = body.media_type === 'video' ? 'video' : 'image'
  const storagePath = typeof body.storage_path === 'string' ? body.storage_path : ''
  const publicUrl = typeof body.public_url === 'string' ? body.public_url : ''
  const sortOrder = typeof body.sort_order === 'number' && Number.isFinite(body.sort_order) ? body.sort_order : 0

  if (!productId) return res.status(400).json({ error: 'product_id is required' })
  if (!storagePath) return res.status(400).json({ error: 'storage_path is required' })
  if (!publicUrl) return res.status(400).json({ error: 'public_url is required' })

  const { data: media, error } = await supabaseAdmin
    .from('product_media')
    .insert({
      product_id: productId,
      media_type: mediaType,
      storage_path: storagePath,
      public_url: publicUrl,
      sort_order: sortOrder,
    })
    .select('*')
    .single()

  if (error || !media) return res.status(500).json({ error: error?.message || 'Failed to save media' })

  if (mediaType === 'image') {
    const { data: product } = await supabaseAdmin.from('products').select('id, image_url').eq('id', productId).single()
    if (product && !product.image_url) {
      await supabaseAdmin.from('products').update({ image_url: publicUrl }).eq('id', productId)
    }
  }

  return res.status(200).json({ media })
}

