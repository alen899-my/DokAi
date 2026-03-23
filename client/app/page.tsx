"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HeroSection from "@/components/home/HeroSection";
import StatsStrip  from "@/components/home/StatsStrip";
import HowItWorks  from "@/components/home/HowItWorks";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // If already logged in — redirect to dashboard
    const token = localStorage.getItem("accessToken");
    if (token) {
      router.replace("/app");
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) return null; // prevent flash

  return (
    <main className="min-h-screen bg-white">
      <HeroSection />
   
    </main>
  );
}