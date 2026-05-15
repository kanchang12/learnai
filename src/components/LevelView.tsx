import React from 'react';
import { Module, Level, UserProgress } from '../types.ts';
import ExploreLevel from './levels/ExploreLevel.tsx';

interface LevelViewProps {
  module: Module;
  level: Level;
  progress: UserProgress;
  onComplete: (levelId: number, score: number, decisions: any, ghostCaught?: boolean) => void;
}

// All level types use the deep AI chat — the system prompts in levelPrompts.js
// handle the different scenarios (design, comply, defend, future).
// No more drag-and-drop or checkbox ticking.
export default function LevelView({ module, level, progress, onComplete }: LevelViewProps) {
  const user = JSON.parse(localStorage.getItem('ceal_session') || '{}').user;

  const isGhostLevel = level.ghost;

  return (
    <div className="h-full bg-brand-paper/30 overflow-y-auto">
      <ExploreLevel
        module={module}
        level={level}
        user={user}
        progress={progress}
        onComplete={(score, decisions) => {
          // For ghost level (M3-L3), check if user caught the PII issue
          // ExploreLevel passes ghostCaught via decisions
          const ghostCaught = isGhostLevel ? (decisions?.ghostCaught ?? false) : undefined;
          onComplete(level.id, score, decisions, ghostCaught);
        }}
      />
    </div>
  );
}
