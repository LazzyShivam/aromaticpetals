import type { NextApiRequest, NextApiResponse } from 'next'
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  ;(req.query as any).nextauth = ['session']
  return NextAuth(req, res, authOptions)
}

