import { supabase } from '@/lib/supabase'
import { Product } from '@/types'
import Link from 'next/link'
import { ShoppingCart, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import ProductPurchase from '@/components/ProductPurchase'

// Force dynamic since we're fetching data
export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 0

async function getProduct(id: string) {
  if (!id) return null

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return data as Product
}

type PageParams = { id?: string; nxtPid?: string }

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<PageParams>
}) {
  const resolvedParams = await params
  const id = resolvedParams.id || resolvedParams.nxtPid || ''
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  return (
    <div className="bg-white dark:bg-zinc-900 min-h-screen py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/products" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
          {/* Image gallery */}
          <div className="flex flex-col-reverse">
            <div className="w-full aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg overflow-hidden sm:aspect-w-2 sm:aspect-h-3">
              <Image
                src={product.image_url || 'https://images.unsplash.com/photo-1496062031456-07b8f162a322?w=1600&q=80'}
                alt={product.name}
                width={800}
                height={800}
                className="w-full h-full object-center object-cover"
              />
            </div>
          </div>

          {/* Product info */}
          <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">{product.name}</h1>
            
            <div className="mt-3">
              <h2 className="sr-only">Product information</h2>
              <p className="text-3xl text-gray-900 dark:text-gray-100">₹{product.price}</p>
            </div>

            <div className="mt-6">
              <h3 className="sr-only">Description</h3>
              <div className="text-base text-gray-700 dark:text-gray-300 space-y-6">
                <p>{product.description}</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.stock_quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
                <span className="ml-4 text-sm text-gray-500">Category: {product.category}</span>
              </div>
            </div>

            <ProductPurchase product={product} />
          </div>
        </div>
      </div>
    </div>
  )
}
