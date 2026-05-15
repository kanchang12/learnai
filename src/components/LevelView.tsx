import React from 'react';
import { Module, Level, UserProgress } from '../types.ts';
import ExploreLevel from './levels/ExploreLevel.tsx';
import DesignLevel from './levels/DesignLevel.tsx';
import ComplyLevel from './levels/ComplyLevel.tsx';
import DefendLevel from './levels/DefendLevel.tsx';
import FutureLevel from './levels/FutureLevel.tsx';

interface LevelViewProps {
  module: Module;
  level: Level;
  progress: UserProgress;
  onComplete: (levelId: number, score: number, decisions: any, ghostCaught?: boolean) => void;
}

export default function LevelView({ module, level, progress, onComplete }: LevelViewProps) {
  // We need to pass the user context from App ideally, but for now we'll assume it's available or fetch from progress
  const user = JSON.parse(localStorage.getItem('ceal_session') || '{}').user;

  const renderLevel = () => {
    switch (level.type) {
      case 'explore':
        return <ExploreLevel 
          module={module} 
          level={level} 
          user={user} 
          progress={progress} 
          onComplete={(score, decisions) => onComplete(level.id, score, decisions)} 
        />;
      case 'design':
        return <DesignLevel 
          module={module} 
          level={level} 
          progress={progress} 
          onComplete={(score, decisions) => onComplete(level.id, score, decisions)} 
        />;
      case 'comply':
        return <ComplyLevel 
          module={module} 
          level={level} 
          progress={progress} 
          onComplete={(score, decisions, ghostCaught) => onComplete(level.id, score, decisions, ghostCaught)} 
        />;
      case 'defend':
        return <DefendLevel 
          module={module} 
          level={level} 
          progress={progress} 
          onComplete={(score, decisions) => onComplete(level.id, score, decisions)} 
        />;
      case 'future':
        return <FutureLevel 
          module={module} 
          level={level} 
          progress={progress} 
          onComplete={(score, decisions) => onComplete(level.id, score, decisions)} 
        />;
      default:
        return <div>Invalid Level Type</div>;
    }
  };

  return (
    <div className="h-full bg-brand-paper/30 overflow-y-auto">
      {renderLevel()}
    </div>
  );
}
