import { ReactNode } from "react";

interface AuthFormWrapperProps {
  title:    string;
  subtitle: string;
  badge?:   string;
  children: ReactNode;
  footer?:  ReactNode;
}

export default function AuthFormWrapper({
  title,
  subtitle,
  badge,
  children,
  footer,
}: AuthFormWrapperProps) {
  return (
    <div className="flex flex-col gap-6 sm:gap-8">

      {/* Header */}
      <div className="flex flex-col gap-2 sm:gap-3">

        {/* Badge */}
        {badge && (
          <div className="inline-flex w-fit items-center gap-2 bg-yellow-300 border-2 border-black px-3 py-1 font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_0px_#000]">
            <span className="w-1.5 h-1.5 bg-black rounded-full" />
            {badge}
          </div>
        )}

        {/* Title — responsive size + solid black for visibility */}
        <h1 className="font-black text-2xl sm:text-3xl md:text-4xl tracking-tighter leading-tight text-black">
          {title}
        </h1>

        {/* Subtitle — darker for readability */}
        <p className="text-black/60 font-medium text-sm leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex-1 h-0.5 bg-black" />
        <div className="w-2 h-2 bg-yellow-300 border-2 border-black rotate-45 flex-shrink-0" />
        <div className="flex-1 h-0.5 bg-black" />
      </div>

      {/* Form content */}
      <div>{children}</div>

      {/* Footer */}
      {footer && (
        <div className="text-center text-sm font-medium text-black/60">
          {footer}
        </div>
      )}
    </div>
  );
}