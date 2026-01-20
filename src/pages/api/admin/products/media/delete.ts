import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type Body = { id?: string }

const BUCKET = 'product-media'

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
  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) return res.status(400).json({ error: 'id is required' })

  const { data: media, error: getError } = await supabaseAdmin.from('product_media').select('*').eq('id', id).single()
  if (getError || !media) return res.status(404).json({ error: 'Media not found' })

  if (media.storage_path) {
    await supabaseAdmin.storage.from(BUCKET).remove([media.storage_path])
  }

  const { error: delError } = await supabaseAdmin.from('product_media').delete().eq('id', id)
  if (delError) return res.status(500).json({ error: delError.message })

  if (media.media_type === 'image') {
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id, image_url')
      .eq('id', media.product_id)
      .single()

    if (product?.image_url === media.public_url) {
      const { data: nextImage } = await supabaseAdmin
        .from('product_media')
        .select('public_url')
        .eq('product_id', media.product_id)
        .eq('media_type', 'image')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      await supabaseAdmin.from('products').update({ image_url: nextImage?.public_url ?? null }).eq('id', media.product_id)
    }
  }

  return res.status(200).json({ success: true })
}

