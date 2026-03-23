import Image from "next/image";
import Link from "next/link";

const testimonials = [
  {
    quote: "I documented my entire SaaS project in under 5 minutes. This tool is insane.",
    name: "Arjun Mehta",
    role: "Founder, BuildFast",
    avatar: "AM",
  },
  {
    quote: "Finally stopped putting off docs. Generated everything from overview to deployment in one shot.",
    name: "Sarah Chen",
    role: "Senior Dev, Stripe",
    avatar: "SC",
  },
  {
    quote: "Our whole team uses it now. The AI mode is genuinely impressive.",
    name: "James Okafor",
    role: "CTO, Launchpad",
    avatar: "JO",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">

      {/* ── LEFT — hidden on mobile/tablet, visible lg+ ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col overflow-hidden border-r-2 border-black flex-shrink-0">

        {/* Background image */}
        <Image
          src="/images/auth/auth.jpg"
          alt="Documenter"
          fill
          priority
          quality={90}
          className="object-cover object-center"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/70" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 w-fit">
            <div className="w-9 h-9 xl:w-10 xl:h-10 bg-yellow-300 border-2 border-black flex items-center justify-center font-black text-sm xl:text-base shadow-[3px_3px_0px_0px_#000]">
              D
            </div>
            <span className="font-black text-xl xl:text-2xl text-white tracking-tight">
              Documenter
            </span>
          </Link>

          {/* Testimonials */}
          <div className="flex flex-col gap-4 xl:gap-5">

            {/* Section label */}
            <div className="inline-flex items-center gap-2 w-fit">
              <div className="w-6 h-0.5 bg-yellow-300" />
              <span className="text-yellow-300 font-black text-xs uppercase tracking-widest">
                What people say
              </span>
            </div>

            {/* Testimonial cards */}
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white/8 border border-white/15 backdrop-blur-sm p-4 xl:p-5 flex flex-col gap-3 xl:gap-4"
              >
                {/* Stars */}
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill="#fde047">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>

                {/* Quote */}
                <p className="text-white/85 font-medium text-xs xl:text-sm leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 xl:w-8 xl:h-8 bg-yellow-300 border-2 border-black flex items-center justify-center font-black text-xs flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-white font-black text-xs">{t.name}</div>
                    <div className="text-white/40 font-medium text-xs">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom tagline */}
          <p className="text-white/30 text-xs font-medium uppercase tracking-widest">
            Trusted by developers worldwide
          </p>
        </div>

        {/* Corner decoration */}
        <div className="absolute bottom-0 right-0 w-14 h-14 xl:w-16 xl:h-16 bg-yellow-300 border-t-2 border-l-2 border-black z-10" />
      </div>

      {/* ── RIGHT — Form panel ── */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 overflow-y-auto">

        {/* Mobile / tablet top bar — hidden on lg+ */}
        <div className="flex lg:hidden items-center justify-between px-5 py-4 border-b-2 border-black">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-300 border-2 border-black flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_0px_#000]">
              D
            </div>
            <span className="font-black text-lg tracking-tight">Documenter</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-black uppercase tracking-widest text-black/40 hover:text-black"
          >
            ← Back
          </Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-16 xl:px-16">
          <div className="w-full max-w-sm sm:max-w-md">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t-2 border-black text-center">
          <p className="text-xs text-black/30 font-medium">
            © 2025 Documenter · All rights reserved
          </p>
        </div>

      </div>
    </div>
  );
}