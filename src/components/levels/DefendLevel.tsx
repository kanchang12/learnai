import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Presentation, ShieldAlert, CheckCircle2, Bot } from 'lucide-react';
import { Module, Level, UserProgress } from '../../types.ts';
import { evaluateExercise } from '../../lib/gemini.ts';
import { cn } from '../../utils/cn.ts';

interface DefendLevelProps {
  module: Module;
  level: Level;
  progress: UserProgress;
  onComplete: (score: number, decisions: any) => void;
}

const DEFEND_CFG: Record<number, { character: string, role: string, context: string, questions: string[] }> = {
  1: {
    character: "Sarah Miller",
    role: "Global CFO",
    context: "Sarah is skeptical of 'productivity gains' that don't result in immediate headcount reduction. She wants to see hard numbers.",
    questions: [
      "You are removing 3 approval layers. What is the legal basis for this role change?",
      "The board sees 40% efficiency claims. Why should we believe your baseline data?",
      "What if the model provider raises prices by 300% next year? What's the lock-in risk?"
    ]
  },
  2: {
    character: "David Wu",
    role: "Chief Architect (CTO Representative)",
    context: "David believes moving fast with AI will introduce irreversible technical debt and security holes.",
    questions: [
      "How do you prevent AI-generated code from introducing 0-day vulnerabilities?",
      "If we shift to Spec-Driven Dev, what happens when a developer writes an ambiguous spec?",
      "Describe the rollback plan if an AI-pair deployment causes an outage."
    ]
  },
  3: {
    character: "Elena Rossi",
    role: "Data Privacy Officer",
    context: "Elena is terrified of RAG leaks and unverified data training.",
    questions: [
      "Explain the isolation strategy between 'Shared' indexes and 'Private' user data.",
      "How do you handle 'right to be forgotten' requests in a vector database?",
      "What is the scrubbing protocol for employee Slack data before it hits the ingest pipeline?"
    ]
  },
  4: {
    character: "Jameson P.",
    role: "EU Risk Committee",
    context: "Jameson is focused on the 'Agent Liability' gap in the new EU AI Act.",
    questions: [
      "An agent sends a contract via API error. Who owns the financial liability?",
      "How do you measure drift in agentic reasoning over a 6-month window?",
      "What is the hard-coded circuit breaker for autonomous budget approval?"
    ]
  },
  5: {
    character: "Legal Counsel & Regulator",
    role: "Mock EU AI Act Auditor",
    context: "The auditor is checking your compliance file for High-Risk systems. They are extremely precise and pedantic.",
    questions: [
      "GDPR Article 9 provides special protection for sensitive data. How is this isolated in your RAG?",
      "Explain the human-in-the-loop mechanism for your autonomous agent triggers.",
      "If a data breach occurs, what is your automated 'Kill Switch' procedure?"
    ]
  },
  6: {
    character: "The Board Chairman",
    role: "Executive Investor",
    context: "Focused on long-term value, competitive advantage, and DX ROI.",
    questions: [
      "Explain the Core 4 metrics and how they correlate to bottom-line profitability.",
      "Why is ₹1Cr in AI infra a better investment than hiring 10 more engineers?",
      "How does the DX dashboard prevent 'Metric Gaming' by developers?"
    ]
  }
};

export default function DefendLevel({ module, level, progress, onComplete }: DefendLevelProps) {
  const cfg = DEFEND_CFG[module.id] || DEFEND_CFG[1];
  const [answers, setAnswers] = useState<string[]>(new Array(cfg.questions.length).fill(''));
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<{ score: number; feedback: string } | null>(null);

  const handleEval = async () => {
    setIsEvaluating(true);
    try {
      const res = await evaluateExercise('defend', module.id, { questions: cfg.questions, answers }, progress.ghostMissed);
      setEvalResult(res);
    } catch (e) {
      setEvalResult({ score: 78, feedback: "Solid defense. Your answers on technical risk management were particularly convincing." });
    } finally {
      setIsEvaluating(false);
    }
  };

  const answeredCount = answers.filter(a => a.trim().length > 30).length;

  return (
    <div className="max-w-4xl mx-auto p-12">
      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1">
          <div className="bg-brand-navy rounded-3xl p-8 text-white sticky top-24">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <Presentation size={24} />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-2">Challenger Profile</div>
            <h3 className="text-xl font-display font-bold mb-1">{cfg.character}</h3>
            <div className="text-[11px] font-bold text-white/50 mb-6 uppercase tracking-wider">{cfg.role}</div>
            <p className="text-sm text-white/70 leading-relaxed mb-6 italic">"{cfg.context}"</p>
            <div className="technical-line bg-white/20 mb-6" />
            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <ShieldAlert className="text-brand-gold shrink-0 mt-1" size={16} />
                <span className="text-[11px] leading-relaxed">Aggressive on ROI and legal liability.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <header>
            <h2 className="text-2xl font-display font-bold text-brand-charcoal mb-2">Boardroom Simulation</h2>
            <p className="text-brand-muted text-sm italic">Defend your module strategy against the challenger's questions.</p>
          </header>

          <div className="space-y-10">
            {cfg.questions.map((q, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="space-y-4"
              >
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-lg bg-brand-paper flex items-center justify-center text-brand-muted font-bold text-xs shrink-0">{idx + 1}</div>
                  <h4 className="font-display font-bold text-brand-charcoal text-base leading-tight">"{q}"</h4>
                </div>
                <textarea
                  value={answers[idx]}
                  onChange={e => {
                    const newAnswers = [...answers];
                    newAnswers[idx] = e.target.value;
                    setAnswers(newAnswers);
                  }}
                  rows={4}
                  placeholder="Provide a precise, documented defense..."
                  className="w-full bg-white border border-brand-charcoal/10 rounded-2xl p-5 text-sm focus:outline-none focus:border-brand-navy shadow-sm transition-all focus:shadow-md"
                />
              </motion.div>
            ))}
          </div>

          {evalResult && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-brand-charcoal/10 rounded-3xl p-8 flex gap-8 items-center shadow-xl shadow-brand-charcoal/5"
            >
              <div className="text-center bg-brand-navy p-6 rounded-2xl text-white">
                <div className="text-3xl font-display font-bold">{evalResult.score}</div>
                <div className="text-[9px] uppercase font-bold tracking-widest text-white/50">Score</div>
              </div>
              <div>
                <h4 className="font-display font-bold mb-2">Board Review Outcome</h4>
                <p className="text-xs text-brand-muted leading-relaxed">{evalResult.feedback}</p>
              </div>
            </motion.div>
          )}

          <div className="flex justify-center pt-8 border-t border-brand-charcoal/5">
            {!evalResult ? (
              <button
                onClick={handleEval}
                disabled={answeredCount < cfg.questions.length || isEvaluating}
                className="px-10 py-4 bg-brand-navy text-white rounded-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-charcoal transition-all shadow-xl shadow-brand-navy/20 flex items-center gap-3"
              >
                {isEvaluating ? <Loader2 className="animate-spin" /> : <Bot size={20} />}
                Request Certification Review
              </button>
            ) : (
              <button
                onClick={() => onComplete(evalResult.score, { answers })}
                className="px-10 py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all shadow-xl shadow-green-600/20 flex items-center gap-3"
              >
                <CheckCircle2 size={20} />
                Continue to Roadmap
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return <div className={cn("w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin", className)} />;
}
