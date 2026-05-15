import React from 'react';
import { motion } from 'motion/react';
import { Award, Shield, Cpu, Database, Network, FileCheck, BarChart3, Lock, CheckCircle2, Download } from 'lucide-react';
import { User, UserProgress, Module, MODULES, Tier } from '../types.ts';
import { cn } from '../utils/cn.ts';
import { generateCertificate } from '../lib/certificate.ts';

interface DashboardProps {
  user: User;
  progress: UserProgress;
  onEnterModule: (mod: Module) => void;
}

const TIER_MODULES: Record<Tier, number[]> = {
  foundation: [1, 2, 3],
  professional: [1, 2, 3, 4, 5],
  full: [1, 2, 3, 4, 5, 6],
};

const MODULE_ICONS: Record<number, any> = {
  1: Network,
  2: Cpu,
  3: Database,
  4: Shield,
  5: FileCheck,
  6: BarChart3,
};

export default function Dashboard({ user, progress, onEnterModule }: DashboardProps) {
  const allowedModuleIds = TIER_MODULES[user.tier];
  
  const totalLevels = allowedModuleIds.length * 5;
  const completedCount = Object.keys(progress.completedLevels).length;
  const progressPct = Math.round((completedCount / totalLevels) * 100);

  const avgScore = Object.values(progress.scores).length > 0
    ? Math.round(Object.values(progress.scores).reduce((a, b) => a + b, 0) / Object.values(progress.scores).length)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      {/* Hero Progress Section */}
      <section className="bg-brand-navy rounded-3xl p-10 text-white mb-12 shadow-xl shadow-brand-navy/20 flex flex-col md:flex-row justify-between gap-12 items-center">
        <div className="max-w-xl">
          <h1 className="text-4xl font-display font-bold mb-4">Welcome back, {user.name.split(' ')[0]}</h1>
          <p className="text-white/60 leading-relaxed mb-8">
            You are training to become a <strong className="text-brand-gold">Certified Enterprise AI Lead</strong>. Every decision you make in these simulations is tracked and evaluated by your AI Consultant.
          </p>
          <div className="grid grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-display font-bold text-brand-gold">{completedCount}</div>
              <div className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Levels Done</div>
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-brand-gold">{totalLevels}</div>
              <div className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Total</div>
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-brand-gold">{avgScore || '—'}</div>
              <div className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Avg Score</div>
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-brand-gold">{progressPct}%</div>
              <div className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Progress</div>
            </div>
          </div>
          
          {completedCount > 0 && (
            <button 
              onClick={() => generateCertificate(user, progress)}
              className="flex items-center gap-2 bg-brand-gold text-brand-navy px-6 py-2 rounded-full font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-brand-gold/20"
            >
              <Download size={16} />
              Download Certificate PDF
            </button>
          )}
        </div>

        <div className="flex flex-col items-center">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="transparent"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="12"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="transparent"
                stroke="#D4A017"
                strokeWidth="12"
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * progressPct) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Award className="text-brand-gold mb-1" size={32} />
              <span className="text-2xl font-display font-bold tracking-tighter">{progressPct}%</span>
            </div>
          </div>
          <span className="mt-4 text-[10px] uppercase font-bold tracking-widest text-white/40">Certification Status</span>
        </div>
      </section>

      {/* Modules Grid */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-display font-bold text-brand-charcoal">Simulation Modules</h2>
          <p className="text-brand-muted text-sm italic">War games for strategic alignment.</p>
        </div>
        <div className="flex gap-4 items-center">
          <span className="flex items-center gap-2 text-[10px] font-bold text-brand-muted uppercase"><div className="w-2 h-2 rounded-full bg-brand-navy" /> Foundation</span>
          <span className="flex items-center gap-2 text-[10px] font-bold text-brand-muted uppercase"><div className="w-2 h-2 rounded-full bg-brand-amber" /> Professional</span>
          <span className="flex items-center gap-2 text-[10px] font-bold text-brand-muted uppercase"><div className="w-2 h-2 rounded-full bg-[#5B2D8E]" /> Full</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MODULES.map(mod => {
          const isLocked = !allowedModuleIds.includes(mod.id);
          const Icon = MODULE_ICONS[mod.id] || Network;
          const completedLevels = mod.levels.filter(lv => progress.completedLevels[`${mod.id}-${lv.id}`]).length;
          const modScore = Object.entries(progress.scores)
            .filter(([k]) => k.startsWith(`${mod.id}-`))
            .map(([, s]) => s);
          const modAvg = modScore.length > 0 ? Math.round(modScore.reduce((a, b) => a + b, 0) / modScore.length) : null;

          return (
            <motion.div
              key={mod.id}
              whileHover={isLocked ? {} : { y: -5 }}
              onClick={() => !isLocked && onEnterModule(mod)}
              className={cn(
                "group relative p-8 rounded-3xl border transition-all cursor-pointer overflow-hidden",
                isLocked 
                  ? "bg-brand-charcoal/[0.02] border-brand-charcoal/5 grayscale cursor-not-allowed" 
                  : "bg-white border-brand-charcoal/10 hover:shadow-xl hover:shadow-brand-charcoal/5"
              )}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                  mod.id === 1 && "bg-brand-navy/10 text-brand-navy",
                  mod.id === 2 && "bg-brand-navy/10 text-brand-navy",
                  mod.id === 3 && "bg-brand-navy/10 text-brand-navy",
                  mod.id === 4 && "bg-brand-amber/10 text-brand-amber",
                  mod.id === 5 && "bg-brand-amber/10 text-brand-amber",
                  mod.id === 6 && "bg-[#5B2D8E]/10 text-[#5B2D8E]"
                )}>
                  <Icon size={24} />
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">{mod.code}</div>
                  {isLocked ? (
                    <Lock size={14} className="text-brand-muted mt-1" />
                  ) : (
                    completedLevels === 5 ? <CheckCircle2 size={16} className="text-green-600 mt-1" /> : null
                  )}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-display font-bold mb-2 group-hover:text-brand-navy transition-colors">{mod.title}</h3>
              <p className="text-brand-muted text-xs leading-relaxed mb-6">{mod.tagline}</p>

              {/* Module Stats */}
              {!isLocked && (
                <div className="flex items-center gap-6 mb-6">
                  <div>
                    <div className="text-sm font-display font-bold">{completedLevels}/5</div>
                    <div className="text-[9px] uppercase font-bold text-brand-muted tracking-wider">Levels</div>
                  </div>
                  {modAvg && (
                    <div>
                      <div className="text-sm font-display font-bold">{modAvg}</div>
                      <div className="text-[9px] uppercase font-bold text-brand-muted tracking-wider">Avg Score</div>
                    </div>
                  )}
                  {mod.ghost && (
                    <div>
                      <div className="text-sm">👻</div>
                      <div className="text-[9px] uppercase font-bold text-brand-muted tracking-wider">Ghost</div>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Bars */}
              <div className="flex gap-1.5 overflow-hidden">
                {mod.levels.map(lv => {
                  const done = progress.completedLevels[`${mod.id}-${lv.id}`];
                  return (
                    <div 
                      key={lv.id}
                      className={cn(
                        "h-1 px-1 flex-1 rounded-full",
                        done ? "bg-brand-navy" : "bg-brand-charcoal/5"
                      )}
                    />
                  );
                })}
              </div>

              {isLocked && (
                <div className="absolute inset-0 bg-brand-paper/40 flex items-center justify-center backdrop-blur-[1px]">
                  <span className="text-[10px] font-bold bg-white/80 border border-brand-charcoal/10 rounded-full px-4 py-2 uppercase tracking-widest shadow-sm">
                    {mod.tier} required
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* Ghost Logic Alert */}
      {progress.ghostMissed && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 bg-red-50 border border-red-200 rounded-3xl p-8 flex gap-6 items-start"
        >
          <div className="text-3xl">👻</div>
          <div>
            <h4 className="text-red-900 font-display font-bold mb-1">Unresolved GDPR Article 9 Violation</h4>
            <p className="text-red-700 text-sm leading-relaxed max-w-2xl">
              A serious oversight in Module 3 (RAG Data Moat) has cascaded. The sensitive employee records you failed to quarantine have now leaked into your training logs. Module 5 (Governance Audit) will be automatically flagged for failure unless fixed.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
