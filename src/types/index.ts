export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface User {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  username?: string;
  city?: string;
  profile_image_url?: string;
  document_url?: string;
  face_url?: string;
  status: 'active' | 'banned' | 'pending' | 'pending_approval';
  strikes: number;
  pay_limit: number;
  created_at: string;
  reportCount?: number;
}

export interface Product {
  id: string;
  title: string;
  sku: string;
  description: string;
  amazon_url?: string;
  is_amazon_verified: boolean;
  estimated_delivery_days: number;
  video_url?: string;
  image_urls: string[];
  about_items?: string[];
  highlights?: string[];
  specs: {
    Material?: string;
    Weight?: string;
    Technology?: string;
    Manufacturer?: string;
    Warranty?: string;
    [key: string]: string | undefined;
  };
  created_at: string;
}

export interface Auction {
  id: string;
  product_id: string;
  title: string;
  description: string;
  start_price: number;
  current_price: number;
  min_bid_increment: number;
  caution_amount: number;
  start_time: string;
  end_time: string;
  status: 'pending' | 'live' | 'finished' | 'cancelled';
  highest_bidder_id?: string | null;
  products?: Product;
  created_at: string;
}

export interface Bid {
  id: string;
  auction_id: string;
  user_id: string;
  amount: number;
  created_at: string;
  users?: {
    full_name?: string;
    phone?: string;
  };
}

export interface ProxyBid {
  id: string;
  auction_id: string;
  user_id: string;
  max_amount: number;
  is_active: boolean;
  created_at: string;
  users?: {
    full_name?: string;
    phone?: string;
  };
}

export interface DeliveryLocation {
  id: string;
  user_id: string;
  city: string;
  address: string;
  created_at: string;
}

export interface Order {
  id: string;
  auction_id: string;
  user_id: string;
  status: 'unpaid' | 'paid' | 'shipping' | 'delivered' | 'cancelled' | 'pending' | 'processing' | 'shipped';
  total_amount: number;
  final_price: number;
  live_lat?: number;
  live_lng?: number;
  checkout_deadline: string;
  created_at: string;
  users?: {
    full_name?: string;
    phone?: string;
  };
  delivery_locations?: DeliveryLocation[];
}

export interface SupportRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'waiting' | 'active' | 'finished';
  subject?: string;
  created_at: string;
  started_at?: string;
  expires_at?: string;
  users?: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
}

export interface SupportMessage {
  id: string;
  user_id: string;
  content: string;
  is_from_admin: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  target_id: string;
  reason: string;
  type: string;
  status: 'pending' | 'investigating' | 'resolved';
  details?: string;
  phone_number?: string;
  target_type?: string;
  created_at: string;
}

export interface DashboardStats {
  revenue: number;
  activeAuctions: number;
  pendingCheckouts: number;
  totalUsers: number;
  activeSupport: number;
}

export interface ChartData {
  name: string;
  revenue: number;
}

export interface DashboardBid {
  id: string;
  auction_id: string;
  user_id: string;
  amount: number;
  created_at: string;
  auctions: {
    products: {
      title: string;
    };
  };
  users: {
    phone: string;
  };
}

export interface DashboardUser {
  id: string;
  full_name: string;
  city: string;
}

export interface DashboardData {
  stats: DashboardStats;
  chartData: ChartData[];
  liveBids: DashboardBid[];
  pendingUsers: DashboardUser[];
}
