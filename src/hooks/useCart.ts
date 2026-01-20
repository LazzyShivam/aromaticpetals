import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product } from '@/types'

interface CartStore {
  items: CartItem[]
  mode: 'local' | 'db'
  hydrating: boolean
  setMode: (mode: 'local' | 'db') => void
  hydrateFromDb: () => Promise<void>
  addItem: (product: Product, quantity?: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  totalItems: () => number
  totalPrice: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      mode: 'local',
      hydrating: false,
      setMode: (mode) => set({ mode }),
      hydrateFromDb: async () => {
        if (get().mode !== 'db') return
        set({ hydrating: true })
        const res = await fetch('/api/cart/list', { method: 'GET', headers: { 'Cache-Control': 'no-cache' } })
        const json = await res.json().catch(() => null)
        try {
          if (!res.ok) {
            throw new Error(json?.error || 'Failed to load cart')
          }
          set({ items: Array.isArray(json?.items) ? json.items : [] })
        } finally {
          set({ hydrating: false })
        }
      },
      addItem: async (product, quantity = 1) => {
        const qty = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1
        if (get().mode === 'db') {
          set((state) => {
            const existing = state.items.find((i) => i.product_id === product.id)
            if (existing) {
              return {
                items: state.items.map((i) => (i.product_id === product.id ? { ...i, quantity: i.quantity + qty } : i)),
              }
            }
            return {
              items: [
                ...state.items,
                { id: 'pending', user_id: '', product_id: product.id, quantity: qty, product },
              ],
            }
          })

          const res = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: product.id, quantity: qty }),
          })
          const json = await res.json().catch(() => null)
          if (!res.ok) {
            await get().hydrateFromDb()
            throw new Error(json?.error || 'Failed to add to cart')
          }
          await get().hydrateFromDb()
          return
        }

        set((state) => {
          const existingItem = state.items.find((item) => item.product_id === product.id)
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product_id === product.id
                  ? { ...item, quantity: item.quantity + qty }
                  : item
              ),
            }
          }
          return {
            items: [
              ...state.items,
              {
                id: Math.random().toString(36).substring(7), // Temporary ID
                user_id: '', // Not used in local state
                product_id: product.id,
                quantity: qty,
                product: product,
              },
            ],
          }
        })
      },
      removeItem: async (productId) => {
        if (get().mode === 'db') {
          set((state) => ({ items: state.items.filter((item) => item.product_id !== productId) }))
          const res = await fetch('/api/cart/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId }),
          })
          const json = await res.json().catch(() => null)
          if (!res.ok) {
            await get().hydrateFromDb()
            throw new Error(json?.error || 'Failed to remove from cart')
          }
          return
        }

        set((state) => ({
          items: state.items.filter((item) => item.product_id !== productId),
        }))
      },
      updateQuantity: async (productId, quantity) => {
        if (get().mode === 'db') {
          set((state) => ({
            items: state.items
              .map((item) => (item.product_id === productId ? { ...item, quantity } : item))
              .filter((item) => item.quantity > 0),
          }))
          const res = await fetch('/api/cart/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId, quantity }),
          })
          const json = await res.json().catch(() => null)
          if (!res.ok) {
            await get().hydrateFromDb()
            throw new Error(json?.error || 'Failed to update cart')
          }
          return
        }

        set((state) => ({
          items: state.items.map((item) => (item.product_id === productId ? { ...item, quantity } : item)),
        }))
      },
      clearCart: async () => {
        if (get().mode === 'db') {
          set({ items: [] })
          const res = await fetch('/api/cart/clear', { method: 'POST' })
          const json = await res.json().catch(() => null)
          if (!res.ok) {
            await get().hydrateFromDb()
            throw new Error(json?.error || 'Failed to clear cart')
          }
          return
        }

        set({ items: [] })
      },
      totalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },
      totalPrice: () => {
        return get().items.reduce((total, item) => total + item.product.price * item.quantity, 0)
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)
