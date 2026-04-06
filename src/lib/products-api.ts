"use client"

import { supabase } from "@/lib/supabase"
import { Product, ApiResponse } from "@/types"

export async function getProducts(): Promise<ApiResponse<Product[]>> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('title', { ascending: true })
    
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred"
    return { success: false, error: message }
  }
}

export async function saveProduct(productData: Partial<Product>, productId?: string | null): Promise<ApiResponse> {
  try {
    let error;
    if (productId) {
      const { error: updateError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from('products')
        .insert([productData])
      error = insertError
    }
    
    if (error) throw error
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred"
    return { success: false, error: message }
  }
}

export async function deleteProduct(productId: string): Promise<ApiResponse> {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
    
    if (error) throw error
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred"
    return { success: false, error: message }
  }
}
