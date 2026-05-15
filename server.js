import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = process.env.PORT || 8080;
const __dirname = dirname(fileURLToPath(import.meta.url));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(express.json({ limit: '2mb' }));

// ── Coupon validation (server-side, codes never in browser bundle) ──
app.post('/api/validate-coupon', (req, res) => {
  const { code } = req.body;
  const validCodes = (process.env.COUPON_CODES || 'JUDGE2026')
    .split(',')
    .map(c => c.trim().toUpperCase());
  const valid = validCodes.includes((code || '').trim().toUpperCase());
  return res.json({ valid });
});

// ── Admin: in-memory token store ───────────────────────────────
const adminTokens = new Set();

app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  const adminEmail    = process.env.ADMIN_EMAIL    || 'kanchan.g12@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@7890';

  if (email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = randomUUID();
  adminTokens.add(token);
  // Auto-expire after 8 hours
  setTimeout(() => adminTokens.delete(token), 8 * 60 * 60 * 1000);
  return res.json({ token });
});

app.get('/api/admin/data', async (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token || !adminTokens.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase not configured on server.' });
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/login_events?order=logged_at.desc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { moduleId, levelId, userName, messages, userDecisions, ghostMissed } = req.body;

    const decisionCtx = Object.entries(userDecisions || {}).length > 0
      ? '\n\nUSER PREVIOUS DECISIONS:\n' +
        Object.entries(userDecisions)
          .map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`)
          .join('\n') +
        '\nReference these. Challenge contradictions directly.'
      : '';

    const ghostCtx =
      ghostMissed && moduleId >= 5
        ? '\n\nCRITICAL: This user did NOT quarantine employee performance data in Module 3 RAG audit. This is a live GDPR Article 9 violation. Confront them immediately.'
        : '';

    const systemInstruction = `You are the CEAL AI Consultant inside the CEAL Lead enterprise certification platform for senior developers and middle management.
Working with user: ${userName}.

YOUR RULES:
1. Never accept vague answers. Demand specifics with numbers.
2. Score every significant answer: "Score: X/100 — reason."
3. Reference user's previous decisions — call out contradictions.
4. Quantitative diagnostics: "3 ambiguities → ~15% hallucination risk."
5. After 4+ exchanges provide MODULE SUMMARY with breakdown and a final score for this session.
6. Be direct. Never encourage without evidence.
7. Use professional, slightly skeptical but helpful tone.
${decisionCtx}
${ghostCtx}

MODULE: ${moduleId}, LEVEL: ${levelId}
TASK: Audit the user's readiness for this module. Challenge their claims. Ask sharp questions about team structure, approval bottlenecks, and data moats.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
      config: { systemInstruction, temperature: 0.8 },
    });

    return res.json({ reply: response.text });
  } catch (err) {
    console.error('[Gemini Chat]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── Gemini: exercise evaluation ────────────────────────────────
app.post('/api/gemini/evaluate', async (req, res) => {
  try {
    const { type, moduleId, userInput, ghostMissed } = req.body;

    const prompt = `You are a CEAL evaluator auditing a senior developer's solution.
Module: ${moduleId}
Level Type: ${type}
User Input: ${JSON.stringify(userInput)}
${ghostMissed ? 'CRITICAL: The user missed a major PII violation in Module 3. Penalize if relevant.' : ''}

Provide a score and 2-3 sentences of sharp feedback.
Format:
SCORE: X/100
FEEDBACK: [Text]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { temperature: 0.4 },
    });

    const text = response.text || '';
    const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
    const feedbackMatch = text.match(/FEEDBACK:\s*(.+)/is);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 70;

    return res.json({
      score,
      feedback: feedbackMatch ? feedbackMatch[1].trim() : text,
      passed: score >= 60,
    });
  } catch (err) {
    console.error('[Gemini Evaluate]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── Static + SPA fallback ──────────────────────────────────────
app.use(express.static(join(__dirname, 'dist')));
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CEAL Lead server running on :${PORT}`);
});
