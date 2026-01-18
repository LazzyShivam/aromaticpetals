import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : ''
    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return res.status(500).json({ error: 'Server is not configured' })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'customer' },
    })

    if (createError || !created.user) {
      return res.status(400).json({ error: createError?.message ?? 'Failed to create user' })
    }

    const { error: insertError } = await supabaseAdmin.from('users').insert({
      id: created.user.id,
      email,
      password_hash: 'managed_by_supabase_auth',
      name,
      role: 'customer',
    })

    if (insertError) {
      return res.status(400).json({ error: insertError.message })
    }

    return res.status(200).json({ ok: true })
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Unexpected error' })
  }
}

