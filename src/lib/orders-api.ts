"use client"

import { createClient } from "@supabase/supabase-js"
import { Order, ApiResponse } from "@/types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function updateOrderStatus(orderId: string, newStatus: string): Promise<ApiResponse> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select()
    
    if (error) {
      return { success: false, error: error.message, code: error.code }
    }
    
    return { success: true, data }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred"
    return { success: false, error: message }
  }
}

export async function getOrders(): Promise<ApiResponse<Order[]>> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, delivery_locations(*), users(phone, full_name)')
      .order('checkout_deadline', { ascending: true })
      .limit(50)
    
    if (error) {
      return { success: false, error: error.message, code: error.code }
    }
    
    return { success: true, data: data as unknown as Order[] }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred"
    return { success: false, error: message }
  }
}
