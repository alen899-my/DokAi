"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Toast, ToastType } from "@/components/ui/Toast";
import { authFetch, apiUrl } from "@/lib/authFetch";
import { SectionRenderer } from "@/components/doc/SectionRenderer";

// ── 21-section schema ──────────────────────────────────────────────
const DOC_SECTIONS = [
  {
    num: "1", title: "Overview",
    icon: `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>`,
    subs: ["1.1 Purpose & Goals","1.2 Scope & Audience","1.3 Architecture Summary","1.4 Key Decisions / ADRs","1.5 Glossary"],
  },
  {
    num: "2", title: "Tech Stack",
    icon: `<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>`,
    subs: ["2.1 Frontend","2.2 Backend","2.3 Database","2.4 DevOps & Infrastructure","2.5 External Services","2.6 Version Matrix"],
  },
  {
    num: "3", title: "Installation & Setup Guide",
    icon: `<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07"/><path d="M4.93 4.93A10 10 0 0 0 19.07 19.07"/>`,
    subs: ["3.1 Prerequisites","3.2 Environment Variables","3.3 Frontend Setup","3.4 Backend Setup","3.5 Database Setup","3.6 Running with Docker","3.7 Common Setup Errors"],
  },
  {
    num: "4", title: "Folder Structure",
    icon: `<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>`,
    subs: ["4.1 Frontend Tree","4.2 Backend Tree","4.3 Naming Conventions"],
  },
  {
    num: "5", title: "UI Components",
    icon: `<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>`,
    subs: ["5.1 Component Inventory","5.2 Primitive / Base Components","5.3 Layout Components","5.4 Navigation Components","5.5 Feedback Components","5.6 Form Components","5.7 Data Display Components","5.8 Component Props Documentation"],
  },
  {
    num: "6", title: "Design System",
    icon: `<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>`,
    subs: ["6.1 Color Palette","6.2 Typography","6.3 Spacing System","6.4 Border Radius","6.5 Shadows & Elevation","6.6 Icons","6.7 Motion & Animation","6.8 Breakpoints","6.9 Z-Index Scale","6.10 Component Theming"],
  },
  {
    num: "7", title: "Pages & Routing",
    icon: `<polygon points="3 11 22 2 13 21 11 13 3 11"/>`,
    subs: ["7.1 Route Map","7.2 Page Hierarchy","7.3 Navigation Guards","7.4 Page-Level Data Fetching","7.5 URL Patterns & Query Params"],
  },
  {
    num: "8", title: "State Management",
    icon: `<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>`,
    subs: ["8.1 State Categories","8.2 Store Structure","8.3 Data Fetching Patterns","8.4 Side Effects"],
  },
  {
    num: "9", title: "API Routes",
    icon: `<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>`,
    subs: ["9.1 Base URL & Versioning","9.2 Authentication Headers","9.3 Request/Response Format","9.4 Error Response Format","9.5 Full Endpoint Reference","9.6 Pagination, Filtering & Sorting","9.7 File Upload Endpoints","9.8 Webhook Endpoints"],
  },
  {
    num: "10", title: "Database Models",
    icon: `<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>`,
    subs: ["10.1 Entity Relationship Diagram","10.2 Model Reference","10.3 Indexes","10.4 Migrations","10.5 Seeding","10.6 Soft Deletes"],
  },
  {
    num: "11", title: "Auth & Security",
    icon: `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`,
    subs: ["11.1 Authentication Flow","11.2 Authorization & Roles","11.3 Password Policies","11.4 Security Headers","11.5 Input Validation & Sanitization","11.6 Rate Limiting","11.7 Secrets Management"],
  },
  {
    num: "12", title: "Common Functions & Utilities",
    icon: `<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>`,
    subs: ["12.1 Frontend Utilities","12.2 Backend Utilities","12.3 Shared Types / Interfaces","12.4 Constants"],
  },
  {
    num: "13", title: "User Workflows",
    icon: `<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>`,
    subs: ["13.1 Registration & Onboarding","13.2 Login & Session Management","13.3 Core Feature Workflow","13.4 Search & Filtering","13.5 Account Settings","13.6 Admin Actions"],
  },
  {
    num: "14", title: "Developer Workflows",
    icon: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
    subs: ["14.1 Git Branching Strategy","14.2 Commit Conventions","14.3 Pull Request Process","14.4 Code Review Standards","14.5 CI Pipeline","14.6 Local Development Tips"],
  },
  {
    num: "15", title: "Error Handling",
    icon: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
    subs: ["15.1 Error Classification","15.2 Error Codes","15.3 Frontend Error Boundaries","15.4 API Error Handling in Frontend","15.5 Backend Global Error Handler","15.6 Logging Strategy"],
  },
  {
    num: "16", title: "Testing Strategy",
    icon: `<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>`,
    subs: ["16.1 Testing Philosophy","16.2 Unit Tests","16.3 Component Tests","16.4 Integration Tests","16.5 End-to-End Tests","16.6 Running Tests","16.7 Test Data & Fixtures"],
  },
  {
    num: "17", title: "Code Standards",
    icon: `<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>`,
    subs: ["17.1 Linting","17.2 Formatting","17.3 TypeScript Rules","17.4 Component Guidelines","17.5 File and Import Rules"],
  },
  {
    num: "18", title: "Performance",
    icon: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
    subs: ["18.1 Frontend Performance Budgets","18.2 Code Splitting Strategy","18.3 Image Optimization","18.4 Caching Strategy","18.5 Database Performance","18.6 Monitoring"],
  },
  {
    num: "19", title: "Deployment",
    icon: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
    subs: ["19.1 Environments","19.2 Environment Variables per Environment","19.3 Frontend Deployment","19.4 Backend Deployment","19.5 Database Deployment","19.6 CI/CD Pipeline","19.7 Rollback Procedure","19.8 Zero-Downtime Deployment"],
  },
  {
    num: "20", title: "Maintenance",
    icon: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`,
    subs: ["20.1 Dependency Updates","20.2 Database Maintenance","20.3 Backup & Recovery","20.4 Scaling Runbook","20.5 Incident Response","20.6 Security Patching","20.7 Data Retention & Deletion"],
  },
  {
    num: "21", title: "Changelog",
    icon: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>`,
    subs: ["21.1 Versioning Scheme","21.2 Changelog Format","21.3 Release Process","21.4 Migration Guides"],
  },
];

