export interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  stock_quantity: number
  category: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  product: Product
}

export interface User {
  id: string
  email: string
  name: string
  role: 'customer' | 'admin'
}

export interface Coupon {
  id?: string
  code: string
  description?: string | null
  discount_type: 'percent' | 'amount'
  discount_value: number
  min_order_amount?: number
  max_discount?: number | null
  starts_at?: string | null
  ends_at?: string | null
  is_active?: boolean
}
