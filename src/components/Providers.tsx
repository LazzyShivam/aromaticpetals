'use client'

import { SessionProvider } from "next-auth/react"
import { useCartSync } from '@/hooks/useCartSync'

function CartSync() {
  useCartSync()
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartSync />
      {children}
    </SessionProvider>
  )
}
