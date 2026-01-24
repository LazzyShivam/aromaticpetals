import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function readRawBody(req: NextApiRequest) {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

function timingSafeEqualHex(a: string, b: string) {
  const aBuf = Buffer.from(a, 'hex')
  const bBuf = Buffer.from(b, 'hex')
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

type LogLevel = 'silent' | 'error' | 'warn' | 'info'

function getLogLevel(): LogLevel {
  const raw = String(process.env.WEBHOOK_LOG_LEVEL || '').toLowerCase()
  if (raw === 'silent' || raw === 'error' || raw === 'warn' || raw === 'info') return raw
  return process.env.NODE_ENV === 'production' ? 'info' : 'info'
}

function shouldLog(level: Exclude<LogLevel, 'silent'>) {
  const current = getLogLevel()
  const order: Record<Exclude<LogLevel, 'silent'>, number> = { error: 0, warn: 1, info: 2 }
  if (current === 'silent') return false
  return order[level] <= order[current]
}

function logInfo(message: string, meta?: Record<string, any>) {
  if (!shouldLog('info')) return
  console.info(`[razorpay-webhook] ${message}`, meta ?? {})
}

function logWarn(message: string, meta?: Record<string, any>) {
  if (!shouldLog('warn')) return
  console.warn(`[razorpay-webhook] ${message}`, meta ?? {})
}

function logError(message: string, meta?: Record<string, any>) {
  if (!shouldLog('error')) return
  console.error(`[razorpay-webhook] ${message}`, meta ?? {})
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    return res.status(500).json({ error: 'RAZORPAY_WEBHOOK_SECRET is not configured' })
  }

  const signature = String(req.headers['x-razorpay-signature'] || '')
  if (!signature) {
    logWarn('Missing signature header')
    return res.status(400).json({ error: 'Missing x-razorpay-signature header' })
  }

  const raw = await readRawBody(req)
  const expected = crypto.createHmac('sha256', webhookSecret).update(raw).digest('hex')
  if (!timingSafeEqualHex(signature, expected)) {
    logWarn('Invalid signature')
    return res.status(401).json({ error: 'Invalid signature' })
  }

  let event: any
  try {
    event = JSON.parse(raw.toString('utf8'))
  } catch {
    logWarn('Invalid JSON body')
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  const eventId = typeof event?.id === 'string' ? event.id : null
  const eventType = typeof event?.event === 'string' ? event.event : null
  const eventCreatedAt = typeof event?.created_at === 'number' ? new Date(event.created_at * 1000).toISOString() : new Date().toISOString()

  const payment = event?.payload?.payment?.entity
  const paymentId = typeof payment?.id === 'string' ? payment.id : null
  const orderId = typeof payment?.order_id === 'string' ? payment.order_id : null
  const status = typeof payment?.status === 'string' ? payment.status : null
  const amount = typeof payment?.amount === 'number' ? payment.amount : null
  const currency = typeof payment?.currency === 'string' ? payment.currency : null

  logInfo('Received', {
    eventId,
    eventType,
    paymentId,
    orderId,
    status,
    amount,
    currency,
  })

  if (!paymentId && !orderId) {
    logInfo('Ignored (no payment/order ids)', { eventId, eventType })
    return res.status(200).json({ received: true })
  }

  const patch: Record<string, any> = {
    webhook_last_event_id: eventId,
    webhook_last_event_type: eventType,
    webhook_last_event_at: eventCreatedAt,
  }

  if (status) patch.payment_status = status
  if (currency) patch.payment_currency = currency
  if (typeof amount === 'number') patch.payment_amount_paise = amount
  if (status === 'captured') {
    patch.payment_captured_at = new Date().toISOString()
    patch.status = 'confirmed'
  }

  if (paymentId) patch.razorpay_payment_id = paymentId
  if (orderId) patch.razorpay_order_id = orderId

  if (paymentId) {
    const { data: byRazorpayPaymentId, error: err1 } = await supabaseAdmin
      .from('orders')
      .update(patch)
      .eq('razorpay_payment_id', paymentId)
      .select('id')

    if (err1) logError('DB update failed (razorpay_payment_id)', { eventId, paymentId, error: err1.message })
    else logInfo('DB update (razorpay_payment_id)', { eventId, paymentId, updated: (byRazorpayPaymentId ?? []).length })

    const { data: byPaymentId, error: err2 } = await supabaseAdmin
      .from('orders')
      .update(patch)
      .eq('payment_id', paymentId)
      .select('id')

    if (err2) logError('DB update failed (payment_id)', { eventId, paymentId, error: err2.message })
    else logInfo('DB update (payment_id)', { eventId, paymentId, updated: (byPaymentId ?? []).length })
  }
  if (orderId) {
    const { data: byOrderId, error: err3 } = await supabaseAdmin
      .from('orders')
      .update(patch)
      .eq('razorpay_order_id', orderId)
      .select('id')

    if (err3) logError('DB update failed (razorpay_order_id)', { eventId, orderId, error: err3.message })
    else logInfo('DB update (razorpay_order_id)', { eventId, orderId, updated: (byOrderId ?? []).length })
  }

  return res.status(200).json({ received: true })
}