// Build a lookup: full section key (e.g. "1. Overview") → schema entry
function matchSchema(key: string) {
  for (const s of DOC_SECTIONS) {
    const titleLower = key.toLowerCase();
    if (
      titleLower === `${s.num}. ${s.title.toLowerCase()}` ||
      titleLower.startsWith(`${s.num}.`) ||
      titleLower.includes(s.title.toLowerCase())
    ) return s;
  }
  return null;
}

// Extract ## subsection headings from content
function extractSubsections(content: string): string[] {
  const matches = content.match(/^##\s+([^\n]+)/gm) || [];
  return matches.map((m) => m.replace(/^##\s+/, "").trim());
}

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
export default function ProjectViewerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const streamOnMount = searchParams.get("stream") === "true";

  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("");
  const [activeSubsection, setActiveSubsection] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [liveSections, setLiveSections] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [batchLabel, setBatchLabel] = useState("");
  const [isRegeneratingSection, setIsRegeneratingSection] = useState(false);
  const [regeneratePrompt, setRegeneratePrompt] = useState("");
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const subsectionRefs = useRef<Record<string, HTMLElement>>({});

  const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: ToastType }>({
    isVisible: false, message: "", type: "info",
  });
  const showToast = (msg: string, type: ToastType) => setToast({ isVisible: true, message: msg, type });

  // ── Fetch project ──────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const res = await authFetch(apiUrl(`/projects/${params.id}`));
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setProject(data);
        if (data.documentData && Object.keys(data.documentData).length > 0) {
          setLiveSections(data.documentData);
          const firstKey = Object.keys(data.documentData)[0];
          setActiveSection(firstKey);
          setExpandedSections(new Set([firstKey]));
          if (streamOnMount) window.history.replaceState(null, "", `/projects/${params.id}`);
        } else if (streamOnMount) {
          window.history.replaceState(null, "", `/projects/${params.id}`);
          startStreaming();
        }
      } catch { /* ignore */ }
      finally { setIsLoading(false); }
    };
    if (params.id) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // ── Stream ─────────────────────────────────────────────────────
  const startStreaming = async () => {
    setIsGenerating(true);
    try {
      const res = await authFetch(apiUrl(`/projects/${params.id}/stream`));
      if (!res.ok) throw new Error("Stream failed");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split("\n\n")) {
            if (!line.startsWith("data: ")) continue;
            try {
              const d = JSON.parse(line.replace("data: ", "").trim());
              if (d.type === "batch") { setBatchLabel(d.label || ""); }
              if (d.type === "content") { acc += d.text; parseMd(acc); }
            } catch { /* ignore */ }
          }
        }
      }
    } catch { /* ignore */ }
    setIsGenerating(false);
  };

  const parseMd = (md: string) => {
    const sections: Record<string, string> = {};
    const regex = /(?:^|\n)#\s+([^\n]+)\n([\s\S]*?)(?=(?:\n#\s+|$))/g;
    let m, last: string | null = null;
    while ((m = regex.exec(md)) !== null) {
      const key = m[1].trim(), val = m[2].trim();
      if (key) { sections[key] = val; last = key; }
    }
    setLiveSections(sections);
    if (last) {
      setActiveSection(last);
      setExpandedSections((prev) => new Set([...prev, last!]));
      contentRef.current && (contentRef.current.scrollTop = contentRef.current.scrollHeight);
    }
  };

  // ── Save ───────────────────────────────────────────────────────
  const save = async () => {
    setIsSaving(true);
    try {
      const res = await authFetch(apiUrl(`/projects/${params.id}`), {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentData: liveSections }),
      });
      if (!res.ok) throw new Error();
      showToast("Saved successfully!", "success");
    } catch { showToast("Save failed.", "error"); }
    setIsSaving(false);
  };

  // ── Regenerate Section ─────────────────────────────────────────
  const regenerateSection = async () => {
    if (!regeneratePrompt.trim()) return;
    setIsRegeneratingSection(true);
    setShowRegenerateModal(false);
    try {
      setLiveSections((p) => ({ ...p, [activeSection]: "" }));
      const res = await authFetch(apiUrl(`/projects/${params.id}/sections/${encodeURIComponent(activeSection)}/regenerate`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions: regeneratePrompt }),
      });
      if (!res.ok) throw new Error("Regeneration failed");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split("\n\n")) {
            if (!line.startsWith("data: ")) continue;
            try {
              const d = JSON.parse(line.replace("data: ", "").trim());
              if (d.type === "content") {
                acc += d.text;
                setLiveSections((p) => ({ ...p, [activeSection]: acc }));
              }
            } catch { /* ignore */ }
          }
        }
      }
      showToast("Section regenerated!", "success");
    } catch { showToast("Failed to regenerate.", "error"); }
    setIsRegeneratingSection(false);
    setRegeneratePrompt("");
  };

  const downloadMarkdown = () => {
    try {
      let md = "";
      Object.entries(liveSections).forEach(([name, content]) => { md += `# ${name}\n\n${content}\n\n---\n\n`; });
      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project?.idea?.slice(0, 30).replace(/[^a-z0-9]/gi, "-").toLowerCase() || "project"}-docs.md`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Download started!", "success");
    } catch { showToast("Export failed.", "error"); }
  };

  // ── Scroll to subsection ───────────────────────────────────────
  const scrollToSubsection = useCallback((heading: string) => {
    setActiveSubsection(heading);
    if (!contentRef.current) return;
    // Find h2 elements inside the content
    const h2s = contentRef.current.querySelectorAll("h2");
    for (const el of Array.from(h2s)) {
      if (el.textContent?.trim().toLowerCase().includes(heading.toLowerCase().replace(/^\d+\.\d+\s+/, ""))) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        break;
      }
    }
  }, []);

  // ── Helpers ──────────────────────────────────────────────────–
  const sectionKeys = Object.keys(liveSections);
  const wordCount = Object.values(liveSections).join(" ").split(/\s+/).filter(Boolean).length;

  const toggleExpand = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // ── Loading ───────────────────────────────────────────────────
  if (isLoading) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-yellow-300 border-2 border-black animate-spin shadow-[4px_4px_0px_0px_#000]" />
        <p className="font-black text-xs uppercase tracking-widest text-black/40">Loading...</p>
      </div>
    </div>
  );

  if (!project) return (
    <div className="flex flex-col items-center justify-center h-screen bg-white gap-5">
      <div className="bg-red-100 border-2 border-red-500 px-6 py-4 font-black text-sm uppercase tracking-wider text-red-600 shadow-[4px_4px_0px_0px_#ef4444]">Project Not Found</div>
      <Link href="/app" className="font-bold text-sm underline text-black/50 hover:text-black">← Dashboard</Link>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-white print:!block print:!h-auto print:!overflow-visible">

      {/* ══ MOBILE OVERLAY ══ */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden print:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* ══ SIDEBAR ══ */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-40 transform transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} w-72 min-w-72 flex flex-col border-r-2 border-black overflow-hidden bg-white print:hidden h-full`}>

        {/* Brand */}
        <div className="px-5 py-4 border-b-2 border-black bg-black flex items-center justify-between flex-shrink-0">
          <div>
            <div className="font-black text-yellow-300 text-[9px] uppercase tracking-widest mb-0.5">DocForge</div>
            <div className="font-black text-white text-sm uppercase tracking-tight">Technical Docs</div>
          </div>
          {isGenerating
            ? <div className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-pulse" />
            : <div className="w-2.5 h-2.5 rounded-full bg-green-400 border border-black" />
          }
        </div>

        {/* Project */}
        <div className="px-5 py-3 border-b-2 border-black bg-gray-50 flex-shrink-0">
          <div className="text-[8px] font-black uppercase tracking-widest text-black/30 mb-1">Project</div>
          <p className="font-bold text-[11px] text-black leading-snug line-clamp-2">{project.idea}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-1">
          {sectionKeys.length === 0 && isGenerating && (
            <div className="px-5 py-4">
              <div className="font-black text-[9px] uppercase tracking-widest text-black/30 animate-pulse mb-1">AI is writing...</div>
              {batchLabel && <div className="text-[8px] font-bold text-yellow-600 uppercase tracking-widest">{batchLabel}</div>}
            </div>
          )}

          {sectionKeys.length === 0 && !isGenerating && (
            <div className="px-5 py-8 text-center">
              <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest">No sections yet</p>
            </div>
          )}

          {sectionKeys.map((key) => {
            const isActive = activeSection === key;
            const isExpanded = expandedSections.has(key);
            const schema = matchSchema(key);
            const subsInContent = extractSubsections(liveSections[key] || "");
            const displaySubs = subsInContent.length > 0 ? subsInContent : (schema?.subs || []);
            const icon = schema?.icon || `<circle cx="12" cy="12" r="10"/>`;
            const num = schema?.num || "";

            return (
              <div key={key}>
                {/* Section row */}
                <div className={`flex items-center border-l-4 transition-all duration-100 ${isActive ? "bg-yellow-300 border-l-black" : "border-l-transparent hover:bg-gray-50 hover:border-l-gray-300"}`}>
                  {/* Expand/collapse chevron */}
                  <button
                    onClick={() => toggleExpand(key)}
                    className="flex-shrink-0 p-2 pl-3 text-black/40 hover:text-black transition-colors"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }}>
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>

                  {/* Section button */}
                  <button
                    onClick={() => { setActiveSection(key); setIsMobileMenuOpen(false); if (!isExpanded) toggleExpand(key); }}
                    className="flex-1 flex items-center gap-2 pr-3 py-2 text-left"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" dangerouslySetInnerHTML={{ __html: icon }} />
                    <span className={`text-[10px] font-black uppercase tracking-wide truncate flex-1 ${isActive ? "text-black" : "text-black/55"}`}>
                      {num && <span className="text-black/40 mr-1">{num}.</span>}
                      {schema?.title || key}
                    </span>
                    {/* Dot if section has content */}
                    {liveSections[key] && (
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? "bg-black" : "bg-green-500"}`} />
                    )}
                    {/* Writing pulse */}
                    {isGenerating && key === sectionKeys[sectionKeys.length - 1] && (
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse flex-shrink-0" />
                    )}
                  </button>
                </div>

                {/* Subsection list */}
                {isExpanded && displaySubs.length > 0 && (
                  <div className="bg-gray-50 border-l-4 border-l-black/10 ml-0">
                    {displaySubs.map((sub) => {
                      const isSubActive = activeSubsection === sub && isActive;
                      return (
                        <button
                          key={sub}
                          onClick={() => { setActiveSection(key); setIsMobileMenuOpen(false); scrollToSubsection(sub); }}
                          className={`w-full text-left flex items-center gap-2 pl-9 pr-4 py-1.5 transition-all duration-100 group ${isSubActive ? "bg-yellow-100 text-black" : "text-black/45 hover:text-black hover:bg-white"}`}
                        >
                          <span className={`w-1 h-1 rounded-full flex-shrink-0 transition-colors ${isSubActive ? "bg-yellow-500" : "bg-black/20 group-hover:bg-black/40"}`} />
                          <span className="text-[9.5px] font-bold truncate">{sub}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-3 border-t-2 border-black bg-gray-50 flex-shrink-0">
          <div className="text-[8.5px] font-black uppercase tracking-widest text-black/30 mb-0.5">
            {sectionKeys.length} / 21 sections · ~{wordCount.toLocaleString()} words
          </div>
          <div className="text-[8.5px] font-bold text-black/25 truncate">{project.modelUsed || "llama-3.3-70b"}</div>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:!block print:!w-full">

        {/* Topbar */}
        <header className="h-14 sm:h-12 border-b-2 border-black flex items-center justify-between px-3 sm:px-6 flex-shrink-0 bg-white print:hidden">
          <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-1.5 border-2 border-black bg-white hover:bg-yellow-300 transition-colors shadow-[2px_2px_0px_0px_#000]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <Link href="/app" className="hidden sm:flex text-black/40 hover:text-black transition-colors items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Dashboard
            </Link>
            <span className="hidden sm:inline text-black/20">/</span>
            {activeSection && (
              <span className="text-black truncate max-w-[200px]">
                {matchSchema(activeSection)?.num}. {matchSchema(activeSection)?.title || activeSection}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-end">
            {isGenerating && (
              <div className="inline-flex items-center gap-2 bg-yellow-300 border-2 border-black px-3 py-1 text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#000]">
                <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />Generating
              </div>
            )}
            {!isGenerating && sectionKeys.length > 0 && (
              <>
                <button onClick={() => setShowRegenerateModal(true)} disabled={isRegeneratingSection}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 border-2 border-black bg-white text-black text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-x-px hover:-translate-y-px disabled:opacity-50 flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                  <span className="hidden sm:inline">{isRegeneratingSection ? "Regenerating" : "Regenerate"}</span>
                </button>
                <button onClick={() => setIsEditing(!isEditing)}
                  className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 border-2 border-black text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-x-px hover:-translate-y-px flex-shrink-0 ${isEditing ? "bg-black text-yellow-300" : "bg-white text-black"}`}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {isEditing ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></> : <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>}
                  </svg>
                  <span className="hidden sm:inline">{isEditing ? "Preview" : "Edit Raw"}</span>
                </button>
                <button onClick={() => window.print()}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 border-2 border-black bg-white text-black text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-x-px hover:-translate-y-px flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                  </svg>
                  <span className="hidden sm:inline">PDF</span>
                </button>
                <button onClick={downloadMarkdown}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 border-2 border-black bg-white text-black text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-x-px hover:-translate-y-px flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span className="hidden sm:inline">MD</span>
                </button>
                <button onClick={save} disabled={isSaving}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 bg-yellow-300 text-black border-2 border-black text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-x-px hover:-translate-y-px disabled:opacity-50 flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                  </svg>
                  <span>{isSaving ? "Saving" : "Save"}</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-white print:!block print:!h-auto print:!overflow-visible" ref={contentRef}>
          {sectionKeys.length > 0 ? (
            <div className="max-w-4xl mx-auto px-8 py-10 print:!max-w-none print:!px-0">
              {/* PDF Title Page */}
              <div className="hidden print:block mb-10 pb-10 border-b-4 border-black">
                <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">{project.idea}</h1>
                <p className="font-bold text-black/50 text-xl uppercase tracking-widest">
                  DocForge Technical Documentation · {new Date().toLocaleDateString()}
                </p>
              </div>

              {sectionKeys.map((key) => {
                const isActive = key === activeSection;
                const schema = matchSchema(key);
                return (
                  <div key={key} className={`${isActive ? "block" : "hidden print:block"} print:mb-12`}>
                    {/* Section header */}
                    <div className="mb-8 pb-6 border-b-2 border-black">
                      {/* Number badge */}
                      {schema?.num && (
                        <div className="inline-flex items-center gap-2 mb-4">
                          <div className="bg-black text-yellow-300 font-black text-[11px] w-8 h-8 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)]">
                            {schema.num}
                          </div>
                          <div className="h-px flex-1 bg-black/10 w-16" />
                        </div>
                      )}
                      <h1 className="font-black text-3xl sm:text-4xl tracking-tighter text-black leading-tight uppercase mb-2">
                        {schema?.title || key}
                      </h1>
                      <p className="text-black/40 font-medium text-sm print:hidden">
                        Section {sectionKeys.indexOf(key) + 1} of {sectionKeys.length} · {(liveSections[key] || "").split(/\s+/).filter(Boolean).length.toLocaleString()} words
                        {isGenerating && key === sectionKeys[sectionKeys.length - 1] && (
                          <span className="ml-3 text-yellow-600 font-black text-[9px] uppercase tracking-widest">⚡ Writing...</span>
                        )}
                      </p>
                      {/* Subsection breadcrumb pills */}
                      {schema?.subs && schema.subs.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3 print:hidden">
                          {schema.subs.map((sub) => (
                            <button key={sub} onClick={() => scrollToSubsection(sub)}
                              className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border transition-all ${activeSubsection === sub && isActive ? "bg-black text-yellow-300 border-black" : "bg-white text-black/40 border-black/20 hover:border-black hover:text-black"}`}>
                              {sub}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Edit vs Preview */}
                    {isEditing && isActive ? (
                      <div className="print:hidden">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="inline-flex items-center gap-2 bg-black text-yellow-300 px-3 py-1.5 text-[8px] font-black uppercase tracking-widest">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Editing Raw Markdown
                          </div>
                          <span className="text-[10px] text-black/30 font-medium">— formatting like **bold** will render in preview</span>
                        </div>
                        <textarea
                          className="w-full min-h-[600px] p-5 font-mono text-sm border-2 border-black bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 resize-y shadow-[4px_4px_0px_0px_#000] text-black leading-relaxed"
                          value={liveSections[key]}
                          onChange={(e) => setLiveSections((prev) => ({ ...prev, [key]: e.target.value }))}
                          placeholder="Write Markdown here…"
                        />
                      </div>
                    ) : (
                      <div className={`${isEditing && !isActive ? "hidden print:block" : ""}`}>
                        <SectionRenderer
                          content={liveSections[key]}
                          sectionName={key}
                          isStreaming={isGenerating && key === sectionKeys[sectionKeys.length - 1]}
                        />
                      </div>
                    )}

                    {/* Prev / Next */}
                    {isActive && (
                      <div className="flex items-center justify-between mt-12 pt-6 border-t-2 border-black print:hidden">
                        {(() => {
                          const idx = sectionKeys.indexOf(activeSection);
                          const prev = sectionKeys[idx - 1];
                          const next = sectionKeys[idx + 1];
                          return (<>
                            {prev
                              ? <button onClick={() => { setActiveSection(prev); setActiveSubsection(""); }}
                                  className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black font-black text-[9px] uppercase tracking-widest bg-white hover:bg-gray-50 transition-all shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000]">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                                  {matchSchema(prev)?.title || prev}
                                </button>
                              : <div />
                            }
                            {next && (
                              <button onClick={() => { setActiveSection(next); setActiveSubsection(""); setExpandedSections((prev) => new Set([...prev, next])); }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-yellow-300 border-2 border-black font-black text-[9px] uppercase tracking-widest transition-all shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-x-px hover:-translate-y-px">
                                {matchSchema(next)?.title || next}
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                              </button>
                            )}
                          </>);
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full text-center px-8 py-20">
              {isGenerating ? (
                <>
                  <div className="w-16 h-16 bg-yellow-300 border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_#000] mb-6 animate-pulse">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  </div>
                  <h3 className="font-black text-xl tracking-tighter mb-2 uppercase">AI is Writing</h3>
                  <p className="text-black/40 font-medium text-sm max-w-xs">Generating all 21 sections. They appear in the sidebar as they complete.</p>
                  <div className="flex gap-2 mt-6">
                    {[0,1,2,3,4].map(i => <div key={i} className="w-2 h-2 bg-black" style={{ animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-gray-100 border-2 border-black border-dashed flex items-center justify-center shadow-[4px_4px_0px_0px_#000] mb-6">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black/30">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <h3 className="font-black text-xl tracking-tighter mb-2 uppercase">Select a Section</h3>
                  <p className="text-black/40 font-medium text-sm max-w-xs">Choose a section from the sidebar to view its content.</p>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      <Toast isVisible={toast.isVisible} message={toast.message} type={toast.type} onClose={() => setToast(p => ({ ...p, isVisible: false }))} />

      {/* Regenerate Modal */}
      {showRegenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000] p-6">
            <h3 className="font-black text-xl tracking-tighter uppercase mb-2">Regenerate Section</h3>
            <p className="text-sm font-medium text-black/60 mb-1">Section: <span className="font-black text-black">{matchSchema(activeSection)?.title || activeSection}</span></p>
            <p className="text-sm font-medium text-black/40 mb-6">Tell the AI what to change, add, or improve in this section.</p>
            <textarea
              className="w-full h-32 p-4 font-mono text-sm border-2 border-black bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-300 shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)] mb-6 resize-none"
              placeholder="e.g., 'Rewrite the color palette with a dark violet theme' or 'Add more detail to the permission matrix'"
              value={regeneratePrompt}
              onChange={(e) => setRegeneratePrompt(e.target.value)}
              autoFocus
            />
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowRegenerateModal(false)}
                className="px-4 py-2 font-black text-[11px] uppercase tracking-widest text-black/60 hover:text-black hover:bg-black/5 border-2 border-transparent hover:border-black transition-colors">
                Cancel
              </button>
              <button disabled={!regeneratePrompt.trim()} onClick={regenerateSection}
                className="px-5 py-2 bg-yellow-300 text-black border-2 border-black font-black text-[11px] uppercase tracking-widest shadow-[3px_3px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
