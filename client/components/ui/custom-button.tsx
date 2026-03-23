"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  ButtonHTMLAttributes,
  AnchorHTMLAttributes,
  forwardRef,
  ReactNode,
} from "react";

// ── Types ──
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize    = "sm" | "md" | "lg" | "xl";

interface BaseProps {
  variant?:   ButtonVariant;
  size?:      ButtonSize;
  className?: string;
  children?:  ReactNode;          // optional here — HTML types already have it
  fullWidth?: boolean;
  icon?:      ReactNode;
  iconRight?: ReactNode;
  loading?:   boolean;
}

// Omit 'children' from HTML types before extending to avoid conflict
interface ButtonAsButton
  extends BaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  as?:   "button";
  href?: never;
}

interface ButtonAsLink extends BaseProps {
  as:      "link";
  href:    string;
  target?: "_blank" | "_self";
}

interface ButtonAsAnchor
  extends BaseProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  as:   "a";
  href: string;
}

type CustomButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsAnchor;

// ── Styles ──
const variantStyles: Record<ButtonVariant, string> = {
  primary:   "bg-black text-white border-2 border-black hover:bg-white hover:text-black",
  secondary: "bg-yellow-300 text-black border-2 border-black hover:bg-yellow-400",
  outline:   "bg-white text-black border-2 border-black hover:bg-black hover:text-white",
  ghost:     "bg-transparent text-black border-2 border-transparent hover:border-black hover:bg-gray-100",
  danger:    "bg-red-500 text-white border-2 border-black hover:bg-red-600",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3 text-base",
  xl: "px-9 py-4 text-lg",
};

const baseStyles = [
  "inline-flex items-center justify-center gap-2",
  "font-black tracking-wide uppercase",
  "transition-all duration-100 ease-in-out",
  "cursor-pointer select-none",
  "rounded-none",
  "shadow-[4px_4px_0px_0px_#000]",
  "hover:shadow-[6px_6px_0px_0px_#000]",
  "hover:-translate-x-0.5 hover:-translate-y-0.5",
  "active:shadow-[1px_1px_0px_0px_#000]",
  "active:translate-x-0.5 active:translate-y-0.5",
  "disabled:opacity-50 disabled:cursor-not-allowed",
  "disabled:shadow-[4px_4px_0px_0px_#000]",
  "disabled:translate-x-0 disabled:translate-y-0",
].join(" ");

// ── Spinner ──
function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8z"
      />
    </svg>
  );
}

// ── Component ──
function CustomButtonInner(
  props: CustomButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement | HTMLAnchorElement>
) {
  const {
    variant   = "primary",
    size      = "md",
    className,
    children,
    fullWidth = false,
    icon,
    iconRight,
    loading   = false,
    as        = "button",
  } = props;

  const classes = cn(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && "w-full",
    className
  );

  const content = (
    <>
      {loading ? (
        <Spinner />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
      {!loading && iconRight && (
        <span className="flex-shrink-0">{iconRight}</span>
      )}
    </>
  );

  // ── Render as Next.js Link ──
  if (as === "link") {
    const { href, target } = props as ButtonAsLink;
    return (
      <Link href={href} target={target ?? "_self"} className={classes}>
        {content}
      </Link>
    );
  }

  // ── Render as plain <a> ──
  if (as === "a") {
    const {
      href,
      variant: _v,
      size: _s,
      fullWidth: _fw,
      icon: _i,
      iconRight: _ir,
      loading: _l,
      as: _a,
      ...anchorProps
    } = props as ButtonAsAnchor & { [key: string]: unknown };

    return (
      <a
        href={href as string}
        className={classes}
        ref={ref as React.ForwardedRef<HTMLAnchorElement>}
        {...(anchorProps as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </a>
    );
  }

  // ── Render as <button> (default) ──
  const {
    variant: _v,
    size: _s,
    fullWidth: _fw,
    icon: _i,
    iconRight: _ir,
    loading: _l,
    as: _a,
    href: _h,
    ...buttonProps
  } = props as ButtonAsButton & { [key: string]: unknown };

  return (
    <button
      className={classes}
      disabled={loading || (buttonProps as ButtonHTMLAttributes<HTMLButtonElement>).disabled}
      ref={ref as React.ForwardedRef<HTMLButtonElement>}
      {...(buttonProps as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  );
}

export const CustomButton = forwardRef(CustomButtonInner) as (
  props: CustomButtonProps & {
    ref?: React.ForwardedRef<HTMLButtonElement | HTMLAnchorElement>;
  }
) => React.ReactElement;

(CustomButton as any).displayName = "CustomButton";