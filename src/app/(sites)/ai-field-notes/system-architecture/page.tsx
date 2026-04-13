"use client";

import { useState } from "react";
import { Container } from "@/components/ui/container";

/* ─── data ──────────────────────────────────────────────── */

const databases = [
  {
    name: "AI Fluency Coaching",
    path: "~/ai-coaching/coaching.db",
    size: "140 KB",
    records: "305",
    purpose: "Skills, builds, tools, pain points, goals, terrain map",
    tables: 13,
    highlights: [
      "45 skills (avg 6.7/10)",
      "42 builds tracked",
      "76 pain points",
      "37 tools in terrain map",
    ],
  },
  {
    name: "Personal RAG (Karpathy-style)",
    path: "~/.rag-db/rag.db",
    size: "163 MB",
    records: "219,888",
    purpose: "Unified knowledge base — FTS5 full-text search, no vector DB",
    tables: 13,
    highlights: [
      "219K Workflowy nodes ingested",
      "104 compiled wiki pages",
      "2,871 cross-references",
      "127 tags",
    ],
  },
  {
    name: "Stream Deck Config",
    path: "~/.streamdeck-db/streamdeck.db",
    size: "892 KB",
    records: "500+",
    purpose: "Stream Deck XL hardware config cache — plugins, buttons, marketplace",
    tables: 10,
    highlights: [
      "330 actions available",
      "638 marketplace plugins cached",
      "6 button templates",
      "Stream Deck XL (8x4)",
    ],
  },
  {
    name: "Workflowy Cache",
    path: "~/.workflowy-mcp/workflowy-cache.db",
    size: "476 MB",
    records: "250,000+",
    purpose: "Local cache of entire Workflowy outline for fast search",
    tables: 0,
    highlights: [
      "Hourly auto-sync",
      "Full 250K+ node outline",
      "WAL mode for safety",
      "Powers Workflowy MCP",
    ],
  },
];

const mcpServers = [
  {
    name: "Workflowy MCP",
    type: "Custom-Built",
    transport: "stdio (Node.js)",
    tools: 7,
    description: "Search, create, move, complete Workflowy nodes. 16 bookmarks mapped to Areas of Responsibility.",
  },
  {
    name: "Discord MCP",
    type: "Custom-Built",
    transport: "stdio (Node.js)",
    tools: 0,
    description: "Full Discord API access — messages, channels, threads, roles.",
  },
  {
    name: "Karpathy-RAG (SQLite)",
    type: "Anthropic Official",
    transport: "stdio",
    tools: 0,
    description: "SQL query access to the RAG knowledge base from Claude Desktop/Chat.",
  },
  {
    name: "Notion",
    type: "Plugin",
    transport: "HTTP",
    tools: 0,
    description: "Create/read/update Notion pages, databases, comments, views.",
  },
  {
    name: "Context7",
    type: "Plugin",
    transport: "stdio (npx)",
    tools: 0,
    description: "Real-time library/framework documentation lookup. Prevents stale API syntax.",
  },
];

const skills = [
  {
    category: "RAG Database",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
    items: [
      { name: "/rag-init", desc: "Bootstrap database" },
      { name: "/rag-ingest", desc: "Add from 6 source types" },
      { name: "/rag-query", desc: "FTS5 search + citations" },
      { name: "/rag-status", desc: "Dashboard & counts" },
      { name: "/rag-update", desc: "Retag, link, archive" },
      { name: "/rag-lint", desc: "Health checks" },
      { name: "/rag-sync", desc: "Re-ingest changed sources" },
      { name: "/rag-compile", desc: "Build wiki pages" },
      { name: "/rag-relate", desc: "Cross-reference graph" },
    ],
  },
  {
    category: "AI Coaching",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    items: [
      { name: "/coach", desc: "Profile, gaps, terrain, pre-build" },
      { name: "/coachme", desc: "Full coaching session" },
      { name: "/vod-coach", desc: "Daily life VOD review" },
    ],
  },
  {
    category: "Workflowy",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
    items: [
      { name: "/workflowy-system", desc: "250K+ node structural knowledge" },
      { name: "/workflowy-format", desc: "Paste-ready outline output" },
    ],
  },
  {
    category: "Tools & Hardware",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    items: [
      { name: "/streamdeck", desc: "Natural language button builder" },
      { name: "/notebooklm", desc: "Document Q&A via browser automation" },
      { name: "/claude-log", desc: "Session logging & tracking" },
    ],
  },
];

