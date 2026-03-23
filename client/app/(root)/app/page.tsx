"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface Project {
  id: string;
  idea: string;
  createdAt: string;
}

export default function AppPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
        const res = await fetch(`${apiUrl}/projects`);
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
        }
      } catch (err) {
        console.error("Failed to fetch projects", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleDeleteProject = async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
      const res = await fetch(`${apiUrl}/projects/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== id));
        setDeleteConfirmId(null);
      } else {
        throw new Error("Failed to delete");
      }
    } catch (err) {
      console.error("Failed to delete project", err);
      alert("Failed to delete project. Please try again.");
    }
  };

  return (
    <div className="p-6 sm:p-8">

      <ConfirmModal 
        isOpen={deleteConfirmId !== null}
        title="Delete Project?"
        message="This action permanently wipes the generated documentation framework and cannot be undone."
        onConfirm={() => deleteConfirmId && handleDeleteProject(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
      />

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-block bg-black text-yellow-300 font-black text-xs uppercase tracking-widest px-3 py-1.5 mb-3">
            Dashboard
          </div>
          <h2 className="font-black text-3xl sm:text-4xl tracking-tighter">
            Your Projects
          </h2>
          <p className="text-black/50 font-medium text-sm mt-1">
            Manage your past system architect generations.
          </p>
        </div>
        <Link
          href="/app/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-300 text-black border-2 border-black font-black text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-100"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5"  y1="12" x2="19" y2="12"/>
          </svg>
          New Project
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20">
          <div className="w-12 h-12 bg-yellow-300 border-2 border-black animate-spin mb-4" />
          <p className="font-bold uppercase tracking-wider text-sm">Loading Vault...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="border-2 border-black border-dashed p-12 sm:p-16 flex flex-col items-center justify-center text-center shadow-[4px_4px_0px_0px_#000]">
          <div className="w-14 h-14 bg-yellow-300 border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000] mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="11" x2="12" y2="17"/>
              <line x1="9"  y1="14" x2="15" y2="14"/>
            </svg>
          </div>
          <h3 className="font-black text-xl tracking-tighter mb-2">
            No projects yet
          </h3>
          <p className="text-black/50 font-medium text-sm max-w-xs mb-6">
            Create your first project and start generating documentation in seconds.
          </p>
          <Link
            href="/app/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white border-2 border-black font-black text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-100"
          >
            Create First Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div key={proj.id} className="group relative bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[8px_8px_0px_0px_#000] hover:-translate-y-1 hover:-translate-x-1 transition-all duration-200 flex flex-col h-full">
              <div className="p-5 border-b-2 border-black bg-gray-50 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-black/60">
                  {new Date(proj.createdAt).toLocaleDateString()}
                </span>
                <span className="w-2 h-2 rounded-full bg-green-400 border border-black" />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <p className="font-bold text-sm leading-relaxed text-black/80 line-clamp-4 flex-1 mb-6">
                  {proj.idea || "No description provided."}
                </p>
                <div className="flex gap-3">
                  <Link
                    href={`/projects/${proj.id}`}
                    className="flex-1 text-center py-2.5 bg-black text-white font-black text-xs uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2"
                  >
                    View Layout
                  </Link>
                  <button 
                    onClick={() => setDeleteConfirmId(proj.id)}
                    className="px-3 bg-red-500 text-white border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:bg-red-600 transition-all outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 flex items-center justify-center group"
                    title="Delete Project"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform">
                       <polyline points="3 6 5 6 21 6" />
                       <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                       <line x1="10" y1="11" x2="10" y2="17" />
                       <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
