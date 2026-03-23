"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Toast, ToastType } from "@/components/ui/Toast";

export default function IndependentProjectViewerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const isStreamingRequested = searchParams.get("stream") === "true";
  
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("");
  
  // Streaming & Edit state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [streamedMarkdown, setStreamedMarkdown] = useState("");
  const [liveSections, setLiveSections] = useState<Record<string, string>>({});
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Toast state
  const [toast, setToast] = useState<{ isVisible: boolean, message: string, type: ToastType }>({
    isVisible: false, message: '', type: 'info'
  });

  const showToast = (message: string, type: ToastType) => {
    setToast({ isVisible: true, message, type });
  };

  useEffect(() => {
    const init = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
        const res = await fetch(`${apiUrl}/projects/${params.id}`);
        if (!res.ok) throw new Error("Failed to fetch project");
        const data = await res.json();
        setProject(data);
        
        // If the project already has data and we aren't streaming, just populate it
        if (data.documentData && typeof data.documentData === "object" && Object.keys(data.documentData).length > 0 && !isStreamingRequested) {
          setLiveSections(data.documentData);
          setActiveSection(Object.keys(data.documentData)[0]);
        } else if (isStreamingRequested) {
          // Time to connect to the stream
          startStreaming();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    if (params.id) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const startStreaming = async () => {
    setIsGenerating(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
      const response = await fetch(`${apiUrl}/projects/${params.id}/stream`);
      
      if (!response.ok) throw new Error("Failed to start streaming");
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let accumulatedMarkdown = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (!dataStr) continue;
              
              try {
                const data = JSON.parse(dataStr);
                if (data.type === 'content') {
                  accumulatedMarkdown += data.text;
                  setStreamedMarkdown(accumulatedMarkdown);
                  parseLiveMarkdown(accumulatedMarkdown);
                } else if (data.type === 'done') {
                  break;
                }
              } catch (e) {
                // ignore
              }
            }
          }
        }
      }
      setIsGenerating(false);
    } catch (e) {
      console.error(e);
      setIsGenerating(false);
    }
  };

  const parseLiveMarkdown = (markdown: string) => {
    const newSections: Record<string, string> = {};
    const regex = /(?:^|\n)#\s+([^\n]+)\n([\s\S]*?)(?=(?:\n#\s+|$))/g;
    let match;
    let lastKey = null;

    while ((match = regex.exec(markdown)) !== null) {
      const key = match[1].trim();
      const content = match[2].trim();
      if (key) {
        newSections[key] = content;
        lastKey = key;
      }
    }

    setLiveSections(newSections);
    if (lastKey) {
      // Pin active tab to whatever section is actively being written!
      setActiveSection(lastKey);
      
      // Auto-scroll the content tab to the bottom naturally
      if (contentRef.current) {
        contentRef.current.scrollTop = contentRef.current.scrollHeight;
      }
    }
  };


  const handleSaveProject = async () => {
    setIsSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
      const response = await fetch(`${apiUrl}/projects/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentData: liveSections })
      });
      if (!response.ok) throw new Error("Failed to save");
      
      showToast("Project saved successfully!", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to save project.", "error");
    } finally {
      setIsSaving(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
        <div className="font-black text-xl uppercase tracking-widest animate-pulse border-2 border-black bg-yellow-300 px-6 py-4 shadow-[6px_6px_0px_0px_#000]">
          Loading Project Data...
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-4 bg-gray-50">
        <div className="font-black text-xl uppercase tracking-widest text-red-600 bg-red-100 border-2 border-red-600 px-6 py-4 shadow-[6px_6px_0px_0px_#dc2626]">
          Project Not Found.
        </div>
        <Link href="/app" className="bg-black text-white px-6 py-3 font-bold border-2 border-black hover:-translate-y-0.5 shadow-[4px_4px_0px_0px_#000]">Return to Dashboard</Link>
      </div>
    );
  }

  const sectionKeys = Object.keys(liveSections);

  return (
    <div className="flex flex-col md:flex-row min-h-screen border-t-2 border-black bg-white">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 lg:w-80 bg-gray-50 border-b-2 md:border-b-0 md:border-r-2 border-black p-6 flex flex-col gap-6 overflow-y-auto">
        <div>
          <Link href="/app/new" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black/60 hover:text-black mb-4 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            Back to Application
          </Link>
          <div className="inline-flex items-center gap-3 bg-black text-white font-black text-[10px] uppercase tracking-widest px-2 py-1 mb-2">
             {isGenerating && <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse" />}
             {isGenerating ? "AI GENERATING..." : "AI GENERATED"}
          </div>
          <h2 className="font-black text-lg tracking-tight uppercase break-words leading-tight">
            {project.idea.length > 50 ? project.idea.slice(0, 50) + "..." : project.idea}
          </h2>
        </div>
        
        <nav className="flex flex-col gap-3">
          {sectionKeys.length === 0 && isGenerating && (
             <div className="text-sm font-bold animate-pulse text-gray-400">Booting AI Brain...</div>
          )}
          {sectionKeys.map((key) => {
            const isActive = activeSection === key;
            return (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`text-left px-4 py-3 font-bold text-xs uppercase tracking-wider border-2 border-black transition-all shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[2px_2px_0px_0px_#000] ${
                  isActive ? "bg-yellow-300 text-black shadow-[6px_6px_0px_0px_#000] -translate-y-0.5 -translate-x-0.5" : "bg-white text-black"
                }`}
              >
                {key}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-12 lg:p-16 overflow-y-auto bg-white relative" ref={contentRef}>
        {activeSection ? (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="inline-flex items-center gap-3 bg-black text-yellow-300 font-black text-sm uppercase tracking-widest px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                {activeSection}
                {isGenerating && activeSection === sectionKeys[sectionKeys.length - 1] && (
                  <div className="w-3 h-3 bg-white border border-black rounded-full animate-bounce" />
                )}
              </div>
              
              {!isGenerating && (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={`font-bold text-xs uppercase tracking-wider px-4 py-2 border-2 border-black transition-all shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[2px_2px_0px_0px_#000] ${isEditing ? 'bg-black text-white' : 'bg-white text-black'}`}
                  >
                    {isEditing ? 'Preview Markdown' : 'Edit Section'}
                  </button>
                  <button 
                    onClick={handleSaveProject}
                    disabled={isSaving}
                    className="font-bold text-xs uppercase tracking-wider px-4 py-2 bg-yellow-300 text-black border-2 border-black transition-all shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[2px_2px_0px_0px_#000] disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Project'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="w-full outline-none pb-32">
              {isEditing ? (
                 <textarea
                   className="w-full min-h-[500px] p-6 font-mono text-sm border-2 border-black bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-300 shadow-[6px_6px_0px_0px_#000]"
                   value={liveSections[activeSection]}
                   onChange={(e) => setLiveSections(prev => ({ ...prev, [activeSection]: e.target.value }))}
                   placeholder="Write your markdown here..."
                 />
              ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 className="font-black text-3xl sm:text-4xl tracking-tighter mb-6 mt-8 uppercase" {...props} />,
                  h2: ({node, ...props}) => <h2 className="font-black text-2xl tracking-tight mb-4 mt-10 uppercase border-b-2 border-black pb-2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="font-bold text-xl tracking-tight mb-3 mt-6 uppercase text-blue-600" {...props} />,
                  h4: ({node, ...props}) => <h4 className="font-bold text-lg mb-2 mt-4 text-teal-600" {...props} />,
                  p: ({node, ...props}) => <p className="text-black/80 font-medium text-[15px] sm:text-base mb-5 leading-relaxed" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-none space-y-3 mb-8" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-3 mb-8 font-bold text-[15px]" {...props} />,
                  li: ({node, ...props}) => {
                    // Make list items look like neo-brutalist feature badges if in UL
                    return (
                      <li className="relative pl-7 text-[15px] font-medium leading-relaxed">
                        <span className="absolute left-0 top-1.5 w-3 h-3 bg-yellow-300 border-[1.5px] border-black shadow-[1px_1px_0px_0px_#000]" />
                        {props.children}
                      </li>
                    );
                  },
                  table: ({node, ...props}) => (
                    <div className="w-full overflow-x-auto mb-8 border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-none">
                      <table className="w-full text-left border-collapse text-sm min-w-[600px]" {...props} />
                    </div>
                  ),
                  thead: ({node, ...props}) => <thead className="bg-gray-100 border-b-2 border-black font-black uppercase text-[11px] tracking-wider text-black/60" {...props} />,
                  tbody: ({node, ...props}) => <tbody className="divide-y-2 divide-black/10 bg-white" {...props} />,
                  tr: ({node, ...props}) => <tr className="hover:bg-yellow-50 transition-colors" {...props} />,
                  th: ({node, ...props}) => <th className="p-3 border-r-2 border-black/20 last:border-r-0 whitespace-nowrap" {...props} />,
                  td: ({node, ...props}) => <td className="p-3 border-r-2 border-black/10 last:border-r-0 font-medium align-top" {...props} />,
                  pre: ({node, ...props}) => (
                    <pre className="bg-[#1e2230] text-[#93c5fd] p-5 border-2 border-black shadow-[6px_6px_0px_0px_#000] overflow-x-auto mb-8 text-[13px] font-mono leading-relaxed" {...props} />
                  ),
                  code: (props) => {
                    const {children, className, node, ...rest} = props
                    const match = /language-(\w+)/.exec(className || '')
                    return match ? (
                      <code {...rest} className={className}>
                        {children}
                      </code>
                    ) : (
                      <code {...rest} className="bg-gray-100 border border-black px-1.5 py-0.5 rounded-sm text-teal-600 font-bold text-[13px]">
                        {children}
                      </code>
                    )
                  },
                  blockquote: ({node, ...props}) => (
                    <blockquote className="border-l-4 border-yellow-300 bg-yellow-50/50 p-5 mb-8 italic text-black/80 font-medium shadow-[2px_2px_0px_0px_#000]" {...props} />
                  ),
                  a: ({node, ...props}) => <a className="text-blue-600 font-bold hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                }}
              >
                {liveSections[activeSection]}
              </ReactMarkdown>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center font-bold text-black/40 text-sm uppercase tracking-wider">
            {isGenerating ? "Preparing Output Buffer..." : "Select a corresponding section on the left to view content."}
          </div>
        )}
      </div>
      
      <Toast 
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
