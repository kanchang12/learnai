import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getAgentReply(
  moduleId: number,
  levelId: number,
  userName: string,
  messages: { role: 'user' | 'model'; content: string }[],
  userDecisions: Record<string, any>,
  ghostMissed: boolean
) {
  const decisionCtx = Object.entries(userDecisions).length > 0
    ? "\n\nUSER PREVIOUS DECISIONS:\n" + Object.entries(userDecisions).map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`).join("\n") + "\nReference these. Challenge contradictions directly."
    : "";

  const ghostCtx = (ghostMissed && moduleId >= 5)
    ? "\n\nCRITICAL: This user did NOT quarantine employee performance data in Module 3 RAG audit. This is a live GDPR Article 9 violation. Confront them about this immediately."
    : "";

  const systemInstruction = `You are the CEAL AI Consultant inside the AI with AI enterprise certification platform for senior devs and middle management.
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
    model: "gemini-3-flash-preview",
    contents: messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    })),
    config: {
      systemInstruction,
      temperature: 0.8,
    }
  });

  return response.text;
}

export async function evaluateExercise(
  type: 'design' | 'comply' | 'defend' | 'future',
  moduleId: number,
  userInput: any,
  ghostMissed: boolean
) {
  const prompt = `You are a CEAL evaluator auditing a senior developer's solution.
Module: ${moduleId}
Level Type: ${type}
User Input: ${JSON.stringify(userInput)}
${ghostMissed ? "CRITICAL: The user missed a major PII violation in Module 3. penalize if relevant to this task." : ""}

Provide a score and 2-3 sentences of sharp feedback.
Format:
SCORE: X/100
FEEDBACK: [Text]`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      temperature: 0.4,
    }
  });

  const text = response.text || "";
  const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
  const feedbackMatch = text.match(/FEEDBACK:\s*(.+)/is);

  return {
    score: scoreMatch ? parseInt(scoreMatch[1]) : 70,
    feedback: feedbackMatch ? feedbackMatch[1].trim() : text,
    passed: (scoreMatch ? parseInt(scoreMatch[1]) : 70) >= 60
  };
}
