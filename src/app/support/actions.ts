"use server"

import { createClient } from "@supabase/supabase-js"
import { SupportRequest, SupportMessage, ApiResponse } from "@/types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function acceptSupportRequest(requestId: string): Promise<ApiResponse> {
  try {
    const now = new Date()
    const expires = new Date(now.getTime() + 50 * 60000)
    
    const { data, error } = await supabase
      .from('support_requests')
      .update({ 
          status: 'active',
          started_at: now.toISOString(),
          expires_at: expires.toISOString()
      })
      .eq('id', requestId)
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

export async function sendSupportMessage(userId: string, content: string): Promise<ApiResponse<SupportMessage>> {
  try {
    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        user_id: userId,
        content: content,
        is_from_admin: true
      })
      .select()
      .single()
    
    if (error) {
      return { success: false, error: error.message, code: error.code }
    }
    
    return { success: true, data: data as unknown as SupportMessage }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred"
    return { success: false, error: message }
  }
}

export async function getSupportRequests(): Promise<ApiResponse<SupportRequest[]>> {
  try {
    const { data, error } = await supabase
      .from('support_requests')
      .select('*, users(full_name, email, phone)')
      .neq('status', 'finished')
      .order('created_at', { ascending: false })
    
    if (error) {
      return { success: false, error: error.message, code: error.code }
    }
    
    return { success: true, data: data as unknown as SupportRequest[] }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred"
    return { success: false, error: message }
  }
}

export async function getSupportMessages(userId: string): Promise<ApiResponse<SupportMessage[]>> {
  try {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    
    if (error) {
      return { success: false, error: error.message, code: error.code }
    }
    
    return { success: true, data: data as unknown as SupportMessage[] }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred"
    return { success: false, error: message }
  }
}
