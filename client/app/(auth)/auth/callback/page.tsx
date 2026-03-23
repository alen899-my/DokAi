"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CallbackHandler() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleCallback() {
      const accessToken  = searchParams.get("accessToken");
      const refreshToken = searchParams.get("refreshToken");

      if (!accessToken || !refreshToken) {
        router.replace("/login");
        return;
      }

      // Store tokens first
      localStorage.setItem("accessToken",  accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      // Fetch user data using the access token
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const data = await res.json();

        if (res.ok && data.data?.user) {
          // Store user so dropdown can read it
          localStorage.setItem("user", JSON.stringify(data.data.user));
        }
      } catch {
        // Even if fetch fails, still redirect — tokens are stored
        console.error("Failed to fetch user profile");
      }

      router.replace("/app");
    }

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-black border-t-yellow-300 rounded-full animate-spin" />
        <p className="font-black text-sm uppercase tracking-widest text-black">
          Signing you in...
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-black border-t-yellow-300 rounded-full animate-spin" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}