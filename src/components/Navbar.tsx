'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { ShoppingCart, User, LogOut } from 'lucide-react'

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-white border-b border-gray-200 dark:bg-zinc-900 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-indigo-600">Aromatic Petals</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/products" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Products
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/cart" className="text-gray-500 hover:text-gray-700 p-2">
              <ShoppingCart className="h-6 w-6" />
            </Link>
            
            {session ? (
              <div className="flex items-center space-x-4">
                <Link href="/profile" className="text-gray-500 hover:text-gray-700">
                  <User className="h-6 w-6" />
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="h-6 w-6" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/auth/login" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                  Log in
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
