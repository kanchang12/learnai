import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface LoginEvent {
  name: string;
  email: string;
  tier: string;
  amount_inr?: number;
  paypal_order_id?: string;
  coupon_used?: string;
  access_type: 'paid' | 'coupon';
}

/**
 * Logs every successful access to Supabase for monitoring.
 *
 * Required table (run once in Supabase SQL Editor):
 *
 * CREATE TABLE login_events (
 *   id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   name           text NOT NULL,
 *   email          text NOT NULL,
 *   tier           text NOT NULL,
 *   amount_inr     integer,
 *   paypal_order_id text,
 *   coupon_used    text,
 *   access_type    text NOT NULL,
 *   logged_at      timestamptz DEFAULT now()
 * );
 */
export async function logLoginEvent(event: LoginEvent): Promise<void> {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Supabase] Not configured — skipping event log.');
    return;
  }
  const { error } = await supabase.from('login_events').insert({
    name: event.name,
    email: event.email,
    tier: event.tier,
    amount_inr: event.amount_inr ?? null,
    paypal_order_id: event.paypal_order_id ?? null,
    coupon_used: event.coupon_used ?? null,
    access_type: event.access_type,
  });
  if (error) {
    console.error('[Supabase] Log failed:', error.message);
  }
}
