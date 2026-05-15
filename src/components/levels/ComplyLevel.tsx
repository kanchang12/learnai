import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Module, Level, UserProgress } from '../../types.ts';
import { evaluateExercise } from '../../lib/gemini.ts';
import { cn } from '../../utils/cn.ts';

interface ComplyLevelProps {
  module: Module;
  level: Level;
  progress: UserProgress;
  onComplete: (score: number, decisions: any, ghostCaught?: boolean) => void;
}

const COMPLY_ITEMS: Record<number, { text: string; critical: boolean; ghost?: boolean }[]> = {
  1: [
    { text: "Redundancy process follows 30-day consultation requirement", critical: true },
    { text: "Headcount changes notified to HRBP", critical: false },
    { text: "AI usage policy document board-approved", critical: true },
    { text: "Baseline efficiency metrics documented", critical: false }
  ],
  2: [
    { text: "No hardcoded API keys in spec files", critical: true },
    { text: "PII data flows documented and minimised", critical: true },
    { text: "Fallback behaviour defined if AI model unavailable", critical: false },
    { text: "Output sanitization logic included in prompt template", critical: true }
  ],
  3: [
    { text: "Customer email addresses excluded from RAG index", critical: true },
    { text: "Financial report metadata stripped", critical: true },
    { text: "Employee performance data identified and quarantined", critical: true, ghost: true },
    { text: "Third-party contracts reviewed for AI training limits", critical: false }
  ],
  4: [
    { text: "Agent cannot send external comms without human approval", critical: true },
    { text: "Spend limits set — agent cannot approve >₹10,000 without review", critical: true },
    { text: "All agent actions logged with timestamps", critical: true },
    { text: "Escalation path defined if agent confidence < 85%", critical: false }
  ],
  5: [
    { text: "AIMS policy document reviewed within last 12 months", critical: true },
    { text: "All High-Risk systems registered in Conformity File", critical: true },
    { text: "No GDPR Article 9 violations found in training data", critical: true, ghost: true },
    { text: "Bias testing completed for customer-facing tools", critical: true }
  ],
  6: [
    { text: "ROI baseline metrics documented and auditable", critical: true },
    { text: "Time savings methodology reviewed by Finance", critical: true },
    { text: "MTTR reduction tracked as primary efficiency metric", critical: false }
  ]
};