const externalServices = [
  { name: "Workflowy", role: "Life operating system", nodes: "250K+", connection: "Custom MCP server + 2 skills" },
  { name: "Notion", role: "Daily execution surface", pages: "Tiny Desk, Cockpit, Task DB, Builds Log", connection: "Notion MCP plugin" },
  { name: "Discord", role: "Notifications + community", detail: "Webhook alerts + bot API", connection: "Hook script + MCP server" },
  { name: "Google NotebookLM", role: "Source-grounded Q&A", detail: "Browser-automated, 50 queries/day", connection: "/notebooklm skill" },
  { name: "GitHub", role: "Code hosting + AI Clubhouse", detail: "karwisch/aiclubhouse", connection: "gh CLI" },
  { name: "Stream Deck XL", role: "Hardware control surface", detail: "8x4 grid, 44 plugins, 330 actions", connection: "/streamdeck skill + database" },
  { name: "Vercel", role: "Website hosting", detail: "cafe655.com auto-deploys from GitHub", connection: "Plugin (disabled)" },
];

const hooks = [
  { name: "Discord Notifications", trigger: "Every notification event", action: "Resolve session name, POST to Discord webhook", script: "discord-notify.sh + discord-notify.py" },
  { name: "Status Line", trigger: "Continuous display", action: "Show model + context window bar", script: "statusline.sh" },
  { name: "Session Gate", trigger: "Every session start", action: "Name, color, goal, resume check, log entry", script: "CLAUDE.md enforced" },
  { name: "Pre-Build Check", trigger: "Before non-trivial builds", action: "Surface tools, gaps, goals, recommendations", script: "coaching.py pre-build" },
  { name: "Nightly Cowork", trigger: "Scheduled (Claude Desktop)", action: "Update Cockpit events + tasks", script: "Claude Desktop cowork" },
];

const builds = [
  { name: "Workflowy MCP Server", type: "MCP Server", tech: "TypeScript", status: "shipped" },
  { name: "Personal RAG Database", type: "Knowledge Base", tech: "SQLite + FTS5", status: "shipped" },
  { name: "AI Fluency Coaching System", type: "Database + CLI", tech: "Python + SQLite", status: "shipped" },
  { name: "Stream Deck Integration", type: "Hardware Bridge", tech: "Python + SQLite", status: "shipped" },
  { name: "Discord Notification Bridge", type: "Automation", tech: "Python + Bash", status: "shipped" },
  { name: "VOD Coaching Skill", type: "Skill", tech: "Prompt Engineering", status: "shipped" },
  { name: "NotebookLM Skill", type: "Browser Automation", tech: "Python + Patchright", status: "shipped" },
  { name: "cafe655.com", type: "Website", tech: "Next.js 16 + Tailwind", status: "shipped" },
  { name: "AI Clubhouse", type: "Community", tech: "GitHub + Discord", status: "active" },
  { name: "Cafe Cockpit", type: "Dashboard", tech: "Notion + Cowork", status: "shipped" },
  { name: "Session Logging System", type: "Protocol", tech: "Skill + CLAUDE.md", status: "shipped" },
  { name: "WFx Chrome Extension", type: "Extension", tech: "Chrome API", status: "in-progress" },
];

const flows = [
  {
    name: "Session Start",
    steps: ["/rename + /color", "Detect interface", "Ask goal", "Check resume", "Log entry", "Pre-build check", "Work begins"],
  },
  {
    name: "Build Cycle",
    steps: ["Pre-build coaching check", "Surface tools & gaps", "Build", "Post-build log", "RAG ingest", "Relate & compile"],
  },
  {
    name: "Task Flow",
    steps: ["Workflowy Tickler", "Task surfaces", "Notion task DB", "Cockpit (nightly)", "Today's Tiny Desk", "Execute"],
  },
  {
    name: "Knowledge Flow",
    steps: ["Ingest sources", "Compile wiki pages", "Query with citations", "Lint & maintain"],
  },
];

/* ─── components ────────────────────────────────────────── */

