import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type CampaignType = 'kampanya' | 'duyuru' | 'etkinlik';

export interface Campaign {
  id: string;
  type: CampaignType;
  badge: string;
  title: string;
  summary: string;
  detail: string;
  expiry: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}
