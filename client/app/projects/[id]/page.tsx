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
  // ... (schema truncated for brevity in this message; full content unchanged)
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
  // Guard using optional chaining because useSearchParams can return null
  const streamOnMount = searchParams?.get("stream") === "true";

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
      {/* rest of component unchanged */}
    </div>
  );
}
