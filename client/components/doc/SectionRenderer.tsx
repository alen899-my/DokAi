"use client";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  isTreeContent, FolderTree,
  parseDbTables, DbSchemaGrid,
  parseApiGroups, ApiGroupList,
  parseRoleCards, RoleCardGrid,
  parseStackItems, StackGrid,
  parseStatCards, StatCardGrid,
  parseWorkflow, WorkflowTimeline,
  parseEnvVars, EnvVarTable,
  PermissionMatrix,
  parseItemCards, ItemCardGrid,
} from "./DocComponents";

// ── Base ReactMarkdown components (no specialised parsing) ─────────
const MD: any = {
  h1: ({ children }: any) => <h1 className="font-black text-2xl sm:text-3xl tracking-tighter text-black mt-10 mb-4 pb-3 border-b-2 border-black uppercase">{children}</h1>,
  h2: ({ children }: any) => <h2 className="font-black text-xl tracking-tight text-black mt-8 mb-3 uppercase">{children}</h2>,
  h3: ({ children }: any) => (
    <h3 className="font-black text-base tracking-tight text-black mt-6 mb-3 flex items-center gap-2">
      <span className="inline-block w-3 h-3 bg-yellow-300 border-2 border-black flex-shrink-0" />{children}
    </h3>
  ),
  h4: ({ children }: any) => <h4 className="font-bold text-sm text-black/60 mt-4 mb-2 uppercase tracking-wider">{children}</h4>,
  p:  ({ children }: any) => <p  className="text-[14px] text-black/70 leading-relaxed mb-4 font-medium">{children}</p>,
  strong: ({ children }: any) => <strong className="font-black text-black">{children}</strong>,
  em:     ({ children }: any) => <em className="italic text-black/80">{children}</em>,
  ul: ({ children }: any) => <ul className="mb-5 space-y-2 list-none">{children}</ul>,
  ol: ({ children }: any) => <ol className="mb-5 space-y-2 list-none">{children}</ol>,
  li: ({ children }: any) => (
    <li className="flex items-start gap-2.5 text-[13.5px] text-black/70 font-medium leading-relaxed">
      <span className="mt-1.5 w-2 h-2 bg-yellow-300 border border-black flex-shrink-0" />
      <span className="flex-1">{children}</span>
    </li>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto mb-6 border-2 border-black shadow-[4px_4px_0px_0px_#000]">
      <table className="w-full text-left border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-black text-yellow-300">{children}</thead>,
  th:    ({ children }: any) => <th className="px-4 py-2.5 font-black text-[8.5px] uppercase tracking-widest border-r border-yellow-400/20 last:border-r-0">{children}</th>,
  tbody: ({ children }: any) => <tbody className="divide-y-2 divide-black/10">{children}</tbody>,
  tr:    ({ children }: any) => <tr className="hover:bg-yellow-50 transition-colors">{children}</tr>,
  td:    ({ children }: any) => <td className="px-4 py-2.5 text-[13px] text-black/70 font-medium border-r border-black/10 last:border-r-0 align-top">{children}</td>,
  pre:   ({ children }: any) => (
    <>{children}</> /* SyntaxHighlighter provides its own pre wrapper, so we just pass children */
  ),
  code: ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    if (!inline && match) {
      return (
        <div className="mb-6">
          <div className="bg-black flex items-center justify-between px-4 py-2 border-2 border-black border-b-0">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400"/><div className="w-3 h-3 rounded-full bg-yellow-300"/><div className="w-3 h-3 rounded-full bg-green-400"/>
            </div>
            <span className="font-mono text-[8.5px] text-white/30 uppercase tracking-widest">{match[1]}</span>
          </div>
          <SyntaxHighlighter
            language={match[1]}
            style={atomDark}
            customStyle={{
              margin: 0,
              background: "#030712",
              padding: "1.25rem",
              border: "2px solid black",
              borderTop: 0,
              borderRadius: 0,
              boxShadow: "4px 4px 0px 0px #000",
              fontSize: "12px",
              fontFamily: "var(--font-mono), monospace",
              overflowX: "auto",
            }}
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        </div>
      );
    }
    return <code className="bg-yellow-100 border border-black px-1.5 py-0.5 text-black font-mono text-[12px] font-bold" {...props}>{children}</code>;
  },
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-black bg-yellow-50 px-5 py-4 mb-5 shadow-[3px_3px_0px_0px_#000]">{children}</blockquote>
  ),
  a:  ({ children, href }: any) => <a href={href} className="font-bold text-black underline decoration-yellow-400 underline-offset-2 hover:decoration-black transition-colors" target="_blank" rel="noopener noreferrer">{children}</a>,
  hr: () => <hr className="border-t-2 border-black/20 my-8" />,
};

// ── SmartBlock: one text chunk → best component ──────────────────
function SmartBlock({ text, sectionName }: { text: string; sectionName: string }) {
  const sec = sectionName.toLowerCase();

  // 1. Folder / project structure
  if (isTreeContent(text)) return <FolderTree content={text} />;

  // 2. DB schema tables (### TableName + | Column | Type | rows)
  if (sec.includes("database") || sec.includes("schema")) {
    const tables = parseDbTables(text);
    if (tables) return <DbSchemaGrid tables={tables} />;
  }

  // 3. API route groups
  if (sec.includes("api") || sec.includes("route") || sec.includes("endpoint")) {
    const groups = parseApiGroups(text);
    if (groups) return <ApiGroupList groups={groups} />;
  }

  // 4. Tech stack table
  if (sec.includes("stack") || sec.includes("tech") || sec.includes("frontend") || sec.includes("backend")) {
    const stack = parseStackItems(text);
    if (stack) return <StackGrid items={stack} />;
  }

  // 5. Env vars table (| Variable | Required | Description |)
  if (sec.includes("env") || sec.includes("config") || sec.includes("structure")) {
    const envs = parseEnvVars(text);
    if (envs) return <EnvVarTable vars={envs} />;
  }

  // 6. Permission matrix table with ✓/✗
  if ((sec.includes("role") || sec.includes("auth") || sec.includes("permission")) && text.includes("|")) {
    const lines = text.split("\n").filter(l => l.trim().startsWith("|"));
    if (lines.length >= 3) return <PermissionMatrix md={text} />;
  }

  // 7. Workflow / phases
  const phases = parseWorkflow(text);
  if (phases) return <WorkflowTimeline phases={phases} />;

  // 8. Role / persona cards
  const roles = parseRoleCards(text);
  if (roles) return <RoleCardGrid cards={roles} />;

  // 9. Stat / KPI cards
  const stats = parseStatCards(text);
  if (stats) return <StatCardGrid cards={stats} />;

  // 10. Generic item cards (numbered or bulleted "Title: desc" lists)
  const items = parseItemCards(text);
  if (items) return <ItemCardGrid cards={items} />;

  // 11. Fallback: rich ReactMarkdown
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>{text}</ReactMarkdown>;
}

// ── CodeBlock wrapper (used by SmartBlock for code nodes) ────────
function CodeBlockWrapper({ content, lang }: { content: string; lang?: string }) {
  if (isTreeContent(content)) return <FolderTree content={content} />;
  return (
    <div className="mb-6">
      <div className="bg-black flex items-center justify-between px-4 py-2 border-2 border-black border-b-0">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400"/><div className="w-3 h-3 rounded-full bg-yellow-300"/><div className="w-3 h-3 rounded-full bg-green-400"/>
        </div>
        {lang && <span className="font-mono text-[8.5px] text-white/30 uppercase tracking-widest">{lang}</span>}
      </div>
      <SyntaxHighlighter
        language={lang || "text"}
        style={atomDark}
        customStyle={{
          margin: 0,
          background: "#030712",
          padding: "1.25rem",
          border: "2px solid black",
          borderTop: 0,
          borderRadius: 0,
          boxShadow: "4px 4px 0px 0px #000",
          fontSize: "12px",
          fontFamily: "var(--font-mono), monospace",
          overflowX: "auto",
        }}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
}

// ── Section-level renderer: splits by ##, dispatches per block ───
export function SectionRenderer({
  content,
  sectionName,
  isStreaming = false,
}: {
  content: string;
  sectionName: string;
  isStreaming?: boolean;
}) {
  // First pass: extract & handle fenced code blocks
  const CODE_PLACEHOLDER = "__CODEBLOCK__";
  const codeBlocks: { content: string; lang?: string }[] = [];
  const withPlaceholders = content.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    codeBlocks.push({ content: code, lang });
    return CODE_PLACEHOLDER;
  });

  // Split remaining text by ## subsection headings
  const parts = withPlaceholders.split(/\n(?=##\s)/);

  return (
    <div>
      {parts.map((part, pi) => {
        const lines       = part.split("\n");
        const firstLine   = lines[0].trim();
        const isH2        = firstLine.startsWith("## ") && !firstLine.startsWith("### ");
        const isH3        = firstLine.startsWith("### ");
        const headingText = (isH2 || isH3) ? firstLine.replace(/^#{2,3}\s*/, "") : null;
        const bodyLines   = (isH2 || isH3) ? lines.slice(1) : lines;

        // Re-insert code blocks
        const renderBody = (rawBody: string) => {
          let cbIdx = 0;
          const segments = rawBody.split(CODE_PLACEHOLDER);
          return segments.map((seg, si) => {
            const cb = si < segments.length - 1 && codeBlocks[cbIdx] ? codeBlocks[cbIdx++] : null;
            return (
              <React.Fragment key={si}>
                {seg.trim() && <SmartBlock text={seg.trim()} sectionName={sectionName} />}
                {cb && <CodeBlockWrapper content={cb.content} lang={cb.lang} />}
              </React.Fragment>
            );
          });
        };

        return (
          <div key={pi}>
            {/* ## Subsection heading */}
            {headingText && (
              isH3 ? (
                <h3 className="font-black text-base tracking-tight text-black mt-6 mb-3 flex items-center gap-2 uppercase">
                  <span className="inline-block w-3 h-3 bg-yellow-300 border-2 border-black flex-shrink-0" />
                  {headingText}
                </h3>
              ) : (
                <div className="flex items-center gap-4 mt-8 mb-4">
                  <h2 className="font-black text-lg tracking-tight text-black uppercase whitespace-nowrap">{headingText}</h2>
                  <div className="flex-1 h-0.5 bg-black/10" />
                </div>
              )
            )}

            {/* Body blocks */}
            {renderBody(bodyLines.join("\n").trim())}
          </div>
        );
      })}

      {isStreaming && (
        <span className="inline-block w-0.5 h-4 bg-black animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  );
}
