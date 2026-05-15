import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { CheckCircle, XCircle, Tag, Loader2 } from 'lucide-react';
import { User, Tier } from '../types.ts';
import { cn } from '../utils/cn.ts';
import { logLoginEvent } from '../lib/supabase.ts';

interface LandingPageProps {
  onLogin: (user: User) => void;
}

const TIERS: { id: Tier; label: string; price: string; amount: number; description: string }[] = [
  { id: 'foundation',   label: 'Foundation',   price: '₹8,000',  amount: 8000,  description: 'Modules 1–3' },
  { id: 'professional', label: 'Professional', price: '₹10,000', amount: 10000, description: 'Modules 1–5' },
  { id: 'full',         label: 'Full',         price: '₹15,000', amount: 15000, description: 'All 6 Modules' },
];

// ── PayPal button wrapper (needs script loaded) ─────────────────
function PayPalSection({
  tier,
  name,
  email,
  onSuccess,
}: {
  tier: Tier;
  name: string;
  email: string;
  onSuccess: (orderId: string) => void;
}) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();
  const selected = TIERS.find(t => t.id === tier)!;

  if (isPending) {
    return (
      <div className="flex items-center justify-center gap-2 py-5 text-brand-muted text-sm">
        <Loader2 size={16} className="animate-spin" />
        Loading PayPal…
      </div>
    );
  }

  if (isRejected) {
    return (
      <p className="text-center text-sm text-red-500 py-4">
        PayPal failed to load. Check your client ID in environment variables.
      </p>
    );
  }

  return (
    <PayPalButtons
      style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay', height: 48 }}
      createOrder={(_data, actions) =>
        actions.order.create({
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: { currency_code: 'INR', value: selected.amount.toString() },
              description: `CEAL ${selected.label} Programme — ${name} <${email}>`,
            },
          ],
        })
      }
      onApprove={async (data, actions) => {
        if (actions.order) {
          const order = await actions.order.capture();
          onSuccess(order.id || data.orderID);
        }
      }}
      onError={err => console.error('[PayPal Error]', err)}
    />
  );
}

