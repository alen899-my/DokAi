"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthFormWrapper from "./AuthFormWrapper";
import { CustomButton } from "@/components/ui/custom-button";

interface FormState {
  email:    string;
  password: string;
}

interface FormErrors {
  email?:    string;
  password?: string;
  general?:  string;
}

export default function LoginForm() {
  const router = useRouter();

  const [form, setForm]       = useState<FormState>({ email: "", password: "" });
  const [errors, setErrors]   = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // ── Validation ──
  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setErrors({ general: data.message || "Login failed" });
        return;
      }

      // Store tokens
      localStorage.setItem("accessToken",  data.data.tokens.accessToken);
      localStorage.setItem("refreshToken", data.data.tokens.refreshToken);
      localStorage.setItem("user",         JSON.stringify(data.data.user));

      router.push("/app");
    } catch {
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  // ── Google Login ──
  function handleGoogleLogin() {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  }

  return (
    <AuthFormWrapper
      badge="Welcome back"
      title="Login to your account"
      subtitle="Enter your credentials to access your documentation projects."
      footer={
        <span>
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-black text-black underline underline-offset-2 decoration-yellow-400 hover:decoration-black"
          >
            Sign up free
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

        {/* General error */}
        {errors.general && (
          <div className="bg-red-50 border-2 border-red-500 px-4 py-3 shadow-[3px_3px_0px_0px_#ef4444]">
            <p className="text-red-600 font-bold text-sm">{errors.general}</p>
          </div>
        )}

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="font-black text-xs uppercase tracking-widest text-black">
            Email Address
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            className={`
              w-full px-4 py-3 bg-white
              border-2 font-medium text-sm text-black
              placeholder:text-black/30
              outline-none transition-all duration-100
              shadow-[3px_3px_0px_0px_#000]
              focus:shadow-[5px_5px_0px_0px_#000]
              focus:-translate-x-0.5 focus:-translate-y-0.5
              ${errors.email
                ? "border-red-500 shadow-[3px_3px_0px_0px_#ef4444]"
                : "border-black"
              }
            `}
          />
          {errors.email && (
            <p className="text-red-500 font-bold text-xs">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="font-black text-xs uppercase tracking-widest text-black">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-bold text-black/40 hover:text-black underline underline-offset-2"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className={`
                w-full px-4 py-3 pr-12 bg-white
                border-2 font-medium text-sm text-black
                placeholder:text-black/30
                outline-none transition-all duration-100
                shadow-[3px_3px_0px_0px_#000]
                focus:shadow-[5px_5px_0px_0px_#000]
                focus:-translate-x-0.5 focus:-translate-y-0.5
                ${errors.password
                  ? "border-red-500 shadow-[3px_3px_0px_0px_#ef4444]"
                  : "border-black"
                }
              `}
            />
            {/* Show/hide toggle */}
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
            >
              {showPass ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 font-bold text-xs">{errors.password}</p>
          )}
        </div>

        {/* Submit */}
        <CustomButton
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </CustomButton>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-0.5 bg-black/10" />
          <span className="text-xs font-black uppercase tracking-widest text-black/30">or</span>
          <div className="flex-1 h-0.5 bg-black/10" />
        </div>

        {/* Google */}
        <CustomButton
          type="button"
          variant="outline"
          size="lg"
          fullWidth
          onClick={handleGoogleLogin}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          }
        >
          Continue with Google
        </CustomButton>

      </form>
    </AuthFormWrapper>
  );
}