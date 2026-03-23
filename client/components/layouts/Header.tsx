"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import UserDropdown from "./UserDropdown";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/app":          { title: "Projects",    subtitle: "All your documentations" },
  "/app/new":      { title: "New Project", subtitle: "Create a new documentation " },
  "/app/settings": { title: "Settings",    subtitle: "Manage your account and preferences" },
  "/docs":         { title: "Docs",        subtitle: "How to use Documenter" },
};

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();

  const meta = PAGE_TITLES[pathname] ?? {
    title:    "Documenter",
    subtitle: "AI-powered documentation",
  };

  return (
    // z-index raised to z-40 so dropdown renders above everything
    <header className="h-14 sm:h-16 border-b-2 border-black bg-white flex items-center justify-between px-4 sm:px-6 flex-shrink-0 sticky top-0 z-40">

      {/* Left */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 border-2 border-black text-black flex items-center justify-center flex-shrink-0 hover:bg-yellow-300 transition-colors shadow-[2px_2px_0px_0px_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5"
          aria-label="Open menu"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <div className="min-w-0">
          <h1 className="font-black text-base sm:text-lg tracking-tighter leading-none truncate text-black">
            {meta.title}
          </h1>
          <p className="text-black/40 text-xs font-medium hidden sm:block truncate mt-0.5">
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

        <Link
          href="/app/new"
          className="flex items-center gap-2 px-3 py-2 bg-yellow-300 border-2 border-black text-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-0 active:translate-y-0 transition-all duration-100"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5"  y1="12" x2="19" y2="12"/>
          </svg>
          <span className="hidden sm:inline">New Project</span>
        </Link>

        <button className="hidden sm:flex w-9 h-9 border-2 border-black text-black bg-white items-center justify-center hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_#000]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>

        <UserDropdown />
      </div>
    </header>
  );
}