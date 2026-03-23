"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// ── Nav items ──
const NAV_ITEMS = [
  {
    label: "Projects",
    href:  "/app",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    label: "New Project",
    href:  "/app/new",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
  },
  {
    label: "Settings",
    href:  "/app/settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
      </svg>
    ),
  },
];

const BOTTOM_ITEMS = [
  {
    label: "Documentation",
    href:  "/docs",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
];

interface SidebarProps {
  isOpen:    boolean;
  onClose:   () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; plan: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    router.push("/");
  }

  function isActive(href: string) {
    if (href === "/app") return pathname === "/app";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          // Base
          "fixed top-0 left-0 h-full z-50 bg-white border-r-2 border-black",
          "flex flex-col",
          "w-[280px] sm:w-[300px]",
          // Transition
          "transition-transform duration-200 ease-in-out",
          // Mobile: slide in/out
          isOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: always visible
          "lg:translate-x-0 lg:static lg:z-auto lg:h-screen"
        )}
      >

        {/* ── TOP: Logo ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-black flex-shrink-0">
          <Link
            href="/app"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-yellow-300 border-2 border-black flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_0px_#000]">
              D
            </div>
           <span className="font-black text-lg tracking-tighter text-black">
  Documenter
</span>
          </Link>

          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── MIDDLE: Nav ── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">

          {/* Section label */}
          <div className="px-3 mb-2">
            <span className="font-black text-xs uppercase tracking-widest text-black/30">
              Menu
            </span>
          </div>

          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 font-bold text-sm transition-all duration-100",
                "border-2",
                isActive(item.href)
                  ? "bg-yellow-300 border-black shadow-[3px_3px_0px_0px_#000] text-black"
                  : "border-transparent text-black/60 hover:bg-black hover:text-white hover:border-black"
              )}
            >
              <span className={cn(
                "flex-shrink-0",
                isActive(item.href) ? "text-black" : ""
              )}>
                {item.icon}
              </span>
              {item.label}

              {/* Active indicator */}
              {isActive(item.href) && (
                <div className="ml-auto w-1.5 h-1.5 bg-black rounded-full" />
              )}
            </Link>
          ))}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom nav */}
          <div className="mt-4 pt-4 border-t-2 border-black flex flex-col gap-1">
            <div className="px-3 mb-2">
              <span className="font-black text-xs uppercase tracking-widest text-black/30">
                Help
              </span>
            </div>
            {BOTTOM_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 font-bold text-sm transition-all duration-100",
                  "border-2",
                  isActive(item.href)
                    ? "bg-yellow-300 border-black shadow-[3px_3px_0px_0px_#000] text-black"
                    : "border-transparent text-black/60 hover:bg-black hover:text-white hover:border-black"
                )}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        

      </aside>
    </>
  );
}