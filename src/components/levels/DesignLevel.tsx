import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layout, Check, AlertCircle } from 'lucide-react';
import { Module, Level, UserProgress } from '../../types.ts';
import { evaluateExercise } from '../../lib/gemini.ts';
import { cn } from '../../utils/cn.ts';

interface DesignLevelProps {
  module: Module;
  level: Level;
  progress: UserProgress;
  onComplete: (score: number, decisions: any) => void;
}

const DESIGN_BLOCKS: Record<number, { title: string; zones: { id: string; label: string; color: string }[]; items: string[] }> = {
  1: {
    title: "Redesign your org for AI speed",
    zones: [
      { id: "keep", label: "Human Oversight", color: "border-green-500 text-green-700 bg-green-50" },
      { id: "auto", label: "AI Execution", color: "border-brand-navy text-brand-navy bg-brand-navy/5" },
      { id: "cut", label: "Remove/Legacy", color: "border-red-500 text-red-700 bg-red-50" }
    ],
    items: ["Security Code Review", "Weekly Status Meetings", "Manual Deployments", "Automated QA", "Customer Support Level 1", "Database Indexing"]
  },
  2: {
    title: "Map the AI-Native SDLC Flow",
    zones: [
      { id: "plan", label: "Planning/Specs", color: "border-purple-500 text-purple-700 bg-purple-50" },
      { id: "build", label: "Build/Dev", color: "border-brand-navy text-brand-navy bg-brand-navy/5" },
      { id: "deploy", label: "Deploy/Ops", color: "border-brand-amber text-brand-amber bg-brand-amber/5" }
    ],
    items: ["Requirement Agent", "Copilot Pairing", "Automated Rollbacks", "LLM Vulnerability Test", "PR Summarizer"]
  },
  3: {
    title: "Build the RAG Data Pipeline",
    zones: [
      { id: "source", label: "Ingestion Source", color: "border-brand-navy text-brand-navy bg-brand-navy/5" },
      { id: "clean", label: "Cleaning/PII Filter", color: "border-brand-amber text-brand-amber bg-brand-amber/5" },
      { id: "index", label: "Vector Index", color: "border-green-500 text-green-700 bg-green-50" }
    ],
    items: ["Internal Slack Logs", "Customer Database", "Product Documentation", "Employee Performance Data", "Legal Contracts"]
  },
  4: {
    title: "Agentic Workflow Orchestration",
    zones: [
      { id: "planner", label: "Task Planner", color: "border-brand-navy text-brand-navy bg-brand-navy/5" },
      { id: "executor", label: "Execution Tools", color: "border-brand-amber text-brand-amber bg-brand-amber/5" },
      { id: "critic", label: "Reviewer/Critic", color: "border-red-500 text-red-700 bg-red-50" }
    ],
    items: ["Step Decomposition", "API Invocation", "Fact Checking", "Error Recovery", "Human hand-off trigger"]
  },
  5: {
    title: "Map the AIMS Conformity File",
    zones: [
      { id: "risk", label: "Risk Mitigation", color: "border-red-500 text-red-700 bg-red-50" },
      { id: "trail", label: "Audit Trails", color: "border-brand-navy text-brand-navy bg-brand-navy/5" },
      { id: "policy", label: "Org Policy", color: "border-green-500 text-green-700 bg-green-50" }
    ],
    items: ["Prompt Injection Log", "Bias Testing Report", "Kill-switch procedure", "ISO 42001 Checklist"]
  },
  6: {
    title: "DX Core 4 Dashboard Metrics",
    zones: [
      { id: "speed", label: "Velocity", color: "border-brand-navy text-brand-navy bg-brand-navy/5" },
      { id: "quality", label: "Reliability", color: "border-green-500 text-green-700 bg-green-50" },
      { id: "impact", label: "P&L Impact", color: "border-brand-amber text-brand-amber bg-brand-amber/5" }
    ],
    items: ["Cycle Time", "MTTR", "Bug Escape Rate", "Revenue per head", "Lead Time"]
  }
};

