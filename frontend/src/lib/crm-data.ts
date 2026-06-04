// Mock data store for the Agentic CRM demo.
// Stays in-memory; shaped to mirror the spec's tables.

export type LifecycleStage =
  | "prospect"
  | "qualified"
  | "engaged"
  | "opportunity"
  | "customer"
  | "advocate";

export type PipelineStage =
  | "identified"
  | "qualified"
  | "proposal_sent"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  industry: string;
  companySize: string;
  stage: LifecycleStage;
  health: number; // 0-100
  channels: ("instagram" | "linkedin" | "whatsapp" | "email" | "tiktok")[];
  lastInteraction: string; // ISO
  source: string;
  owner: string;
  avatarHue: number;
  rfm?: { r: number; f: number; m: number; segment: string };
}

export interface TimelineEvent {
  id: string;
  contactId: string;
  ts: string;
  channel: string;
  kind: "engagement" | "message" | "agent" | "stage" | "system";
  title: string;
  detail?: string;
  agent?: string;
}

export interface Opportunity {
  id: string;
  contactId: string;
  title: string;
  amount: number;
  stage: PipelineStage;
  probability: number; // 0..1
  closeDate: string;
  owner: string;
  qualReason: string;
  stalledDays?: number;
}

export interface Proposal {
  id: string;
  opportunityId: string;
  contactName: string;
  company: string;
  amount: number;
  status: "drafting" | "review" | "sent" | "accepted" | "rejected";
  createdAt: string;
  sections: number;
  template: string;
  agentConfidence: number;
}

export interface FollowUp {
  id: string;
  contactId: string;
  contactName: string;
  channel: "whatsapp" | "email" | "linkedin" | "call";
  message: string;
  scheduledAt: string;
  status: "queued" | "executed" | "skipped";
  reasoning: string;
  agent: string;
}

export interface RetentionSignal {
  id: string;
  contactId: string;
  contactName: string;
  company: string;
  signalType: string;
  severity: "low" | "medium" | "high";
  churnProbability: number;
  detail: string;
  createdAt: string;
  intervention: "pending" | "running" | "resolved";
}

export interface AgentRun {
  id: string;
  agent: string;
  graph: string;
  status: "succeeded" | "running" | "needs_review" | "failed";
  startedAt: string;
  duration: number; // sec
  tokens: number;
  contactId?: string;
  trace: { step: string; thought: string; tool?: string; output?: string }[];
}

export const owners = ["Maya R.", "Daniel K.", "Inès B.", "Tomás L."];

