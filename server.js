import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID, scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { getLevelPrompt } from './levelPrompts.js';

const app = express();
const PORT = process.env.PORT || 8080;
const __dirname = dirname(fileURLToPath(import.meta.url));
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(express.json({ limit: '2mb' }));

// ── Helpers ────────────────────────────────────────────────────
function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const hashBuf  = Buffer.from(hash, 'hex');
  const inputBuf = scryptSync(password, salt, 64);
  return timingSafeEqual(hashBuf, inputBuf);
}

async function supabaseFetch(path, options = {}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) return null;
  return res.json();
}

// ── Public config ──────────────────────────────────────────────
app.get('/api/config', (_req, res) => {
  res.json({ paypalClientId: process.env.PAYPAL_CLIENT_ID || '' });
});

// ── Auth: Register ─────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, tier, access_type, amount_inr, paypal_order_id, coupon_used } = req.body;
  if (!name || !email || !password || !tier) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  // Check if user already exists
  const existing = await supabaseFetch(`users?email=eq.${encodeURIComponent(email)}&select=id`);
  if (existing && existing.length > 0) {
    return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
  }
  const password_hash = hashPassword(password);
  const user = await supabaseFetch('users', {
    method: 'POST',
    body: JSON.stringify({ name, email, password_hash, tier }),
  });
  // Log the event
  await supabaseFetch('login_events', {
    method: 'POST',
    body: JSON.stringify({ name, email, tier, amount_inr, paypal_order_id, coupon_used, access_type }),
  });
  const token = randomUUID();
  return res.json({ token, user: { name, email, tier } });
});

// ── Auth: Login ────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  const users = await supabaseFetch(`users?email=eq.${encodeURIComponent(email)}&select=name,email,tier,password_hash`);
  if (!users || users.length === 0) {
    return res.status(401).json({ error: 'No account found with this email.' });
  }
  const user = users[0];
  if (!verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }
  const token = randomUUID();
  return res.json({ token, user: { name: user.name, email: user.email, tier: user.tier } });
});

// ── Log event ─────────────────────────────────────────────────
app.post('/api/log-event', async (req, res) => {
  await supabaseFetch('login_events', { method: 'POST', body: JSON.stringify(req.body) });
  return res.json({ ok: true });
});

// ── Coupon validation ──────────────────────────────────────────
app.post('/api/validate-coupon', (req, res) => {
  const { code } = req.body;
  const validCodes = (process.env.COUPON_CODES || 'JUDGE2026').split(',').map(c => c.trim().toUpperCase());
  return res.json({ valid: validCodes.includes((code || '').trim().toUpperCase()) });
});

// ── Admin ──────────────────────────────────────────────────────
const adminTokens = new Set();

app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (email !== (process.env.ADMIN_EMAIL || 'kanchan.g12@gmail.com') ||
      password !== (process.env.ADMIN_PASSWORD || 'Admin@7890')) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = randomUUID();
  adminTokens.add(token);
  setTimeout(() => adminTokens.delete(token), 8 * 60 * 60 * 1000);
  return res.json({ token });
});

app.get('/api/admin/data', async (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token || !adminTokens.has(token)) return res.status(401).json({ error: 'Unauthorized' });
  const data = await supabaseFetch('login_events?order=logged_at.desc');
  return res.json(data || []);
});

// ── Gemini chat ────────────────────────────────────────────────
app.all('/api/gemini/chat', async (req, res) => {
  req.body = req.body || req.query;
  try {
    const { moduleId, levelId, userName, messages, userDecisions, ghostMissed } = req.body;
    const decisionCtx = Object.entries(userDecisions || {}).length > 0
      ? '\n\nUSER PREVIOUS DECISIONS:\n' + Object.entries(userDecisions).map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`).join('\n') + '\nChallenge contradictions directly.' : '';
    const ghostCtx = ghostMissed && moduleId >= 5
      ? '\n\nCRITICAL: User missed GDPR Article 9 violation in Module 3. Confront immediately.' : '';
    const specificPrompt = getLevelPrompt(moduleId, levelId);
    const systemInstruction = specificPrompt
      ? `${specificPrompt}\n\nUSER: ${userName}\n${decisionCtx}${ghostCtx}\n\nAFTER 5 EXCHANGES: Give a MODULE SUMMARY with a final score out of 100 and 3 specific actions the user must take.`
      : `You are the CEAL AI Consultant. User: ${userName}.
1. Never accept vague answers. Demand specifics with numbers.
2. Score every answer: "Score: X/100 — reason."
3. Reference previous decisions — call out contradictions.
4. After 4+ exchanges give MODULE SUMMARY with final score.
5. Be direct. Never encourage without evidence.
${decisionCtx}${ghostCtx}
MODULE: ${moduleId}, LEVEL: ${levelId}`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: messages.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
      config: { systemInstruction, temperature: 0.8 },
    });
    return res.json({ reply: response.text });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

// ── Gemini evaluate ────────────────────────────────────────────
app.all('/api/gemini/evaluate', async (req, res) => {
  req.body = req.body || req.query;
  try {
    const { type, moduleId, userInput, ghostMissed } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: `CEAL evaluator. Module: ${moduleId}, Level: ${type}\nInput: ${JSON.stringify(userInput)}\n${ghostMissed ? 'Penalize PII violation if relevant.' : ''}\nFormat:\nSCORE: X/100\nFEEDBACK: [Text]`,
      config: { temperature: 0.4 },
    });
    const text = response.text || '';
    const score = parseInt((text.match(/SCORE:\s*(\d+)/i) || [])[1] || '70');
    const feedback = (text.match(/FEEDBACK:\s*(.+)/is) || [])[1]?.trim() || text;
    return res.json({ score, feedback, passed: score >= 60 });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

// ── Static + SPA ───────────────────────────────────────────────
app.use(express.static(join(__dirname, 'dist')));
app.get('*', (_req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')));

app.listen(PORT, () => console.log(`CEAL Lead running on :${PORT}`));
