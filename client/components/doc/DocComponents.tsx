"use client";
import React from "react";

// ── Colour accents cycling ───────────────────────────────────────
const CARD_BORDERS = [
  "border-l-yellow-400", "border-l-blue-400", "border-l-green-400",
  "border-l-red-400",    "border-l-purple-400", "border-l-orange-400",
];
const DB_HEADERS = [
  "bg-blue-900 text-blue-200",   "bg-teal-900 text-teal-200",
  "bg-purple-900 text-purple-200","bg-green-900 text-green-200",
  "bg-orange-900 text-orange-200","bg-red-900 text-red-200",
];
const METHOD_CLS: Record<string, string> = {
  GET:    "bg-green-100 text-green-800 border-green-500",
  POST:   "bg-blue-100  text-blue-800  border-blue-500",
  PUT:    "bg-yellow-100 text-yellow-800 border-yellow-500",
  PATCH:  "bg-orange-100 text-orange-800 border-orange-500",
  DELETE: "bg-red-100   text-red-800   border-red-500",
};

// ════════════════════════════════════════════════════════════
// FOLDER TREE
// ════════════════════════════════════════════════════════════
export function isTreeContent(s: string) {
  return (s.includes("├──") || s.includes("└──") || s.includes("│"))
    || (s.split("\n").filter(l => /^\s{2,}/.test(l) && (l.trim().endsWith("/") || /\.\w+$/.test(l.trim()))).length > 4);
}

function treeLineClass(line: string) {
  const t = line.trimStart();
  if (t.endsWith("/"))                                return "text-blue-400 font-bold";
  if (/\.(ts|tsx|js|jsx)$/.test(t))                  return "text-yellow-300";
  if (/\.(json|yaml|yml|toml|env.*)$/.test(t))       return "text-orange-300";
  if (/\.(css|scss|sass)$/.test(t))                  return "text-pink-300";
  if (/\.(md|mdx|txt)$/.test(t))                     return "text-green-300";
  if (/\.(png|jpg|svg|webp|ico)$/.test(t))           return "text-purple-300";
  return "text-gray-300";
}

