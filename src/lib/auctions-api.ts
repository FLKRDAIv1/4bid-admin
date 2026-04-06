"use client"

import { supabase } from "@/lib/supabase"
import { Product, Auction, ApiResponse, Bid, ProxyBid } from "@/types"

export async function saveAuction(
  productPayload: Partial<Product>, 
  auctionPayload: Partial<Auction>, 
  editingAuctionId: string | null, 
  editingProductId: string | null
): Promise<ApiResponse> {
  try {
    let productId = editingProductId

    if (!editingProductId) {
      // 1. Create Product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert(productPayload)
        .select()
        .single()

      if (productError || !productData) {
        return { success: false, error: productError?.message || "Failed to create product" }
      }
      productId = productData.id
    } else {
      // Update existing product
      const { error: productError } = await supabase
        .from('products')
        .update(productPayload)
        .eq('id', editingProductId)

      if (productError) {
        return { success: false, error: "Product update failed: " + productError.message }
      }
    }

    // Prepare Auction Payload with verified Product ID
    const finalAuctionPayload = {
      ...auctionPayload,
      product_id: productId
    }

    let auctionError
    if (editingAuctionId) {
      const { error } = await supabase
        .from('auctions')
        .update(finalAuctionPayload)
        .eq('id', editingAuctionId)
        .select()
      auctionError = error
    } else {
      const { error } = await supabase
        .from('auctions')
        .insert(finalAuctionPayload)
        .select()
      auctionError = error
    }

    if (auctionError) {
      return { success: false, error: "Auction save failed: " + auctionError.message }
    }

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred"
    return { success: false, error: message }
  }
}

export async function deleteAuction(id: string): Promise<ApiResponse> {
  try {
    const { error } = await supabase.from('auctions').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred"
    return { success: false, error: message }
  }
}

export async function updateAuctionPrice(id: string, amount: number): Promise<ApiResponse> {
  try {
    const { error } = await supabase.from('auctions').update({ current_price: amount }).eq('id', id).select()
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred"
    return { success: false, error: message }
  }
}

export async function getAuctions(): Promise<ApiResponse<Auction[]>> {
  try {
    const { data, error } = await supabase
      .from('auctions')
      .select('*, products(*)')
      .order('start_time', { ascending: false })
      .limit(50)
    
    if (error) {
      return { success: false, error: error.message, code: error.code }
    }
    
    return { success: true, data: data as unknown as Auction[] }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred"
    return { success: false, error: message }
  }
}

export async function getAuctionBids(auctionId: string): Promise<ApiResponse<{ bids: Bid[], proxies: ProxyBid[] }>> {
  try {
    const { data: bids, error: bidsError } = await supabase
      .from('bids')
      .select('*, users(full_name, phone)')
      .eq('auction_id', auctionId)
      .order('created_at', { ascending: false })
    
    const { data: proxies, error: proxyError } = await supabase
      .from('proxy_bids')
      .select('*, users(full_name, phone)')
      .eq('auction_id', auctionId)
      .eq('is_active', true)
      .order('max_amount', { ascending: false })
    
    if (bidsError || proxyError) {
      return { 
        success: false, 
        error: bidsError?.message || proxyError?.message, 
        code: bidsError?.code || proxyError?.code 
      }
    }
    
    return { 
      success: true, 
      data: { 
        bids: bids as unknown as Bid[], 
        proxies: proxies as unknown as ProxyBid[] 
      } 
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred"
    return { success: false, error: message }
  }
}