export const contacts: Contact[] = [
  { id: "c-001", name: "Hana Mori", email: "hana.mori@nordwave.co", phone: "+45 22 14 99 02", company: "Nordwave Audio", role: "Head of Growth", industry: "Consumer electronics", companySize: "120", stage: "opportunity", health: 86, channels: ["instagram","whatsapp","email"], lastInteraction: "2026-06-02T09:14:00Z", source: "Instagram ad · DICM-731", owner: "Maya R.", avatarHue: 268, rfm: { r:5, f:4, m:5, segment:"Champion" } },
  { id: "c-002", name: "Yusuf Demir", email: "y.demir@aterra.io", phone: "+90 530 442 21 03", company: "Aterra Robotics", role: "VP Sales", industry: "Industrial automation", companySize: "340", stage: "qualified", health: 71, channels: ["linkedin","email"], lastInteraction: "2026-06-01T16:30:00Z", source: "LinkedIn comment", owner: "Daniel K.", avatarHue: 180, rfm:{r:4,f:3,m:4,segment:"Loyal"} },
  { id: "c-003", name: "Priya Shankar", email: "priya@lumenlabs.in", phone: "+91 98430 11 092", company: "Lumen Labs", role: "Founder", industry: "EdTech", companySize: "18", stage: "engaged", health: 64, channels: ["whatsapp","instagram"], lastInteraction: "2026-05-30T12:02:00Z", source: "WhatsApp inbound", owner: "Inès B.", avatarHue: 25, rfm:{r:3,f:3,m:2,segment:"Potential"} },
  { id: "c-004", name: "Magnus Olafsen", email: "m.olafsen@fjordbyte.no", phone: "+47 902 11 884", company: "FjordByte", role: "Director of Marketing", industry: "SaaS", companySize: "82", stage: "customer", health: 92, channels: ["email","linkedin","whatsapp"], lastInteraction: "2026-06-02T07:45:00Z", source: "Inbound referral", owner: "Maya R.", avatarHue: 200, rfm:{r:5,f:5,m:5,segment:"Champion"} },
  { id: "c-005", name: "Lucia Romero", email: "lucia@vidacafe.mx", phone: "+52 55 4422 9981", company: "Vida Café", role: "CMO", industry: "F&B", companySize: "240", stage: "opportunity", health: 78, channels: ["tiktok","instagram","whatsapp"], lastInteraction: "2026-06-01T22:11:00Z", source: "TikTok campaign", owner: "Tomás L.", avatarHue: 15, rfm:{r:4,f:4,m:4,segment:"Loyal"} },
  { id: "c-006", name: "Aiko Tanaka", email: "aiko.t@kintora.jp", phone: "+81 3 4567 1122", company: "Kintora", role: "Procurement Lead", industry: "Logistics", companySize: "1.2k", stage: "prospect", health: 41, channels: ["linkedin"], lastInteraction: "2026-05-25T08:20:00Z", source: "LinkedIn ad", owner: "Daniel K.", avatarHue: 320, rfm:{r:2,f:1,m:1,segment:"At risk"} },
  { id: "c-007", name: "Femi Adesanya", email: "femi@bluetide.ng", phone: "+234 803 221 9911", company: "BlueTide Energy", role: "COO", industry: "Renewables", companySize: "65", stage: "advocate", health: 96, channels: ["email","whatsapp","linkedin"], lastInteraction: "2026-06-02T11:02:00Z", source: "Referral · NPS 10", owner: "Inès B.", avatarHue: 160, rfm:{r:5,f:5,m:5,segment:"Champion"} },
  { id: "c-008", name: "Chloé Bernard", email: "chloe@maisonpli.fr", phone: "+33 6 78 22 14 90", company: "Maison Pli", role: "Owner", industry: "Retail", companySize: "12", stage: "engaged", health: 58, channels: ["instagram","whatsapp"], lastInteraction: "2026-05-28T18:44:00Z", source: "Instagram DM", owner: "Tomás L.", avatarHue: 300, rfm:{r:3,f:2,m:2,segment:"Needs nurture"} },
  { id: "c-009", name: "Rahul Mehta", email: "rahul@quantastra.com", phone: "+1 415 998 2230", company: "Quantastra", role: "Head of RevOps", industry: "FinTech", companySize: "410", stage: "qualified", health: 73, channels: ["linkedin","email"], lastInteraction: "2026-06-02T02:00:00Z", source: "Webinar signup", owner: "Maya R.", avatarHue: 240, rfm:{r:4,f:3,m:4,segment:"Loyal"} },
  { id: "c-010", name: "Sara Lindqvist", email: "sara.l@hagenstudio.se", phone: "+46 70 998 1144", company: "Hagen Studio", role: "Creative Director", industry: "Design", companySize: "9", stage: "prospect", health: 38, channels: ["instagram"], lastInteraction: "2026-05-22T10:08:00Z", source: "Instagram comment", owner: "Inès B.", avatarHue: 50, rfm:{r:2,f:1,m:1,segment:"At risk"} },
  { id: "c-011", name: "Dimitri Volkov", email: "d.volkov@arctel.ee", phone: "+372 5512 0099", company: "Arctel", role: "Sales Director", industry: "Telecom", companySize: "780", stage: "opportunity", health: 81, channels: ["email","linkedin","whatsapp"], lastInteraction: "2026-06-02T13:24:00Z", source: "Outbound · LinkedIn", owner: "Daniel K.", avatarHue: 210, rfm:{r:5,f:4,m:5,segment:"Champion"} },
  { id: "c-012", name: "Aria Patel", email: "aria@solivagrove.com", phone: "+1 646 220 1188", company: "Soliva Grove", role: "Marketing Manager", industry: "Wellness", companySize: "44", stage: "customer", health: 88, channels: ["email","instagram","whatsapp"], lastInteraction: "2026-06-01T19:55:00Z", source: "Referral", owner: "Tomás L.", avatarHue: 130, rfm:{r:5,f:4,m:4,segment:"Loyal"} },
];

