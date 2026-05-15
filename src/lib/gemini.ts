/**
 * Gemini API calls are proxied through the server (/api/gemini/*)
 * so the GEMINI_API_KEY is never exposed in the browser bundle.
 */

export async function getAgentReply(
  moduleId: number,
  levelId: number,
  userName: string,
  messages: { role: 'user' | 'model'; content: string }[],
  userDecisions: Record<string, any>,
  ghostMissed: boolean
): Promise<string> {
  const res = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ moduleId, levelId, userName, messages, userDecisions, ghostMissed }),
  });
  if (!res.ok) throw new Error(`Chat API error: ${res.status}`);
  const { reply } = await res.json();
  return reply as string;
}

export async function evaluateExercise(
  type: 'design' | 'comply' | 'defend' | 'future',
  moduleId: number,
  userInput: any,
  ghostMissed: boolean
): Promise<{ score: number; feedback: string; passed: boolean }> {
  const res = await fetch('/api/gemini/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, moduleId, userInput, ghostMissed }),
  });
  if (!res.ok) throw new Error(`Evaluate API error: ${res.status}`);
  return res.json();
}
