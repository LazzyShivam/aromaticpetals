import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'
import { Product } from '@/types'

// Enable dynamic rendering for this page since we're fetching data
export const dynamic = 'force-dynamic'

async function getProducts(searchParams: { category?: string, search?: string }) {
  let query = supabase.from('products').select('*').eq('is_active', true)

  if (searchParams.category) {
    query = query.eq('category', searchParams.category)
  }

  if (searchParams.search) {
    query = query.ilike('name', `%${searchParams.search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data as Product[]
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; search?: string }>
}) {
  const resolvedSearchParams = (await searchParams) ?? {}

  const products = await getProducts(resolvedSearchParams)
  const categories = ['Flowers', 'Plants', 'Gifts']

  return (
    <div className="bg-white dark:bg-zinc-900 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row justify-between items-baseline border-b border-gray-200 pb-6 mb-6">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">New Arrivals</h1>
          
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <a href="/products" className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300">All</a>
            {categories.map((category) => (
              <a 
                key={category} 
                href={`/products?category=${category}`}
                className={`text-sm font-medium ${resolvedSearchParams.category === category ? 'text-indigo-600' : 'text-gray-700 hover:text-gray-900 dark:text-gray-300'}`}
              >
                {category}
              </a>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-500">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
