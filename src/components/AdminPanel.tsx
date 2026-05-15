import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Users, DollarSign, Tag, TrendingUp, RefreshCw, Download, Shield } from 'lucide-react';

interface LoginEvent {
  id: string;
  name: string;
  email: string;
  tier: string;
  amount_inr: number | null;
  paypal_order_id: string | null;
  coupon_used: string | null;
  access_type: 'paid' | 'coupon';
  logged_at: string;
}

const TIER_COLORS: Record<string, string> = {
  foundation:   'bg-blue-100 text-blue-800',
  professional: 'bg-amber-100 text-amber-800',
  full:         'bg-purple-100 text-purple-800',
};

// ── Helpers ─────────────────────────────────────────────────────
function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Admin Login ──────────────────────────────────────────────────
function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const { error: msg } = await res.json();
        setError(msg || 'Invalid credentials');
        return;
      }
      const { token } = await res.json();
      sessionStorage.setItem('ceal_admin_token', token);
      onLogin(token);
    } catch {
      setError('Server unreachable. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-navy flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-10 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand-navy rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-brand-charcoal">CEAL Admin</h1>
            <p className="text-brand-muted text-xs">Management Dashboard</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-brand-muted mb-2 block">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-brand-paper border border-brand-charcoal/10 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-navy transition-colors"
              placeholder="admin@example.com"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-brand-muted mb-2 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-brand-paper border border-brand-charcoal/10 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-navy transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 rounded-lg px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-navy text-white rounded-xl py-4 font-bold hover:bg-brand-charcoal transition-all shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><RefreshCw size={16} className="animate-spin" /> Verifying…</>
            ) : 'Sign In →'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ── Admin Dashboard ──────────────────────────────────────────────
function AdminDashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [events, setEvents]   = useState<LoginEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState<'all' | 'paid' | 'coupon'>('all');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { onLogout(); return; }
      if (!res.ok) throw new Error('Failed to load data');
      const data = await res.json();
      setEvents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Stats ──────────────────────────────────────────────────────
  const totalRevenue  = events.filter(e => e.access_type === 'paid').reduce((s, e) => s + (e.amount_inr || 0), 0);
  const paidCount     = events.filter(e => e.access_type === 'paid').length;
  const couponCount   = events.filter(e => e.access_type === 'coupon').length;
  const tierBreakdown = ['foundation', 'professional', 'full'].map(t => ({
    tier: t,
    count: events.filter(e => e.tier === t).length,
  }));

  // ── Filtered rows ──────────────────────────────────────────────
  const filtered = filter === 'all' ? events : events.filter(e => e.access_type === filter);

  // ── CSV export ─────────────────────────────────────────────────
  const exportCSV = () => {
    const header = 'Name,Email,Tier,Access Type,Amount (INR),PayPal Order,Coupon,Date\n';
    const rows = events.map(e =>
      [e.name, e.email, e.tier, e.access_type, e.amount_inr ?? 0,
       e.paypal_order_id ?? '', e.coupon_used ?? '', formatDate(e.logged_at)]
      .map(v => `"${v}"`).join(',')
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `ceal-logins-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-brand-paper">
      {/* Header */}
      <header className="bg-white border-b border-brand-charcoal/10 px-6 h-16 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-navy rounded-lg flex items-center justify-center">
            <Shield size={14} className="text-white" />
          </div>
          <span className="font-display font-bold text-brand-navy">CEAL Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 text-brand-muted hover:text-brand-charcoal hover:bg-brand-charcoal/5 rounded-full transition-all"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-brand-navy bg-brand-navy/5 hover:bg-brand-navy/10 rounded-lg transition-all"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={onLogout}
            className="p-2 text-brand-muted hover:text-brand-charcoal hover:bg-brand-charcoal/5 rounded-full transition-all"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8 space-y-8">

        {/* ── Stat cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users',    value: events.length.toString(),   icon: Users,       color: 'text-blue-600',   bg: 'bg-blue-50' },
            { label: 'Total Revenue',  value: formatINR(totalRevenue),    icon: DollarSign,  color: 'text-green-600',  bg: 'bg-green-50' },
            { label: 'Paid Signups',   value: paidCount.toString(),       icon: TrendingUp,  color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Coupon Access',  value: couponCount.toString(),     icon: Tag,         color: 'text-amber-600',  bg: 'bg-amber-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl p-6 border border-brand-charcoal/5 shadow-sm">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon size={18} className={color} />
              </div>
              <div className="text-2xl font-display font-bold text-brand-charcoal">{value}</div>
              <div className="text-xs text-brand-muted font-bold uppercase tracking-wider mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Tier breakdown ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 border border-brand-charcoal/5 shadow-sm">
          <h2 className="font-display font-bold text-brand-charcoal mb-4">Tier Breakdown</h2>
          <div className="flex gap-6">
            {tierBreakdown.map(({ tier, count }) => (
              <div key={tier} className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${TIER_COLORS[tier]}`}>{tier}</span>
                <span className="font-bold text-brand-charcoal">{count} users</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Login events table ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-brand-charcoal/5 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-charcoal/5 flex items-center justify-between">
            <h2 className="font-display font-bold text-brand-charcoal">Login Events</h2>
            <div className="flex gap-2">
              {(['all', 'paid', 'coupon'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    filter === f
                      ? 'bg-brand-navy text-white'
                      : 'text-brand-muted hover:text-brand-charcoal hover:bg-brand-charcoal/5'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-brand-muted gap-2">
              <RefreshCw size={16} className="animate-spin" /> Loading…
            </div>
          ) : error ? (
            <div className="text-center py-16 text-red-500 text-sm">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-brand-muted text-sm">No records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand-paper border-b border-brand-charcoal/5">
                    {['Name', 'Email', 'Tier', 'Access', 'Amount', 'PayPal / Coupon', 'Date'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-[10px] uppercase tracking-wider text-brand-muted font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-charcoal/5">
                  {filtered.map(event => (
                    <tr key={event.id} className="hover:bg-brand-paper/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-brand-charcoal">{event.name}</td>
                      <td className="px-6 py-4 text-brand-muted">{event.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase capitalize ${TIER_COLORS[event.tier] || 'bg-gray-100 text-gray-600'}`}>
                          {event.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          event.access_type === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {event.access_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-brand-charcoal">
                        {event.amount_inr ? formatINR(event.amount_inr) : '—'}
                      </td>
                      <td className="px-6 py-4 text-brand-muted font-mono text-xs">
                        {event.paypal_order_id
                          ? event.paypal_order_id.slice(0, 12) + '…'
                          : event.coupon_used || '—'}
                      </td>
                      <td className="px-6 py-4 text-brand-muted text-xs whitespace-nowrap">
                        {formatDate(event.logged_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────
export default function AdminPanel() {
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem('ceal_admin_token')
  );

  const handleLogout = () => {
    sessionStorage.removeItem('ceal_admin_token');
    setToken(null);
  };

  return (
    <AnimatePresence mode="wait">
      {token ? (
        <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AdminDashboard token={token} onLogout={handleLogout} />
        </motion.div>
      ) : (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AdminLogin onLogin={setToken} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