export const timeline: TimelineEvent[] = [
  { id:"t1", contactId:"c-001", ts:"2026-06-02T09:14:00Z", channel:"whatsapp", kind:"message", title:"Replied to proposal preview", detail:"\"Looks great, can we add a Q3 milestone?\"" },
  { id:"t2", contactId:"c-001", ts:"2026-06-02T08:55:00Z", channel:"agent", kind:"agent", title:"Agent H2 drafted proposal v2", detail:"Confidence 0.91 · 6 sections · $48k", agent:"Proposal Drafting" },
  { id:"t3", contactId:"c-001", ts:"2026-06-01T20:12:00Z", channel:"email", kind:"engagement", title:"Opened pricing one-pager (3rd time)" },
  { id:"t4", contactId:"c-001", ts:"2026-05-31T11:00:00Z", channel:"system", kind:"stage", title:"Lifecycle: engaged → opportunity", detail:"Health crossed 80 threshold" },
  { id:"t5", contactId:"c-001", ts:"2026-05-30T16:42:00Z", channel:"instagram", kind:"engagement", title:"Clicked launch reel link" },
  { id:"t6", contactId:"c-001", ts:"2026-05-28T09:10:00Z", channel:"agent", kind:"agent", title:"Agent G1 enriched profile", detail:"Clearbit · added role, company size, tech stack", agent:"Contact Profile" },
];

export const opportunities: Opportunity[] = [
  { id:"o1", contactId:"c-001", title:"Nordwave · Launch campaign Q3", amount:48000, stage:"proposal_sent", probability:0.6, closeDate:"2026-07-12", owner:"Maya R.", qualReason:"3 pricing-page visits, asked timeline, budget confirmed" },
  { id:"o2", contactId:"c-002", title:"Aterra · Pilot deployment", amount:124000, stage:"qualified", probability:0.45, closeDate:"2026-08-04", owner:"Daniel K.", qualReason:"Procurement intro, technical fit confirmed", stalledDays:2 },
  { id:"o3", contactId:"c-005", title:"Vida Café · Loyalty rollout", amount:36000, stage:"negotiation", probability:0.72, closeDate:"2026-06-22", owner:"Tomás L.", qualReason:"Negotiating annual commit terms" },
  { id:"o4", contactId:"c-011", title:"Arctel · Enterprise tier", amount:215000, stage:"proposal_sent", probability:0.55, closeDate:"2026-08-30", owner:"Daniel K.", qualReason:"Multi-stakeholder, security review cleared" },
  { id:"o5", contactId:"c-009", title:"Quantastra · RevOps add-on", amount:62000, stage:"qualified", probability:0.4, closeDate:"2026-07-28", owner:"Maya R.", qualReason:"Champion identified, demo scheduled" },
  { id:"o6", contactId:"c-004", title:"FjordByte · Expansion", amount:88000, stage:"identified", probability:0.25, closeDate:"2026-09-15", owner:"Maya R.", qualReason:"Usage up 38% MoM, expansion signal" },
  { id:"o7", contactId:"c-007", title:"BlueTide · Renewal + upsell", amount:142000, stage:"negotiation", probability:0.78, closeDate:"2026-06-30", owner:"Inès B.", qualReason:"Advocate, NPS 10, upsell discussed" },
  { id:"o8", contactId:"c-012", title:"Soliva Grove · Retainer", amount:24000, stage:"closed_won", probability:1, closeDate:"2026-05-28", owner:"Tomás L.", qualReason:"Signed · 12-month" },
  { id:"o9", contactId:"c-003", title:"Lumen Labs · Pilot", amount:18000, stage:"identified", probability:0.3, closeDate:"2026-08-10", owner:"Inès B.", qualReason:"WhatsApp inbound, fit assessment in progress" },
];

