'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useCart } from '@/hooks/useCart'

export function useCartSync() {
  const { data: session, status } = useSession()
  const hydratedRef = useRef(false)

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    const role = (session?.user as any)?.role
    const isCustomer = status === 'authenticated' && role !== 'admin'

    if (!isCustomer) {
      useCart.getState().setMode('local')
      hydratedRef.current = false
      return
    }

    useCart.getState().setMode('db')
    if (!hydratedRef.current) {
      hydratedRef.current = true
      void useCart.getState().hydrateFromDb()
    }
  }, [session, status])
}