export function FolderTree({ content }: { content: string }) {
  const lines = content.split("\n").filter(l => l.trim());
  return (
    <div className="my-5 border-2 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
      <div className="bg-black flex items-center justify-between px-4 py-2 border-b-2 border-black">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-300" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <span className="font-mono text-[9px] text-white/40 uppercase tracking-widest">Project Structure</span>
      </div>
      <div className="bg-gray-950 px-5 py-4 overflow-x-auto">
        <pre className="font-mono text-[12px] leading-[1.8]">
          {lines.map((line, i) => {
            const indent = line.match(/^(\s*(?:[│├└─\s])*)/)?.[1] ?? "";
            const rest   = line.slice(indent.length);
            return (
              <div key={i}>
                <span className="text-gray-600">{indent}</span>
                <span className={treeLineClass(rest)}>{rest}</span>
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// DATABASE SCHEMA CARDS
// ════════════════════════════════════════════════════════════
interface DbRow { col: string; type: string; notes?: string }
interface DbTable { name: string; rows: DbRow[] }

export function parseDbTables(md: string): DbTable[] | null {
  const tables: DbTable[] = [];
  // match ### TableName blocks
  const tableBlocks = md.split(/\n(?=###\s)/);
  for (const block of tableBlocks) {
    const nameMatch = block.match(/^###\s+(.+)/);
    if (!nameMatch) continue;
    const name = nameMatch[1].replace(/[`*]/g, "").trim();
    const rows: DbRow[] = [];
    const lines = block.split("\n");
    let inTable = false;
    for (const line of lines) {
      if (/^\|[-\s|]+\|$/.test(line.trim())) { inTable = true; continue; }
      if (inTable && line.trim().startsWith("|")) {
        const cells = line.split("|").map(c => c.trim()).filter(Boolean);
        if (cells.length >= 2) rows.push({ col: cells[0].replace(/\*\*/g,""), type: cells[1], notes: cells[2] });
      }
    }
    if (rows.length) tables.push({ name, rows });
  }
  return tables.length ? tables : null;
}

function isPk(col: string) { return /\bid\b/.test(col) || col.includes("_id") && col === "id"; }
function isFk(col: string) { return col.endsWith("_id") && col !== "id"; }

export function DbSchemaGrid({ tables }: { tables: DbTable[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5">
      {tables.map((table, ti) => (
        <div key={ti} className="border-2 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden hover:shadow-[6px_6px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
          <div className={`px-4 py-2.5 font-mono font-black text-sm border-b-2 border-black ${DB_HEADERS[ti % DB_HEADERS.length]}`}>
            {table.name}
          </div>
          {table.rows.map((row, ri) => (
            <div key={ri} className="flex items-center justify-between px-4 py-2 border-b border-black/10 last:border-0 hover:bg-yellow-50 transition-colors">
              <div className="flex items-center gap-2 font-mono text-[12px] font-bold text-black">
                {row.col}
                {isPk(row.col) && <span className="text-[8px] px-1.5 py-0.5 bg-yellow-100 border border-yellow-400 text-yellow-700 font-black uppercase tracking-wider">PK</span>}
                {isFk(row.col) && <span className="text-[8px] px-1.5 py-0.5 bg-blue-100 border border-blue-400 text-blue-700 font-black uppercase tracking-wider">FK</span>}
              </div>
              <div className="font-mono text-[11px] text-black/40 text-right">{row.type}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// API ROUTE GROUPS
// ════════════════════════════════════════════════════════════
interface ApiRoute { method: string; path: string; desc: string; auth?: string }
interface ApiGroup { label: string; routes: ApiRoute[] }

export function parseApiGroups(md: string): ApiGroup[] | null {
  const groups: ApiGroup[] = [];
  const sections = md.split(/\n(?=###\s)/);
  for (const sec of sections) {
    const nameMatch = sec.match(/^###\s+(.+)/);
    const label = nameMatch ? nameMatch[1].trim() : "";
    const routes: ApiRoute[] = [];
    for (const line of sec.split("\n")) {
      // table row: | METHOD | /path | ... | desc |
      if (line.trim().startsWith("|")) {
        const cells = line.split("|").map(c => c.trim().replace(/\*\*/g,"")).filter(Boolean);
        const method = cells[0]?.toUpperCase();
        if (method && ["GET","POST","PUT","PATCH","DELETE"].includes(method) && cells[1]) {
          routes.push({ method, path: cells[1], desc: cells[3] || cells[2] || "", auth: cells[2] });
        }
      }
      // inline: GET /path — desc
      const m = line.trim().match(/^(GET|POST|PUT|PATCH|DELETE)\s+(\/\S*)\s*[-–—]\s*(.+)$/i);
      if (m) routes.push({ method: m[1].toUpperCase(), path: m[2], desc: m[3] });
    }
    if (routes.length) groups.push({ label: label || "Routes", routes });
  }
  // flat fallback: no ### headings but lines exist
  if (!groups.length) {
    const routes: ApiRoute[] = [];
    for (const line of md.split("\n")) {
      const m = line.trim().match(/^(GET|POST|PUT|PATCH|DELETE)\s+(\/\S*)\s*[-–—]\s*(.+)$/i);
      if (m) routes.push({ method: m[1].toUpperCase(), path: m[2], desc: m[3] });
    }
    if (routes.length >= 2) return [{ label: "Endpoints", routes }];
    return null;
  }
  return groups;
}

export function ApiGroupList({ groups }: { groups: ApiGroup[] }) {
  return (
    <div className="space-y-6 my-5">
      {groups.map((g, gi) => (
        <div key={gi}>
          <div className="text-[9px] font-black uppercase tracking-widest text-black/40 mb-2 pb-2 border-b border-black/10">
            {g.label}
          </div>
          <div className="space-y-2">
            {g.routes.map((r, ri) => (
              <div key={ri} className="flex items-start gap-3 p-3 border-2 border-black bg-white hover:bg-yellow-50 transition-colors shadow-[2px_2px_0px_0px_#000]">
                <span className={`border-2 font-black text-[9px] px-2 py-1 uppercase tracking-widest flex-shrink-0 mt-0.5 ${METHOD_CLS[r.method] || "bg-gray-100 text-gray-700 border-gray-500"}`}>
                  {r.method}
                </span>
                <div className="min-w-0 flex-1">
                  <code className="font-mono text-[12px] font-bold text-black">{r.path}</code>
                  {r.desc && <div className="text-[12px] text-black/50 font-medium mt-0.5 leading-snug">{r.desc}</div>}
                </div>
                {r.auth && !["Get","Post","Delete","Put","Patch","yes","no","✓","✗","required","optional"].includes(r.auth) && (
                  <span className="flex-shrink-0 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-black text-yellow-300 border border-black">{r.auth}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ROLE / PERSONA CARDS
// ════════════════════════════════════════════════════════════
interface RoleCard { initials: string; title: string; desc: string }

export function parseRoleCards(md: string): RoleCard[] | null {
  const cards: RoleCard[] = [];
  const regex = /(?:^|\n)(?:\d+\.\s+|\-\s+)(?:\*\*)?([^*:\n]+)(?:\*\*)?[:\s*—]+([^\n]{20,})/g;
  let m;
  while ((m = regex.exec(md)) !== null) {
    const title = m[1].trim().replace(/\*\*/g, "");
    const desc  = m[2].trim().replace(/\*\*/g, "");
    if (title && desc) {
      const words = title.split(/\s+/);
      const initials = words.length >= 2 ? words[0][0] + words[1][0] : words[0].slice(0,2);
      cards.push({ initials: initials.toUpperCase(), title, desc });
    }
  }
  return cards.length >= 2 ? cards : null;
}

const ROLE_COLORS = [
  "bg-yellow-300 text-black border-black",
  "bg-black text-yellow-300 border-black",
  "bg-blue-100 text-blue-900 border-blue-400",
  "bg-green-100 text-green-900 border-green-400",
  "bg-red-100 text-red-900 border-red-400",
  "bg-purple-100 text-purple-900 border-purple-400",
];

export function RoleCardGrid({ cards }: { cards: RoleCard[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-5">
      {cards.map((card, i) => (
        <div key={i} className={`border-2 border-black shadow-[4px_4px_0px_0px_#000] p-5 border-l-4 ${CARD_BORDERS[i % CARD_BORDERS.length]} hover:shadow-[6px_6px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all bg-white`}>
          <div className={`w-10 h-10 border-2 flex items-center justify-center font-black text-sm mb-3 ${ROLE_COLORS[i % ROLE_COLORS.length]}`}>
            {card.initials}
          </div>
          <div className="font-black text-sm uppercase tracking-wide text-black mb-2 leading-tight">{card.title}</div>
          <div className="text-[12.5px] text-black/60 font-medium leading-relaxed">{card.desc}</div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TECH STACK CARDS
// ════════════════════════════════════════════════════════════
interface StackItem { layer: string; tech: string; detail: string }

export function parseStackItems(md: string): StackItem[] | null {
  // detect "| Layer | Technology | ... | Detail |" table or numbered items
  const items: StackItem[] = [];
  for (const line of md.split("\n")) {
    if (line.trim().startsWith("|") && !/^[-\s|]+$/.test(line.trim())) {
      const cells = line.split("|").map(c => c.trim().replace(/\*\*/g,"")).filter(Boolean);
      if (cells.length >= 3 && !["layer","technology","tech","purpose","detail","layer"].includes(cells[0].toLowerCase())) {
        items.push({ layer: cells[0], tech: cells[1], detail: cells[2] });
      }
    }
  }
  return items.length >= 3 ? items : null;
}

export function StackGrid({ items }: { items: StackItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-5">
      {items.map((item, i) => (
        <div key={i} className="border-2 border-black shadow-[3px_3px_0px_0px_#000] p-4 bg-white hover:bg-yellow-50 hover:shadow-[5px_5px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
          <div className="text-[8.5px] font-black uppercase tracking-widest text-black/40 mb-1">{item.layer}</div>
          <div className="font-black text-sm text-black mb-2 tracking-tight">{item.tech}</div>
          <div className="text-[12px] text-black/55 font-medium leading-relaxed">{item.detail}</div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STAT / KPI CARDS
// ════════════════════════════════════════════════════════════
interface StatCard { label: string; value: string; sub?: string }

export function parseStatCards(md: string): StatCard[] | null {
  const cards: StatCard[] = [];
  for (const line of md.split("\n")) {
    const m = line.trim().match(/^[-*]\s+\*\*([^*]+)\*\*[:\s]+([^\s—–-][^\n]{0,60})/);
    if (m) cards.push({ label: m[1].trim(), value: m[2].trim() });
  }
  return cards.length >= 3 ? cards : null;
}

export function StatCardGrid({ cards }: { cards: StatCard[] }) {
  const ACCENT_BG = ["bg-yellow-300","bg-black","bg-white","bg-white","bg-white","bg-white"];
  const ACCENT_TXT= ["text-black","text-yellow-300","text-black","text-black","text-black","text-black"];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 my-5">
      {cards.map((c, i) => (
        <div key={i} className={`border-2 border-black shadow-[3px_3px_0px_0px_#000] p-4 ${ACCENT_BG[i] || "bg-white"}`}>
          <div className="text-[8.5px] font-black uppercase tracking-widest text-black/40 mb-2">{c.label}</div>
          <div className={`font-black text-lg tracking-tighter ${ACCENT_TXT[i] || "text-black"}`}>{c.value}</div>
          {c.sub && <div className="text-[10px] text-black/40 mt-1 font-medium">{c.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// WORKFLOW TIMELINE
// ════════════════════════════════════════════════════════════
interface Phase { num: string; title: string; desc: string; tags: string[] }

export function parseWorkflow(md: string): Phase[] | null {
  const phases: Phase[] = [];
  const regex = /(?:^|\n)(?:##\s+)?(?:Phase|Step|Stage)\s+(\d+)[:\s*—]+([^\n]+)\n([\s\S]*?)(?=(?:\n(?:##\s+)?(?:Phase|Step|Stage)\s+\d+)|$)/gi;
  let m;
  while ((m = regex.exec(md)) !== null) {
    const desc = m[3].trim().replace(/\*\*/g,"");
    const tags = (desc.match(/`([^`]+)`/g) || []).map(t => t.replace(/`/g,""));
    phases.push({ num: m[1], title: m[2].trim().replace(/\*\*/g,""), desc: desc.replace(/`[^`]+`/g,"").substring(0,200), tags });
  }
  return phases.length >= 2 ? phases : null;
}

const PHASE_COLORS = ["bg-yellow-300 border-black text-black","bg-black text-yellow-300 border-black","bg-blue-100 text-blue-900 border-blue-400","bg-green-100 text-green-900 border-green-400","bg-purple-100 text-purple-900 border-purple-400"];

export function WorkflowTimeline({ phases }: { phases: Phase[] }) {
  return (
    <div className="space-y-0 my-5">
      {phases.map((p, i) => (
        <div key={i} className="flex gap-5">
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 border-2 flex items-center justify-center font-black text-[13px] flex-shrink-0 ${PHASE_COLORS[i % PHASE_COLORS.length]}`}>
              {p.num.padStart(2,"0")}
            </div>
            {i < phases.length - 1 && <div className="w-0.5 bg-black/20 flex-1 min-h-[32px]" />}
          </div>
          <div className="pb-8 flex-1 pt-1.5">
            <div className="font-black text-sm uppercase tracking-wide text-black mb-1">{p.title}</div>
            <div className="text-[13px] text-black/60 font-medium leading-relaxed mb-2">{p.desc}</div>
            {p.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {p.tags.map((t,ti) => <span key={ti} className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-black/5 border border-black/20 text-black/50">{t}</span>)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ENV VAR TABLE
// ════════════════════════════════════════════════════════════
interface EnvVar { key: string; required: boolean; description: string; example?: string }

export function parseEnvVars(md: string): EnvVar[] | null {
  const vars: EnvVar[] = [];
  for (const line of md.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    if (/^[-\s|]+$/.test(line.trim())) continue;
    const cells = line.split("|").map(c => c.trim().replace(/\*\*/g,"")).filter(Boolean);
    if (cells.length < 2) continue;
    const key = cells[0];
    if (!key || key.toLowerCase() === "variable" || key.toLowerCase() === "name") continue;
    const required = cells[1]?.toLowerCase().includes("yes") || cells[1]?.toLowerCase().includes("required") || cells[1] === "✓";
    vars.push({ key, required, description: cells[2] || cells[1] || "" });
  }
  return vars.length >= 4 ? vars : null;
}

export function EnvVarTable({ vars }: { vars: EnvVar[] }) {
  return (
    <div className="border-2 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden my-5">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-black text-yellow-300">
            <th className="px-4 py-2.5 text-left font-black text-[8.5px] uppercase tracking-widest border-r border-yellow-400/20">Variable</th>
            <th className="px-4 py-2.5 text-left font-black text-[8.5px] uppercase tracking-widest border-r border-yellow-400/20 w-24">Required</th>
            <th className="px-4 py-2.5 text-left font-black text-[8.5px] uppercase tracking-widest">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10">
          {vars.map((v, i) => (
            <tr key={i} className="hover:bg-yellow-50 transition-colors">
              <td className="px-4 py-2.5 font-mono text-[11.5px] font-bold text-black border-r border-black/10">{v.key}</td>
              <td className="px-4 py-2.5 border-r border-black/10">
                {v.required
                  ? <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-red-100 text-red-700 border border-red-300">Required</span>
                  : <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-gray-100 text-gray-500 border border-gray-300">Optional</span>
                }
              </td>
              <td className="px-4 py-2.5 text-[12.5px] text-black/60 font-medium">{v.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PERMISSION MATRIX  
// ════════════════════════════════════════════════════════════
export function PermissionMatrix({ md }: { md: string }) {
  const lines = md.split("\n").filter(l => l.trim().startsWith("|") && !/^[-\s|]+$/.test(l.trim()));
  if (lines.length < 2) return null;
  const headers = lines[0].split("|").map(c => c.trim().replace(/\*\*/g,"")).filter(Boolean);
  const rows = lines.slice(1);
  return (
    <div className="border-2 border-black shadow-[4px_4px_0px_0px_#000] overflow-x-auto my-5">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-black text-yellow-300">
            {headers.map((h,i) => <th key={i} className={`px-4 py-2.5 font-black text-[8.5px] uppercase tracking-widest border-r border-yellow-400/20 last:border-r-0 ${i===0?"text-left":"text-center"}`}>{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10">
          {rows.map((row, ri) => {
            const cells = row.split("|").map(c => c.trim().replace(/\*\*/g,"")).filter(Boolean);
            return (
              <tr key={ri} className="hover:bg-yellow-50 transition-colors">
                {cells.map((cell, ci) => (
                  <td key={ci} className={`px-4 py-2.5 border-r border-black/10 last:border-r-0 font-medium ${ci===0?"text-left text-[13px] text-black":"text-center text-base"}`}>
                    {cell === "✓" || cell.toLowerCase()==="yes" ? <span className="text-green-600 font-black">✓</span>
                     : cell === "✗" || cell.toLowerCase()==="no" ? <span className="text-black/20 font-black">✗</span>
                     : ci===0 ? <span className="text-[12.5px] text-black/70">{cell}</span>
                     : <span className="text-[11px] text-black/50">{cell}</span>}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// GENERIC ITEM CARDS  (numbered or bullet: **Title**: desc)
// ════════════════════════════════════════════════════════════
interface ItemCard { num?: string; title: string; body: string }

export function parseItemCards(block: string): ItemCard[] | null {
  const cards: ItemCard[] = [];
  const lines = block.split("\n");
  let cur: ItemCard | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    const numbed = line.match(/^(\d+)\.\s+(?:\*\*)?([^*:\n]{3,60})(?:\*\*)?\s*[:\s*—]+\s*(.{10,})/);
    const bullet = line.match(/^[-*•]\s+(?:\*\*)?([^*:\n]{3,60})(?:\*\*)?\s*[:\s*—]+\s*(.{10,})/);
    if (numbed) {
      if (cur) cards.push(cur);
      cur = { num: numbed[1], title: numbed[2].trim(), body: numbed[3].trim().replace(/\*\*/g,"") };
    } else if (bullet) {
      if (cur) cards.push(cur);
      cur = { title: bullet[1].trim(), body: bullet[2].trim().replace(/\*\*/g,"") };
    } else if (cur && line) {
      cur.body += " " + line.replace(/\*\*/g,"");
    }
  }
  if (cur) cards.push(cur);
  return cards.length >= 2 ? cards : null;
}

export function ItemCardGrid({ cards }: { cards: ItemCard[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5">
      {cards.map((card, i) => (
        <div key={i} className={`bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-5 border-l-4 ${CARD_BORDERS[i % CARD_BORDERS.length]} hover:shadow-[6px_6px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all`}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-black text-yellow-300 flex items-center justify-center font-black text-xs flex-shrink-0">
              {card.num || String(i + 1)}
            </div>
            <div className="min-w-0">
              <div className="font-black text-sm uppercase tracking-wide text-black mb-1.5 leading-tight">{card.title}</div>
              <div className="text-[12.5px] text-black/60 font-medium leading-relaxed">{card.body}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
