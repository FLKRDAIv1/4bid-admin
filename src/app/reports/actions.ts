"use server"

import { createClient } from "@supabase/supabase-js"
import { Report, ApiResponse } from "@/types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function updateReportStatus(reportId: string, newStatus: string): Promise<ApiResponse> {
  try {
    const { data, error } = await supabase
      .from('reports')
      .update({ status: newStatus })
      .eq('id', reportId)
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

export async function getReports(): Promise<ApiResponse<Report[]>> {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      return { success: false, error: error.message, code: error.code }
    }
    
    return { success: true, data: data as unknown as Report[] }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred"
    return { success: false, error: message }
  }
}