export const proposals: Proposal[] = [
  { id:"p1", opportunityId:"o1", contactName:"Hana Mori", company:"Nordwave Audio", amount:48000, status:"review", createdAt:"2026-06-02T08:55:00Z", sections:6, template:"Launch Campaign · v3", agentConfidence:0.91 },
  { id:"p2", opportunityId:"o4", contactName:"Dimitri Volkov", company:"Arctel", amount:215000, status:"sent", createdAt:"2026-05-30T14:20:00Z", sections:9, template:"Enterprise · v2", agentConfidence:0.84 },
  { id:"p3", opportunityId:"o3", contactName:"Lucia Romero", company:"Vida Café", amount:36000, status:"accepted", createdAt:"2026-05-27T10:10:00Z", sections:5, template:"Loyalty Program", agentConfidence:0.88 },
  { id:"p4", opportunityId:"o7", contactName:"Femi Adesanya", company:"BlueTide Energy", amount:142000, status:"review", createdAt:"2026-06-01T17:02:00Z", sections:7, template:"Renewal + Upsell", agentConfidence:0.93 },
  { id:"p5", opportunityId:"o5", contactName:"Rahul Mehta", company:"Quantastra", amount:62000, status:"drafting", createdAt:"2026-06-02T11:40:00Z", sections:4, template:"RevOps Add-on", agentConfidence:0.71 },
];

export const followUps: FollowUp[] = [
  { id:"f1", contactId:"c-002", contactName:"Yusuf Demir", channel:"linkedin", message:"Share the deployment architecture brief; reference last week's robotics keynote.", scheduledAt:"2026-06-03T09:00:00Z", status:"queued", reasoning:"Stage stalled 2 days; engagement on architecture content historically lifts response 2.4x.", agent:"Next Best Action" },
  { id:"f2", contactId:"c-008", contactName:"Chloé Bernard", channel:"whatsapp", message:"Send Spring lookbook with bespoke styling note.", scheduledAt:"2026-06-03T11:30:00Z", status:"queued", reasoning:"7-day silence, last 3 touches were on Instagram; channel rotation due.", agent:"Next Best Action" },
  { id:"f3", contactId:"c-010", contactName:"Sara Lindqvist", channel:"email", message:"Studio-focused case study + offer 20-min portfolio review.", scheduledAt:"2026-06-03T15:00:00Z", status:"queued", reasoning:"Health dropping; high-fit ICP; offer-based re-engagement.", agent:"Re-engagement" },
  { id:"f4", contactId:"c-001", contactName:"Hana Mori", channel:"whatsapp", message:"Confirm Q3 milestone addition; share revised SOW preview.", scheduledAt:"2026-06-02T16:00:00Z", status:"executed", reasoning:"Direct ask on proposal; high-intent.", agent:"Next Best Action" },
  { id:"f5", contactId:"c-006", contactName:"Aiko Tanaka", channel:"linkedin", message:"Skipped — frequency cap (3 touches / 7 days).", scheduledAt:"2026-06-02T12:00:00Z", status:"skipped", reasoning:"Channel-gating rule triggered; deferred to next window.", agent:"Next Best Action" },
];

export const retentionSignals: RetentionSignal[] = [
  { id:"r1", contactId:"c-006", contactName:"Aiko Tanaka", company:"Kintora", signalType:"Engagement decay", severity:"high", churnProbability:0.78, detail:"No interaction 8 days · last 3 emails unopened", createdAt:"2026-06-01T08:00:00Z", intervention:"running" },
  { id:"r2", contactId:"c-010", contactName:"Sara Lindqvist", company:"Hagen Studio", signalType:"Negative sentiment", severity:"medium", churnProbability:0.52, detail:"Sentiment dropped after pricing reply", createdAt:"2026-05-31T14:12:00Z", intervention:"pending" },
  { id:"r3", contactId:"c-008", contactName:"Chloé Bernard", company:"Maison Pli", signalType:"Channel silence", severity:"medium", churnProbability:0.46, detail:"WhatsApp unread 7d after 2 attempts", createdAt:"2026-06-02T09:30:00Z", intervention:"pending" },
  { id:"r4", contactId:"c-004", contactName:"Magnus Olafsen", company:"FjordByte", signalType:"Usage anomaly", severity:"low", churnProbability:0.18, detail:"Login frequency -22% WoW", createdAt:"2026-06-02T06:00:00Z", intervention:"resolved" },
];

