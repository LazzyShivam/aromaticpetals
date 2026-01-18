import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  // Fetch orders
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('user_id', (session.user as any).id)
    .order('created_at', { ascending: false })

  return (
    <div className="bg-white dark:bg-zinc-900 min-h-screen py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">My Account</h1>

        <div className="bg-white dark:bg-zinc-800 shadow overflow-hidden sm:rounded-lg mb-8 border border-gray-200 dark:border-zinc-700">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Profile Information</h3>
          </div>
          <div className="border-t border-gray-200 dark:border-zinc-700">
            <dl>
              <div className="bg-gray-50 dark:bg-zinc-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{session.user?.name}</dd>
              </div>
              <div className="bg-white dark:bg-zinc-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{session.user?.email}</dd>
              </div>
              <div className="bg-gray-50 dark:bg-zinc-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</dt>
                {/* @ts-ignore */}
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 capitalize">{session.user?.role || 'Customer'}</dd>
              </div>
            </dl>
          </div>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">Order History</h2>

        {orders && orders.length > 0 ? (
          <div className="bg-white dark:bg-zinc-800 shadow overflow-hidden sm:rounded-md border border-gray-200 dark:border-zinc-700">
            <ul role="list" className="divide-y divide-gray-200 dark:divide-zinc-700">
              {orders.map((order: any) => (
                <li key={order.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">{order.order_number}</p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {order.status}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          Total: ₹{order.total_amount}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                        <p>
                          Placed on <time dateTime={order.created_at}>{new Date(order.created_at).toLocaleDateString()}</time>
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">You haven't placed any orders yet.</p>
        )}
      </div>
    </div>
  )
}
