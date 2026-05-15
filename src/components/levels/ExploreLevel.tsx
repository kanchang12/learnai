import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User as UserIcon, Bot, Loader2, AlertTriangle, ChevronRight } from 'lucide-react';
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

const MIN_EXCHANGES = 20;
const PASS_SCORE    = 70;

// Opening scenario shown before chat begins
const OPENING_SCENARIOS: Record<string, { situation: string; objective: string; stakes: string }> = {
  '1-1': {
    situation: "Your CTO has just announced 'AI transformation' after buying GitHub Copilot for the whole team. Nothing else has changed. You are the one developer who actually knows what this means.",
    objective: "Conduct a real AI Readiness Audit of your organisation. Score your team across 8 dimensions. Identify the blockers stopping real transformation.",
    stakes: "If you get this wrong, your company will waste £200,000 on AI tools that nobody uses effectively. Your CTO will blame the team."
  },
  '1-2': {
    situation: "Your team: 1 Tech Lead, 3 Backend, 2 Frontend, 1 QA, 1 DevOps. Your VP has said 'integrate AI into everything by Q2.' Nobody knows what that means.",
    objective: "Redesign your org chart for AI. Every role must be reclassified. Some people will need new responsibilities. Some may be at risk.",
    stakes: "A wrong org design means the wrong people own AI decisions. You will ship AI features nobody trusts, and nobody is accountable when they fail."
  },
  '1-3': {
    situation: "You want to deploy an AI tool that reads your company's private GitHub repos and sends code to an external LLM. Legal hasn't been consulted. GDPR officer doesn't know.",
    objective: "Navigate every policy obligation before deployment. Data classification, vendor risk, employee consent, IP ownership, incident response.",
    stakes: "Deploy without this and you face regulatory fines, employee grievances, and potential IP theft. One missed obligation can kill the entire AI programme."
  },
  '1-4': {
    situation: "You have 10 minutes to justify a £50,000 AI budget to a CTO who has rejected 18 AI pitches this year. They've seen every slide deck. They want numbers.",
    objective: "Build and defend a business case that survives brutal interrogation. ROI, risk, ownership, opportunity cost — all of it.",
    stakes: "Fail this and there is no budget, no AI programme, and your credibility as someone who can think at the business level is gone."
  },
  '1-5': {
    situation: "It is January. You have £30,000, a willing team, zero AI governance, and a CEO who wants to show the board 'something real' by June.",
    objective: "Build a credible 12-month AI roadmap with quarterly milestones, budget allocation, risk flags, and measurable outcomes.",
    stakes: "A vague roadmap gets torn apart at the first quarterly review. Without specific milestones, every missed deadline is your fault."
  },
  '2-1': {
    situation: "Your team is about to build an AI-powered customer support triage system. The PM has given you a one-line brief: 'make AI handle tickets.' That's it.",
    objective: "Write a complete AI Spec Kit — Intent, Context, Constraints, Output Contract, Failure Modes — that an AI model could execute without further clarification.",
    stakes: "A vague spec produces an AI that hallucinates ticket priorities, misroutes P0 incidents, and destroys customer trust in 48 hours."
  },
  '2-2': {
    situation: "Your team ships in 2-week sprints. Sprint planning on Mondays. Standup daily. Retro on Fridays. AI is now part of every feature but your process hasn't changed at all.",
    objective: "Redesign your SDLC for AI. Identify where prompt engineering, evaluation, hallucination monitoring, and model drift detection fit.",
    stakes: "An AI feature that passes QA today can silently degrade in production. Without AI-native SDLC steps, you won't know until a customer complains."
  },
  '2-3': {
    situation: "You just shipped a feature: users type questions in natural language, your backend sends that directly to an LLM, the LLM generates SQL, your database executes it.",
    objective: "Audit this architecture for every security vulnerability. Prompt injection, data leakage, insecure output handling, supply chain risk — find them all.",
    stakes: "This architecture as described is a critical security failure. You need to identify exactly why before your CISO does — or before an attacker does."
  },
  '2-4': {
    situation: "You shipped an AI feature in 3 days using a third-party LLM API. Your VP of Engineering is furious: 'You've created a black box dependency with no SLA, no fallback, no understanding of what it does.'",
    objective: "Defend your architectural decision. Quantify the technical debt. Propose a credible mitigation plan with real timelines and costs.",
    stakes: "If you can't defend this, the feature gets rolled back. Worse, you lose trust as an engineer who can think about production consequences."
  },
  '2-5': {
    situation: "Your team uses GitHub Copilot for code, ChatGPT for docs, manual code review, and Jenkins for CI/CD. It is 2026. Your competitors are moving faster.",
    objective: "Design an AI-native dev workflow that will still make sense in 3 years. Spec-to-code pipelines, automated PR review, eval-driven testing — map it all out.",
    stakes: "Stick with the current workflow and you will be outbuilt by teams half your size. Design it wrong and you create automation that nobody trusts."
  },
  '3-1': {
    situation: "A VC just asked you: 'If OpenAI ships this as a default feature next month, does your product die?' You hesitated. That hesitation cost you the meeting.",
    objective: "Identify your company's real data moat. Proprietary data, embedded data, workflow data — what do you actually have that nobody can buy or replicate?",
    stakes: "Without a real moat, you are building on sand. Every competitor with a better model destroys your product overnight."
  },
  '3-2': {
    situation: "You are building a RAG system over 500 company PDFs, 200 Confluence pages, and 3 years of Slack history. Your manager wants it done in 2 weeks.",
    objective: "Design the complete RAG pipeline — ingestion, chunking, embedding, retrieval, generation. Every design decision must be justified with specific trade-offs.",
    stakes: "A poorly designed RAG pipeline retrieves wrong context, confuses the LLM, and produces confident wrong answers. Users trust it. That is worse than no AI."
  },
  '3-3': {
    situation: "You have just completed a RAG system over your company's internal data. You are about to go live. Before you do, you are running a final data audit.",
    objective: "Audit every data source in your RAG pipeline for sensitivity, GDPR compliance, and access control violations. Everything that should not be there must be found.",
    stakes: "Employee performance reviews, salary data, and health disclosures in a RAG system accessible to all staff is a GDPR Article 9 violation. Miss it and you face regulatory action."
  },
  '3-4': {
    situation: "You are presenting your RAG architecture to the engineering committee. One engineer immediately challenges: 'Why RAG? Why not just fine-tune? Or a structured prompt with key facts?'",
    objective: "Defend RAG for your specific use case with data. Retrieval accuracy, latency, cost per query, maintenance overhead — you need real numbers.",
    stakes: "If you cannot defend the architecture decision with evidence, the committee will reject it. You will rebuild from scratch on a different approach."
  },
  '3-5': {
    situation: "Your RAG system processes 100 queries per day. An investor just said: 'We want to fund this but only if you can show us it scales to 1 million queries.' Your current setup runs on one server.",
    objective: "Design the scaled architecture. Query scale, data scale, quality scale — how does everything change and what breaks first?",
    stakes: "Fail to answer this credibly and you lose the investment. Design it wrong and your first scale event causes a complete system failure in front of new customers."
  },
  '4-1': {
    situation: "Your manager wants you to automate the weekly engineering report. Currently it takes 3 hours: pull Jira data, pull GitHub stats, check Slack, write the summary, send to 15 people.",
    objective: "Design a Planner Agent that handles this end-to-end. Define perception, memory, reasoning, actions, and failure conditions at every step.",
    stakes: "An agent that sends a garbled report to 15 senior people at 6am on Monday destroys confidence in AI automation for the next 6 months."
  },
  '4-2': {
    situation: "Your company wants to automate the entire customer onboarding process: document verification, account setup, welcome email, first-week check-in. Currently this takes your team 4 hours per customer.",
    objective: "Design a multi-agent pipeline that handles all four stages. Define each agent, their tools, their handoff conditions, and every failure recovery scenario.",
    stakes: "A broken onboarding pipeline means new paying customers stuck in limbo. Every hour of delay costs revenue and destroys the first impression."
  },
  '4-3': {
    situation: "You want to deploy an agent that reads customer support emails, issues refunds up to £50, and escalates to humans when needed. Your head of customer service is deeply uncomfortable.",
    objective: "Design the human-in-the-loop framework. Define exactly when humans intervene, what they see, how long they have, and what happens if they don't respond.",
    stakes: "An agent that issues £50 refunds incorrectly at scale can cost hundreds of thousands. An agent that escalates everything defeats the point."
  },
  '4-4': {
    situation: "You deployed an agent that could merge PRs and trigger deployments autonomously when tests passed. Last night it deployed broken code to production at 3am. Revenue lost: £200,000 in 4 hours.",
    objective: "Run the post-mortem. Every decision that led here. Redesign the permission model. Define what the agent can never do autonomously.",
    stakes: "If you cannot demonstrate clear learning from this incident, the company bans all autonomous agents. Your AI programme is over."
  },
  '4-5': {
    situation: "You manage 6 developers. Three agents now handle code review, testing, and documentation. Your team is anxious. Two have started applying for jobs elsewhere.",
    objective: "Redesign your team around the Centaur model. What does each person do now that the agent handles their previous tasks? Write specific new role descriptions.",
    stakes: "Lose two engineers because you failed to communicate a clear vision and their new roles will cost £60,000+ in recruitment and 6 months of lost velocity."
  },
  '5-1': {
    situation: "Your company runs 4 AI systems in production: CV screening tool, customer churn predictor, internal code completion, and customer support chatbot. The EU AI Act is now enforced.",
    objective: "Classify every system into the correct EU AI Act risk tier. List every compliance obligation for each high-risk system. Identify which you currently meet.",
    stakes: "Wrong classification means you are either over-compliant (wasting money) or non-compliant (facing fines up to €30M or 6% of global turnover)."
  },
  '5-2': {
    situation: "Your biggest enterprise prospect requires ISO 42001 certification before signing. You have 12 months. You have never built a conformity file.",
    objective: "Build the Conformity File for your CV screening tool. Every section: system description, intended purpose, risk assessment, testing evidence, oversight procedures.",
    stakes: "Fail the ISO audit and you lose the enterprise contract. Worse, the gap analysis will expose every compliance weakness across your entire AI portfolio."
  },
  '5-3': {
    situation: "A candidate has filed a complaint. Your CV screening tool has been flagged by the UK AI Safety Institute for review. The regulator wants your documentation now.",
    objective: "Respond to a formal regulatory audit. Produce every requested document. Identify and remediate every gap before the regulator finds it first.",
    stakes: "A failed regulatory audit means system suspension, public disclosure, and potential fines. It also triggers review of every other AI system you run."
  },
  '5-4': {
    situation: "It is 6am. Your CISO calls. Your AI recommendation system has been breached. 50,000 customer records exposed via model inversion attack. The press are calling.",
    objective: "Make every decision in the next 72 hours correctly. System offline or not. Notification drafts. Legal liability. Vendor responsibility. Ransom demand.",
    stakes: "Every wrong decision compounds the damage. GDPR requires breach notification within 72 hours. The clock is running from the moment you answer this call."
  },
  '5-5': {
    situation: "Your board has just read about three AI disasters in the FT. They want to know why this cannot happen to your company. You have 30 minutes to present a complete Governance OS.",
    objective: "Build and defend a four-pillar AI Governance OS: Policy, Process, People, Technology. Every pillar must have specific owners, timelines, and measurable outcomes.",
    stakes: "Fail to satisfy the board and they mandate an external AI audit that costs £100,000+ and exposes every weakness you have been avoiding."
  },
  '6-1': {
    situation: "Your team of 5 has used GitHub Copilot for 3 months. Your VP asks: 'Show me the ROI in numbers. Not feelings. Numbers.' You have until end of day.",
    objective: "Build a hard-dollar ROI case. Measure actual time saved per task, convert to money, subtract all costs. Produce a number you would sign your name to.",
    stakes: "A vague ROI case means the licence gets cancelled. A wrong ROI case means you have misled your VP and damaged your credibility permanently."
  },
  '6-2': {
    situation: "Your VP says productivity is up 20% since Copilot based on ticket velocity. Your developers say they are more stressed than ever. Both cannot be right.",
    objective: "Build a DX Core 4 Dashboard measuring Speed, Quality, Satisfaction, and Sustainability. Identify what is actually happening versus what the metrics suggest.",
    stakes: "Optimising for the wrong metric destroys your team. Fast unhappy engineers who ship broken code are worse than slow careful ones."
  },
  '6-3': {
    situation: "Your team has submitted to the annual report: 'AI tools saved 1,200 developer hours this quarter representing £120,000 in productivity gains.' The CFO wants to audit this claim.",
    objective: "Defend every number in this claim under audit conditions. Methodology, data integrity, comparability — every assumption must survive scrutiny.",
    stakes: "A claim in an annual report that cannot be defended is a material misstatement. The consequences range from embarrassment to regulatory investigation."
  },
  '6-4': {
    situation: "You have 5 minutes with the CFO to approve £200,000 for an AI engineering platform. The CFO has rejected the last three AI investment proposals from other teams.",
    objective: "Deliver a financial case that answers three questions without being asked: When do we break even? What if it underdelivers by 50%? What is the exit cost?",
    stakes: "This is the last AI budget conversation you get this year. Fail and the entire programme is deprioritised until next fiscal year."
  },
  '6-5': {
    situation: "Your board demands a 3-year AI ROI model. The problem: AI is changing so fast that any single forecast is almost certainly wrong. They want precision you cannot honestly provide.",
    objective: "Build three scenarios: Conservative, Base Case, Aggressive. Every scenario must have specific assumptions, specific numbers, and honest error bars.",
    stakes: "A single-point forecast that misses by 40% destroys board confidence in AI investments for years. Scenario planning protects you and keeps the programme funded."
  },
};

