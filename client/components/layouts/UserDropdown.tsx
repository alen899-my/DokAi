"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface User {
  name:  string;
  email: string;
  plan:  string;
}

export default function UserDropdown() {
  const router      = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setOpen(false);
    router.push("/");
  }

  if (!user) return null;

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "U";

  return (
    // position:relative is the anchor for the dropdown
    <div className="relative" ref={dropdownRef}>

      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-2 border-2 border-black px-2 py-1.5",
          "shadow-[2px_2px_0px_0px_#000]",
          "hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5",
          "active:shadow-none active:translate-x-0 active:translate-y-0",
          "transition-all duration-100",
          open ? "bg-black text-white" : "bg-white text-black"
        )}
      >
        {/* Avatar */}
        <div className="w-6 h-6 flex items-center justify-center font-black text-xs border border-black flex-shrink-0 bg-yellow-300 text-black">
          {initials}
        </div>

        {/* Name */}
        <span className="font-black text-xs uppercase tracking-wider hidden sm:block max-w-[80px] truncate">
          {user.name?.split(" ")[0]}
        </span>

        {/* Chevron */}
        <svg
          width="12" height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "flex-shrink-0 transition-transform duration-150",
            open ? "rotate-180" : "rotate-0"
          )}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          className={cn(
            // Position — fixed to viewport on mobile to avoid overflow clipping
            "fixed sm:absolute right-2 sm:right-0",
            "top-16 sm:top-auto sm:mt-2",
            // Size
            "w-[calc(100vw-16px)] sm:w-72",
            // Style
            "bg-white border-2 border-black",
            "shadow-[4px_4px_0px_0px_#000]",
            // Stack above everything
            "z-[9999]"
          )}
        >
          {/* User info */}
          <div className="p-4 border-b-2 border-black bg-yellow-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black text-yellow-300 border-2 border-black flex items-center justify-center font-black text-sm flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-black text-sm text-black truncate">
                  {user.name}
                </div>
                <div className="text-black/60 text-xs font-medium truncate">
                  {user.email}
                </div>
              </div>
              <div className={cn(
                "flex-shrink-0 text-xs font-black uppercase px-2 py-0.5 border-2 border-black",
                user.plan === "pro"
                  ? "bg-black text-yellow-300"
                  : "bg-white text-black"
              )}>
                {user.plan ?? "free"}
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-2 flex flex-col gap-0.5">
           <a 
              href="/app/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 font-bold text-sm text-black border-2 border-transparent hover:bg-yellow-300 hover:border-black transition-all duration-100"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Settings
            </a>

            
             <a
              href="/app"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 font-bold text-sm text-black border-2 border-transparent hover:bg-yellow-300 hover:border-black transition-all duration-100"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              My Projects
            </a>

            <a
              href="/docs"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 font-bold text-sm text-black border-2 border-transparent hover:bg-yellow-300 hover:border-black transition-all duration-100"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              Documentation
            </a>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-black" />

          {/* Logout */}
          <div className="p-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 font-black text-sm text-red-600 border-2 border-transparent hover:bg-red-500 hover:text-white hover:border-red-600 transition-all duration-100"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Log out
            </button>
          </div>

        </div>
      )}
    </div>
  );
}