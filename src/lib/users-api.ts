"use client"

import { supabase } from "@/lib/supabase"
import { User, ApiResponse } from "@/types"

export async function getUsers(): Promise<ApiResponse<User[]>> {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (userError) throw userError

    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .select('user_id')
    
    if (reportError) throw reportError
    
    const usersWithReports: User[] = (userData || []).map(user => ({
      ...user,
      reportCount: reportData?.filter(r => r.user_id === user.id).length || 0
    }))

    return { success: true, data: usersWithReports }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred"
    return { success: false, error: message }
  }
}

export async function updateUserStatus(userId: string, status: string): Promise<ApiResponse> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', userId)
    
    if (error) throw error
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred"
    return { success: false, error: message }
  }
}

export async function updateUserStrikes(userId: string, strikes: number): Promise<ApiResponse> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ strikes })
      .eq('id', userId)
    
    if (error) throw error
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred"
    return { success: false, error: message }
  }
}

export async function updateUserPayLimit(userId: string, payLimit: number): Promise<ApiResponse> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ pay_limit: payLimit })
      .eq('id', userId)
    
    if (error) throw error
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred"
    return { success: false, error: message }
  }
}

export async function deleteUser(userId: string): Promise<ApiResponse> {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
    
    if (error) throw error
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred"
    return { success: false, error: message }
  }
}

export async function createUser(userData: Partial<User>): Promise<ApiResponse> {
  try {
    const { error } = await supabase
      .from('users')
      .insert([{ ...userData, status: 'active' }])
    
    if (error) throw error
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred"
    return { success: false, error: message }
  }
}
