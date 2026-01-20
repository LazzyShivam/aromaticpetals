import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Customer support</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Email{' '}
              <Link href="mailto:shivams954@gmail.com" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                shivams954@gmail.com
              </Link>
              {' '}• Phone{' '}
              <Link href="tel:+917624800761" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                7624800761
              </Link>
            </p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} Aromatic Petals</p>
        </div>
      </div>
    </footer>
  )
}