function SectionHeader({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3 mb-6">
      {children}
      {count !== undefined && (
        <span className="text-sm font-mono font-normal text-accent bg-accent-muted px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </h2>
  );
}

function ExpandCard({
  title,
  subtitle,
  badge,
  badgeColor = "bg-accent-muted text-accent",
  children,
  defaultOpen = false,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden hover:border-border-hover transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`text-xs font-mono transition-transform duration-200 text-muted ${open ? "rotate-90" : ""}`}
          >
            {"\u25B6"}
          </span>
          <span className="font-semibold truncate">{title}</span>
          {badge && (
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full shrink-0 ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        {subtitle && <span className="text-sm text-muted shrink-0">{subtitle}</span>}
      </button>
      {open && <div className="px-4 pb-4 border-t border-border">{children}</div>}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3 text-center">
      <div className="text-2xl font-bold font-mono text-accent">{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}

function FlowDiagram({ name, steps }: { name: string; steps: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted mb-3">{name}</h3>
      <div className="flex flex-wrap items-center gap-1">
        {steps.map((step, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="text-xs font-mono bg-surface border border-border rounded px-2 py-1 whitespace-nowrap">
              {step}
            </span>
            {i < steps.length - 1 && (
              <span className="text-accent text-xs">{"\u2192"}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── page ──────────────────────────────────────────────── */

export default function SystemArchitecturePage() {
  return (
    <Container className="py-16 pb-32">
      {/* Hero */}
      <header className="mb-16">
        <p className="text-sm font-mono text-accent tracking-widest uppercase mb-3">
          System Architecture
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
          Cafe&apos;s AI{" "}
          <span className="text-accent">Operating System</span>
        </h1>
        <p className="text-muted mt-4 max-w-2xl text-lg">
          A complete map of every tool, database, MCP server, skill, plugin,
          hook, and integration powering a Claude-native personal operating
          system. Built by a house painter, powered by Claude.
        </p>
        <p className="text-muted-foreground text-sm mt-2 font-mono">
          Last updated: April 12, 2026
        </p>
      </header>

      {/* Stats overview */}
      <section className="mb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatBox label="Databases" value="4" />
          <StatBox label="MCP Servers" value="5" />
          <StatBox label="Custom Skills" value="17" />
          <StatBox label="Plugins" value="6" />
          <StatBox label="RAG Documents" value="220K" />
          <StatBox label="Builds Shipped" value="12+" />
        </div>
      </section>

      {/* Core Infrastructure */}
      <section className="mb-16">
        <SectionHeader>Core Infrastructure</SectionHeader>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-surface border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <h3 className="font-semibold">Claude Code CLI</h3>
            </div>
            <ul className="text-sm text-muted space-y-1.5">
              <li>Model: Claude Opus 4 (1M context)</li>
              <li>Platform: Windows 11 Pro</li>
              <li>Shell: Bash (Git Bash)</li>
              <li>Python 3.13 + Node.js (TypeScript)</li>
              <li>Voice input enabled (push-to-talk)</li>
              <li>30+ custom keybindings</li>
              <li>Custom status line (model + context bar)</li>
            </ul>
          </div>
          <div className="bg-surface border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-semibold">Claude Desktop App</h3>
            </div>
            <ul className="text-sm text-muted space-y-1.5">
              <li>MCP server host (Workflowy, Discord, RAG)</li>
              <li>Cowork scheduled tasks (nightly Cockpit)</li>
              <li>Keep Awake: enabled</li>
              <li>Subscription: Max</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <h3 className="font-semibold">Global CLAUDE.md</h3>
            <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
              system prompt
            </span>
          </div>
          <p className="text-sm text-muted">
            Mandatory session gate (5-step protocol) &bull; Pre-build coaching check &bull;
            RAG query-first rule &bull; AI Builds Log protocol &bull; Stream Deck protocol &bull;
            Session logging &bull; Katie signature convention
          </p>
        </div>
      </section>

      {/* Databases */}
      <section className="mb-16">
        <SectionHeader count={4}>Databases</SectionHeader>
        <div className="space-y-3">
          {databases.map((db) => (
            <ExpandCard
              key={db.name}
              title={db.name}
              subtitle={db.size}
              badge={`${db.records} records`}
            >
              <div className="pt-3 space-y-3">
                <p className="text-sm text-muted">{db.purpose}</p>
                <div className="text-xs font-mono text-muted-foreground">
                  {db.path} &bull; {db.tables > 0 ? `${db.tables} tables` : "Cache DB"}
                </div>
                <div className="flex flex-wrap gap-2">
                  {db.highlights.map((h) => (
                    <span
                      key={h}
                      className="text-xs bg-surface border border-border rounded px-2 py-1 text-muted"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </ExpandCard>
          ))}
        </div>
      </section>

      {/* MCP Servers */}
      <section className="mb-16">
        <SectionHeader count={5}>MCP Servers</SectionHeader>
        <div className="space-y-3">
          {mcpServers.map((mcp) => (
            <ExpandCard
              key={mcp.name}
              title={mcp.name}
              badge={mcp.type}
              badgeColor={
                mcp.type === "Custom-Built"
                  ? "bg-accent-muted text-accent"
                  : mcp.type === "Plugin"
                    ? "bg-violet-400/10 text-violet-400"
                    : "bg-emerald-400/10 text-emerald-400"
              }
              subtitle={mcp.transport}
            >
              <div className="pt-3">
                <p className="text-sm text-muted">{mcp.description}</p>
                {mcp.tools > 0 && (
                  <p className="text-xs font-mono text-accent mt-2">{mcp.tools} tools exposed</p>
                )}
              </div>
            </ExpandCard>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="mb-16">
        <SectionHeader count={17}>Custom Skills</SectionHeader>
        <div className="grid md:grid-cols-2 gap-4">
          {skills.map((group) => (
            <div
              key={group.category}
              className={`border ${group.border} rounded-lg p-4`}
            >
              <h3 className={`text-sm font-semibold ${group.color} mb-3`}>
                {group.category}
                <span className="text-muted-foreground font-normal ml-2">
                  ({group.items.length})
                </span>
              </h3>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div key={item.name} className="flex items-start gap-2">
                    <code className={`text-xs font-mono ${group.color} shrink-0`}>
                      {item.name}
                    </code>
                    <span className="text-xs text-muted">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* External Services */}
      <section className="mb-16">
        <SectionHeader count={7}>External Services</SectionHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Service</th>
                <th className="pb-2 pr-4 font-medium">Role</th>
                <th className="pb-2 font-medium">Connection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {externalServices.map((svc) => (
                <tr key={svc.name} className="text-muted">
                  <td className="py-2.5 pr-4 font-semibold text-foreground whitespace-nowrap">
                    {svc.name}
                  </td>
                  <td className="py-2.5 pr-4">{svc.role}</td>
                  <td className="py-2.5 text-xs font-mono text-accent">{svc.connection}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Hooks & Automation */}
      <section className="mb-16">
        <SectionHeader count={5}>Hooks &amp; Automation</SectionHeader>
        <div className="space-y-3">
          {hooks.map((hook) => (
            <div
              key={hook.name}
              className="border border-border rounded-lg p-4 hover:border-border-hover transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-sm">{hook.name}</h3>
                  <p className="text-xs text-muted mt-1">{hook.action}</p>
                </div>
                <span className="text-xs font-mono text-muted-foreground bg-surface px-2 py-1 rounded shrink-0">
                  {hook.trigger}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Builds */}
      <section className="mb-16">
        <SectionHeader count={builds.length}>Builds</SectionHeader>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {builds.map((build) => (
            <div
              key={build.name}
              className="border border-border rounded-lg p-4 hover:border-border-hover transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                    build.status === "shipped"
                      ? "bg-emerald-400/10 text-emerald-400"
                      : build.status === "active"
                        ? "bg-blue-400/10 text-blue-400"
                        : "bg-amber-400/10 text-amber-400"
                  }`}
                >
                  {build.status}
                </span>
                <span className="text-xs text-muted-foreground">{build.type}</span>
              </div>
              <h3 className="font-semibold text-sm group-hover:text-accent transition-colors">
                {build.name}
              </h3>
              <p className="text-xs text-muted-foreground font-mono mt-1">{build.tech}</p>
            </div>
          ))}
        </div>
      </section>

      {/* System Flows */}
      <section className="mb-16">
        <SectionHeader count={flows.length}>System Flows</SectionHeader>
        <div className="space-y-6 bg-surface border border-border rounded-lg p-6">
          {flows.map((flow) => (
            <FlowDiagram key={flow.name} name={flow.name} steps={flow.steps} />
          ))}
        </div>
      </section>

      {/* Plugins */}
      <section className="mb-8">
        <SectionHeader count={6}>Plugins</SectionHeader>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: "Notion", status: "enabled" },
            { name: "Context7", status: "enabled" },
            { name: "Frontend Design", status: "enabled" },
            { name: "Feature Dev", status: "enabled" },
            { name: "Vercel", status: "disabled" },
            { name: "Ralph Wiggum", status: "disabled" },
          ].map((p) => (
            <div
              key={p.name}
              className="border border-border rounded-lg px-4 py-3 flex items-center justify-between"
            >
              <span className="text-sm font-semibold">{p.name}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  p.status === "enabled" ? "bg-emerald-400" : "bg-muted-foreground"
                }`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Footer note */}
      <footer className="border-t border-border pt-8 mt-16">
        <p className="text-sm text-muted-foreground text-center">
          Built by David (Cafe655) with Claude Code &bull; All infrastructure is local-first (SQLite, no cloud dependencies) &bull; Inspired by Andrej Karpathy&apos;s RAG pipeline
        </p>
      </footer>
    </Container>
  );
}
