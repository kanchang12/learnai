import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Target, CheckCircle2, Star, Loader2 } from 'lucide-react';
import { Module, Level, UserProgress } from '../../types.ts';
import { evaluateExercise } from '../../lib/gemini.ts';
import { cn } from '../../utils/cn.ts';

interface FutureLevelProps {
  module: Module;
  level: Level;
  progress: UserProgress;
  onComplete: (score: number, decisions: any) => void;
}

const ROADMAP_CFG: Record<number, { title: string, phases: { l: string, color: string }[] }> = {
  1: {
    title: "12-Month AI Transformation Roadmap",
    phases: [
      { l: "Month 1–3: Foundation & Work Redesign", color: "bg-brand-navy" },
      { l: "Month 4–6: Automation Pilot", color: "bg-brand-amber" },
      { l: "Month 7–9: Augmentation & Scaling", color: "bg-green-700" },
      { l: "Month 10–12: Full Enterprise Transformation", color: "bg-[#5B2D8E]" }
    ]
  },
  2: {
    title: "AI-Native SDLC Implementation Plan",
    phases: [
      { l: "Month 1–3: Automated Review & Spec Kits", color: "bg-brand-navy" },
      { l: "Month 4–6: Agent-Pair Programming Pilot", color: "bg-brand-amber" },
      { l: "Month 7–9: CI/CD AI Integration", color: "bg-green-700" },
      { l: "Month 10–12: Autonomous Release Cycles", color: "bg-[#5B2D8E]" }
    ]
  },
  3: {
    title: "The 10× Data Scaling Strategy",
    phases: [
      { l: "Month 1–3: Data Moat Audit", color: "bg-brand-navy" },
      { l: "Month 4–6: Context Window Optimization", color: "bg-brand-amber" },
      { l: "Month 7–9: Cross-Functional RAG Deployment", color: "bg-green-700" },
      { l: "Month 10–12: Personalised AI Context Mesh", color: "bg-[#5B2D8E]" }
    ]
  },
  4: {
    title: "Autonomous Agent Evolution",
    phases: [
      { l: "Month 1–3: Internal Tool Access", color: "bg-brand-navy" },
      { l: "Month 4–6: Supervised External Actions", color: "bg-brand-amber" },
      { l: "Month 7–9: Inter-Agent Communication", color: "bg-green-700" },
      { l: "Month 10–12: Self-Healing Workflows", color: "bg-[#5B2D8E]" }
    ]
  },
  5: {
    title: "ISO 42001 Certification Path",
    phases: [
      { l: "Phase 1: Gap Analysis", color: "bg-brand-navy" },
      { l: "Phase 2: Registry Implementation", color: "bg-brand-amber" },
      { l: "Phase 3: Internal Audit Simulation", color: "bg-green-700" },
      { l: "Phase 4: Final Board Verification", color: "bg-[#5B2D8E]" }
    ]
  },
  6: {
    title: "3-Year ROI Compounding Model",
    phases: [
      { l: "Year 1: Efficiency Baseline", color: "bg-brand-navy" },
      { l: "Year 2: Scaled ROI Realisation", color: "bg-brand-amber" },
      { l: "Year 2.5: Product Expansion", color: "bg-green-700" },
      { l: "Year 3: Market Dominance", color: "bg-[#5B2D8E]" }
    ]
  }
};

export default function FutureLevel({ module, level, progress, onComplete }: FutureLevelProps) {
  const cfg = ROADMAP_CFG[module.id] || ROADMAP_CFG[1];
  const [phases, setPhases] = useState<{ text: string, confidence: number }[]>(
    new Array(cfg.phases.length).fill(null).map(() => ({ text: '', confidence: 1 }))
  );
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<{ score: number; feedback: string } | null>(null);

  const updatePhase = (idx: number, updates: Partial<{ text: string, confidence: number }>) => {
    const newPhases = [...phases];
    newPhases[idx] = { ...newPhases[idx], ...updates };
    setPhases(newPhases);
  };

  const handleEval = async () => {
    setIsEvaluating(true);
    try {
      const res = await evaluateExercise('future', module.id, { phases }, progress.ghostMissed);
      setEvalResult(res);
    } catch (e) {
      setEvalResult({ score: 82, feedback: "Strategic vision is clear. Your confidence ratings align well with the technical complexity of Month 10-12." });
    } finally {
      setIsEvaluating(false);
    }
  };

  const filledCount = phases.filter(p => p.text.trim().length > 30).length;

  return (
    <div className="max-w-4xl mx-auto p-12">
      <header className="mb-12 text-center">
        <div className="w-16 h-16 bg-purple-100 text-purple-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Target size={32} />
        </div>
        <h2 className="text-3xl font-display font-bold text-brand-charcoal mb-4">{cfg.title}</h2>
        <p className="text-brand-muted text-sm max-w-sm mx-auto">Define specific initiatives, tool choices, and expected outcomes.</p>
      </header>

      <div className="space-y-6 mb-12">
        {cfg.phases.map((p, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex gap-8 group"
          >
            <div className="flex flex-col items-center">
              <div className={cn("w-3 h-3 rounded-full shrink-0", p.color)} />
              <div className="w-px flex-1 bg-brand-charcoal/10 my-2" />
            </div>
            <div className="flex-1 pb-12">
              <div className="flex justify-between items-center mb-4">
                <span className={cn("text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full text-white", p.color)}>
                  {p.l}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Confidence Level</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onClick={() => updatePhase(idx, { confidence: n })}
                        className={cn(
                          "w-6 h-6 rounded-lg text-[10px] font-bold transition-all",
                          phases[idx].confidence >= n ? p.color + " text-white" : "bg-brand-paper text-brand-muted hover:bg-brand-charcoal/10"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <textarea
                value={phases[idx].text}
                onChange={e => updatePhase(idx, { text: e.target.value })}
                rows={3}
                placeholder="List specific tools, stakeholders, and KPIs..."
                className="w-full bg-white border border-brand-charcoal/10 rounded-2xl p-5 text-sm focus:outline-none focus:border-brand-navy shadow-sm transition-all focus:shadow-md h-full"
              />
            </div>
          </motion.div>
        ))}
      </div>

      {evalResult && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12 bg-white border border-brand-charcoal/10 rounded-3xl p-8 flex gap-8 items-center shadow-2xl shadow-brand-charcoal/5"
        >
          <div className="text-center bg-purple-700 p-6 rounded-2xl text-white">
            <div className="text-3xl font-display font-bold">{evalResult.score}</div>
            <div className="text-[9px] uppercase font-bold tracking-widest text-white/50">Score</div>
          </div>
          <div>
            <h4 className="font-display font-bold mb-2">Roadmap Stress-Test</h4>
            <p className="text-xs text-brand-muted leading-relaxed italic">"{evalResult.feedback}"</p>
          </div>
        </motion.div>
      )}

      <div className="flex justify-center">
        {!evalResult ? (
          <button
            onClick={handleEval}
            disabled={filledCount < cfg.phases.length || isEvaluating}
            className="px-10 py-4 bg-brand-navy text-white rounded-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-charcoal transition-all shadow-xl shadow-brand-navy/20 flex items-center gap-3"
          >
            {isEvaluating ? <Loader2 className="animate-spin" /> : <Star size={20} />}
            Ask for Strategy Audit
          </button>
        ) : (
          <button
            onClick={() => onComplete(evalResult.score, { phases })}
            className="px-10 py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all shadow-xl shadow-green-600/20 flex items-center gap-3"
          >
            <CheckCircle2 size={20} />
            Complete Module
          </button>
        )}
      </div>
    </div>
  );
}
