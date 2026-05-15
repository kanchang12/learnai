import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID, scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import Groq from 'groq-sdk';
import { getLevelPrompt } from './levelPrompts.js';

const app = express();
const PORT = process.env.PORT || 8080;
const __dirname = dirname(fileURLToPath(import.meta.url));
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '4mb' }));

function hashPassword(p) {
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + scryptSync(p, salt, 64).toString('hex');
}
function verifyPassword(p, stored) {
  const [salt, hash] = stored.split(':');
  return timingSafeEqual(Buffer.from(hash, 'hex'), scryptSync(p, salt, 64));
}
async function supabaseFetch(path, options = {}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(options.headers || {}) },
  });
  if (!res.ok) return null;
  return res.json();
}

app.get('/api/config', (_req, res) => {
  res.json({ paypalClientId: process.env.PAYPAL_CLIENT_ID || '' });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, tier, access_type, amount_inr, paypal_order_id, coupon_used } = req.body;
  if (!name || !email || !password || !tier) return res.status(400).json({ error: 'Missing required fields.' });
  const existing = await supabaseFetch(`users?email=eq.${encodeURIComponent(email)}&select=id`);
  if (existing && existing.length > 0) return res.status(409).json({ error: 'Account already exists. Please log in.' });
  await supabaseFetch('users', { method: 'POST', body: JSON.stringify({ name, email, password_hash: hashPassword(password), tier }) });
  await supabaseFetch('login_events', { method: 'POST', body: JSON.stringify({ name, email, tier, amount_inr, paypal_order_id, coupon_used, access_type }) });
  return res.json({ token: randomUUID(), user: { name, email, tier } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  const users = await supabaseFetch(`users?email=eq.${encodeURIComponent(email)}&select=name,email,tier,password_hash`);
  if (!users || users.length === 0) return res.status(401).json({ error: 'No account found with this email.' });
  if (!verifyPassword(password, users[0].password_hash)) return res.status(401).json({ error: 'Incorrect password.' });
  return res.json({ token: randomUUID(), user: { name: users[0].name, email: users[0].email, tier: users[0].tier } });
});

app.post('/api/validate-coupon', (req, res) => {
  const valid = (process.env.COUPON_CODES || 'JUDGE2026').split(',').map(c => c.trim().toUpperCase()).includes((req.body.code || '').trim().toUpperCase());
  return res.json({ valid });
});

app.post('/api/log-event', async (req, res) => {
  await supabaseFetch('login_events', { method: 'POST', body: JSON.stringify(req.body) });
  return res.json({ ok: true });
});

const adminTokens = new Set();
app.post('/api/admin/login', (req, res) => {
  if (req.body.email !== (process.env.ADMIN_EMAIL || 'kanchan.g12@gmail.com') ||
      req.body.password !== (process.env.ADMIN_PASSWORD || 'Admin@7890'))
    return res.status(401).json({ error: 'Invalid credentials' });
  const token = randomUUID();
  adminTokens.add(token);
  setTimeout(() => adminTokens.delete(token), 8 * 60 * 60 * 1000);
  return res.json({ token });
});
app.get('/api/admin/data', async (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token || !adminTokens.has(token)) return res.status(401).json({ error: 'Unauthorized' });
  return res.json(await supabaseFetch('login_events?order=logged_at.desc') || []);
});

// ── Groq chat ──────────────────────────────────────────────────
const handleChat = async (req, res) => {
  const body = req.method === 'GET' ? req.query : req.body;
  let { moduleId, levelId, userName, messages, userDecisions, ghostMissed } = body;
  if (typeof messages === 'string') { try { messages = JSON.parse(messages); } catch { messages = []; } }
  if (typeof userDecisions === 'string') { try { userDecisions = JSON.parse(userDecisions); } catch { userDecisions = {}; } }
  if (!Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'messages array required' });
  try {
    const decisionCtx = Object.keys(userDecisions || {}).length
      ? '\n\nUSER PREVIOUS DECISIONS:\n' + Object.entries(userDecisions).map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`).join('\n') + '\nChallenge contradictions.'
      : '';
    const ghostCtx = ghostMissed && moduleId >= 5
      ? '\n\nCRITICAL: User missed GDPR Article 9 violation in Module 3. Confront immediately.' : '';
    const specific = getLevelPrompt(moduleId, levelId);
    const codeInstruction = `

CODE CHALLENGES — MANDATORY:
At exchange 3, present a real code snippet (10-20 lines) that is directly relevant to this module/level scenario. The code must have 2-3 deliberate issues (security flaw, bad architecture, missing error handling, data leak, wrong pattern etc). Ask the user to:
1. Identify every problem in the code
2. Rewrite the specific broken parts
3. Explain the real-world business or security impact of each issue
After they respond to the code challenge, give them a "Code Review Score: X/100" and explain what they missed.
If the user avoids the code challenge or gives vague answers, refuse to continue until they engage with it specifically.`;

    const systemInstruction = specific
      ? `${specific}\n\nUSER: ${userName}\n${decisionCtx}${ghostCtx}${codeInstruction}\n\nAfter every 5 exchanges give a running score. After 20 exchanges give FINAL MODULE SCORE out of 100 with 3 mandatory actions.`
      : `You are the CEAL AI Consultant working with ${userName}. Be direct, challenge every vague answer, score every response 0-100. MODULE: ${moduleId}, LEVEL: ${levelId}${decisionCtx}${ghostCtx}${codeInstruction}`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemInstruction },
        ...messages.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content })),
      ],
      temperature: 0.8,
      max_tokens: 2048,
    });

    return res.json({ reply: response.choices[0]?.message?.content || '' });
  } catch (err) {
    console.error('[Groq Chat Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
};
app.get('/api/gemini/chat', handleChat);
app.post('/api/gemini/chat', handleChat);

// ── Groq evaluate ──────────────────────────────────────────────
const handleEvaluate = async (req, res) => {
  const body = req.method === 'GET' ? req.query : req.body;
  let { type, moduleId, userInput, ghostMissed } = body;
  if (typeof userInput === 'string') { try { userInput = JSON.parse(userInput); } catch { userInput = {}; } }
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: `CEAL evaluator. Module: ${moduleId}, Level: ${type}\nInput: ${JSON.stringify(userInput)}\n${ghostMissed ? 'Penalise PII violation if relevant.' : ''}\nFormat:\nSCORE: X/100\nFEEDBACK: [2-3 sentences]` }],
      temperature: 0.4,
      max_tokens: 512,
    });
    const text = response.choices[0]?.message?.content || '';
    const score = parseInt((text.match(/SCORE:\s*(\d+)/i) || [])[1] || '70');
    const feedback = (text.match(/FEEDBACK:\s*(.+)/is) || [])[1]?.trim() || text;
    return res.json({ score, feedback, passed: score >= 60 });
  } catch (err) {
    console.error('[Groq Evaluate Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
};
app.get('/api/gemini/evaluate', handleEvaluate);
app.post('/api/gemini/evaluate', handleEvaluate);

app.use(express.static(join(__dirname, 'dist')));
app.get('*', (_req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')));

app.listen(PORT, () => console.log(`CEAL Lead running on :${PORT}`));
