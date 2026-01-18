import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'
import { Product } from '@/types'

// Enable dynamic rendering
export const dynamic = 'force-dynamic'

async function getFeaturedProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .limit(4)

  if (error) {
    console.error('Error fetching featured products:', error)
    return []
  }

  return data as Product[]
}

export default async function Home() {
  const featuredProducts = await getFeaturedProducts()

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <div className="relative bg-gray-900">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1496062031456-07b8f162a322?w=1600&q=80"
            alt="Hero background"
            className="h-full w-full object-cover object-center opacity-40"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Welcome to Aromatic Petals
          </h1>
          <p className="mt-4 text-xl text-gray-300 max-w-2xl">
            Discover our exquisite collection of fresh flowers, lush plants, and aromatic gifts for every occasion.
          </p>
          <div className="mt-8">
            <Link
              href="/products"
              className="inline-block rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="bg-white dark:bg-zinc-900 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">Featured Products</h2>
          
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Link href="/products" className="text-indigo-600 font-medium hover:text-indigo-500">
              View all products <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