export const agentRuns: AgentRun[] = [
  { id:"a1", agent:"Proposal Drafting (H2)", graph:"crm/draft-proposal", status:"needs_review", startedAt:"2026-06-02T08:55:00Z", duration:34.2, tokens:18420, contactId:"c-001",
    trace:[
      { step:"load_context", thought:"Pull contact, opportunity, prior emails, and template Launch v3." },
      { step:"select_template", thought:"Launch v3 matches industry=Consumer Electronics + budget tier ≥ $40k.", tool:"templates.match", output:"template_id=launch_v3" },
      { step:"draft_sections", thought:"Generate 6 sections; pull case study Aterra similarity 0.82.", tool:"llm.claude-sonnet-4" },
      { step:"price_calc", thought:"Apply tiered pricing; confirm volume rebate not applicable.", output:"$48,000" },
      { step:"self_critique", thought:"Section 3 (timeline) lacks Q3 milestone explicitly requested in last WA msg. Flag for human review.", output:"needs_review=true" },
    ]},
  { id:"a2", agent:"Next Best Action (I1)", graph:"crm/nba", status:"succeeded", startedAt:"2026-06-02T11:00:00Z", duration:4.8, tokens:2110, contactId:"c-002",
    trace:[
      { step:"frequency_check", thought:"Within cap. Last touch 2d ago on email.", output:"ok" },
      { step:"channel_rotate", thought:"Rotate to LinkedIn; engagement higher on technical content.", output:"channel=linkedin" },
      { step:"compose", thought:"Share architecture brief; reference last week's keynote.", tool:"llm.claude-sonnet-4" },
      { step:"schedule", thought:"Next business window 09:00 CET.", output:"2026-06-03T09:00Z" },
    ]},
  { id:"a3", agent:"Retention Intervention (J1)", graph:"crm/retention", status:"running", startedAt:"2026-06-02T12:30:00Z", duration:12.1, tokens:5400, contactId:"c-006",
    trace:[
      { step:"signal_assess", thought:"Engagement decay 8d, P(churn)=0.78. High severity." },
      { step:"select_play", thought:"Use 'value-recap + soft check-in' play; not discount (preserve margin).", output:"play=value_recap" },
      { step:"compose", thought:"Drafting personalized recap referencing pilot KPI 23% throughput gain.", tool:"llm.claude-sonnet-4" },
    ]},
  { id:"a4", agent:"Contact Profile (G1)", graph:"crm/build-contact", status:"succeeded", startedAt:"2026-06-02T07:14:00Z", duration:2.1, tokens:820, contactId:"c-009",
    trace:[
      { step:"dedupe", thought:"Match on email exact; no duplicate." },
      { step:"enrich", thought:"Clearbit hit: RevOps lead, 410 FTE, FinTech.", tool:"clearbit.enrich" },
      { step:"score_health", thought:"Webinar attend + 2 email opens → 73." },
    ]},
  { id:"a5", agent:"Opportunity Qualification (H1)", graph:"crm/qualify", status:"failed", startedAt:"2026-06-02T05:02:00Z", duration:7.6, tokens:3120,
    trace:[
      { step:"load_context", thought:"Insufficient signal data; only 1 interaction logged." },
      { step:"abort", thought:"Falling below confidence threshold 0.4; will retry in 24h.", output:"error=low_confidence" },
    ]},
];

export const pipelineStages: { key: PipelineStage; label: string }[] = [
  { key: "identified", label: "Identified" },
  { key: "qualified", label: "Qualified" },
  { key: "proposal_sent", label: "Proposal sent" },
  { key: "negotiation", label: "Negotiation" },
  { key: "closed_won", label: "Closed won" },
  { key: "closed_lost", label: "Closed lost" },
];

export const lifecycleStages: LifecycleStage[] = [
  "prospect", "qualified", "engaged", "opportunity", "customer", "advocate",
];

export function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", maximumFractionDigits:0 }).format(n);
}
export function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return `${Math.floor(d)}s ago`;
  if (d < 3600) return `${Math.floor(d/60)}m ago`;
  if (d < 86400) return `${Math.floor(d/3600)}h ago`;
  return `${Math.floor(d/86400)}d ago`;
}
export function getContact(id?: string) {
  return contacts.find(c => c.id === id);
}
