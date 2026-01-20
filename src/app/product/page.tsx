import { supabase } from '@/lib/supabase'
import { Product, ProductMedia } from '@/types'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import ProductPurchase from '@/components/ProductPurchase'

export const dynamic = 'force-dynamic'

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

async function getProductMedia(productId: string) {
  if (!productId) return [] as ProductMedia[]
  const { data } = await supabase
    .from('product_media')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  return (data ?? []) as unknown as ProductMedia[]
}

type SearchParams = { id?: string }

export default async function ProductByQueryPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const { id = '' } = (await searchParams) ?? {}
  const product = await getProduct(id)
  const media = await getProductMedia(id)

  if (!product) {
    notFound()
  }

  const images = media.filter((m) => m.media_type === 'image')
  const videos = media.filter((m) => m.media_type === 'video')
  const heroImage = images[0]?.public_url || product.image_url || 'https://images.unsplash.com/photo-1496062031456-07b8f162a322?w=1600&q=80'

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
          <div className="flex flex-col-reverse">
            <div className="w-full aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg overflow-hidden sm:aspect-w-2 sm:aspect-h-3">
              <Image
                src={heroImage}
                alt={product.name}
                width={800}
                height={800}
                className="w-full h-full object-center object-cover"
              />
            </div>

            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {images.slice(0, 8).map((img) => (
                  <div key={img.id} className="aspect-square rounded-md overflow-hidden bg-gray-100">
                    <Image src={img.public_url} alt="" width={200} height={200} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {videos.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Videos</h3>
                <div className="mt-3 space-y-3">
                  {videos.slice(0, 3).map((v) => (
                    <video key={v.id} src={v.public_url} controls className="w-full rounded-lg border border-gray-200 dark:border-zinc-700" />
                  ))}
                </div>
              </div>
            )}
          </div>

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
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.stock_quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
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
