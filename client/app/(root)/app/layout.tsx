"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layouts/Sidebar";
import Header  from "@/components/layouts/Header";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router             = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checked, setChecked]         = useState(false);

  // Auth guard — redirect to login if no token
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace("/login");
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-black border-t-yellow-300 rounded-full animate-spin" />
          <p className="font-black text-xs uppercase tracking-widest text-black/40">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden text-black">

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main — header + scrollable content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-white">
          {children}
        </main>

      </div>
    </div>
  );
}