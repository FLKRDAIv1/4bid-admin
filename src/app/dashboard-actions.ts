"use server"

import { createClient } from "@supabase/supabase-js"
import { format, subDays } from 'date-fns'
import { DashboardData, ApiResponse } from "@/types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function getDashboardStats(): Promise<ApiResponse<DashboardData>> {
  try {
    // 1. Fetch Counts
    const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true })
    const { count: auctionsCount } = await supabase.from('auctions').select('*', { count: 'exact', head: true }).eq('status', 'live')
    const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending_checkout')
    const { count: supportCount } = await supabase.from('support_requests').select('*', { count: 'exact', head: true }).eq('status', 'active')

    // 2. Fetch all paid orders for Revenue sum
    const { data: paidOrders } = await supabase
        .from('orders')
        .select('final_price')
        .in('status', ['paid', 'shipped', 'out_for_delivery', 'delivered'])
    
    const totalRev = paidOrders?.reduce((acc, o) => acc + o.final_price, 0) || 0

    // 3. Compute 7 Days Chart Data
    const sevenDaysAgo = subDays(new Date(), 7)
    const { data: recentOrders } = await supabase
        .from('orders')
        .select('final_price, checkout_deadline')
        .in('status', ['paid', 'shipped', 'out_for_delivery', 'delivered'])
        .gte('checkout_deadline', sevenDaysAgo.toISOString())
    
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

    // 4. Fetch 5 most recent bids
    const { data: liveBids } = await supabase
      .from('bids')
      .select('*, auctions(products(title)), users(phone)')
      .order('created_at', { ascending: false })
      .limit(5)

    // 5. Fetch Pending Users
    const { data: pendingUsers } = await supabase
      .from('users')
      .select('id, full_name, city')
      .eq('status', 'pending_approval')
      .limit(5)

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
