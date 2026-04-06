"use server"

import { supabase } from "@/lib/supabase"
import { format, subDays } from 'date-fns'
import { DashboardData, ApiResponse } from "@/types"

export async function getDashboardStats(): Promise<ApiResponse<DashboardData>> {
  try {
    // Parallelize all main fetching operations for maximum performance
    const [
      { count: usersCount },
      { count: auctionsCount },
      { count: ordersCount },
      { count: supportCount },
      { data: paidOrders },
      { data: liveBids },
      { data: pendingUsers }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('auctions').select('*', { count: 'exact', head: true }).eq('status', 'live'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending_checkout'),
      supabase.from('support_requests').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('orders').select('final_price').in('status', ['paid', 'shipped', 'out_for_delivery', 'delivered']),
      supabase.from('bids').select('*, auctions(products(title)), users(phone)').order('created_at', { ascending: false }).limit(5),
      supabase.from('users').select('id, full_name, city').eq('status', 'pending_approval').limit(5)
    ])

    // Calculate total revenue from parallel fetch
    const totalRev = paidOrders?.reduce((acc, o) => acc + o.final_price, 0) || 0

    // Fetch chart data separately or also parallelize if needed (for now, simpler logic)
    const sevenDaysAgo = subDays(new Date(), 7)
    const { data: recentOrders } = await supabase
        .from('orders')
        .select('final_price, checkout_deadline')
        .in('status', ['paid', 'shipped', 'out_for_delivery', 'delivered'])
        .gte('checkout_deadline', sevenDaysAgo.toISOString())
    
    // Process Chart Data
    const revMap = new Map()
    for(let i=6; i>=0; i--) {
      revMap.set(format(subDays(new Date(), i), 'EEE'), 0)
    }

    if(recentOrders) {
       recentOrders.forEach(o => {
          const dayName = format(new Date(o.checkout_deadline), 'EEE')
          if(revMap.has(dayName)) {
             revMap.set(dayName, revMap.get(dayName) + o.final_price)
          }
       })
    }
    
    const chartData = Array.from(revMap, ([name, revenue]) => ({ name, revenue }))

    return {
      success: true,
      data: {
        stats: {
          revenue: totalRev,
          activeAuctions: auctionsCount || 0,
          pendingCheckouts: ordersCount || 0,
          totalUsers: usersCount || 0,
          activeSupport: supportCount || 0
        },
        chartData,
        liveBids: liveBids || [],
        pendingUsers: pendingUsers || []
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred"
    return { success: false, error: message }
  }
}
