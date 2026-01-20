import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type CartProductRow = {
  id: string
  price: number
}

export type CartItemRow = {
  product_id: string
  quantity: number
  products: CartProductRow | null
}

export async function getCartRowsForUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .select('product_id, quantity, products(id, price)')
    .eq('user_id', userId)

  if (error) return { rows: [] as CartItemRow[], error: error.message }
  return { rows: (data ?? []) as unknown as CartItemRow[], error: null as string | null }
}

export function computeCartSubtotal(rows: CartItemRow[]) {
  let subtotal = 0
  for (const row of rows) {
    const price = Number(row.products?.price)
    const qty = Number(row.quantity)
    if (!Number.isFinite(price) || !Number.isFinite(qty) || qty <= 0) continue
    subtotal += price * qty
  }
  return Number(subtotal.toFixed(2))
}

