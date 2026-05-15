import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Tier } from '../types.ts';
import { cn } from '../utils/cn.ts';

interface LandingPageProps {
  onLogin: (user: User) => void;
}

const TIERS: { id: Tier; label: string; price: string; description: string; color: string }[] = [
  { id: 'foundation', label: 'Foundation', price: '₹8,000', description: 'Modules 1–3', color: 'bg-brand-navy' },
  { id: 'professional', label: 'Professional', price: '₹10,000', description: 'Modules 1–5', color: 'bg-brand-amber' },
  { id: 'full', label: 'Full', price: '₹15,000', description: 'All 6 Modules', color: 'bg-[#5B2D8E]' },
];

export default function LandingPage({ onLogin }: LandingPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState<Tier>('professional');
  const [step, setStep] = useState<'info' | 'tier' | 'payment'>('info');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setStep('tier');
  };

  const handleProcessPayment = () => {
    setIsProcessing(true);
    // Simulate payment gateway delay
    setTimeout(() => {
      setIsProcessing(false);
      onLogin({ name, email, tier });
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-brand-navy text-white pt-24 pb-20 px-8 relative overflow-hidden flex-1 flex flex-col justify-center">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center w-full">
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
              Transform from a technical executor to a strategic AI Lead. Master EU AI Act compliance, RAG architecture, and agentic governance in a high-stakes simulation environment.
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
          </motion.div>

          <AnimatePresence mode="wait">
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
                
                <form onSubmit={handleStartPayment} className="space-y-6">
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
                    className="w-full bg-brand-navy text-white rounded-xl py-4 font-bold hover:bg-brand-charcoal transition-all shadow-lg hover:shadow-brand-navy/20"
                  >
                    Select Programme →
                  </button>
                </form>
              </motion.div>
            )}

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
                        "w-full text-left p-4 rounded-2xl border-2 transition-all flex justify-between items-center group",
                        tier === t.id 
                          ? "border-brand-navy bg-brand-navy/5 shadow-sm" 
                          : "border-brand-charcoal/5 hover:border-brand-charcoal/15 bg-brand-paper/30"
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

            {step === 'payment' && (
              <motion.div 
                key="payment"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-10 text-brand-charcoal shadow-2xl z-10 text-center"
              >
                <div className="w-16 h-16 bg-brand-navy/10 text-brand-navy rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                </div>
                <h2 className="text-2xl font-display font-bold mb-2">Checkout</h2>
                <p className="text-brand-muted text-sm mb-8">Authorizing secure transaction for <strong>{TIERS.find(t => t.id === tier)?.label}</strong></p>
                
                <div className="bg-brand-paper rounded-2xl p-6 mb-8 text-left space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-muted">Amount Due</span>
                    <span className="font-bold">{TIERS.find(t => t.id === tier)?.price}</span>
                  </div>
                  <div className="technical-line" />
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-muted">Payment Method</span>
                    <span className="font-bold">Enterprise Wallet</span>
                  </div>
                </div>

                <button 
                  onClick={handleProcessPayment}
                  disabled={isProcessing}
                  className="w-full bg-brand-navy text-white rounded-xl py-4 font-bold hover:bg-brand-charcoal transition-all shadow-lg flex items-center justify-center gap-3"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Processing Securely...
                    </>
                  ) : `Pay ${TIERS.find(t => t.id === tier)?.price} & Start Session`}
                </button>
                <p className="text-[10px] text-brand-muted mt-4 uppercase tracking-widest font-bold">Encrypted via RSA-4096 • Loveuad Ltd Certification</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Backdrop accents */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-brand-amber/10 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Stats / Proof Section */}
      <section className="py-24 px-8 bg-white border-b border-brand-charcoal/10">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="text-center mb-16">
            <span className="text-brand-muted text-xs font-bold tracking-widest uppercase mb-4 block">The Problem</span>
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-brand-charcoal">You are stuck in "Pilot Purgatory"</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 w-full">
            {[
              { val: "82%", label: "of leaders use GenAI weekly but cannot prove its ROI to the board" },
              { val: "60%", label: "of CEOs believe boards are rushing AI transformation without understanding it" },
              { val: "0%", label: "of traditional developer training covers EU AI Act or Agentic Governance" }
            ].map(stat => (
              <div key={stat.val} className="p-8 border border-brand-charcoal/5 rounded-3xl hover:bg-brand-paper transition-colors group">
                <div className="text-5xl font-display font-bold text-brand-navy mb-4 group-hover:text-brand-amber transition-colors">{stat.val}</div>
                <p className="text-brand-muted leading-relaxed">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-paper py-12 px-8 border-t border-brand-charcoal/10 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="font-display font-bold text-lg text-brand-navy">CEAL</div>
          <p className="text-brand-muted text-xs max-w-sm">
            LOVEUAD LTD · Company No. 16838046 · London, UK<br />
            Enterprise AI Certification Platform · © 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
