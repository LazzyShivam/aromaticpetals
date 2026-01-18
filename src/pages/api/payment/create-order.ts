import type { NextApiRequest, NextApiResponse } from 'next'
import Razorpay from 'razorpay'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const amount = typeof req.body?.amount === 'number' ? req.body.amount : Number(req.body?.amount)
    const currency = typeof req.body?.currency === 'string' ? req.body.currency : 'INR'
    const receipt = typeof req.body?.receipt === 'string' ? req.body.receipt : undefined

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Amount is required' })
    }

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret || keyId.startsWith('your-') || keySecret.startsWith('your-')) {
      return res.status(500).json({ error: 'Razorpay keys are not configured' })
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt,
    })

    return res.status(200).json(order)
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Something went wrong' })
  }
}

