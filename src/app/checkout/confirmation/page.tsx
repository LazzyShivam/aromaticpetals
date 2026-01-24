import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type SearchParams = { order_id?: string }

export default async function CheckoutConfirmationPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login?callbackUrl=/checkout')

  const { order_id: orderId = '' } = (await searchParams) ?? {}
  if (!orderId) redirect('/profile')

  const userId = (session.user as any).id as string

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!order) {
    redirect('/profile')
  }

  return (
    <div className="bg-white dark:bg-zinc-900 min-h-screen py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Order placed</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Order number: <span className="font-medium">{order.order_number}</span>
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-md border border-gray-200 dark:border-zinc-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Order status</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{order.status}</p>
            </div>
            <div className="rounded-md border border-gray-200 dark:border-zinc-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Payment status</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{order.payment_status || 'unknown'}</p>
            </div>
            <div className="rounded-md border border-gray-200 dark:border-zinc-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total paid</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">₹{order.total_amount}</p>
            </div>
            <div className="rounded-md border border-gray-200 dark:border-zinc-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Payment id</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white break-all">{order.payment_id || '-'}</p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Link
              href="/profile"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              View orders
            </Link>
            <Link
              href="/products"
              className="rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

