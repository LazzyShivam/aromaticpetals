'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect } from 'react'
import { LayoutDashboard, Package, ShoppingBag } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (session && (session.user as any).role !== 'admin') {
      router.push('/')
    }
  }, [session, status, router])

  if (status === 'loading') return <div className="p-8">Loading...</div>
  if (!session || (session.user as any).role !== 'admin') return null

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-zinc-900">
      <aside className="w-64 bg-white dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Admin Portal</h2>
        </div>
        <nav className="mt-6 px-4 space-y-2">
          <Link href="/admin" className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-md">
            <LayoutDashboard className="mr-3 h-5 w-5" />
            Dashboard
          </Link>
          <Link href="/admin/products" className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-md">
            <Package className="mr-3 h-5 w-5" />
            Products
          </Link>
          <Link href="/admin/orders" className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-md">
            <ShoppingBag className="mr-3 h-5 w-5" />
            Orders
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