export default function ComplyLevel({ module, level, progress, onComplete }: ComplyLevelProps) {
  const items = COMPLY_ITEMS[module.id] || COMPLY_ITEMS[1];
  const [checkedIds, setCheckedIds] = useState<number[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<{ score: number; feedback: string } | null>(null);

  const toggleCheck = (id: number) => {
    setCheckedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const ghostItemIdx = items.findIndex(i => i.ghost);
  const ghostCaught = ghostItemIdx === -1 || checkedIds.includes(ghostItemIdx);
  
  // Specific fail for Module 5 if they missed it in M3
  const isAutoFail = module.id === 5 && progress.ghostMissed && checkedIds.includes(ghostItemIdx);

  const handleEval = async () => {
    setIsEvaluating(true);
    try {
      const res = await evaluateExercise('comply', module.id, { checkedIds, ghostCaught }, progress.ghostMissed);
      // Force low score if auto-fail logic triggered
      if (isAutoFail) {
        res.score = 30;
        res.feedback = "MAJOR VIOLATION: You checked the compliance box for PII data, but our records show the Employee Performance data from Module 3 was never quarantined. This is a false attestation and a GDPR breach.";
      }
      setEvalResult(res);
    } catch (e) {
      setEvalResult({ score: 80, feedback: "Audit documentation complete. Policy controls appear sufficient." });
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-12">
      <header className="mb-12 text-center">
        <div className="w-16 h-16 bg-brand-amber/10 text-brand-amber rounded-3xl flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-3xl font-display font-bold text-brand-charcoal mb-4">Compliance Audit Checkpoint</h2>
        <p className="text-brand-muted text-sm leading-relaxed max-w-md mx-auto italic">
          Attest to meeting these critical enterprise requirements. Every box you check is a legal commitment.
        </p>
      </header>

      {progress.ghostMissed && module.id === 5 && (
        <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl flex gap-4 text-red-900 border-l-4 border-l-red-600">
          <AlertTriangle className="flex-shrink-0" size={24} />
          <div>
            <div className="font-bold text-sm mb-1">Unresolved Data Debt</div>
            <p className="text-xs opacity-80 leading-relaxed">
              Detection system: A violation from a previous RAG audit (M3) remains active. You cannot bypass this audit without consequences.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3 mb-12">
        {items.map((item, idx) => (
          <div 
            key={idx}
            onClick={() => toggleCheck(idx)}
            className={cn(
              "p-5 rounded-2xl border transition-all cursor-pointer flex gap-4 items-start",
              checkedIds.includes(idx) 
                ? "bg-white border-brand-navy shadow-sm" 
                : "bg-brand-paper/50 border-brand-charcoal/5 hover:border-brand-charcoal/10"
            )}
          >
            <div className={cn(
              "w-6 h-6 rounded-lg border-2 mt-0.5 flex items-center justify-center transition-colors",
              checkedIds.includes(idx) ? "bg-brand-navy border-brand-navy text-white" : "border-brand-charcoal/20"
            )}>
              {checkedIds.includes(idx) && <CheckCircle2 size={14} />}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium pr-8">{item.text}</div>
              {item.critical && (
                <span className="text-[9px] uppercase font-bold tracking-widest text-red-600/60 mt-2 block">Enterprise Critical</span>
              )}
            </div>
            {item.ghost && <div className="text-xl grayscale opacity-30">👻</div>}
          </div>
        ))}
      </div>

      {evalResult && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "mb-12 p-8 rounded-3xl border flex gap-6 items-center",
            evalResult.score >= 60 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          )}
        >
          <div className="text-center bg-white p-4 rounded-2xl shadow-sm border border-brand-charcoal/5">
            <div className={cn("text-3xl font-display font-bold", evalResult.score >= 60 ? "text-green-700" : "text-red-700")}>{evalResult.score}</div>
            <div className="text-[9px] uppercase font-bold tracking-widest text-brand-muted">Score</div>
          </div>
          <div className="flex-1">
            <h4 className="font-display font-bold text-sm mb-1">{evalResult.score >= 60 ? "Audit Passed" : "Audit Failed"}</h4>
            <p className={cn("text-xs leading-relaxed", evalResult.score >= 60 ? "text-green-800/80" : "text-red-800/80")}>
              {evalResult.feedback}
            </p>
          </div>
        </motion.div>
      )}

      <div className="flex justify-center">
        {!evalResult ? (
          <button
            onClick={handleEval}
            disabled={checkedIds.length < items.filter(i => i.critical).length || isEvaluating}
            className="px-10 py-4 bg-brand-navy text-white rounded-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-charcoal transition-all shadow-xl shadow-brand-navy/20 flex items-center gap-3"
          >
            {isEvaluating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <ShieldCheck size={20} />}
            Submit for Certification
          </button>
        ) : (
          <button
            onClick={() => onComplete(evalResult.score, { checkedIds, ghostCaught }, ghostCaught)}
            className={cn(
              "px-10 py-4 text-white rounded-2xl font-bold transition-all shadow-xl flex items-center gap-3",
              evalResult.score >= 60 ? "bg-green-600 hover:bg-green-700 shadow-green-600/20" : "bg-red-600 hover:bg-red-700 shadow-red-600/20"
            )}
          >
            {evalResult.score >= 60 ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            {evalResult.score >= 60 ? "Continue" : "Return to Module"}
          </button>
        )}
      </div>
    </div>
  );
}
