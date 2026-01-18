import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product } from '@/types'

interface CartStore {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.product_id === product.id)
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product_id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
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
                quantity: 1,
                product: product,
              },
            ],
          }
        })
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product_id !== productId),
        }))
      },
      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.product_id === productId ? { ...item, quantity } : item
          ),
        }))
      },
      clearCart: () => {
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
