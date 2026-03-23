"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthFormWrapper from "./AuthFormWrapper";
import { CustomButton } from "@/components/ui/custom-button";

interface FormState {
  name:            string;
  email:           string;
  password:        string;
  confirmPassword: string;
}

interface FormErrors {
  name?:            string;
  email?:           string;
  password?:        string;
  confirmPassword?: string;
  general?:         string;
}

export default function SignupForm() {
  const router = useRouter();

  const [form, setForm]         = useState<FormState>({
    name: "", email: "", password: "", confirmPassword: "",
  });
  const [errors, setErrors]     = useState<FormErrors>({});
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  // ── Validation ──
  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!form.name || form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      newErrors.password = "Must include uppercase, lowercase, and a number";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            name:     form.name,
            email:    form.email,
            password: form.password,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setErrors({ general: data.message || "Registration failed" });
        return;
      }

      // Store tokens
      localStorage.setItem("accessToken",  data.data.tokens.accessToken);
      localStorage.setItem("refreshToken", data.data.tokens.refreshToken);
      localStorage.setItem("user",         JSON.stringify(data.data.user));

      router.push("/login");
    } catch {
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  // ── Google ──
  function handleGoogleSignup() {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  }

  // ── Password strength ──
  function getPasswordStrength(): { label: string; color: string; width: string } {
    const p = form.password;
    if (!p) return { label: "", color: "", width: "0%" };
    if (p.length < 6) return { label: "Weak", color: "bg-red-500", width: "25%" };
    if (p.length < 8) return { label: "Fair", color: "bg-yellow-400", width: "50%" };
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(p))
      return { label: "Good", color: "bg-blue-400", width: "75%" };
    return { label: "Strong", color: "bg-green-500", width: "100%" };
  }

  const strength = getPasswordStrength();

  return (
    <AuthFormWrapper
      badge="Get started free"
      title="Create your account"
      subtitle="Start generating professional documentation in seconds."
      footer={
        <span>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-black text-black underline underline-offset-2 decoration-yellow-400 hover:decoration-black"
          >
            Log in
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

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="font-black text-xs uppercase tracking-widest text-black">
            Full Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="John Doe"
            className={`
              w-full px-4 py-3 bg-white
              border-2 font-medium text-sm text-black
              placeholder:text-black/30 outline-none
              transition-all duration-100
              shadow-[3px_3px_0px_0px_#000]
              focus:shadow-[5px_5px_0px_0px_#000]
              focus:-translate-x-0.5 focus:-translate-y-0.5
              ${errors.name ? "border-red-500 shadow-[3px_3px_0px_0px_#ef4444]" : "border-black"}
            `}
          />
          {errors.name && (
            <p className="text-red-500 font-bold text-xs">{errors.name}</p>
          )}
        </div>

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
              placeholder:text-black/30 outline-none
              transition-all duration-100
              shadow-[3px_3px_0px_0px_#000]
              focus:shadow-[5px_5px_0px_0px_#000]
              focus:-translate-x-0.5 focus:-translate-y-0.5
              ${errors.email ? "border-red-500 shadow-[3px_3px_0px_0px_#ef4444]" : "border-black"}
            `}
          />
          {errors.email && (
            <p className="text-red-500 font-bold text-xs">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="font-black text-xs uppercase tracking-widest text-black">
            Password
          </label>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min. 8 characters"
              className={`
                w-full px-4 py-3 pr-12 bg-white
                border-2 font-medium text-sm text-black
                placeholder:text-black/30 outline-none
                transition-all duration-100
                shadow-[3px_3px_0px_0px_#000]
                focus:shadow-[5px_5px_0px_0px_#000]
                focus:-translate-x-0.5 focus:-translate-y-0.5
                ${errors.password ? "border-red-500 shadow-[3px_3px_0px_0px_#ef4444]" : "border-black"}
              `}
            />
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

          {/* Password strength bar */}
          {form.password && (
            <div className="flex flex-col gap-1 mt-1">
              <div className="w-full h-1.5 bg-black/10 border border-black/20">
                <div
                  className={`h-full ${strength.color} transition-all duration-300`}
                  style={{ width: strength.width }}
                />
              </div>
              <p className="text-xs font-bold text-black/40">
                Strength: <span className="text-black">{strength.label}</span>
              </p>
            </div>
          )}

          {errors.password && (
            <p className="text-red-500 font-bold text-xs">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1.5">
          <label className="font-black text-xs uppercase tracking-widest text-black">
            Confirm Password
          </label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            placeholder="Re-enter password"
            className={`
              w-full px-4 py-3 bg-white
              border-2 font-medium text-sm text-black
              placeholder:text-black/30 outline-none
              transition-all duration-100
              shadow-[3px_3px_0px_0px_#000]
              focus:shadow-[5px_5px_0px_0px_#000]
              focus:-translate-x-0.5 focus:-translate-y-0.5
              ${errors.confirmPassword ? "border-red-500 shadow-[3px_3px_0px_0px_#ef4444]" : "border-black"}
            `}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 font-bold text-xs">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Terms */}
        <p className="text-xs text-black/40 font-medium">
          By signing up you agree to our{" "}
          <Link href="/terms" className="font-black text-black underline underline-offset-2">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-black text-black underline underline-offset-2">
            Privacy Policy
          </Link>
        </p>

        {/* Submit */}
        <CustomButton
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
        >
          {loading ? "Creating account..." : "Create Account"}
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
          onClick={handleGoogleSignup}
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