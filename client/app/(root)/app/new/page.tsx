"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authFetch, apiUrl } from "@/lib/authFetch";

export default function NewProjectPage() {
  const router = useRouter();
  

  const [model, setModel] = useState("llama-3.3-70b-versatile");
  const [idea, setIdea] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [coreFeatures, setCoreFeatures] = useState("");
  const [techStack, setTechStack] = useState("");
  
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;

    const fullPrompt = `Project Idea:\n${idea.trim()}\n\n${targetAudience ? `Target Audience:\n${targetAudience.trim()}\n\n` : ''}${coreFeatures ? `Core Features:\n${coreFeatures.trim()}\n\n` : ''}${techStack ? `Tech Stack Preferences:\n${techStack.trim()}` : ''}`;

    setIsGenerating(true);
    
    try {
      const response = await authFetch(apiUrl("/projects"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: fullPrompt, model }),
      });

      if (!response.ok) throw new Error("Failed to start project creation");

      const data = await response.json();

      // Navigate instantly to the isolated project viewer, telling it to stream
      router.push(`/projects/${data.id}?stream=true`);

    } catch (error) {
      console.error(error);
      setIsGenerating(false);
      alert("Error generating project.");
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="inline-block bg-black text-yellow-300 font-black text-xs uppercase tracking-widest px-3 py-1.5 mb-3">
          AI Full Generate Mode
        </div>
        <h2 className="text-black font-black text-3xl sm:text-4xl tracking-tighter">
          Create New Project
        </h2>
        <p className="text-black/60 font-medium text-sm mt-2 max-w-xl">
          Describe your project idea in detail. Our AI will automatically scaffold the complete documentation for you.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-8">
        <div className="bg-white border-2 border-black p-6 sm:p-8 shadow-[6px_6px_0px_0px_#000]">
          <div className="flex flex-col gap-6">
            
            <div>
              <label className="block text-black font-black text-sm uppercase tracking-wider mb-2">
                AI Model
              </label>
              <div className="relative">
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full appearance-none border-2 border-black p-3 pr-10 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 cursor-pointer bg-white"
                >
                  <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile (Recommended)</option>
                  <option value="llama-3.1-70b-versatile">Llama 3.1 70B</option>
                  <option value="llama3-8b-8192">Llama 3 8B (Ultra Fast)</option>
                  <option value="mixtral-8x7b-32768">Mixtral 8x7B (Long Context)</option>
                  <option value="gemma2-9b-it">Gemma 2 9B</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black border-l-2 border-black">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-black font-black text-sm uppercase tracking-wider mb-2">
                Project Idea & Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                rows={4}
                className="w-full border-2 border-black p-4 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-y shadow-inner text-black placeholder:text-black/30 bg-white"
                placeholder="e.g. A SaaS platform for dog walkers to manage their schedules and clients..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-black text-xs uppercase tracking-wider mb-2 text-black/80">
                  Target Audience (Optional)
                </label>
                <textarea
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  rows={3}
                  className="w-full border-2 border-black p-3 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-y text-black placeholder:text-black/30"
                  placeholder="e.g. Freelance designers, Small enterprise HR teams"
                />
              </div>

              <div>
                <label className="block font-black text-xs uppercase tracking-wider mb-2 text-black/80">
                  Tech Stack Preferences (Optional)
                </label>
                <textarea
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  rows={3}
                  className="w-full border-2 border-black p-3 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-y text-black placeholder:text-black/30"
                  placeholder="e.g. Next.js frontend, PostgreSQL, TailwindCSS"
                />
              </div>
            </div>

            <div>
              <label className="block font-black text-xs uppercase tracking-wider mb-2 text-black/80">
                Core Features (Optional)
              </label>
              <textarea
                value={coreFeatures}
                onChange={(e) => setCoreFeatures(e.target.value)}
                rows={3}
                className="w-full border-2 border-black p-3 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-y text-black placeholder:text-black/30"
                placeholder="e.g. Stripe billing, secure file uploads, real-time chat"
              />
            </div>

          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isGenerating}
            className="inline-flex items-center gap-3 px-8 py-4 bg-black text-yellow-300 border-2 border-black font-black text-sm md:text-base uppercase tracking-widest shadow-[6px_6px_0px_0px_#000] hover:shadow-[8px_8px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150 active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#000] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-yellow-300 border-t-black rounded-full animate-spin" />
                Preparing Layout...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/>
                </svg>
                Generate First Step
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
