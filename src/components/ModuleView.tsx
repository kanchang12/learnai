import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, CheckCircle2, MessageSquare, Layout, ShieldCheck, Presentation, Compass } from 'lucide-react';
import { Module, UserProgress, Level } from '../types.ts';
import { cn } from '../utils/cn.ts';

interface ModuleViewProps {
  module: Module;
  progress: UserProgress;
  onEnterLevel: (level: Level) => void;
  onBack: () => void;
}

const TYPE_ICONS: Record<Level['type'], any> = {
  explore: Compass,
  design: Layout,
  comply: ShieldCheck,
  defend: Presentation,
  future: MessageSquare,
};

const TYPE_LABELS: Record<Level['type'], string> = {
  explore: 'Explore',
  design: 'Design',
  comply: 'Comply',
  defend: 'Defend',
  future: 'Future Proof',
};

const TYPE_COLORS: Record<Level['type'], string> = {
  explore: 'text-brand-navy bg-brand-navy/10 border-brand-navy/20',
  design: 'text-green-700 bg-green-50 border-green-200',
  comply: 'text-brand-amber bg-brand-amber/5 border-brand-amber/20',
  defend: 'text-red-700 bg-red-50 border-red-200',
  future: 'text-purple-700 bg-purple-50 border-purple-200',
};

export default function ModuleView({ module, progress, onEnterLevel, onBack }: ModuleViewProps) {
  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <header className="mb-12">
        <div className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em] mb-4">{module.code} Certification</div>
        <h1 className="text-3xl font-display font-bold text-brand-navy mb-4">{module.title}</h1>
        <p className="text-brand-charcoal/70 leading-relaxed italic">{module.tagline}</p>
        
        {module.ghost && (
          <div className={cn(
            "mt-8 p-6 rounded-2xl border flex gap-4 items-start",
            module.id === 5 && progress.ghostMissed 
              ? "bg-red-50 border-red-200 text-red-900" 
              : "bg-amber-50 border-brand-gold/20 text-brand-amber"
          )}>
            <div className="text-2xl">👻</div>
            <div>
              <div className="font-bold text-sm mb-1">Ghost Data System Active</div>
              <p className="text-xs opacity-80 leading-relaxed">
                {module.id === 5 && progress.ghostMissed 
                  ? "CRITICAL: The PII violation from Module 3 is haunting this audit. Failure is imminent unless addressed." 
                  : "Caution: Choices made in Level 3 regarding sensitive data will have cascading effects on Module 5."}
              </p>
            </div>
          </div>
        )}
      </header>

      <div className="space-y-4">
        {module.levels.map((level, idx) => {
          const key = `${module.id}-${level.id}`;
          const isDone = progress.completedLevels[key];
          const score = progress.scores[key];
          const Icon = TYPE_ICONS[level.type] || Compass;

          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onEnterLevel(level)}
              className={cn(
                "group relative p-6 rounded-2xl border bg-white flex items-center gap-6 cursor-pointer transition-all active:scale-[0.98]",
                isDone 
                  ? "border-brand-navy/20 shadow-sm" 
                  : "border-brand-charcoal/5 hover:border-brand-charcoal/15 hover:shadow-lg hover:shadow-brand-charcoal/5"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                isDone ? "bg-brand-navy text-white" : "bg-brand-paper text-brand-muted"
              )}>
                {isDone ? <CheckCircle2 size={24} /> : <span className="font-display font-bold">{level.id}</span>}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className={cn(
                    "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border",
                    TYPE_COLORS[level.type]
                  )}>
                    {TYPE_LABELS[level.type]}
                  </span>
                  {level.ghost && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-amber-100 text-brand-amber border border-brand-amber/20">Ghost Level</span>}
                </div>
                <h3 className="font-display font-bold text-brand-charcoal group-hover:text-brand-navy transition-colors">
                  {level.title}
                </h3>
              </div>

              {score && (
                <div className="text-right mr-4">
                  <div className="text-xl font-display font-bold text-brand-navy">{score}</div>
                  <div className="text-[9px] uppercase font-bold text-brand-muted tracking-widest">Score</div>
                </div>
              )}

              <ChevronRight className="text-brand-charcoal/20 group-hover:text-brand-navy transition-colors" size={20} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
