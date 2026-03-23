"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  

  const [model, setModel] = useState("gemini-2.5-flash");
  const [idea, setIdea] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;

    setIsGenerating(true);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
      
      const response = await fetch(`${apiUrl}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, model }),
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
        <h2 className="font-black text-3xl sm:text-4xl tracking-tighter">
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
              <label className="block font-black text-sm uppercase tracking-wider mb-2">
                AI Model (Free Tier Recommended)
              </label>
              <div className="relative">
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full appearance-none border-2 border-black p-3 pr-10 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 cursor-pointer bg-white"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast & Free)</option>
                  <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Ultra Fast)</option>
                  <option value="gemini-2.0-flash">Gemini 2 Flash</option>
                  <option value="gemini-2.0-flash-lite">Gemini 2 Flash Lite</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black border-l-2 border-black">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-black text-sm uppercase tracking-wider mb-2">
                Project Idea & Description
              </label>
              <p className="text-xs text-black/60 font-medium mb-3">
                What does it do? Who uses it? What tech stack are you planning to use? The more detail you provide, the better the generated documentation will be.
              </p>
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                rows={8}
                className="w-full border-2 border-black p-4 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-y shadow-inner text-black placeholder:text-black/30 bg-white"
                placeholder="e.g. A SaaS platform for dog walkers to manage their schedules and clients..."
                required
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
