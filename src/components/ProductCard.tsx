'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types'
import { ShoppingCart } from 'lucide-react'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group relative bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow dark:bg-zinc-800 dark:border-zinc-700">
      <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-t-lg bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-80">
        <Image
          src={product.image_url}
          alt={product.name}
          width={500}
          height={500}
          className="h-full w-full object-cover object-center lg:h-full lg:w-full"
        />
      </div>
      <div className="mt-4 flex justify-between px-4 pb-4">
        <div>
          <h3 className="text-sm text-gray-700 dark:text-gray-200">
            <Link href={`/product?id=${product.id}`}>
              <span aria-hidden="true" className="absolute inset-0" />
              {product.name}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{product.category}</p>
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">₹{product.price}</p>
      </div>
    </div>
  )
}
