"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Toast, ToastType } from "@/components/ui/Toast";
import { authFetch, apiUrl } from "@/lib/authFetch";
import { SectionRenderer } from "@/components/doc/SectionRenderer";

// ── Section icon paths ──────────────────────────────────────────
const SECTION_ICONS: Record<string, string> = {
  "Overview":          `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>`,
  "User Workflow":     `<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>`,
  "Design System":     `<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>`,
  "Roles":             `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>`,
  "Database":          `<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>`,
  "API":               `<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>`,
  "Frontend":          `<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>`,
  "Backend":           `<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>`,
  "Project Structure": `<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>`,
  "AI":                `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
  "Deployment":        `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
  "Extra":             `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>`,
};
const SECTION_GROUPS: Record<string, string[]> = {
  "Getting Started": ["Overview", "User Workflow"],
  "Design":          ["Design System"],
  "Architecture":    ["Roles", "Database", "API"],
  "Development":     ["Frontend", "Backend", "Project Structure", "AI"],
  "Operations":      ["Deployment", "Extra"],
};

function getIconPath(key: string) {
  for (const [k, v] of Object.entries(SECTION_ICONS))
    if (key.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(key.toLowerCase().split(" ")[0])) return v;
  return `<circle cx="12" cy="12" r="10"/>`;
}
function getGroup(key: string) {
  for (const [group, keys] of Object.entries(SECTION_GROUPS))
    if (keys.some(k => key.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(key.toLowerCase().split(" ")[0]))) return group;
  return "Content";
}

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
export default function ProjectViewerPage() {
  const params        = useParams();
  const searchParams  = useSearchParams();
  const streamOnMount = searchParams.get("stream") === "true";

  const [project,       setProject]       = useState<any>(null);
  const [isLoading,     setIsLoading]     = useState(true);
  const [activeSection, setActiveSection] = useState("");
  const [isGenerating,  setIsGenerating]  = useState(false);
  const [isEditing,     setIsEditing]     = useState(false);
  const [isSaving,      setIsSaving]      = useState(false);
  const [liveSections,  setLiveSections]  = useState<Record<string, string>>({});
  const [isRegeneratingSection, setIsRegeneratingSection] = useState(false);
  const [regeneratePrompt, setRegeneratePrompt] = useState("");
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: ToastType }>({
    isVisible: false, message: "", type: "info",
  });
  const showToast = (msg: string, type: ToastType) => setToast({ isVisible: true, message: msg, type });

  // ── Fetch project ─────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const res  = await authFetch(apiUrl(`/projects/${params.id}`));
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setProject(data);
        if (data.status === "completed" || (data.documentData && Object.keys(data.documentData).length > 0)) {
          setLiveSections(data.documentData || {});
          if (data.documentData && Object.keys(data.documentData).length > 0) {
            setActiveSection(Object.keys(data.documentData)[0]);
          }
          if (streamOnMount) {
            window.history.replaceState(null, "", `/projects/${params.id}`);
          }
        } else if (streamOnMount) {
          window.history.replaceState(null, "", `/projects/${params.id}`);
          startStreaming();
        }
      } catch { /* ignore */ }
      finally  { setIsLoading(false); }
    };
    if (params.id) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // ── Stream ────────────────────────────────────────────────────
  const startStreaming = async () => {
    setIsGenerating(true);
    try {
      const res = await authFetch(apiUrl(`/projects/${params.id}/stream`));
      if (!res.ok) throw new Error("Stream failed");
      const reader  = res.body?.getReader();
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
    if (last) { setActiveSection(last); contentRef.current && (contentRef.current.scrollTop = contentRef.current.scrollHeight); }
  };

  // ── Save ──────────────────────────────────────────────────────
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

  // ── Regenerate Section ────────────────────────────────────────
  const regenerateSection = async () => {
    if (!regeneratePrompt.trim()) return;
    setIsRegeneratingSection(true);
    setShowRegenerateModal(false);
    try {
      setLiveSections(p => ({ ...p, [activeSection]: "" }));
      const res = await authFetch(apiUrl(`/projects/${params.id}/sections/${encodeURIComponent(activeSection)}/regenerate`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions: regeneratePrompt })
      });
      if (!res.ok) throw new Error("Regeneration failed");
      const reader  = res.body?.getReader();
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
                setLiveSections(p => ({ ...p, [activeSection]: acc }));
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
      Object.entries(liveSections).forEach(([name, content]) => {
        md += `# ${name}\n\n${content}\n\n---\n\n`;
      });
      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project?.idea?.slice(0, 30).replace(/[^a-z0-9]/gi, "-").toLowerCase() || "project"}-docs.md`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Download started!", "success");
    } catch {
      showToast("Export failed.", "error");
    }
  };

  // ── Helpers ───────────────────────────────────────────────────
  const sectionKeys = Object.keys(liveSections);
  const wordCount   = Object.values(liveSections).join(" ").split(/\s+/).filter(Boolean).length;

  const groupedNav = () => {
    const g: Record<string, string[]> = {};
    for (const k of sectionKeys) { const gr = getGroup(k); g[gr] = g[gr] ? [...g[gr], k] : [k]; }
    return g;
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
      <div className="bg-red-100 border-2 border-red-500 px-6 py-4 font-black text-sm uppercase tracking-wider text-red-600 shadow-[4px_4px_0px_0px_#ef4444]">
        Project Not Found
      </div>
      <Link href="/app" className="font-bold text-sm underline text-black/50 hover:text-black">← Dashboard</Link>
    </div>
  );

  const grouped = groupedNav();

  return (
    <div className="flex h-screen overflow-hidden bg-white print:!block print:!h-auto print:!overflow-visible print:!m-0 print:!p-0">

      {/* ══ MOBILE OVERLAY ══ */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden print:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* ══ SIDEBAR ══ */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-40 transform transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} w-64 min-w-64 flex flex-col border-r-2 border-black overflow-hidden bg-white print:hidden h-full shadow-[4px_0px_0px_0px_rgba(0,0,0,0.1)] md:shadow-none`}>
        {/* Brand */}
        <div className="px-5 py-4 border-b-2 border-black bg-black flex items-center justify-between">
          <div>
            <div className="font-black text-yellow-300 text-[9px] uppercase tracking-widest mb-0.5">DocForge</div>
            <div className="font-black text-white text-sm uppercase tracking-tight leading-tight">AI Docs</div>
          </div>
          {isGenerating
            ? <div className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-pulse" />
            : <div className="w-2.5 h-2.5 rounded-full bg-green-400 border border-black" />
          }
        </div>

        {/* Project */}
        <div className="px-5 py-3 border-b-2 border-black bg-gray-50">
          <div className="text-[8px] font-black uppercase tracking-widest text-black/30 mb-1">Project</div>
          <p className="font-bold text-[11px] text-black leading-snug line-clamp-3">{project.idea}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {sectionKeys.length === 0 && isGenerating && (
            <div className="px-5 py-4 font-black text-[9px] uppercase tracking-widest text-black/30 animate-pulse">AI is writing...</div>
          )}
          {Object.entries(grouped).map(([group, keys]) => (
            <div key={group}>
              <div className="px-5 pt-4 pb-1 text-[8px] font-black uppercase tracking-widest text-black/25">{group}</div>
              {keys.map(key => {
                const isActive = activeSection === key;
                return (
                  <button key={key} onClick={() => { setActiveSection(key); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider transition-all duration-100 border-l-4 ${
                      isActive ? "bg-yellow-300 text-black border-l-black shadow-[inset_-2px_-2px_0px_0px_rgba(0,0,0,0.1)]"
                               : "text-black/50 border-l-transparent hover:bg-gray-50 hover:text-black hover:border-l-gray-300"
                    }`}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" dangerouslySetInnerHTML={{ __html: getIconPath(key) }} />
                    <span className="truncate flex-1">{key}</span>
                    {isGenerating && key === sectionKeys[sectionKeys.length - 1] && (
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          {/* Ungrouped */}
          {(() => {
            const used = Object.values(grouped).flat();
            const rest = sectionKeys.filter(k => !used.includes(k));
            if (!rest.length) return null;
            return (<>
              <div className="px-5 pt-4 pb-1 text-[8px] font-black uppercase tracking-widest text-black/25">Other</div>
              {rest.map(key => (
                <button key={key} onClick={() => { setActiveSection(key); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all border-l-4 ${
                    activeSection === key ? "bg-yellow-300 text-black border-l-black" : "text-black/50 border-l-transparent hover:bg-gray-50 hover:text-black"
                  }`}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" dangerouslySetInnerHTML={{ __html: getIconPath(key) }} />
                  <span className="truncate">{key}</span>
                </button>
              ))}
            </>);
          })()}
        </nav>

        {/* Footer */}
        <div className="px-5 py-3 border-t-2 border-black bg-gray-50">
          <div className="text-[8.5px] font-black uppercase tracking-widest text-black/30 mb-0.5">{sectionKeys.length} sections · ~{wordCount.toLocaleString()} words</div>
          <div className="text-[8.5px] font-bold text-black/25 truncate">{project.modelUsed || "llama-3.3-70b"}</div>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:!block print:!w-full print:!h-auto print:!overflow-visible print:!m-0 print:!p-0">

        {/* Topbar */}
        <header className="h-14 sm:h-12 border-b-2 border-black flex items-center justify-between px-3 sm:px-6 flex-shrink-0 bg-white print:hidden">
          <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-wider max-w-[40%] sm:max-w-none">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-1.5 border-2 border-black bg-white hover:bg-yellow-300 transition-colors shadow-[2px_2px_0px_0px_#000]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <Link href="/app" className="hidden sm:flex text-black/40 hover:text-black transition-colors items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Dashboard
            </Link>
            <span className="hidden sm:inline text-black/20">/</span>
            {activeSection && <><span className="hidden sm:inline text-black/40">Projects</span><span className="hidden sm:inline text-black/20">/</span><span className="text-black truncate max-w-[150px] sm:max-w-none">{activeSection}</span></>}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-end overflow-x-auto no-scrollbar pb-1 sm:pb-0 translate-y-0.5 sm:translate-y-0">
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
                    <polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect>
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
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 bg-yellow-300 text-black border-2 border-black text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-x-px hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
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
        <main className="flex-1 overflow-y-auto bg-white print:!block print:!h-auto print:!overflow-visible print:!m-0 print:!p-0" ref={contentRef}>
          {sectionKeys.length > 0 ? (
            <div className="max-w-4xl mx-auto px-8 py-10 print:!max-w-none print:!px-0 print:!py-0 print:!m-0">
              {/* PDF Title Page (Only visible when printing) */}
              <div className="hidden print:block mb-10 pb-10 border-b-4 border-black">
                <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">{project.idea}</h1>
                <p className="font-bold text-black/50 text-xl uppercase tracking-widest">DocForge Technical Documentation • {new Date().toLocaleDateString()}</p>
              </div>

              {sectionKeys.map((key) => {
                const isActive = key === activeSection;
                return (
                  <div key={key} className={`${isActive ? "block" : "hidden print:block"} print:mb-12 print:break-inside-avoid-page`}>
                    
                    {/* Section header */}
                    <div className="mb-8 pb-6 border-b-2 border-black">
                      <div className="inline-block bg-black text-yellow-300 font-black text-[9px] uppercase tracking-widest px-3 py-1.5 mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)]">
                        {getGroup(key)}
                      </div>
                      <h1 className="font-black text-3xl sm:text-4xl tracking-tighter text-black leading-tight uppercase mb-2">
                        {key}
                      </h1>
                      <p className="text-black/40 font-medium text-sm print:hidden">
                        Section {sectionKeys.indexOf(key) + 1} of {sectionKeys.length}
                        {isGenerating && key === sectionKeys[sectionKeys.length - 1] && (
                          <span className="ml-3 text-yellow-600 font-black text-[9px] uppercase tracking-widest">⚡ Writing...</span>
                        )}
                      </p>
                    </div>

                    {/* Edit Mode vs Preview */}
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
                      <div className={`${isEditing && !isActive ? 'hidden print:block' : ''}`}>
                        <SectionRenderer
                          content={liveSections[key]}
                          sectionName={key}
                          isStreaming={isGenerating && key === sectionKeys[sectionKeys.length - 1]}
                        />
                      </div>
                    )}

                    {/* Prev / Next nav - ONLY on active section in browser */}
                    {isActive && (
                      <div className="flex items-center justify-between mt-12 pt-6 border-t-2 border-black print:hidden">
                        {(() => {
                          const idx  = sectionKeys.indexOf(activeSection);
                          const prev = sectionKeys[idx - 1];
                          const next = sectionKeys[idx + 1];
                          return (<>
                            {prev
                              ? <button onClick={() => setActiveSection(prev)} className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black font-black text-[9px] uppercase tracking-widest bg-white hover:bg-gray-50 transition-all shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000]">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                                  {prev}
                                </button>
                              : <div />
                            }
                            {next && (
                              <button onClick={() => setActiveSection(next)} className="inline-flex items-center gap-2 px-4 py-2 bg-black text-yellow-300 border-2 border-black font-black text-[9px] uppercase tracking-widest transition-all shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-x-px hover:-translate-y-px">
                                {next}
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
                  <p className="text-black/40 font-medium text-sm max-w-xs">Sections appear in the sidebar as they complete.</p>
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

      {/* ── Regenerate Modal ── */}
      {showRegenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000] p-6">
            <h3 className="font-black text-xl tracking-tighter uppercase mb-2">Regenerate "{activeSection}"</h3>
            <p className="text-sm font-medium text-black/60 mb-6">Tell the AI what to change, add, or remove in this specific section.</p>
            <textarea
              className="w-full h-32 p-4 font-mono text-sm border-2 border-black bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-300 shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)] mb-6 resize-none"
              placeholder="e.g., 'Rewrite this to use MongoDB instead of PostgreSQL' or 'List 5 more advanced features for the backlog.'"
              value={regeneratePrompt}
              onChange={e => setRegeneratePrompt(e.target.value)}
              autoFocus
            />
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowRegenerateModal(false)}
                className="px-4 py-2 font-black text-[11px] uppercase tracking-widest text-black/60 hover:text-black hover:bg-black/5 border-2 border-transparent hover:border-black transition-colors">
                Cancel
              </button>
              <button disabled={!regeneratePrompt.trim()} onClick={regenerateSection}
                className="px-5 py-2 bg-yellow-300 text-black border-2 border-black font-black text-[11px] uppercase tracking-widest shadow-[3px_3px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:shadow-[3px_3px_0px_0px_#000] disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed flex items-center gap-2">
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
