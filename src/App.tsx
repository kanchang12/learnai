/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, ChevronLeft, Award, Shield, Cpu, Database, Network, FileCheck, BarChart3 } from 'lucide-react';
import { User, UserProgress, Module, Level, MODULES, Tier } from './types.ts';
import Dashboard from './components/Dashboard.tsx';
import ModuleView from './components/ModuleView.tsx';
import LevelView from './components/LevelView.tsx';
import LandingPage from './components/LandingPage.tsx';
import AdminPanel from './components/AdminPanel.tsx';

export default function App() {
  // Admin route — renders the admin panel when URL is /admin
  if (window.location.pathname === '/admin') {
    return <AdminPanel />;
  }

  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<UserProgress>({
    completedLevels: {},
    scores: {},
    decisions: {},
    ghostMissed: false
  });
  const [view, setView] = useState<'landing' | 'dashboard' | 'module' | 'level'>('landing');
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [activeLevel, setActiveLevel] = useState<Level | null>(null);

  useEffect(() => {
    const savedSession = localStorage.getItem('ceal_session');
    if (savedSession) {
      try {
        const { user, progress } = JSON.parse(savedSession);
        setUser(user);
        setProgress(progress);
        setView('dashboard');
      } catch (e) {
        console.error("Failed to load session", e);
      }
    }
  }, []);

  const saveSession = (newUser: User, newProgress: UserProgress) => {
    localStorage.setItem('ceal_session', JSON.stringify({ user: newUser, progress: newProgress }));
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    const initialProgress = { completedLevels: {}, scores: {}, decisions: {}, ghostMissed: false };
    setProgress(initialProgress);
    saveSession(newUser, initialProgress);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('ceal_session');
    setUser(null);
    setView('landing');
  };

  const completeLevel = (levelId: number, score: number, decisions: any, ghostCaught?: boolean) => {
    if (!activeModule) return;
    
    const key = `${activeModule.id}-${levelId}`;
    const newProgress = { ...progress };
    newProgress.completedLevels[key] = true;
    newProgress.scores[key] = score;
    newProgress.decisions[key] = decisions;

    // Ghost Data logic: Module 3, Level 3 is the critical point
    if (activeModule.id === 3 && levelId === 3) {
      newProgress.ghostMissed = !ghostCaught;
    }

    setProgress(newProgress);
    if (user) saveSession(user, newProgress);
    setView('module');
  };

  const enterModule = (mod: Module) => {
    setActiveModule(mod);
    setView('module');
  };

  const enterLevel = (lv: Level) => {
    setActiveLevel(lv);
    setView('level');
  };

  return (
    <div className="min-h-screen bg-brand-paper">
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LandingPage onLogin={handleLogin} />
          </motion.div>
        )}

        {user && (
          <div className="flex flex-col min-h-screen">
            {/* Navigation Header */}
            <header className="bg-white border-b border-brand-charcoal/10 px-6 h-16 flex items-center justify-between sticky top-0 z-50">
              <div className="flex items-center gap-6">
                <div className="font-display font-bold text-xl text-brand-navy flex items-center">
                  CEAL <span className="text-brand-amber ml-2 font-normal text-sm tracking-widest uppercase">Lead</span>
                </div>
                {view !== 'dashboard' && (
                  <button 
                    onClick={() => setView(view === 'level' ? 'module' : 'dashboard')}
                    className="flex items-center gap-2 text-sm font-medium text-brand-muted hover:text-brand-charcoal transition-colors"
                  >
                    <ChevronLeft size={16} />
                    Back
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end mr-2">
                  <span className="text-sm font-semibold">{user.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-brand-muted font-bold">
                    {user.tier} Certification
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-brand-muted hover:text-brand-charcoal hover:bg-brand-charcoal/5 rounded-full transition-all"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </header>

            <main className="flex-1 overflow-auto">
              {view === 'dashboard' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Dashboard 
                    user={user} 
                    progress={progress} 
                    onEnterModule={enterModule} 
                  />
                </motion.div>
              )}

              {view === 'module' && activeModule && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <ModuleView 
                    module={activeModule} 
                    progress={progress} 
                    onEnterLevel={enterLevel} 
                    onBack={() => setView('dashboard')}
                  />
                </motion.div>
              )}

              {view === 'level' && activeModule && activeLevel && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <LevelView 
                    module={activeModule} 
                    level={activeLevel} 
                    progress={progress}
                    onComplete={completeLevel}
                  />
                </motion.div>
              )}
            </main>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