// ── Main component ──────────────────────────────────────────────
export default function LandingPage({ onLogin }: LandingPageProps) {
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [tier, setTier]   = useState<Tier>('professional');
  const [step, setStep]   = useState<'info' | 'tier' | 'payment'>('info');

  // Coupon state
  const [couponInput, setCouponInput]   = useState('');
  const [couponStatus, setCouponStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [couponError, setCouponError]   = useState('');

  const [isProcessing, setIsProcessing] = useState(false);

  // ── Coupon check ──────────────────────────────────────────────
  const checkCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponStatus('checking');
    setCouponError('');
    try {
      const res = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const { valid } = await res.json();
      setCouponStatus(valid ? 'valid' : 'invalid');
      if (!valid) setCouponError('Invalid coupon code. Please try again.');
    } catch {
      setCouponStatus('invalid');
      setCouponError('Could not verify coupon. Check your connection.');
    }
  };

  // ── Coupon access (free) ──────────────────────────────────────
  const handleCouponAccess = async () => {
    setIsProcessing(true);
    await logLoginEvent({
      name, email, tier: 'full',
      amount_inr: 0,
      coupon_used: couponInput.trim().toUpperCase(),
      access_type: 'coupon',
    });
    onLogin({ name, email, tier: 'full' });
  };

  // ── PayPal success ────────────────────────────────────────────
  const handlePayPalSuccess = async (orderId: string) => {
    setIsProcessing(true);
    const selected = TIERS.find(t => t.id === tier)!;
    await logLoginEvent({
      name, email, tier,
      amount_inr: selected.amount,
      paypal_order_id: orderId,
      access_type: 'paid',
    });
    onLogin({ name, email, tier });
  };

  const selectedTier = TIERS.find(t => t.id === tier)!;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-brand-navy text-white pt-24 pb-20 px-8 relative overflow-hidden flex-1 flex flex-col justify-center">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center w-full">

          {/* Left copy */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="z-10"
          >
            <span className="text-brand-gold font-bold tracking-[0.2em] text-xs uppercase mb-6 block">
              Enterprise AI Certification for Senior Leaders
            </span>
            <h1 className="text-5xl lg:text-7xl font-display font-bold leading-[0.95] mb-8">
              10 years of coding<br />
              won't save your career.<br />
              <span className="text-brand-gold italic">Governance will.</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed max-w-lg mb-10">
              Transform from a technical executor to a strategic AI Lead. Master EU AI Act compliance,
              RAG architecture, and agentic governance in a high-stakes simulation environment.
            </p>
            <div className="flex gap-8 items-center text-sm font-medium text-white/50">
              <div className="flex items-center gap-2">
                <span className="text-brand-gold text-2xl font-display font-bold">6</span> Modules
              </div>
              <div className="flex items-center gap-2">
                <span className="text-brand-gold text-2xl font-display font-bold">30</span> Levels
              </div>
              <div className="flex items-center gap-2">
                <span className="text-brand-gold text-2xl font-display font-bold">AI</span> Consultant
              </div>
            </div>

            {/* Powered by Google / Gemini badge */}
            <div className="mt-10 flex items-center gap-3">
              <span className="text-white/40 text-xs uppercase tracking-widest font-bold">Powered by</span>
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                {/* Google "G" logo SVG */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-white text-xs font-bold tracking-wide">Gemini AI</span>
              </div>
            </div>
          </motion.div>

          {/* Right — multi-step form */}
          <AnimatePresence mode="wait">

            {/* Step 1: Info */}
            {step === 'info' && (
              <motion.div
                key="info"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-3xl p-10 text-brand-charcoal shadow-2xl z-10"
              >
                <h2 className="text-2xl font-display font-bold mb-2">Secure your session</h2>
                <p className="text-brand-muted text-sm mb-8">Enterprise credentials required for verification.</p>

                <form
                  onSubmit={e => { e.preventDefault(); if (name && email) setStep('tier'); }}
                  className="space-y-6"
                >
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-brand-muted mb-2 block">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-brand-paper border-brand-charcoal/10 border rounded-lg px-4 py-3 focus:outline-none focus:border-brand-navy transition-colors"
                      placeholder="e.g. Alex Chen"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-brand-muted mb-2 block">Company Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-brand-paper border-brand-charcoal/10 border rounded-lg px-4 py-3 focus:outline-none focus:border-brand-navy transition-colors"
                      placeholder="alex@enterprise.ai"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-brand-navy text-white rounded-xl py-4 font-bold hover:bg-brand-charcoal transition-all shadow-lg"
                  >
                    Select Programme →
                  </button>
                </form>
              </motion.div>
            )}

            {/* Step 2: Tier */}
            {step === 'tier' && (
              <motion.div
                key="tier"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-3xl p-10 text-brand-charcoal shadow-2xl z-10"
              >
                <button onClick={() => setStep('info')} className="text-xs text-brand-muted mb-4 flex items-center gap-1 hover:text-brand-navy font-bold">← Back</button>
                <h2 className="text-2xl font-display font-bold mb-2">Choose Level</h2>
                <p className="text-brand-muted text-sm mb-8">Select the programme that matches your career roadmap.</p>

                <div className="space-y-3 mb-8">
                  {TIERS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTier(t.id)}
                      className={cn(
                        'w-full text-left p-4 rounded-2xl border-2 transition-all flex justify-between items-center group',
                        tier === t.id
                          ? 'border-brand-navy bg-brand-navy/5 shadow-sm'
                          : 'border-brand-charcoal/5 hover:border-brand-charcoal/15 bg-brand-paper/30'
                      )}
                    >
                      <div>
                        <div className="font-display font-bold text-brand-charcoal">{t.label}</div>
                        <div className="text-[10px] uppercase tracking-wider text-brand-muted font-bold">{t.description}</div>
                      </div>
                      <div className="text-lg font-display font-bold text-brand-navy group-hover:scale-110 transition-transform">{t.price}</div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep('payment')}
                  className="w-full bg-brand-navy text-white rounded-xl py-4 font-bold hover:bg-brand-charcoal transition-all shadow-lg"
                >
                  Confirm Selection
                </button>
              </motion.div>
            )}

            {/* Step 3: Payment */}
            {step === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-10 text-brand-charcoal shadow-2xl z-10"
              >
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 size={40} className="animate-spin text-brand-navy" />
                    <p className="font-bold text-brand-charcoal">Activating your session…</p>
                  </div>
                ) : (
                  <>
                    <button onClick={() => setStep('tier')} className="text-xs text-brand-muted mb-4 flex items-center gap-1 hover:text-brand-navy font-bold">← Back</button>
                    <h2 className="text-2xl font-display font-bold mb-1">Checkout</h2>
                    <p className="text-brand-muted text-sm mb-6">
                      <strong>{selectedTier.label}</strong> Programme — {selectedTier.price}
                    </p>

                    {/* Order summary */}
                    <div className="bg-brand-paper rounded-2xl p-5 mb-6 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-brand-muted">Programme</span>
                        <span className="font-bold">{selectedTier.label} — {selectedTier.description}</span>
                      </div>
                      <div className="border-t border-brand-charcoal/5" />
                      <div className="flex justify-between text-sm">
                        <span className="text-brand-muted">Amount</span>
                        <span className="font-bold text-brand-navy">{selectedTier.price}</span>
                      </div>
                    </div>

                    {/* ── Coupon section ──────────────────────── */}
                    <div className="mb-6">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-brand-muted mb-2 flex items-center gap-1">
                        <Tag size={10} /> Coupon Code
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={e => { setCouponInput(e.target.value); setCouponStatus('idle'); setCouponError(''); }}
                          onKeyDown={e => e.key === 'Enter' && checkCoupon()}
                          className={cn(
                            'flex-1 bg-brand-paper border rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors uppercase tracking-widest',
                            couponStatus === 'valid'   && 'border-green-500 bg-green-50',
                            couponStatus === 'invalid' && 'border-red-400',
                            couponStatus === 'idle'    && 'border-brand-charcoal/10 focus:border-brand-navy',
                          )}
                          placeholder="ENTER CODE"
                          disabled={couponStatus === 'valid'}
                        />
                        {couponStatus !== 'valid' && (
                          <button
                            onClick={checkCoupon}
                            disabled={couponStatus === 'checking' || !couponInput.trim()}
                            className="px-4 py-2.5 bg-brand-navy text-white rounded-lg text-sm font-bold hover:bg-brand-charcoal transition-all disabled:opacity-50"
                          >
                            {couponStatus === 'checking' ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                          </button>
                        )}
                      </div>

                      {couponStatus === 'valid' && (
                        <div className="mt-2 flex items-center gap-2 text-green-600 text-sm font-bold">
                          <CheckCircle size={14} />
                          100% discount applied — Full access unlocked
                        </div>
                      )}
                      {couponStatus === 'invalid' && couponError && (
                        <div className="mt-2 flex items-center gap-2 text-red-500 text-sm">
                          <XCircle size={14} />
                          {couponError}
                        </div>
                      )}
                    </div>

                    {/* ── CTA: coupon or PayPal ───────────────── */}
                    {couponStatus === 'valid' ? (
                      <button
                        onClick={handleCouponAccess}
                        className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-4 font-bold transition-all shadow-lg"
                      >
                        Access Full Programme →
                      </button>
                    ) : (
                      <PayPalSection
                        tier={tier}
                        name={name}
                        email={email}
                        onSuccess={handlePayPalSuccess}
                      />
                    )}

                    <p className="text-[10px] text-brand-muted mt-5 uppercase tracking-widest text-center font-bold">
                      Secure Checkout · LOVEUAD LTD · Company No. 16838046
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Background accents */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-brand-amber/10 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* ── Stats section ────────────────────────────────────── */}
      <section className="py-24 px-8 bg-white border-b border-brand-charcoal/10">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="text-center mb-16">
            <span className="text-brand-muted text-xs font-bold tracking-widest uppercase mb-4 block">The Problem</span>
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-brand-charcoal">You are stuck in "Pilot Purgatory"</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 w-full">
            {[
              { val: '82%', label: 'of leaders use GenAI weekly but cannot prove its ROI to the board' },
              { val: '60%', label: 'of CEOs believe boards are rushing AI transformation without understanding it' },
              { val: '0%',  label: 'of traditional developer training covers EU AI Act or Agentic Governance' },
            ].map(stat => (
              <div key={stat.val} className="p-8 border border-brand-charcoal/5 rounded-3xl hover:bg-brand-paper transition-colors group">
                <div className="text-5xl font-display font-bold text-brand-navy mb-4 group-hover:text-brand-amber transition-colors">{stat.val}</div>
                <p className="text-brand-muted leading-relaxed">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="bg-brand-paper py-12 px-8 border-t border-brand-charcoal/10 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="font-display font-bold text-lg text-brand-navy">CEAL</div>
          <p className="text-brand-muted text-xs max-w-sm">
            LOVEUAD LTD · Company No. 16838046 · Leeds, UK<br />
            Enterprise AI Certification Platform · © 2026
          </p>
          <div className="flex items-center gap-2 mt-2 opacity-50">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">Powered by Gemini AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