export default function ExploreLevel({ module, level, user, progress, onComplete }: ExploreLevelProps) {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [messages, setMessages]             = useState<Message[]>([]);
  const [input, setInput]                   = useState('');
  const [isLoading, setIsLoading]           = useState(false);
  const [currentScore, setCurrentScore]     = useState<number | null>(null);
  const [isJustified, setIsJustified]       = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const key      = `${module.id}-${level.id}`;
  const scenario = OPENING_SCENARIOS[key];
  const exchanges = messages.filter(m => m.role === 'user').length;
  const canComplete = exchanges >= MIN_EXCHANGES && (currentScore !== null && currentScore >= PASS_SCORE);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startSession = async () => {
    setSessionStarted(true);
    setIsLoading(true);
    try {
      const reply = await getAgentReply(
        module.id, level.id, user.name,
        [{ role: 'user', content: 'Begin the session. Present the first challenge.' }],
        progress.decisions, progress.ghostMissed
      );
      setMessages([{ role: 'model', content: reply || 'Let us begin.' }]);
    } catch {
      setMessages([{ role: 'model', content: 'Connection error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    try {
      const reply = await getAgentReply(
        module.id, level.id, user.name,
        newMessages, progress.decisions, progress.ghostMissed
      );
      const botMsg: Message = { role: 'model', content: reply || 'Continue.' };
      setMessages(prev => [...prev, botMsg]);

      // Extract score
      const scoreMatch = reply?.match(/Score:\s*(\d+)/i);
      if (scoreMatch) {
        const s = parseInt(scoreMatch[1]);
        setCurrentScore(s);
        if (s >= PASS_SCORE) setIsJustified(true);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'model', content: 'Connection error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Scenario gate ────────────────────────────────────────────
  if (!sessionStarted && scenario) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Level header */}
          <div className="mb-8">
            <div className="text-[10px] uppercase tracking-widest font-bold text-brand-muted mb-2">
              Module {module.id} · Level {level.id} · {level.type.toUpperCase()}
            </div>
            <h1 className="text-3xl font-display font-bold text-brand-charcoal">{level.title}</h1>
          </div>

          {/* Scenario card */}
          <div className="bg-brand-navy text-white rounded-3xl p-8 mb-6">
            <div className="text-[10px] uppercase tracking-widest font-bold text-brand-gold mb-4">Your Situation</div>
            <p className="text-lg leading-relaxed text-white/90 mb-8">{scenario.situation}</p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-2xl p-5">
                <div className="text-[10px] uppercase tracking-widest font-bold text-brand-gold mb-3">Your Objective</div>
                <p className="text-sm text-white/80 leading-relaxed">{scenario.objective}</p>
              </div>
              <div className="bg-red-500/20 border border-red-400/30 rounded-2xl p-5">
                <div className="text-[10px] uppercase tracking-widest font-bold text-red-300 mb-3">What's at Stake</div>
                <p className="text-sm text-white/80 leading-relaxed">{scenario.stakes}</p>
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="bg-brand-paper border border-brand-charcoal/10 rounded-2xl p-6 mb-8 space-y-3">
            <div className="text-[10px] uppercase tracking-widest font-bold text-brand-muted mb-4">Session Rules</div>
            {[
              `Minimum ${MIN_EXCHANGES} exchanges before completion is available`,
              `You must score ${PASS_SCORE}/100 or above — vague answers will not pass`,
              'The AI consultant will challenge every claim — prepare to defend with specifics and numbers',
              'Completion is only unlocked when you have genuinely justified your position',
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-brand-muted">
                <div className="w-5 h-5 bg-brand-navy/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-brand-navy">{i + 1}</div>
                {rule}
              </div>
            ))}
          </div>

          <button
            onClick={startSession}
            className="w-full bg-brand-navy text-white rounded-2xl py-5 font-bold text-lg hover:bg-brand-charcoal transition-all shadow-xl flex items-center justify-center gap-3"
          >
            Enter the Scenario <ChevronRight size={20} />
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Chat interface ───────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto border-x border-brand-charcoal/5 bg-white shadow-sm">

      {/* Progress bar */}
      <div className="px-6 py-3 border-b border-brand-charcoal/5 bg-brand-paper/50 flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-brand-muted">
              {level.title}
            </span>
            <span className="text-[10px] font-bold text-brand-muted">
              {exchanges}/{MIN_EXCHANGES} exchanges
              {currentScore !== null && ` · Score: ${currentScore}/100`}
            </span>
          </div>
          <div className="w-full bg-brand-charcoal/10 rounded-full h-1.5">
            <div
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                canComplete ? "bg-green-500" : isJustified ? "bg-brand-amber" : "bg-brand-navy"
              )}
              style={{ width: `${Math.min((exchanges / MIN_EXCHANGES) * 100, 100)}%` }}
            />
          </div>
        </div>

        <AnimatePresence>
          {canComplete && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => onComplete(currentScore || 80, { exchanges, score: currentScore, justified: true })}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-md whitespace-nowrap flex items-center gap-2"
            >
              Complete ✓
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {!sessionStarted && isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-brand-navy" size={32} />
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 max-w-[88%]",
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
                  : "bg-brand-paper border border-brand-charcoal/5 rounded-tl-none text-brand-charcoal"
              )}>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex gap-4 max-w-[88%] mr-auto">
            <div className="w-8 h-8 rounded-full bg-brand-navy flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="p-4 rounded-2xl bg-brand-paper border border-brand-charcoal/5 rounded-tl-none flex items-center gap-2">
              <Loader2 className="animate-spin text-brand-navy/40" size={16} />
              <span className="text-xs text-brand-muted">Analysing your response…</span>
            </div>
          </div>
        )}

        {/* Warning if exchanges done but score too low */}
        {exchanges >= MIN_EXCHANGES && currentScore !== null && currentScore < PASS_SCORE && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">Not yet justified — score {currentScore}/100</p>
              <p className="text-xs text-amber-700 mt-1">You need {PASS_SCORE}/100 to complete. Keep defending your position with specifics and numbers.</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-5 border-t border-brand-charcoal/10 bg-brand-paper/50">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Address the consultant's challenge. Be specific. Use numbers."
            rows={3}
            className="flex-1 bg-white border border-brand-charcoal/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-navy transition-colors resize-none shadow-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="h-12 w-12 bg-brand-navy text-white rounded-xl flex items-center justify-center hover:bg-brand-charcoal transition-all disabled:opacity-40 shadow-md"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-brand-muted text-center mt-3 uppercase tracking-widest font-bold">
          Shift + Enter for new line · Enter to send
        </p>
      </div>
    </div>
  );
}