export default function DesignLevel({ module, level, progress, onComplete }: DesignLevelProps) {
  const config = DESIGN_BLOCKS[module.id] || DESIGN_BLOCKS[1];
  const [placements, setPlacements] = useState<Record<string, string[]>>({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<{ score: number; feedback: string } | null>(null);

  const unplacedItems = config.items.filter(item => 
    !Object.values(placements).some(list => list.includes(item))
  );

  const handleDrop = (zoneId: string, item: string) => {
    const newPlacements = { ...placements };
    // Remove if already placed elsewhere
    Object.keys(newPlacements).forEach(zid => {
      newPlacements[zid] = newPlacements[zid]?.filter(i => i !== item) || [];
    });
    
    // Add to new zone
    if (!newPlacements[zoneId]) newPlacements[zoneId] = [];
    newPlacements[zoneId].push(item);
    setPlacements(newPlacements);
  };

  const handleEval = async () => {
    setIsEvaluating(true);
    try {
      const res = await evaluateExercise('design', module.id, placements, progress.ghostMissed);
      setEvalResult(res);
    } catch (e) {
      setEvalResult({ score: 75, feedback: "Great effort. Your architecture shows a clear understanding of task separation." });
    } finally {
      setIsEvaluating(false);
    }
  };

  const hasPlacedMost = Object.values(placements).flat().length >= config.items.length * 0.6;

  return (
    <div className="max-w-6xl mx-auto p-12">
      <div className="flex justify-between items-start mb-12">
        <div>
          <h2 className="text-3xl font-display font-bold text-brand-navy mb-2">{config.title}</h2>
          <p className="text-brand-muted text-sm italic">Drag blocks to the correct governance zones.</p>
        </div>
        {evalResult && (
          <div className="bg-white border-2 border-brand-navy rounded-2xl p-6 shadow-xl flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-brand-navy">{evalResult.score}</div>
              <div className="text-[9px] uppercase font-bold tracking-widest text-brand-muted">Score</div>
            </div>
            <div className="technical-line w-px h-10" />
            <p className="text-xs text-brand-charcoal max-w-xs">{evalResult.feedback}</p>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Source Items */}
        <div className="lg:col-span-1 bg-brand-paper rounded-3xl p-6 border border-brand-charcoal/5 h-fit">
          <h3 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-6 px-2">ComponentsPool</h3>
          <div className="space-y-3">
            {unplacedItems.map(item => (
              <motion.div
                key={item}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("item", item)}
                className="bg-white p-4 rounded-xl border border-brand-charcoal/10 text-sm font-medium cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all border-l-4 border-l-brand-navy"
                layoutId={item}
              >
                {item}
              </motion.div>
            ))}
            {unplacedItems.length === 0 && (
              <div className="text-center py-12 text-brand-muted italic text-xs">
                All components deployed.
              </div>
            )}
          </div>
        </div>

        {/* Zones */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {config.zones.map(zone => (
            <div
              key={zone.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const item = e.dataTransfer.getData("item");
                handleDrop(zone.id, item);
              }}
              className={cn(
                "min-h-[400px] border-2 border-dashed rounded-3xl p-6 flex flex-col transition-all",
                zone.color,
                "hover:border-solid"
              )}
            >
              <h4 className="text-xs font-bold uppercase tracking-widest mb-6 flex justify-between">
                <span>{zone.label}</span>
                <span className="opacity-40">{placements[zone.id]?.length || 0}</span>
              </h4>
              <div className="flex-1 space-y-3">
                {placements[zone.id]?.map(item => (
                  <motion.div
                    key={item}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("item", item)}
                    className="bg-white p-4 rounded-xl border border-brand-charcoal/10 text-sm font-medium shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
                    layoutId={item}
                  >
                    {item}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 flex justify-center">
        {!evalResult ? (
          <button
            onClick={handleEval}
            disabled={!hasPlacedMost || isEvaluating}
            className="group px-10 py-4 bg-brand-navy text-white rounded-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-charcoal transition-all shadow-xl shadow-brand-navy/20 flex items-center gap-3"
          >
            {isEvaluating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <Layout size={20} />}
            Ask for Board Review
          </button>
        ) : (
          <button
            onClick={() => onComplete(evalResult.score, { placements })}
            className="px-10 py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all shadow-xl shadow-green-600/20 flex items-center gap-3"
          >
            <Check size={20} />
            Commit Design to Repo
          </button>
        )}
      </div>
    </div>
  );
}
