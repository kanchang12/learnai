export interface LoginEvent {
  name: string;
  email: string;
  tier: string;
  amount_inr?: number;
  paypal_order_id?: string;
  coupon_used?: string;
  access_type: 'paid' | 'coupon';
}

export async function logLoginEvent(event: LoginEvent): Promise<void> {
  try {
    await fetch('/api/log-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
  } catch (err) {
    console.error('[Log] Failed:', err);
  }
}
