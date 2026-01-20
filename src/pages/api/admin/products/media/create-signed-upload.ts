import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type Body = {
  product_id?: string
  file_name?: string
  content_type?: string
  media_type?: 'image' | 'video'
}

const BUCKET = 'product-media'

function sanitizeFileName(name: string) {
  const trimmed = name.trim().replace(/\s+/g, '_')
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, '')
}

async function ensureBucket() {
  const existing = await supabaseAdmin.storage.getBucket(BUCKET)
  if (existing.data) return
  if (existing.error && !String(existing.error.message || '').toLowerCase().includes('not found')) {
    return
  }
  await supabaseAdmin.storage.createBucket(BUCKET, { public: true })
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
  const fileNameRaw = typeof body.file_name === 'string' ? body.file_name : ''
  const contentType = typeof body.content_type === 'string' ? body.content_type : ''
  const mediaType = body.media_type === 'video' ? 'video' : 'image'

  if (!productId) return res.status(400).json({ error: 'product_id is required' })
  if (!fileNameRaw) return res.status(400).json({ error: 'file_name is required' })
  if (!contentType) return res.status(400).json({ error: 'content_type is required' })

  await ensureBucket()

  const safeName = sanitizeFileName(fileNameRaw) || 'upload'
  const key = `${productId}/${Date.now()}_${Math.random().toString(16).slice(2)}_${safeName}`

  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(key)
  if (error || !data) {
    return res.status(500).json({ error: error?.message || 'Failed to create signed upload url' })
  }

  const publicUrl = supabaseAdmin.storage.from(BUCKET).getPublicUrl(key).data.publicUrl

  return res.status(200).json({
    bucket: BUCKET,
    path: key,
    signedUrl: data.signedUrl,
    token: data.token,
    publicUrl,
    mediaType,
    contentType,
  })
}

