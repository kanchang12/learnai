import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User as UserIcon, Bot, Loader2 } from 'lucide-react';
import { getAgentReply } from '../../lib/gemini.ts';
import { Module, Level, UserProgress, User } from '../../types.ts';
import { cn } from '../../utils/cn.ts';

interface ExploreLevelProps {
  module: Module;
  level: Level;
  user: User;
  progress: UserProgress;
  onComplete: (score: number, decisions: any) => void;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function ExploreLevel({ module, level, user, progress, onComplete }: ExploreLevelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial bot message
    if (messages.length === 0) {
      handleSend("Begin the session.");
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    
    // Only show user message IF it's not the initial "Begin"
    if (text !== "Begin the session.") {
      setMessages(newMessages);
      setInput('');
    }
    
    setIsLoading(true);

    try {
      const reply = await getAgentReply(
        module.id,
        level.id,
        user.name,
        newMessages,
        progress.decisions,
        progress.ghostMissed
      );

      const botMsg: Message = { role: 'model', content: reply || "I see. Please continue." };
      setMessages(prev => [...prev, botMsg]);

      // Extract score from reply if present: "Score: 85/100"
      const scoreMatch = botMsg.content.match(/Score:\s*(\d+)/i);
      if (scoreMatch) {
        setCurrentScore(parseInt(scoreMatch[1]));
      }

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', content: "There was an error connecting to the CEAL brain. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const exchangeCount = (messages.filter(m => m.role === 'user').length);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto border-x border-brand-charcoal/5 bg-white shadow-sm">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6"
      >
        <div className="text-center py-8 opacity-50">
          <div className="w-12 h-12 bg-brand-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-navy">
            <Bot size={24} />
          </div>
          <h3 className="font-display font-bold">CEAL AI Consultant Session</h3>
          <p className="text-xs uppercase tracking-widest font-bold mt-1">Minimum 4 exchanges required</p>
        </div>

        <AnimatePresence mode="popLayout">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 max-w-[85%]",
                m.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                m.role === 'user' ? "bg-brand-charcoal text-white" : "bg-brand-navy text-white"
              )}>
                {m.role === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed",
                m.role === 'user' 
                  ? "bg-brand-navy text-white rounded-tr-none" 
                  : "bg-brand-paper border border-brand-charcoal/5 rounded-tl-none"
              )}>
                <div className="prose prose-sm prose-invert whitespace-pre-wrap">
                  {m.content}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex gap-4 max-w-[85%] mr-auto animate-pulse">
            <div className="w-8 h-8 rounded-full bg-brand-navy/20 flex-shrink-0" />
            <div className="p-4 rounded-2xl bg-brand-paper border border-brand-charcoal/5 rounded-tl-none w-32 h-12 flex items-center justify-center">
              <Loader2 className="animate-spin text-brand-navy/40" size={16} />
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-brand-charcoal/10 bg-brand-paper/50">
        <div className="flex gap-4 items-end max-w-4xl mx-auto relative">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend(input))}
            placeholder="Address the consultant's challenge..."
            rows={2}
            className="flex-1 bg-white border border-brand-charcoal/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-navy transition-colors resize-none shadow-sm"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={isLoading || !input.trim()}
            className="h-12 w-12 bg-brand-navy text-white rounded-xl flex items-center justify-center hover:bg-brand-charcoal transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Send size={18} />
          </button>
        </div>
        
        <div className="mt-4 flex justify-between items-center px-2">
          <div className="flex gap-1 items-center">
            {[1, 2, 3, 4].map(n => (
              <div 
                key={n}
                className={cn(
                  "h-1 w-6 rounded-full transition-colors",
                  exchangeCount >= n ? "bg-brand-navy" : "bg-brand-charcoal/10"
                )}
              />
            ))}
            <span className="text-[9px] uppercase font-bold text-brand-muted tracking-widest ml-2">
              Step {Math.min(exchangeCount, 4)}/4
            </span>
          </div>

          <AnimatePresence>
            {exchangeCount >= 4 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs font-bold bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all shadow-sm flex items-center gap-2"
                onClick={() => onComplete(currentScore || 80, { exchanges: exchangeCount })}
              >
                Complete Session
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
