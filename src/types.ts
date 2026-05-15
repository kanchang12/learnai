export type Tier = 'foundation' | 'professional' | 'full';

export interface Level {
  id: number;
  type: 'explore' | 'design' | 'comply' | 'defend' | 'future';
  title: string;
  ghost?: boolean;
}

export interface Module {
  id: number;
  code: string;
  title: string;
  tagline: string;
  tier: Tier;
  ghost?: boolean;
  levels: Level[];
}

export interface UserProgress {
  completedLevels: Record<string, boolean>; // e.g., "1-1": true
  scores: Record<string, number>; // e.g., "1-1": 85
  decisions: Record<string, any>;
  ghostMissed: boolean;
}

export interface User {
  name: string;
  email: string;
  tier: Tier;
}

export const MODULES: Module[] = [
  {
    id: 1,
    code: "M1",
    title: "Work Redesign & Strategy",
    tagline: "Break legacy workflows. Let AI hit the P&L.",
    tier: "foundation",
    levels: [
      { id: 1, type: "explore", title: "AI Readiness Audit" },
      { id: 2, type: "design", title: "Redesign the Org Chart" },
      { id: 3, type: "comply", title: "Policy Obligations" },
      { id: 4, type: "defend", title: "Board Justification" },
      { id: 5, type: "future", title: "12-Month Roadmap" },
    ],
  },
  {
    id: 2,
    code: "M2",
    title: "AI-Led SDLC",
    tagline: "From coder to articulator of intent.",
    tier: "foundation",
    levels: [
      { id: 1, type: "explore", title: "Write Your Spec Kit" },
      { id: 2, type: "design", title: "Map the SDLC Flow" },
      { id: 3, type: "comply", title: "Spec Security Audit" },
      { id: 4, type: "defend", title: "Speed vs Tech Debt" },
      { id: 5, type: "future", title: "AI-Native Dev Workflow" },
    ],
  },
  {
    id: 3,
    code: "M3",
    title: "RAG & Data Moat",
    tagline: "Build thick products. Not thin wrappers.",
    tier: "foundation",
    ghost: true,
    levels: [
      { id: 1, type: "explore", title: "Identify Your Moat" },
      { id: 2, type: "design", title: "Build RAG Pipeline" },
      { id: 3, type: "comply", title: "Data Sensitivity Audit", ghost: true },
      { id: 4, type: "defend", title: "Architecture Defence" },
      { id: 5, type: "future", title: "Scale to 10×" },
    ],
  },
  {
    id: 4,
    code: "M4",
    title: "Agentic Workflows",
    tagline: "From UX to AX. Autonomous digital workforces.",
    tier: "professional",
    levels: [
      { id: 1, type: "explore", title: "First Planner Agent" },
      { id: 2, type: "design", title: "Multi-Agent Pipeline" },
      { id: 3, type: "comply", title: "Human-in-the-Loop" },
      { id: 4, type: "defend", title: "Autonomy Justification" },
      { id: 5, type: "future", title: "Centaur Team Design" },
    ],
  },
  {
    id: 5,
    code: "M5",
    title: "Governance OS",
    tagline: "EU AI Act + ISO 42001. Compliance that scales.",
    tier: "professional",
    ghost: true,
    levels: [
      { id: 1, type: "explore", title: "Risk Tier Audit" },
      { id: 2, type: "design", title: "Build Conformity File" },
      { id: 3, type: "comply", title: "Mock Regulator Audit", ghost: true },
      { id: 4, type: "defend", title: "Data Breach Crisis" },
      { id: 5, type: "future", title: "Governance Roadmap" },
    ],
  },
  {
    id: 6,
    code: "M6",
    title: "ROI & DX Core 4",
    tagline: "Prove ₹10.30 return per ₹1.00 invested.",
    tier: "full",
    levels: [
      { id: 1, type: "explore", title: "Reclaimed Hours Calculator" },
      { id: 2, type: "design", title: "DX Core 4 Dashboard" },
      { id: 3, type: "comply", title: "Audit Validation" },
      { id: 4, type: "defend", title: "CFO Presentation" },
      { id: 5, type: "future", title: "3-Year ROI Model" },
    ],
  },
];
